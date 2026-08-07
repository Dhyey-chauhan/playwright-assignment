import type { TestdinoConfig } from '@testdino/playwright';

// Token / serverUrl / ciRunId stay wired through the reporter options in
// playwright.config.ts and the TESTDINO_* env vars (see .env). They are
// deliberately not duplicated here.
//
// This file carries the code-coverage block so the `tdpw` CLI sees the same
// coverage configuration the reporter does. Keep it in sync with
// playwright.config.ts.
const coverageEnabled = process.env.COVERAGE === 'true';

const coverageMode = process.env.COVERAGE_MODE ?? 'istanbul';

const num = (value: string | undefined, fallback: number) =>
  value === undefined ? fallback : Number(value);

// See playwright.config.ts for why the v8 line/statement floors are low.
const thresholdDefaults =
  coverageMode === 'v8'
    ? { lines: 20, branches: 65, functions: 40, statements: 20 }
    : { lines: 70, branches: 60, functions: 70, statements: 70 };

const config: TestdinoConfig = {
  ...(coverageEnabled
    ? {
        coverage: {
          enabled: true,
          include: coverageMode === 'v8' ? ['**/static/js/**'] : ['**/src/**'],
          exclude: ['**/node_modules/**', 'tests/**', 'pages/**'],
          thresholds: {
            lines: num(process.env.COVERAGE_MIN_LINES, thresholdDefaults.lines),
            branches: num(process.env.COVERAGE_MIN_BRANCHES, thresholdDefaults.branches),
            functions: num(process.env.COVERAGE_MIN_FUNCTIONS, thresholdDefaults.functions),
            statements: num(process.env.COVERAGE_MIN_STATEMENTS, thresholdDefaults.statements),
          },
        },
      }
    : {}),
};

export default config;
