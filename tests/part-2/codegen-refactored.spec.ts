import { test, expect } from '@playwright/test';

test.describe('Refactored ecommerce flow', () => {

  test('User adds products and opens checkout flow', async ({ page }) => {

    const BASE_URL = 'https://storedemo.testdino.com';

    await page.goto(BASE_URL);

    const products = [
      'JBL Charge 4 Bluetooth',
      'SanDisk Ultra Dual Drive',
    ];

    for (const product of products) {

      await page
        .getByTestId('featured-products-section')
        .getByRole('link', { name: new RegExp(product, 'i') })
        .click();

      const addToCartButton = page.getByTestId('add-to-cart-button');

      await expect(addToCartButton).toBeVisible();

      await addToCartButton.click();

      await page.goto(BASE_URL);
    }

    await page.getByTestId('header-cart-icon').click();

    await expect(page.getByTestId('checkout-button')).toBeVisible();

    await page.getByTestId('checkout-button').click();

    await expect(page.getByTestId('login-email-input')).toBeVisible();
  });

});