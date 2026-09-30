# Sift

Sift 是一个财经资讯阅读助手：通过每日简报了解重要变化，在探索中继续阅读，查看依据，并带着上下文追问。关注来源、自选资产和明确表达的兴趣共同帮助筛选相关信息。

[在线演示](https://sift-demo.liuqiang1357.chatgpt.site)使用固定内容、示意行情和本地对话回复，尚未接入资讯供应商、实时行情或 AI 模型。本地修改需要另行部署才会更新线上页面。

## 本地运行

需要 Node.js 22.12 或更高版本。项目使用 React、TypeScript 和 Vite。

```sh
npm ci
npm run dev
```

打开[本地预览](http://127.0.0.1:5173/)。运行 `npm test` 检查行为规则，运行 `npm run build` 完成类型检查和生产构建。

## 文档

- [产品设计](docs/product-design.md)：阅读任务、核心概念与功能边界。
- [内容规则](docs/content-rules.md)：来源、依据、重复发布、版本、筛选与简报快照。
- [当前 Sift 设计的架构方案](docs/architecture-sift.md)：固定简报、可追溯内容与上下文问答的实现建议。
- [产品需求方案的架构方案](docs/architecture-product.md)：动态精选、外部同步、个性化、异动与通知的实现建议。
- [演示说明](docs/demo.md)：已实现能力、限制、本地数据与开发方式。
- [示例情景与资料来源](docs/demo-scenarios.md)：真实背景、虚构材料及完整体验路径。
- [与产品需求方案的对比](docs/comparison-pm.md)：主要取舍、代价及重新考虑的条件。
- [与 eg 设计指南的对比](docs/comparison-eg.md)：保留卡片方案的价值，明确首版承担的职责。

产品设计描述目标中的最小可用产品；具体实现状态以演示说明为准。交互能够运行，并不代表已经具备生产服务能力或验证了推荐效果。
