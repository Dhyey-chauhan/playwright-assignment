import { test, expect } from '@playwright/test';

/**
 * Half of the `interrupted` pair — see ../interrupted/b-gets-interrupted.spec.ts.
 *
 * Run both with:  npm run test:interrupted
 * (`--max-failures=1` stops the run as soon as this case fails, which leaves the
 * long-running case in the other worker to be reported as `interrupted`.)
 *
 * These specs are excluded from the default run via testIgnore in
 * playwright.config.ts — they are only meaningful under --max-failures.
 */
test.describe('Interrupted run - trigger', { tag: ['@interrupted', '@status-coverage'] }, () => {
  test('Trigger: fails immediately to trip --max-failures', {
    tag: ['@interrupted', '@trigger'],
  }, async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle('This title does not exist on the storefront', { timeout: 3_000 });
  });
});
