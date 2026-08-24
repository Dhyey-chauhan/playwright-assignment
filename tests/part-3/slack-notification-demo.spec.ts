import { test, expect } from '@playwright/test';

/**
 * Slack notification demo.
 *
 * 27 additional cases spread across passed / failed / flaky / skipped so a
 * run through this file produces a realistic mixed-status summary for
 * exercising the TestDino -> Slack alert, on top of the smaller set already
 * covered by run-status-coverage.spec.ts.
 *
 * Split: 7 passed, 7 failed, 7 skipped, 6 flaky.
 */

// --------------------------------------------------------------- passed (7)
test.describe('Slack Notification Demo - Passed', { tag: ['@status-coverage', '@slack-demo', '@passed'] }, () => {
  test('Homepage loads at the expected URL', { tag: ['@passed'] }, async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/storedemo/);
  });

  test('Homepage renders a page title', { tag: ['@passed'] }, async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/.+/);
  });

  test('Product catalog renders at least one product', { tag: ['@passed'] }, async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('Seagate 4TB External Hard Drive').first()).toBeVisible();
  });

  test('Product page shows an add-to-cart control', { tag: ['@passed'] }, async ({ page }) => {
    await page.goto('/');
    await page.getByText('Seagate 4TB External Hard Drive').first().click();
    await expect(page.getByTestId('add-to-cart-button')).toBeVisible();
  });

  test('Navigation header is visible on load', { tag: ['@passed'] }, async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('body')).toContainText('Seagate 4TB External Hard Drive');
  });

  test('Body content is visible after navigation', { tag: ['@passed'] }, async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('body')).toBeVisible();
  });

  test('Page responds with a successful navigation', { tag: ['@passed'] }, async ({ page }) => {
    const response = await page.goto('/');
    expect(response?.ok()).toBeTruthy();
  });
});

// --------------------------------------------------------------- failed (7)
test.describe('Slack Notification Demo - Failed', { tag: ['@status-coverage', '@slack-demo', '@failed'] }, () => {
  test('Fails on an incorrect page title', { tag: ['@failed'] }, async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle('This title does not exist on the storefront');
  });

  test('Fails on an incorrect URL pattern', { tag: ['@failed'] }, async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/this-domain-does-not-exist/);
  });

  test('Fails on a non-existent element', { tag: ['@failed'] }, async ({ page }) => {
    await page.goto('/');
    await expect(page.getByTestId('element-that-does-not-exist')).toBeVisible({ timeout: 3_000 });
  });

  test('Fails on an incorrect cart count', { tag: ['@failed'] }, async ({ page }) => {
    await page.goto('/');
    await page.getByTestId('add-to-cart-button').first().click();
    await expect(page.getByText('99').first()).toBeVisible({ timeout: 3_000 });
  });

  test('Fails on an incorrect element count', { tag: ['@failed'] }, async ({ page }) => {
    await page.goto('/');
    await expect(page.getByTestId('add-to-cart-button')).toHaveCount(0);
  });

  test('Fails on an incorrect text assertion', { tag: ['@failed'] }, async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('body')).toHaveText('This text will never match the storefront body');
  });

  test('Fails on an incorrect heading text', { tag: ['@failed'] }, async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('h1').first()).toHaveText('Nonexistent Heading', { timeout: 3_000 });
  });
});

// -------------------------------------------------------------- skipped (7)
test.describe('Slack Notification Demo - Skipped', { tag: ['@status-coverage', '@slack-demo', '@skipped'] }, () => {
  test.skip('Skipped: feature not yet implemented', {
    tag: ['@skipped'],
    annotation: [{ type: 'reason', description: 'Wishlist feature is not built yet' }],
  }, async ({ page }) => {
    await page.goto('/');
  });

  test.skip('Skipped: pending design review', {
    tag: ['@skipped'],
    annotation: [{ type: 'reason', description: 'New checkout layout awaiting design sign-off' }],
  }, async ({ page }) => {
    await page.goto('/');
  });

  test.skip('Skipped: deprecated legacy flow', {
    tag: ['@skipped'],
    annotation: [{ type: 'reason', description: 'Old cart flow scheduled for removal' }],
  }, async ({ page }) => {
    await page.goto('/');
  });

  test.skip('Skipped: region-locked promotion banner', {
    tag: ['@skipped'],
    annotation: [{ type: 'reason', description: 'Promotion only rolled out in a region we do not test' }],
  }, async ({ page }) => {
    await page.goto('/');
  });

  test('Skipped: gated behind a feature flag env var', { tag: ['@skipped', '@conditional'] }, async ({ page }) => {
    test.skip(process.env.ENABLE_WISHLIST !== '1', 'Wishlist feature flag disabled');
    await page.goto('/');
  });

  test('Skipped: gated behind a beta checkout env var', { tag: ['@skipped', '@conditional'] }, async ({ page }) => {
    test.skip(process.env.ENABLE_BETA_CHECKOUT !== '1', 'Beta checkout flow disabled');
    await page.goto('/');
  });

  test('Skipped: gated behind a loyalty-program env var', { tag: ['@skipped', '@conditional'] }, async ({ page }) => {
    test.skip(process.env.ENABLE_LOYALTY_PROGRAM !== '1', 'Loyalty program flow disabled');
    await page.goto('/');
  });
});

// ---------------------------------------------------------------- flaky (6)
// `retries` is 0 in playwright.config.ts, and a case can only be reported
// flaky if it is retried — so this block opts itself in, same as
// run-status-coverage.spec.ts.
test.describe('Slack Notification Demo - Flaky', {
  tag: ['@status-coverage', '@slack-demo', '@flaky'],
}, () => {
  test.describe.configure({ retries: 2 });

  test('Flaky 1: fails first attempt, passes on retry', { tag: ['@flaky'] }, async ({ page }, testInfo) => {
    await page.goto('/');
    expect(testInfo.retry, 'simulated instability').toBeGreaterThan(0);
  });

  test('Flaky 2: fails first attempt, passes on retry', { tag: ['@flaky'] }, async ({ page }, testInfo) => {
    await page.goto('/');
    expect(testInfo.retry, 'simulated instability').toBeGreaterThan(0);
  });

  test('Flaky 3: fails first attempt, passes on retry', { tag: ['@flaky'] }, async ({ page }, testInfo) => {
    await page.goto('/');
    expect(testInfo.retry, 'simulated instability').toBeGreaterThan(0);
  });

  test('Flaky 4: fails first two attempts, passes on second retry', { tag: ['@flaky'] }, async ({ page }, testInfo) => {
    await page.goto('/');
    expect(testInfo.retry, 'simulated instability').toBeGreaterThan(1);
  });

  test('Flaky 5: fails first attempt, passes on retry', { tag: ['@flaky'] }, async ({ page }, testInfo) => {
    await page.goto('/');
    await expect(page).toHaveURL(/storedemo/);
    expect(testInfo.retry, 'simulated instability').toBeGreaterThan(0);
  });

  test('Flaky 6: fails first attempt, passes on retry', { tag: ['@flaky'] }, async ({ page }, testInfo) => {
    await page.goto('/');
    await expect(page.locator('body')).toBeVisible();
    expect(testInfo.retry, 'simulated instability').toBeGreaterThan(0);
  });
});
