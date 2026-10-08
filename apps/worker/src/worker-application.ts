import "reflect-metadata";
import { createServer, type Server, type ServerResponse } from "node:http";
import {
  BackendModule,
  createLogger,
  PG_POOL,
  ReadinessService,
  redisOptions,
  systemQueueName,
  type AppEnv,
} from "@news-draft/backend";
import type { PgPool } from "@news-draft/db";
import {
  Inject,
  Injectable,
  Module,
  type DynamicModule,
  type BeforeApplicationShutdown,
  type OnModuleInit,
} from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { Worker } from "bullmq";
import { APP_ENV } from "@news-draft/backend";
@Injectable()
class SystemWorker implements OnModuleInit, BeforeApplicationShutdown {
  private worker?: Worker;
  private server?: Server;
  constructor(
    @Inject(APP_ENV) private readonly env: AppEnv,
    @Inject(PG_POOL) private readonly pool: PgPool,
    @Inject(ReadinessService) private readonly readiness: ReadinessService,
  ) {}
  async onModuleInit() {
    this.worker = new Worker(
      systemQueueName,
      async (job) => {
        if (job.name !== "probe") throw new Error("Unsupported system job");
        await this.pool.query("SELECT 1");
        return { status: "ok", service: "news-draft-worker" };
      },
      {
        connection: { ...redisOptions(this.env.REDIS_URL), maxRetriesPerRequest: null },
        concurrency: 2,
      },
    );
    this.worker.on("error", () => {});
    this.server = createServer((request, response) => {
      void this.handle(request.url, response);
    });
    await new Promise<void>((resolve, reject) => {
      this.server!.once("error", reject);
      this.server!.listen(this.env.WORKER_HEALTH_PORT, this.env.HOST, resolve);
    });
  }
  private async handle(url: string | undefined, response: ServerResponse) {
    response.setHeader("Content-Type", "application/json");
    response.setHeader("Cache-Control", "no-store");
    if (url === "/health") {
      response.end(JSON.stringify({ status: "ok", service: "news-draft-worker" }));
      return;
    }
    if (url !== "/health/ready") {
      response.statusCode = 404;
      response.end();
      return;
    }
    const result = await this.readiness.check("news-draft-worker");
    if (!this.worker?.isRunning()) result.status = "not_ready";
    response.statusCode = result.status === "ready" ? 200 : 503;
    response.end(JSON.stringify(result));
  }
  async beforeApplicationShutdown() {
    await new Promise<void>((resolve, reject) =>
      this.server ? this.server.close((error) => (error ? reject(error) : resolve())) : resolve(),
    );
    // System probes are disposable; future business workers must drain durable jobs.
    await this.worker?.close(true);
  }
}
@Module({})
class WorkerModule {
  static register(env: AppEnv): DynamicModule {
    return {
      module: WorkerModule,
      imports: [BackendModule.register(env)],
      providers: [SystemWorker],
    };
  }
}
export async function createWorkerApplication(env: AppEnv) {
  const app = await NestFactory.createApplicationContext(WorkerModule.register(env), {
    logger: createLogger("news-draft-worker", env.LOG_LEVEL),
  });
  app.enableShutdownHooks();
  return app;
}
