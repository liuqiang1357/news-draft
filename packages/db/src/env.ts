import { existsSync } from "node:fs";
import { loadEnvFile } from "node:process";

export function loadDatabaseUrl(): string | undefined {
  const file = new URL("../../../apps/api/.env.local", import.meta.url);
  if (process.env.NODE_ENV !== "test" && existsSync(file)) loadEnvFile(file);
  return process.env.DATABASE_URL;
}
