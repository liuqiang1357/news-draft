import { describe, expect, it } from "vitest";
import { parseEnv } from "./env.js";
const base = { DATABASE_URL: "postgresql://localhost/test", REDIS_URL: "redis://localhost:6379" };
describe("environment", () => {
  it("allows a disabled model without disabling the API", () =>
    expect(parseEnv(base).MODEL_API_KEY).toBeUndefined());
  it("rejects partial model configuration", () =>
    expect(() => parseEnv({ ...base, MODEL_API_KEY: "test" })).toThrow());
  it("rejects wrong database and Redis protocols", () => {
    expect(() => parseEnv({ ...base, DATABASE_URL: "https://example.com" })).toThrow();
    expect(() => parseEnv({ ...base, REDIS_URL: "http://localhost" })).toThrow();
    expect(() => parseEnv({ ...base, REDIS_URL: "redis://localhost/private" })).toThrow();
  });
  it("rejects invalid ports", () => expect(() => parseEnv({ ...base, PORT: "0" })).toThrow());
});
