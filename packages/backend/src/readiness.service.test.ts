import "reflect-metadata";
import type { PgPool } from "@news-draft/db";
import { expect, it, vi } from "vitest";
import type { QueueService } from "./queue.service.js";
import { ReadinessService } from "./readiness.service.js";
it("reports degraded readiness without exposing dependency errors", async () => {
  const service = new ReadinessService(
    {
      query: vi.fn().mockRejectedValue(new Error("private connection string")),
    } as unknown as PgPool,
    { ping: vi.fn().mockResolvedValue("PONG") } as unknown as QueueService,
  );
  expect(await service.check("news-draft-api")).toEqual({
    status: "not_ready",
    service: "news-draft-api",
    dependencies: { database: "down", redis: "up" },
  });
});
it("bounds checks even when a dependency never settles", async () => {
  vi.useFakeTimers();
  try {
    const service = new ReadinessService(
      { query: () => new Promise(() => {}) } as unknown as PgPool,
      { ping: vi.fn().mockResolvedValue("PONG") } as unknown as QueueService,
    );
    const result = service.check("news-draft-api");
    await vi.advanceTimersByTimeAsync(2500);
    expect((await result).status).toBe("not_ready");
  } finally {
    vi.useRealTimers();
  }
});
