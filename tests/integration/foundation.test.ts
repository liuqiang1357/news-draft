import { randomBytes } from "node:crypto";
import { execFile } from "node:child_process";
import { createServer } from "node:net";
import { promisify } from "node:util";
import { afterAll, beforeAll, expect, it } from "vitest";
import { createApiApplication } from "../../apps/api/src/api-application.ts";
import { parseEnv, QueueService, redisOptions, systemQueueName } from "@news-draft/backend";
import { healthSchema, publicationListSchema, readinessSchema } from "@news-draft/contracts";
import { createPool, createDatabase, publications } from "@news-draft/db";
import { createWorkerApplication } from "../../apps/worker/src/worker-application.ts";
import { QueueEvents } from "bullmq";
const exec = promisify(execFile);
const project = `news-draft-test-${randomBytes(6).toString("hex")}`;
async function availablePort(): Promise<number> {
  const server = createServer();
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("No port");
  await new Promise<void>((resolve) => server.close(() => resolve()));
  return address.port;
}
const [postgresPort, redisPort, workerPort] = await Promise.all([
  availablePort(),
  availablePort(),
  availablePort(),
]);
// Preserve OS tooling only. Never inherit development credentials or read local .env files.
const systemEnv = Object.fromEntries(
  ["PATH", "HOME", "TMPDIR", "DOCKER_HOST", "DOCKER_CONTEXT", "DOCKER_CONFIG", "PNPM_HOME"].flatMap(
    (key) => (process.env[key] ? [[key, process.env[key]!]] : []),
  ),
);
const testEnv = {
  ...systemEnv,
  NODE_ENV: "test",
  DATABASE_URL: `postgresql://news_draft:news_draft@127.0.0.1:${postgresPort}/news_draft`,
  REDIS_URL: `redis://127.0.0.1:${redisPort}`,
  WORKER_HEALTH_PORT: String(workerPort),
  LOG_LEVEL: "silent",
  POSTGRES_PORT: String(postgresPort),
  REDIS_PORT: String(redisPort),
  MODEL_API_KEY: "",
  MODEL_NAME: "",
};
const env = parseEnv(testEnv);
const compose = ["compose", "--env-file", "/dev/null", "-f", "compose.yaml", "-p", project];
let api: Awaited<ReturnType<typeof createApiApplication>>;
let worker: Awaited<ReturnType<typeof createWorkerApplication>>;
let events: QueueEvents;
let pool: ReturnType<typeof createPool>;

beforeAll(async () => {
  await exec("docker", [...compose, "up", "-d", "--wait"], { env: testEnv, timeout: 120_000 });
  await exec("pnpm", ["db:apply"], { env: testEnv, timeout: 30_000 });
  api = await createApiApplication(env);
  await api.init();
  await api.getHttpAdapter().getInstance().ready();
  pool = createPool(env.DATABASE_URL);
  worker = await createWorkerApplication(env);
  events = new QueueEvents(systemQueueName, { connection: redisOptions(env.REDIS_URL) });
  await events.waitUntilReady();
});

afterAll(async () => {
  const cleanup = await Promise.allSettled([
    events?.close(),
    worker?.close(),
    api?.close(),
    pool?.end(),
  ]);
  await exec("docker", [...compose, "down", "--volumes", "--remove-orphans"], {
    env: testEnv,
    timeout: 30_000,
  });
  const failures = cleanup.flatMap((result) =>
    result.status === "rejected" ? [result.reason] : [],
  );
  if (failures.length) throw new AggregateError(failures, "Application cleanup failed");
});

it("can apply database migrations again", async () => {
  await exec("pnpm", ["db:apply"], { env: testEnv, timeout: 30_000 });
});

it("reports API health and database/Redis readiness", async () => {
  const http = api.getHttpAdapter().getInstance();
  const health = await http.inject({ method: "GET", url: "/health" });
  expect(health.statusCode).toBe(200);
  expect(healthSchema.parse(health.json())).toEqual({ status: "ok", service: "news-draft-api" });
  const ready = await http.inject({ method: "GET", url: "/health/ready" });
  expect(ready.statusCode).toBe(200);
  expect(readinessSchema.parse(ready.json()).status).toBe("ready");
});

it("reads stored publications and rejects duplicate versions", async () => {
  const database = createDatabase(pool);
  const fixture = {
    sourceId: "integration",
    externalId: "publication-1",
    revision: "1",
    title: "Isolated integration publication",
    publishedAt: new Date("2026-10-01T08:00:00Z"),
  };
  await database.insert(publications).values(fixture);
  await expect(database.insert(publications).values(fixture)).rejects.toThrow();
  const response = await api.getHttpAdapter().getInstance().inject({
    method: "GET",
    url: "/publications",
  });
  expect(response.statusCode).toBe(200);
  const list = publicationListSchema.parse(response.json());
  expect(list.items).toHaveLength(1);
  expect(list.items[0]).toMatchObject({
    sourceId: fixture.sourceId,
    title: fixture.title,
    publishedAt: fixture.publishedAt.toISOString(),
  });
});

it("processes a queued job and reports Worker readiness", async () => {
  const job = await api.get(QueueService).queue.add("probe", {});
  expect(await job.waitUntilFinished(events, 10_000)).toEqual({
    service: "news-draft-worker",
    status: "ok",
  });
  const response = await fetch(`http://127.0.0.1:${workerPort}/health/ready`);
  expect(response.status).toBe(200);
  expect(readinessSchema.parse(await response.json()).status).toBe("ready");
});
