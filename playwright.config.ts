import { defineConfig, devices } from '@playwright/test';
import 'dotenv/config';

// Run-level labels for the TestDino run (comma-separated, e.g. TESTDINO_TAGS=dhyey/testing-PR)
const testdinoTags = process.env.TESTDINO_TAGS
  ?.split(',')
  .map((tag) => tag.trim())
  .filter(Boolean);

// Where runs are reported. Defaults to staging; override with TESTDINO_SERVER_URL
// (.env locally, the TESTDINO_SERVER_URL repo variable in CI) to point at
// production, which is where the reporter goes on its own if this is unset.
const testdinoServerUrl =
  process.env.TESTDINO_SERVER_URL || 'https://stg-reporter.testdino.com/';

// Code coverage is opt-in: `COVERAGE=true npm run test:coverage`.
const coverageEnabled = process.env.COVERAGE === 'true';

// How coverage is collected (see tests/support/test.ts):
//   istanbul — app is built with an Istanbul plugin and exposes window.__coverage__
//   v8       — collect Chromium V8 coverage from the deployed bundles instead
const coverageMode = process.env.COVERAGE_MODE ?? 'istanbul';

// istanbul mode needs a locally served, instrumented build. v8 mode works against
// the ordinary deployed app, so it reuses the normal baseURL.
const defaultCoverageBaseURL =
  coverageMode === 'v8'
    ? process.env.BASE_URL || 'https://storedemo.testdino.com'
    : 'http://localhost:3000';
const coverageBaseURL = process.env.COVERAGE_BASE_URL || defaultCoverageBaseURL;

// Command that serves the instrumented build (istanbul mode). Leave unset when
// COVERAGE_BASE_URL already points at a running server — no webServer is started then.
const coverageAppCmd = process.env.COVERAGE_APP_CMD;

// Coverage is attributed to original sources under istanbul, and to the served
// bundles under v8 (the app's source maps are not published).
const coverageInclude =
  coverageMode === 'v8' ? ['**/static/js/**'] : ['**/src/**'];

const num = (value: string | undefined, fallback: number) =>
  value === undefined ? fallback : Number(value);

// Defaults are per-mode. Under v8 the app's source maps are not published, so the
// minified bundle collapses to a handful of statements/lines — those two metrics
// sit at 100% and carry no signal, hence the deliberately low floors. Branches and
// functions are the meaningful numbers; their floors sit just under the measured
// baseline (74.7% branches, 48.4% functions) so a real regression trips them.
const thresholdDefaults =
  coverageMode === 'v8'
    ? { lines: 20, branches: 65, functions: 40, statements: 20 }
    : { lines: 70, branches: 60, functions: 70, statements: 70 };

const coverageThresholds = {
  lines: num(process.env.COVERAGE_MIN_LINES, thresholdDefaults.lines),
  branches: num(process.env.COVERAGE_MIN_BRANCHES, thresholdDefaults.branches),
  functions: num(process.env.COVERAGE_MIN_FUNCTIONS, thresholdDefaults.functions),
  statements: num(process.env.COVERAGE_MIN_STATEMENTS, thresholdDefaults.statements),
};

export default defineConfig({
  testDir: './tests',
  // Coverage specs are meaningful only under the dedicated coverage project, so they
  // are excluded everywhere by default. The `coverage` project opts back in below.
  // The interrupted pair only makes sense under --max-failures (npm run
  // test:interrupted), so it stays out of the normal run.
  testIgnore: ['**/coverage.spec.ts', '**/part-3/interrupted/**'],
  fullyParallel: false,
  retries: 0,
  workers: 1,
  reporter: [
    ['list'],
    ['html', { open: 'never' }],
    ['@testdino/playwright', {
      token: process.env.TESTDINO_TOKEN,
      serverUrl: testdinoServerUrl,
      ...(testdinoTags?.length ? { tags: testdinoTags } : {}),
      ...(coverageEnabled
        ? {
            coverage: {
              enabled: true,
              include: coverageInclude,
              exclude: ['**/node_modules/**', 'tests/**', 'pages/**'],
              thresholds: coverageThresholds,
            },
          }
        : {}),
    }],
  ],
  ...(coverageEnabled && coverageAppCmd
    ? {
        webServer: {
          command: coverageAppCmd,
          url: coverageBaseURL,
          reuseExistingServer: !process.env.CI,
          timeout: 120_000,
          env: { NODE_ENV: 'test' },
        },
      }
    : {}),
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
    {
      name: 'coverage',
      // Overrides the top-level testIgnore for this project only.
      testIgnore: [],
      testMatch: '**/coverage.spec.ts',
      grep: /@coverage/,
      use: { ...devices['Desktop Chrome'], baseURL: coverageBaseURL },
    },
  ],
});
