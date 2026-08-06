import { defineConfig, devices } from '@playwright/test';
import 'dotenv/config';

// Run-level labels for the TestDino run (comma-separated, e.g. TESTDINO_TAGS=dhyey/testing-PR)
const testdinoTags = process.env.TESTDINO_TAGS
  ?.split(',')
  .map((tag) => tag.trim())
  .filter(Boolean);

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
      ...(testdinoTags?.length ? { tags: testdinoTags } : {}),
    }],
  ],
  use: {
    baseURL: process.env.BASE_URL || 'https://storedemo.testdino.com',
    trace: 'on',
    video: 'retain-on-failure',
    screenshot: 'only-on-failure',
    headless: process.env.HEADED !== '1',
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
