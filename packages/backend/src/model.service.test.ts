import "reflect-metadata";
import { createServer } from "node:http";
import { afterAll, beforeAll, expect, it } from "vitest";
import { parseEnv, type AppEnv } from "./env.js";
import { ModelService } from "./model.service.js";
let env: AppEnv;
const server = createServer(async (request, response) => {
  let text = "";
  for await (const chunk of request) text += chunk;
  const body = JSON.parse(text);
  expect(request.url).toBe("/v1/chat/completions");
  expect(request.headers.authorization).toBe("Bearer local-test-key");
  if (body.stream) {
    response.writeHead(200, { "Content-Type": "text/event-stream" });
    for (const delta of [{ role: "assistant", content: "Evidence" }, { content: " matters." }]) {
      response.write(
        `data: ${JSON.stringify({ id: "test", object: "chat.completion.chunk", model: "test-model", choices: [{ index: 0, delta, finish_reason: null }] })}\n\n`,
      );
    }
    response.write(
      `data: ${JSON.stringify({ id: "test", object: "chat.completion.chunk", model: "test-model", choices: [{ index: 0, delta: {}, finish_reason: "stop" }] })}\n\n`,
    );
    response.end("data: [DONE]\n\n");
  } else {
    response.setHeader("Content-Type", "application/json");
    response.end(
      JSON.stringify({
        id: "test",
        object: "chat.completion",
        model: "test-model",
        choices: [
          {
            index: 0,
            message: { role: "assistant", content: "A concise summary." },
            finish_reason: "stop",
          },
        ],
        usage: { prompt_tokens: 5, completion_tokens: 5, total_tokens: 10 },
      }),
    );
  }
});
beforeAll(async () => {
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("Missing test port");
  env = parseEnv({
    DATABASE_URL: "postgresql://localhost/test",
    REDIS_URL: "redis://localhost",
    MODEL_API_KEY: "local-test-key",
    MODEL_NAME: "test-model",
    MODEL_BASE_URL: `http://127.0.0.1:${address.port}/v1`,
  });
});
afterAll(async () => {
  await new Promise<void>((resolve) => server.close(() => resolve()));
});
it("generates a summary through AI SDK without external credentials", async () => {
  expect(await new ModelService(env).summarize("Test material")).toBe("A concise summary.");
});
it("produces the UI message stream protocol with text parts", async () => {
  const response = new ModelService(env).streamReply(
    [{ role: "user", content: "Explain the material" }],
    new AbortController().signal,
  );
  expect(response.headers.get("content-type")).toContain("text/event-stream");
  expect(response.headers.get("cache-control")).toBe("no-store");
  const text = await response.text();
  expect(text).toContain("text-delta");
  expect(text).toContain("Evidence");
  expect(text).toContain(" matters.");
});
it("fails explicitly instead of generating fake output when no model is configured", async () => {
  await expect(
    new ModelService({ ...env, MODEL_API_KEY: undefined, MODEL_NAME: undefined }).summarize("Test"),
  ).rejects.toThrow("Model is not configured");
});
