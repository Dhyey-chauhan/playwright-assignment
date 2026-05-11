import { test, expect, chromium } from '@playwright/test';

test.describe('Race-safe Add-to-Cart', () => {

  test('Add 3 products to cart and verify count', async () => {

    const browser = await chromium.launch({
      headless: false,
    });

    const context = await browser.newContext();
    const page = await context.newPage();

    const BASE_URL = 'https://storedemo.testdino.com';

    const products = [
      'Seagate 4TB External Hard Drive',
      'JBL Charge 4 Bluetooth Speaker',
      'Rode NT1-A Condenser Mic',
    ];

    await page.goto(BASE_URL);

    for (const product of products) {

      await page.goto(BASE_URL);

      await page.getByText(product).first().click();

      const addToCartButton = page.getByTestId('add-to-cart-button');

      await expect(addToCartButton).toBeVisible();

      await addToCartButton.click();

      console.log(`${product} added successfully`);
    }

    const cartBadge = page.getByText('3').first();

    await expect(cartBadge).toBeVisible();

    await page.screenshot({
      path: 'screenshots/cart-with-3-products.png',
      fullPage: true,
    });

    await browser.close();
  });

});