import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  timeout: 30000,
  expect: { timeout: 10000 },

  use: {
    baseURL: 'http://localhost:1420',
    trace: 'on-first-retry',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  webServer: [
    {
      command: 'cd ../api && bun run src/index.ts',
      url: 'http://localhost:3000/health',
      reuseExistingServer: !process.env.CI,
      timeout: 15000,
    },
    {
      command: 'VITE_USE_MOCKS=false pnpm dev',
      url: 'http://localhost:1420',
      reuseExistingServer: !process.env.CI,
      timeout: 15000,
    },
  ],
})
