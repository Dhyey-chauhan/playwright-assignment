import { test, expect } from '@playwright/test';

/**
 * PR-comment evidence — failures that carry the full artifact set.
 *
 * The config runs with trace: 'on', screenshot: 'only-on-failure' and
 * video: 'retain-on-failure', so every failure below produces a trace, a
 * screenshot and a video. The two failures are deliberately staged on
 * *different pages* — the first on the catalog, the second on the cart — so the
 * evidence links in the PR comment can be told apart at a glance: if a row's
 * Screenshot or Video shows the wrong page, the links are crossed.
 *
 * The passing case at the end is the control: a green row must carry no
 * evidence links at all.
 */
test.describe('PR comment evidence — full artifact set', {
  tag: ['@pr-evidence'],
}, () => {

  // Fails on the catalog page. Screenshot/video must show the product grid.
  test('Catalog lists the Nikon D850 body', {
    tag: ['@pr-evidence', '@catalog'],
    annotation: [
      { type: 'expects', description: 'fails on the catalog page — Trace + Screenshot + Video' },
    ],
  }, async ({ page }) => {
    await page.goto('/');

    // Sanity: the catalog really did render before the deliberate failure.
    await expect(page.getByText('Seagate 4TB External Hard Drive').first()).toBeVisible();

    // Deliberate failure: this product is not in the storefront catalog.
    await expect(
      page.getByText('Nikon D850 DSLR Body').first(),
      'catalog is expected to carry the Nikon D850 body',
    ).toBeVisible({ timeout: 5_000 });
  });

  // Fails on the cart page. Screenshot/video must show the cart, not the catalog.
  test('Cart summary counts every added item', {
    tag: ['@pr-evidence', '@cart'],
    annotation: [
      { type: 'expects', description: 'fails on the cart page — Trace + Screenshot + Video' },
    ],
  }, async ({ page }) => {
    await page.goto('/');
    await page.getByText('JBL Charge 4 Bluetooth Speaker').first().click();

    const addToCartButton = page.getByTestId('add-to-cart-button');
    await expect(addToCartButton).toBeVisible();
    await addToCartButton.click();

    await page.getByTestId('header-cart-icon').click();

    // Deliberate failure: one item was added, so a 7-item cart cannot exist.
    await expect(
      page.getByText('7 items').first(),
      'cart is expected to summarise 7 items',
    ).toBeVisible({ timeout: 5_000 });
  });

  // Control: a green row must show no evidence links.
  test('Catalog renders the storefront header', {
    tag: ['@pr-evidence', '@control'],
    annotation: [{ type: 'expects', description: 'passes — no evidence links expected' }],
  }, async ({ page }) => {
    await page.goto('/');

    await expect(page.getByTestId('header-cart-icon')).toBeVisible();
  });
});
