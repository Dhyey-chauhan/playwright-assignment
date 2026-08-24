import { test, expect } from '@playwright/test';

/**
 * Half of the `interrupted` pair — see ../interrupted/a-aborts-the-run.spec.ts.
 *
 * A separate file so it lands in a second worker and is still mid-flight when
 * the trigger case trips --max-failures. Playwright then stops the workers and
 * reports this case with status `interrupted`, which is the only way to fill
 * TestDino's Interrupted filter.
 */
test.describe('Interrupted run - victim', { tag: ['@interrupted', '@status-coverage'] }, () => {
  test('Victim: long-running case cut short when the run is stopped', {
    tag: ['@interrupted', '@victim'],
  }, async ({ page }) => {
    test.setTimeout(120_000);

    await page.goto('/');
    await expect(page).toHaveURL(/storedemo/);

    // Still waiting here when the run is aborted.
    await page.waitForTimeout(60_000);
    await expect(page.locator('body')).toBeVisible();
  });
});
