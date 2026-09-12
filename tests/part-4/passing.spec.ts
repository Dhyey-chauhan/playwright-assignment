import { test, expect } from '@playwright/test';
import { STORE_HTML, PRODUCTS } from './store-fixture';

// The 10 tests that MUST pass. Every assertion here is checked against the
// fixture in store-fixture.ts, so a failure in this file is a real regression
// (or a broken fixture) — never an intended outcome.

test.describe('part-4 · passing @part-4 @part-4-pass', () => {
  test.beforeEach(async ({ page }) => {
    await page.setContent(STORE_HTML);
  });

  test('P01 · renders the store title and an empty cart @part-4-pass', async ({ page }) => {
    await expect(page.getByTestId('store-title')).toHaveText('TestDino Store');
    await expect(page.getByTestId('cart-count')).toHaveText('0');
    await expect(page.getByTestId('cart-total')).toHaveText('$0');
  });

  test('P02 · lists every product with its price @part-4-pass', async ({ page }) => {
    await expect(page.locator('#catalogue li')).toHaveCount(PRODUCTS.length);
    for (const product of PRODUCTS) {
      const row = page.locator(`#catalogue li[data-sku="${product.sku}"]`);
      await expect(row.locator('.name')).toHaveText(product.name);
      await expect(row.locator('.price')).toHaveText(`$${product.price}`);
    }
  });

  test('P03 · adding one product updates count and total @part-4-pass', async ({ page }) => {
    await page.click('[data-add="aurora-mug"]');
    await expect(page.getByTestId('cart-count')).toHaveText('1');
    await expect(page.getByTestId('cart-total')).toHaveText('$12');
  });

  test('P04 · adding three products sums the total @part-4-pass', async ({ page }) => {
    await page.click('[data-add="aurora-mug"]');   // 12
    await page.click('[data-add="basalt-tee"]');   // 25
    await page.click('[data-add="cobalt-cap"]');   // 18
    await expect(page.getByTestId('cart-count')).toHaveText('3');
    await expect(page.getByTestId('cart-total')).toHaveText('$55');
  });

  test('P05 · the same product can be added twice @part-4-pass', async ({ page }) => {
    await page.click('[data-add="drift-hoodie"]');
    await page.click('[data-add="drift-hoodie"]');
    await expect(page.getByTestId('cart-count')).toHaveText('2');
    await expect(page.getByTestId('cart-total')).toHaveText('$80');
  });

  test('P06 · removing an item decrements the cart @part-4-pass', async ({ page }) => {
    const remove = page.locator('[data-remove="basalt-tee"]');
    await expect(remove).toBeDisabled();

    await page.click('[data-add="basalt-tee"]');
    await expect(remove).toBeEnabled();

    await remove.click();
    await expect(page.getByTestId('cart-count')).toHaveText('0');
    await expect(page.getByTestId('cart-total')).toHaveText('$0');
    await expect(remove).toBeDisabled();
  });

  test('P07 · search filters the catalogue @part-4-pass', async ({ page }) => {
    await page.fill('[data-testid="search"]', 'cap');
    await expect(page.locator('#catalogue li:visible')).toHaveCount(1);
    await expect(page.locator('#catalogue li:visible .name')).toHaveText('Cobalt Cap');
  });

  test('P08 · a search with no match reports an empty result @part-4-pass', async ({ page }) => {
    await page.fill('[data-testid="search"]', 'telescope');
    await expect(page.locator('#catalogue li:visible')).toHaveCount(0);
    await expect(page.getByTestId('status')).toHaveText('No products match your search');
  });

  test('P09 · pay stays disabled until the email is valid @part-4-pass', async ({ page }) => {
    const pay = page.getByTestId('pay');
    await expect(pay).toBeDisabled();

    await page.fill('[data-testid="email"]', 'not-an-email');
    await expect(pay).toBeDisabled();

    await page.fill('[data-testid="email"]', 'buyer@example.com');
    await expect(pay).toBeEnabled();
  });

  test('P10 · checkout confirms the order, and the promo resolves async @part-4-pass', async ({ page }) => {
    await page.click('[data-testid="apply-promo"]');
    await expect(page.getByTestId('promo')).toBeVisible();
    await expect(page.getByTestId('promo')).toHaveText('PROMO10 applied');

    await page.click('[data-add="aurora-mug"]');
    await page.fill('[data-testid="email"]', 'buyer@example.com');
    await page.click('[data-testid="pay"]');
    await expect(page.getByTestId('status')).toHaveText('Order placed for buyer@example.com');
  });
});
