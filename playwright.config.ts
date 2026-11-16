import { defineConfig } from '@playwright/test'

const channel = process.env.PLAYWRIGHT_CHANNEL === 'chromium' ? undefined : 'chrome'
const port = Number(process.env.PLAYWRIGHT_PORT || 3100)

export default defineConfig({
  testDir: './tests',
  testMatch: '**/*.spec.ts',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  workers: 1,
  reporter: 'list',
  use: {
    baseURL: `http://localhost:${port}`,
    channel,
    headless: true,
    viewport: { width: 1440, height: 1000 },
    trace: 'retain-on-failure',
  },
  webServer: {
    // Keep the test server and its cache separate from the user's preview.
    command: `pnpm run dev --port ${port}`,
    env: { NEXT_DIST_DIR: '.next-e2e' },
    url: `http://localhost:${port}`,
    reuseExistingServer: false,
    timeout: 120_000,
  },
})
