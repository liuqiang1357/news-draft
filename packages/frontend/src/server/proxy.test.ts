import { afterEach, expect, it, vi } from "vitest";
import { forwardApi } from "./proxy.js";
afterEach(() => vi.unstubAllGlobals());
it("does not forward arbitrary or internal routes", async () => {
  const fetcher = vi.fn();
  vi.stubGlobal("fetch", fetcher);
  expect(
    (await forwardApi(["internal", "probe"], undefined, new AbortController().signal)).status,
  ).toBe(404);
  expect(fetcher).not.toHaveBeenCalled();
});
it("preserves upstream failure and disables response caching", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue(Response.json({ status: "not_ready" }, { status: 503 })),
  );
  const response = await forwardApi(
    ["health", "ready"],
    "http://localhost:3001",
    new AbortController().signal,
  );
  expect(response.status).toBe(503);
  expect(response.headers.get("cache-control")).toBe("no-store");
});
it("returns a controlled failure when the backend is unavailable", async () => {
  vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("private address")));
  const response = await forwardApi(["health"], undefined, new AbortController().signal);
  expect(response.status).toBe(502);
  expect(await response.json()).toEqual({ error: "API_UNAVAILABLE" });
});
