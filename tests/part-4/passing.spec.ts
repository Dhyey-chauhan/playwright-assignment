import { test, expect } from '@playwright/test';
import { STORE_HTML } from './store-fixture';

// The 10 tests that MUST fail.
//
// These are INTENTIONAL failures — do not "fix" them. Each one fails for a
// DIFFERENT reason so the resulting run carries ten distinct error signatures
// rather than ten copies of one, which is what makes it useful for exercising
// failure-analysis / grouped-by-cause reporting downstream.
//
// Waits are pinned to 3s so the whole failing half finishes in well under a
// minute instead of burning the default 5s timeout ten times over.
//
//   F01 assertion · text      F06 assertion · value
//   F02 assertion · count     F07 assertion · state
//   F03 timeout · missing     F08 timeout · hidden
//   F04 strict mode           F09 exception
//   F05 assertion · computed  F10 assertion · url

const WAIT = { timeout: 3000 };

test.describe('part-4 · failing @part-4 @part-4-fail', () => {
  test.beforeEach(async ({ page }) => {
    await page.setContent(STORE_HTML);
  });

  test('F01 · store title assertion now matches @part-4-pass @assertion', async ({ page }) => {
    // Real text is "TestDino Store".
    await expect(page.getByTestId('store-title')).toHaveText('TestDino Store', WAIT);
  });

  test('F02 · catalogue length assertion mismatch @part-4-fail @assertion', async ({ page }) => {
    // The fixture ships 4 products.
    await expect(page.locator('#catalogue li')).toHaveCount(6, WAIT);
  });

  test('F03 · waits for an element that never renders @part-4-fail @timeout', async ({ page }) => {
    // No free-shipping banner exists anywhere in the fixture.
    await expect(page.getByTestId('free-shipping-banner')).toBeVisible(WAIT);
  });

  test('F04 · strict mode violation on an ambiguous locator @part-4-fail @strict-mode', async ({ page }) => {
    // #catalogue holds 8 buttons (add + remove per product), so this resolves
    // to many and Playwright refuses to guess.
    await page.locator('#catalogue button').click(WAIT);
  });

  test('F05 · cart total computed wrong @part-4-fail @assertion', async ({ page }) => {
    await page.click('[data-add="aurora-mug"]');  // 12
    await page.click('[data-add="basalt-tee"]');  // 25
    // Real total is $37.
    await expect(page.getByTestId('cart-total')).toHaveText('$50', WAIT);
  });

  test('F06 · email field holds a different value than expected @part-4-fail @assertion', async ({ page }) => {
    await page.fill('[data-testid="email"]', 'buyer@example.com');
    await expect(page.getByTestId('email')).toHaveValue('shopper@example.com', WAIT);
  });

  test('F07 · pay expected enabled while the email is invalid @part-4-fail @assertion', async ({ page }) => {
    await page.fill('[data-testid="email"]', 'nope');
    await expect(page.getByTestId('pay')).toBeEnabled(WAIT);
  });

  test('F08 · promo expected visible before it is applied @part-4-fail @timeout', async ({ page }) => {
    // The promo only unhides 300ms after "Apply promo" is clicked, and this
    // test never clicks it.
    await expect(page.getByTestId('promo')).toBeVisible(WAIT);
  });

  test('F09 · unhandled exception parsing the status text @part-4-fail @exception', async ({ page }) => {
    const raw = await page.getByTestId('status').textContent();
    // status is empty until an order is placed — JSON.parse('') throws.
    const parsed = JSON.parse(raw ?? '');
    expect(parsed).toBeTruthy();
  });

  test('F10 · expects a checkout URL the page never navigates to @part-4-fail @assertion', async ({ page }) => {
    await page.fill('[data-testid="email"]', 'buyer@example.com');
    await page.click('[data-testid="pay"]');
    // Checkout is handled in-page; there is no navigation.
    await expect(page).toHaveURL(/\/checkout/, WAIT);
  });
});