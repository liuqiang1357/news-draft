import "reflect-metadata";
import { randomUUID } from "node:crypto";
import { BackendModule, createLogger, type AppEnv } from "@news-draft/backend";
import { Module, type DynamicModule } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { FastifyAdapter, type NestFastifyApplication } from "@nestjs/platform-fastify";
import { ApiExceptionFilter } from "./http/api-exception.filter.js";
import { HealthController } from "./health.controller.js";
import { PublicationsController } from "./publications.controller.js";
@Module({})
class ApiModule {
  static register(env: AppEnv): DynamicModule {
    return {
      module: ApiModule,
      imports: [BackendModule.register(env)],
      controllers: [HealthController, PublicationsController],
    };
  }
}
export async function createApiApplication(env: AppEnv): Promise<NestFastifyApplication> {
  const app = await NestFactory.create<NestFastifyApplication>(
    ApiModule.register(env),
    new FastifyAdapter({ bodyLimit: 16 * 1024, logger: false, genReqId: () => randomUUID() }),
    { logger: createLogger("news-draft-api", env.LOG_LEVEL) },
  );
  app.useGlobalFilters(new ApiExceptionFilter());
  app
    .getHttpAdapter()
    .getInstance()
    .addHook("onSend", async (request, reply) => {
      reply.header("X-Request-Id", request.id);
      reply.header("Cache-Control", "no-store");
      reply.header("X-Content-Type-Options", "nosniff");
    });
  app.enableShutdownHooks();
  return app;
}
