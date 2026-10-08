import { healthSchema } from "@news-draft/contracts";
import { afterEach, expect, it, vi } from "vitest";
import { requestJson } from "./request.js";

afterEach(() => vi.unstubAllGlobals());

it("rejects successful responses that violate the API contract", async () => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({ status: "ok" })));
  await expect(requestJson("/api/health", healthSchema)).rejects.toThrow();
});

it("reports HTTP failures even when the error body is not JSON", async () => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("Unavailable", { status: 503 })));
  await expect(requestJson("/api/health", healthSchema)).rejects.toThrow(
    "API request failed (503)",
  );
});
