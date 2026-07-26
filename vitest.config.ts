import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  resolve: { tsconfigPaths: true },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./tests/setup.ts"],
    // Playwright specs live in /tests/e2e and are run by Playwright, not Vitest.
    include: ["**/*.test.ts", "**/*.test.tsx"],
    exclude: ["node_modules", ".next", "tests/e2e/**"],
  },
});
