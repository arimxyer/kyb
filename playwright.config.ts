import { defineConfig, devices } from "@playwright/test";

const workerTarget = process.env.PLAYWRIGHT_TARGET === "worker";
const port = workerTarget ? 8788 : 3000;
const baseURL = workerTarget
  ? `http://127.0.0.1:${port}`
  : `http://localhost:${port}`;
const frontendCommand = workerTarget
  ? "bunx opennextjs-cloudflare preview --port 8788 --log-level warn"
  : "bun run start";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: process.env.CI
    ? [["github"], ["html", { open: "never" }]]
    : [["list"], ["html", { open: "on-failure" }]],
  use: {
    baseURL,
    screenshot: "only-on-failure",
    trace: "on-first-retry",
    video: "on-first-retry",
  },
  projects: [
    {
      name: "chromium-desktop",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "chromium-mobile",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 390, height: 844 },
      },
    },
  ],
  webServer: [
    {
      command:
        "CONVEX_AGENT_MODE=anonymous bunx convex dev --typecheck enable --tail-logs disable",
      url: "http://127.0.0.1:3210",
      reuseExistingServer: false,
      timeout: 120_000,
      stdout: "pipe",
      stderr: "pipe",
    },
    {
      command: frontendCommand,
      url: baseURL,
      reuseExistingServer: false,
      timeout: 120_000,
      stdout: "pipe",
      stderr: "pipe",
    },
  ],
});
