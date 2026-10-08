import type { Readiness } from "@news-draft/contracts";
import type { PgPool } from "@news-draft/db";
import { Inject, Injectable } from "@nestjs/common";
import { QueueService } from "./queue.service.js";
import { PG_POOL } from "./tokens.js";
async function available(check: () => Promise<unknown>): Promise<"up" | "down"> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    await Promise.race([
      Promise.resolve().then(check),
      new Promise((_, reject) => {
        timer = setTimeout(() => reject(new Error("Readiness timeout")), 2500);
      }),
    ]);
    return "up";
  } catch {
    return "down";
  } finally {
    clearTimeout(timer);
  }
}
@Injectable()
export class ReadinessService {
  constructor(
    @Inject(PG_POOL) private readonly pool: PgPool,
    @Inject(QueueService) private readonly queue: QueueService,
  ) {}
  async check(service: Readiness["service"]): Promise<Readiness> {
    const [database, redis] = await Promise.all([
      available(() => this.pool.query("SELECT 1")),
      available(() => this.queue.ping()),
    ]);
    return {
      service,
      status: database === "up" && redis === "up" ? "ready" : "not_ready",
      dependencies: { database, redis },
    };
  }
}
