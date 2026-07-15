import path from "path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";
import solid from "vite-plugin-solid";

const rootDir = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(rootDir, "./src"),
    },
  },
  plugins: [solid()],
  test: {
    environment: "jsdom",
    globals: true,
    exclude: ["**/node_modules/**", "**/dist/**", "tests/integration/**"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "lcov"],
      include: [
        "src/domains/accessibility/**/*.ts",
        "src/domains/analytics/**/*.ts",
        "src/domains/crowd/density.ts",
        "src/domains/guardrails/**/*.ts",
        "src/shared/schemas.ts",
      ],
      thresholds: {
        lines: 30,
        functions: 35,
        branches: 55,
        statements: 30,
      },
    },
  },
});
