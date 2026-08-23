import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tests/**/*.test.ts"],
    exclude: ["demo/**", "demo/.workdir/**", ".nemesis/**", "node_modules/**"],
    testTimeout: 120_000,
    hookTimeout: 120_000,
    fileParallelism: false
  }
});
