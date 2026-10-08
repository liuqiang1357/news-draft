import { defineConfig } from "drizzle-kit";
import { loadDatabaseUrl } from "./src/env.js";
const url = loadDatabaseUrl();
export default defineConfig({
  dialect: "postgresql",
  schema: "./src/schema.ts",
  out: "./drizzle",
  ...(url ? { dbCredentials: { url } } : {}),
});
