import { defineConfig, devices } from '@playwright/test';
import 'dotenv/config';

export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  retries: 0,
  workers: 1,
  reporter: [
    ['list'],
    ['html', { open: 'never' }],
    ['@testdino/playwright', {
      token: process.env.TESTDINO_TOKEN,
      serverUrl: process.env.TESTDINO_SERVER_URL,
    }],
  ],
  use: {
    trace: 'on',
    video: 'retain-on-failure',
    screenshot: 'only-on-failure',
    headless: false,
  },
  expect: {
    toHaveScreenshot: {
      maxDiffPixelRatio: 0.01,
      threshold: 0.2,
      animations: 'disabled',
    },
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
