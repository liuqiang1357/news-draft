FROM node:24-alpine AS build
WORKDIR /app
ENV HUSKY=0
RUN corepack enable
COPY . .
RUN --mount=type=cache,target=/root/.local/share/pnpm/store pnpm install --frozen-lockfile
RUN pnpm build
RUN --mount=type=cache,target=/root/.local/share/pnpm/store pnpm --filter @news-draft/api deploy --prod /out/api
RUN --mount=type=cache,target=/root/.local/share/pnpm/store pnpm --filter @news-draft/worker deploy --prod /out/worker

FROM node:24-alpine AS api
ENV NODE_ENV=production HOST=0.0.0.0
WORKDIR /app
COPY --from=build --chown=node:node /out/api .
USER node
EXPOSE 3001
CMD ["node", "dist/main.js"]

FROM node:24-alpine AS worker
ENV NODE_ENV=production HOST=0.0.0.0
WORKDIR /app
COPY --from=build --chown=node:node /out/worker .
USER node
EXPOSE 3101
CMD ["node", "dist/main.js"]

FROM node:24-alpine AS web
ENV NODE_ENV=production HOSTNAME=0.0.0.0 PORT=3000
WORKDIR /app
COPY --from=build --chown=node:node /app/apps/web/.next/standalone .
COPY --from=build --chown=node:node /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=build --chown=node:node /app/apps/web/public ./apps/web/public
USER node
EXPOSE 3000
CMD ["node", "apps/web/server.js"]
