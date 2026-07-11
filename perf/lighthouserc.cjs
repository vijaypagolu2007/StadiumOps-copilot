module.exports = {
  ci: {
    collect: {
      url: ["http://127.0.0.1:4173"],
      startServerCommand: "pnpm vite preview --host 127.0.0.1 --port 4173",
    },
    assert: {
      assertions: {
        "largest-contentful-paint": ["error", { maxNumericValue: 2500 }],
        "total-blocking-time": ["error", { maxNumericValue: 200 }],
        "categories:accessibility": ["error", { minScore: 0.95 }],
        "categories:best-practices": ["error", { minScore: 0.95 }],
      },
    },
  },
};
