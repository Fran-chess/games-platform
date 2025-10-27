import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright configuration for performance testing
 * Tests both memotest and roulette with custom performance metrics
 */
export default defineConfig({
  testDir: './tests',
  fullyParallel: false,  // Run sequentially to avoid interference
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,  // One test at a time
  timeout: 60000,  // 60 seconds per test

  use: {
    trace: 'retain-on-failure',
    video: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'memotest',
      testMatch: '**/memotest.spec.ts',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: 'http://localhost:3001',
      },
    },
    {
      name: 'roulette',
      testMatch: '**/roulette.spec.ts',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: 'http://localhost:3000',
      },
    },
  ],

  // Start production servers before tests
  webServer: [
    {
      command: 'pnpm --filter=@games-platform/roulette start -p 3000',
      port: 3000,
      timeout: 120000,  // 2 minutes to start
      reuseExistingServer: !process.env.CI,
    },
    {
      command: 'pnpm --filter=@games-platform/memotest start -p 3001',
      port: 3001,
      timeout: 120000,
      reuseExistingServer: !process.env.CI,
    },
  ],

  // Custom reporter for performance metrics
  reporter: [
    ['list'],
    ['html', { outputFolder: '.playwright-report' }],
    ['./tests/reporters/performance-reporter.ts'],
  ],
});
