import { test, expect, chromium } from '@playwright/test';

test.describe('Cross-context isolation', () => {

  test('User A cart should not affect User B cart', async () => {

    const browser = await chromium.launch({
      headless: false,
    });

    const BASE_URL = 'https://storedemo.testdino.com';

    
    // User A Context
    const contextA = await browser.newContext();
    const pageA = await contextA.newPage();

    await pageA.goto(BASE_URL);

    // Open product page
    await pageA
      .getByText('Seagate 4TB External Hard Drive')
      .first()
      .click();

    // Wait until Add to Cart button is visible
    const addToCartButton = pageA.getByTestId('add-to-cart-button');

    await expect(addToCartButton).toBeVisible();

    // Capture product page screenshot
    await pageA.screenshot({
      path: 'screenshots/product-page.png',
      fullPage: true,
    });

    // Add product to cart
    await addToCartButton.click();

    // Verify User A cart contains item
    const cartBadge = pageA.locator('text=1').first();

    await expect(cartBadge).toBeVisible();

    console.log('User A successfully added product to cart');

    // User B Context
    const contextB = await browser.newContext();
    const pageB = await contextB.newPage();

    await pageB.goto(BASE_URL);

    // Verify User B has empty cart
    const userBCartBadge = pageB.locator(
      '[class*="badge"], [class*="cart-count"], [class*="count"]'
    );

    await expect(userBCartBadge).not.toBeVisible();

    console.log('User B cart remained isolated and empty');

    // Clean 
    await contextA.close();
    await contextB.close();
    await browser.close();
  });

});