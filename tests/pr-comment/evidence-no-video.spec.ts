import { test, expect } from '@playwright/test';

/**
 * PR-comment evidence — a failure with video recording switched off.
 *
 * Everything else in the run keeps the config's video: 'retain-on-failure'.
 * This file alone opts out, so its failure produces a trace and a screenshot
 * but no video file. The row for this test in the PR comment must therefore
 * show Trace and Screenshot and *no* Video link.
 *
 * The failure is staged on the product detail page, a third distinct page, so
 * its screenshot cannot be confused with the catalog or cart failures in
 * evidence-with-video.spec.ts.
 */
test.use({ video: 'off' });

test.describe('PR comment evidence — video disabled', {
  tag: ['@pr-evidence', '@no-video'],
}, () => {

  test('Product page prices the Rode NT1-A in euros', {
    tag: ['@pr-evidence', '@no-video'],
    annotation: [
      { type: 'expects', description: 'fails on the product page — Trace + Screenshot, no Video' },
    ],
  }, async ({ page }) => {
    await page.goto('/');
    await page.getByText('Rode NT1-A Condenser Mic').first().click();

    // Sanity: the product detail page really did open.
    await expect(page.getByTestId('add-to-cart-button')).toBeVisible();

    // Deliberate failure: the storefront prices in USD, never in euros.
    await expect(
      page.getByText('€').first(),
      'product price is expected to be quoted in euros',
    ).toBeVisible({ timeout: 5_000 });
  });
});
