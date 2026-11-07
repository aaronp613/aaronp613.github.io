import { defineConfig } from "@playwright/test";

// Serves the repository root like GitHub Pages does and runs the smoke tests against it.
export default defineConfig({
  testDir: "tests",
  timeout: 30_000,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: "http://localhost:8080",
    serviceWorkers: "block",
    viewport: { width: 1280, height: 900 }
  },
  webServer: {
    command: "python3 -m http.server 8080",
    url: "http://localhost:8080/",
    reuseExistingServer: !process.env.CI,
    stderr: "ignore"
  }
});
