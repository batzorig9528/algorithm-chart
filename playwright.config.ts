import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests",
  testMatch: "**/*.spec.ts",
  use: { baseURL: "http://localhost:4327", headless: true },
  webServer: {
    command: "npm run dev -- --port 4327",
    url: "http://localhost:4327",
    reuseExistingServer: true,
  },
  reporter: "list",
});
