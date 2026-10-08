import "reflect-metadata";
import { createDatabase, createPool, type PgPool } from "@news-draft/db";
import {
  Inject,
  Injectable,
  Module,
  type DynamicModule,
  type OnApplicationShutdown,
} from "@nestjs/common";
import type { AppEnv } from "./env.js";
import { ModelService } from "./model.service.js";
import { PublicationsService } from "./publications.service.js";
import { QueueService } from "./queue.service.js";
import { ReadinessService } from "./readiness.service.js";
import { APP_ENV, DATABASE, PG_POOL } from "./tokens.js";
@Injectable()
class DatabaseLifecycle implements OnApplicationShutdown {
  constructor(@Inject(PG_POOL) private readonly pool: PgPool) {}
  async onApplicationShutdown(): Promise<void> {
    await this.pool.end();
  }
}
@Module({})
export class BackendModule {
  static register(env: AppEnv): DynamicModule {
    return {
      module: BackendModule,
      providers: [
        { provide: APP_ENV, useValue: env },
        {
          provide: PG_POOL,
          useFactory: () => {
            const pool = createPool(env.DATABASE_URL);
            pool.on("error", () => {});
            return pool;
          },
        },
        {
          provide: DATABASE,
          useFactory: (pool: PgPool) => createDatabase(pool),
          inject: [PG_POOL],
        },
        DatabaseLifecycle,
        ModelService,
        PublicationsService,
        QueueService,
        ReadinessService,
      ],
      exports: [
        APP_ENV,
        PG_POOL,
        DATABASE,
        ModelService,
        PublicationsService,
        QueueService,
        ReadinessService,
      ],
    };
  }
}
