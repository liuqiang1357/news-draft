import { Inject, Injectable, type OnApplicationShutdown } from "@nestjs/common";
import { Queue } from "bullmq";
import type { AppEnv } from "./env.js";
import { APP_ENV } from "./tokens.js";
export const systemQueueName = "news-draft-system";
export function redisOptions(url: string) {
  const value = new URL(url);
  return {
    host: value.hostname,
    port: Number(value.port || 6379),
    username: value.username ? decodeURIComponent(value.username) : undefined,
    password: value.password ? decodeURIComponent(value.password) : undefined,
    db: Number(value.pathname.slice(1) || 0),
    ...(value.protocol === "rediss:" ? { tls: {} } : {}),
  };
}
@Injectable()
export class QueueService implements OnApplicationShutdown {
  readonly queue: Queue;
  constructor(@Inject(APP_ENV) env: AppEnv) {
    this.queue = new Queue(systemQueueName, {
      connection: { ...redisOptions(env.REDIS_URL), maxRetriesPerRequest: 1, connectTimeout: 2000 },
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: "exponential", delay: 1000 },
        removeOnComplete: 100,
        removeOnFail: 100,
      },
    });
    this.queue.on("error", () => {});
  }
  async ping(): Promise<void> {
    await this.queue.getJobCounts("waiting");
  }
  async onApplicationShutdown(): Promise<void> {
    await this.queue.close();
  }
}
