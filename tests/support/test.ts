import { test as testdinoTest, expect } from '@testdino/playwright';
import v8ToIstanbul from 'v8-to-istanbul';

/**
 * Coverage-aware Playwright fixture.
 *
 * Two collection modes, selected by COVERAGE_MODE:
 *
 *   istanbul  (default) — the app under test is built with an Istanbul plugin and
 *                         exposes `window.__coverage__`. `@testdino/playwright`'s
 *                         own auto fixture reads it after each test. This is the
 *                         mode the TestDino docs describe and the one to use once
 *                         an instrumented build is available.
 *
 *   v8                  — the app under test is a deployed, uninstrumented build we
 *                         don't control (storedemo.testdino.com). Chromium's V8
 *                         coverage is collected from the served bundles and
 *                         converted to Istanbul format here, then attached under the
 *                         same `testdino-coverage` attachment the reporter merges.
 *                         Coverage is attributed to the *served bundle* files, not
 *                         to original sources, because the app's source maps are
 *                         served 403.
 *
 * Coverage specs must import { test, expect } from this file. Importing
 * '@playwright/test' directly yields a green run with no coverage attached.
 *
 * Non-coverage specs keep importing '@playwright/test' and are unaffected.
 */

const coverageMode = process.env.COVERAGE_MODE ?? 'istanbul';

/** Attachment name/shape that the TestDino reporter merges into its coverage map. */
const TESTDINO_COVERAGE_ATTACHMENT = 'testdino-coverage';

/** Scripts worth reporting on: same-origin app bundles, not inline or extension code. */
function isAppScript(url: string): boolean {
  if (!url.startsWith('http')) return false;
  const { pathname } = new URL(url);
  return pathname.endsWith('.js') || pathname.endsWith('.mjs');
}

/** Stable, repo-relative-looking key for the Istanbul map (drops the origin). */
function coverageKeyFor(url: string): string {
  return new URL(url).pathname.replace(/^\/+/, '');
}

const v8CoverageFixture = {
  _v8Coverage: [
    async (
      { page, browserName }: { page: import('@playwright/test').Page; browserName: string },
      use: () => Promise<void>,
      testInfo: import('@playwright/test').TestInfo,
    ) => {
      // page.coverage is a Chromium-only API.
      const collecting = browserName === 'chromium';
      if (collecting) {
        await page.coverage.startJSCoverage({ resetOnNavigation: false });
      }

      await use();

      if (!collecting) return;

      const entries = await page.coverage.stopJSCoverage();
      const istanbul: Record<string, unknown> = {};
      const failures: string[] = [];

      for (const entry of entries) {
        if (!entry.url || !entry.source || !isAppScript(entry.url)) continue;
        try {
          // The bundles carry a sourceMappingURL comment, but the app serves its
          // maps 403. Left in place, v8-to-istanbul tries to read the map off the
          // local disk and throws ENOENT for every bundle.
          const source = entry.source.replace(/\/\/[#@]\s*sourceMappingURL=.*$/gm, '');
          const converter = v8ToIstanbul(coverageKeyFor(entry.url), 0, { source });
          await converter.load();
          converter.applyCoverage(entry.functions);
          Object.assign(istanbul, converter.toIstanbul());
        } catch (error) {
          // One unconvertible bundle must not fail the test, but it must be visible
          // rather than silently shrinking the coverage report.
          failures.push(`${entry.url}: ${(error as Error).message}`);
        }
      }

      if (failures.length > 0) {
        console.warn(`[coverage] failed to convert ${failures.length} bundle(s):\n  ${failures.join('\n  ')}`);
      }

      if (Object.keys(istanbul).length === 0) {
        console.warn(
          `[coverage] no V8 coverage collected for "${testInfo.title}" — ` +
            `${entries.length} script(s) seen, none convertible.`,
        );
        return;
      }

      await testInfo.attach(TESTDINO_COVERAGE_ATTACHMENT, {
        body: JSON.stringify({ istanbul }),
        contentType: 'application/json',
      });
    },
    { auto: true },
  ],
};

export const test =
  coverageMode === 'v8'
    ? testdinoTest.extend<{ _v8Coverage: void }>(v8CoverageFixture as never)
    : testdinoTest;

export { expect };
