# News Draft

面向新闻阅读、判断记录与复盘的 TypeScript 单仓库。产品范围和整体方案见[架构文档](docs/architecture.md)。

## 项目结构

```text
apps/web           Next.js 页面、PWA、React、Tailwind CSS 与 TanStack Query
apps/api           NestJS + Fastify HTTP 服务
apps/worker        NestJS 后台进程与 BullMQ 任务处理
packages/frontend  公共 UI、请求、查询配置、Provider 与服务端 API 转发
packages/backend   API 与 Worker 共用的服务、配置和资源管理
packages/db        PostgreSQL 连接、Drizzle 数据模型与迁移
packages/contracts 前后端共享的 Zod 接口校验规则与类型
tests/integration  Vitest 跨应用集成测试，连接真实数据库与 Redis
tests/e2e      Playwright 浏览器交互测试，模拟 API 响应
scripts            本地开发辅助脚本
docs               产品与架构文档
```

API 与 Worker 独立运行、共用后端服务。前端公共代码集中在 `frontend`，页面和路由留在 `apps/web`。`frontend` 通过明确的子路径分别提供客户端功能和服务端转发，避免把两者混在一个入口。接口数据格式与校验规则集中在 `contracts`，数据库访问集中在后端。Turborepo 按依赖顺序构建各包，数据库模型和迁移统一放在 `packages/db`。

`contracts` 描述接口传递的数据，独立的 `domain` 包用于共享业务规则。目前尚无需要单独抽取的领域逻辑，先保留 `contracts`；以后出现前后端共同使用的判断状态、观察窗口或价格方向规则时，再按实际需要抽取。

## 本地开发

需要 Node.js 24.7 或更高版本、pnpm 12.10.1，以及支持 Compose 的 Docker。`.node-version` 指定 Node.js 24。

```sh
pnpm install --frozen-lockfile
pnpm env:init
docker compose up -d --wait
pnpm db:apply
pnpm dev
```

`env:init` 创建缺失的 `.env.local`，保留已有配置。Compose 中的账号密码仅用于本地开发，生产环境应使用独立凭据。

- 网页：http://localhost:3000
- API：http://localhost:3001
- Worker 健康检查：http://localhost:3101/health

阅读页从 PostgreSQL 获取公开来源记录，包含加载、空列表和失败状态。新数据库没有内容，启动时不自动插入示例文章。开发时，共享包自动重新编译，API 与 Worker 监听编译产物并重启。

API 提供以下接口：

- `GET /publications`：最近的公开来源记录。
- `GET /health`：进程是否可用。
- `GET /health/ready`：数据库与 Redis 是否就绪。

Worker 提供相同的健康检查路径，并处理内部队列探针任务。网页通过同域 `/api` 转发到 `API_ORIGIN`，仅允许上述公开 GET 接口。

## 模型与当前范围

模型服务通过 AI SDK 和兼容 OpenAI 的接口提供摘要与流式消息。使用时，在后端环境文件中同时设置 `MODEL_API_KEY` 和 `MODEL_NAME`；`MODEL_BASE_URL` 默认指向 DeepSeek。未配置模型时仍可启动工程，调用模型服务会明确报错。测试使用本地模拟接口，不调用外部模型。

当前工程包含页面、公开记录读取、数据库迁移、队列、健康检查和模型服务。登录、真实来源采集、推荐批次、判断记录、价格对照和会话持久化尚未实现。对话接口应在鉴权、消息保存和工具权限完成后开放。队列探针仅验证任务传递与进程运行；业务任务仍需按架构方案补充持久化任务记录和防重复处理规则。

PWA 已包含清单、图标和独立窗口配置。本地以外的安装需要 HTTPS 和浏览器支持，当前不提供 Service Worker 或离线阅读缓存。

## 检查与数据库迁移

```sh
pnpm check
pnpm build
pnpm test:integration
pnpm exec playwright install chromium
pnpm test:e2e
```

`check` 包含格式、代码规范、类型检查、未使用的文件与依赖检查和单元测试。单元测试与源码放在一起，使用 `*.test.ts`。单元测试和集成测试共用 Vitest，但通过 `unit`、`integration` 两个项目明确区分：`pnpm test` 只运行单元测试，`pnpm test:integration` 只匹配 `tests/integration/**/*.test.ts`，不会混入其他测试。

集成测试目录只放测试文件，环境准备与清理使用测试文件中的 `beforeAll`、`afterAll`。当前测试使用临时端口创建独立的 Compose 项目，分别验证重复执行迁移、API 读取和 Worker 任务处理，结束后清理测试容器与数据卷。测试不读取开发环境文件，也不修改本地开发数据库；执行前需要启动 Docker。

`pnpm test:e2e` 运行 `tests/e2e/*.spec.ts`。浏览器测试使用独立的前端进程和受控接口响应，覆盖桌面与移动尺寸下的加载、空列表、内容展示、失败重试和 PWA 资源；无需启动开发后端。这类测试验证前端交互，不覆盖前后端完整链路；完整业务流程实现后再补充端到端测试。首次运行需要安装 Chromium，失败时保留报告和调用轨迹。

前端使用 Tailwind 工具类处理布局、间距、响应式和交互状态；主题颜色和字体集中在 `apps/web/src/app/globals.css`，页面不再定义独立的组件样式。

基础组件放在 `packages/frontend/src/ui`，通过独立子路径导入；目前包含 `Button` 和 `EmptyState`。`Button` 支持主按钮、边框按钮、链接样式，以及通过 `asChild` 保留链接语义；`EmptyState` 统一加载、空列表与失败状态的排版，业务文案和动作由页面传入。组件源码由仓库维护，使用 Radix Slot、CVA 和 Tailwind 类名合并工具；按实际页面需求增加组件。全局 CSS 显式扫描公共包的 UI 源码，保证跨包样式生效。

安装依赖后，Husky 自动启用提交前检查，直接执行 `pnpm check`，检查工作区的格式、代码规范、类型、未使用的文件与依赖，以及单元测试。格式问题需要运行 `pnpm format` 后再提交。集成测试和浏览器测试单独运行，由 CI 完整验证。CI 和 Docker 构建使用 `HUSKY=0` 跳过钩子安装。

格式统一由 oxfmt 配置和 CI 检查负责。`pnpm deps:check` 可单独检查未使用的文件与依赖。Dependabot 每周分组提出依赖更新，更新仍需经过检查和人工合并。

修改数据库模型后执行：

```sh
pnpm db:generate
pnpm db:apply
```

需要浏览本地数据时，执行 `pnpm db:studio`；它读取与迁移相同的数据库配置，只监听本机地址。

生成的 SQL 和迁移元数据应一起提交。部署时，在启动服务前单独执行迁移；应用启动不自动修改数据库结构。

## 部署

根目录 Dockerfile 提供 `web`、`api` 和 `worker` 三个构建目标：

```sh
docker build --target api -t news-draft-api .
docker build --target worker -t news-draft-worker .
docker build --target web -t news-draft-web .
```

为后端容器提供数据库、Redis 和可选的模型配置；网页容器的服务端变量 `API_ORIGIN` 指向 API 地址。使用数据库包和部署凭据单独执行迁移，数据库与 Redis 保持内网访问。健康检查区分进程可用和依赖就绪，模型故障不应阻断公开内容读取。

CI 使用锁文件安装依赖，执行检查、构建、独立集成测试和浏览器测试。正式部署仍需配置备份、来源供应商凭据和生产环境访问控制。
