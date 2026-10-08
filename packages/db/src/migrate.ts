import { fileURLToPath } from "node:url";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { createDatabase, createPool } from "./index.js";
import { loadDatabaseUrl } from "./env.js";
const url = loadDatabaseUrl();
if (!url) throw new Error("DATABASE_URL is required");
const pool = createPool(url);
try {
  await migrate(createDatabase(pool), {
    migrationsFolder: fileURLToPath(new URL("../drizzle", import.meta.url)),
  });
  console.log("Database migrations applied.");
} finally {
  await pool.end();
}
