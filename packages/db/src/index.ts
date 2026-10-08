import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema.js";
export * from "./schema.js";
export function createPool(url: string) {
  return new Pool({
    connectionString: url,
    max: 10,
    connectionTimeoutMillis: 2000,
    query_timeout: 2000,
  });
}
export function createDatabase(pool: Pool) {
  return drizzle(pool, { schema });
}
export type Database = ReturnType<typeof createDatabase>;
export type PgPool = Pool;
