import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [['html', { open: 'never' }], ['list']],
  use: {
    baseURL: process.env.BASE_URL ?? 'http://127.0.0.1:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'Galaxy S25',
      use: {
        ...devices['Galaxy S24'],
        viewport: { width: 360, height: 780 },
        isMobile: true,
        hasTouch: true,
      },
    },
    {
      name: 'iPhone 14',
      use: {
        ...devices['iPhone 14'],
        browserName: 'chromium',
      },
    },
  ],
  webServer: process.env.CI
    ? undefined
    : {
        command: 'npm run start:dev',
        cwd: '../backend',
        url: 'http://localhost:3000/health',
        reuseExistingServer: true,
        timeout: 120000,
      },
});
