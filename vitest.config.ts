import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    projects: [
      {
        test: {
          name: "unit",
          include: ["apps/**/*.test.ts", "packages/**/*.test.ts"],
          testTimeout: 10_000,
        },
      },
      {
        test: {
          name: "integration",
          include: ["tests/integration/**/*.test.ts"],
          fileParallelism: false,
          testTimeout: 30_000,
          hookTimeout: 180_000,
        },
      },
    ],
  },
});
