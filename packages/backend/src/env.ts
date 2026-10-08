import { existsSync } from "node:fs";
import { loadEnvFile } from "node:process";
import { z } from "zod";
const optional = z.preprocess(
  (value) => (value === "" ? undefined : value),
  z.string().min(1).optional(),
);
const urlWithProtocol = (protocols: readonly string[]) =>
  z.url().refine((value) => protocols.includes(new URL(value).protocol));
const schema = z
  .object({
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    PORT: z.coerce.number().int().min(1).max(65535).default(3001),
    WORKER_HEALTH_PORT: z.coerce.number().int().min(1).max(65535).default(3101),
    HOST: z.string().min(1).default("127.0.0.1"),
    DATABASE_URL: urlWithProtocol(["postgres:", "postgresql:"]),
    REDIS_URL: urlWithProtocol(["redis:", "rediss:"]).refine(
      (value) => /^\/\d*$/.test(new URL(value).pathname) || new URL(value).pathname === "",
    ),
    LOG_LEVEL: z
      .enum(["silent", "fatal", "error", "warn", "info", "debug", "trace"])
      .default("info"),
    MODEL_BASE_URL: urlWithProtocol(["https:", "http:"]).default("https://api.deepseek.com/v1"),
    MODEL_API_KEY: optional,
    MODEL_NAME: optional,
  })
  .superRefine((env, context) => {
    if (Boolean(env.MODEL_API_KEY) !== Boolean(env.MODEL_NAME)) {
      context.addIssue({
        code: "custom",
        message: "Configure both MODEL_API_KEY and MODEL_NAME, or neither.",
        path: ["MODEL_NAME"],
      });
    }
  });
export type AppEnv = z.infer<typeof schema>;
export function parseEnv(input: NodeJS.ProcessEnv): AppEnv {
  return schema.parse(input);
}
export function loadEnv(file: URL): AppEnv {
  if (process.env.NODE_ENV !== "test" && existsSync(file)) loadEnvFile(file);
  return parseEnv(process.env);
}
