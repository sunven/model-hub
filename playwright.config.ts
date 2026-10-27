import { defineConfig } from '@playwright/test'

const channel = process.env.PLAYWRIGHT_CHANNEL === 'chromium' ? undefined : 'chrome'

export default defineConfig({
  testDir: './tests',
  testMatch: '**/*.spec.ts',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  workers: 1,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:3000',
    channel,
    headless: true,
    viewport: { width: 1440, height: 1000 },
    trace: 'retain-on-failure',
  },
  webServer: {
    // Tests own the dev server and clear .next in pretest:e2e.
    // Stop any running `npm run dev` before test:e2e.
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: false,
    timeout: 120_000,
  },
})
