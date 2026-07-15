import path from "path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import solid from "vite-plugin-solid";

const rootDir = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(rootDir, "./src"),
    },
  },
  plugins: [solid()],
  build: {
    target: "es2022",
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          "ops-core": ["zod", "zustand", "idb"],
          "solid-runtime": ["solid-js"],
        },
      },
    },
  },
  worker: {
    format: "es",
  },
  server: {
    headers: {
      "Content-Security-Policy":
        "default-src 'self'; script-src 'self' 'wasm-unsafe-eval' 'unsafe-inline'; connect-src 'self' wss://*.stadiumops.fifa2026.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:;",
      "X-Frame-Options": "DENY",
      "Referrer-Policy": "strict-origin-when-cross-origin",
    },
  },
});
