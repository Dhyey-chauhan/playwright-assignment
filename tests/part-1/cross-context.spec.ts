import { test, expect, chromium } from '@playwright/test';

test('User A cart should not affect User B cart', async () => {
  const browser = await chromium.launch({ headless: false });

  // user a
  const contextA = await browser.newContext();
  const pageA = await contextA.newPage();

  // home page first
  await pageA.goto('https://storedemo.testdino.com', { waitUntil: 'domcontentloaded' });
  await pageA.waitForTimeout(3000);

  // create product page screenshot before adding to cart
  await pageA.getByText('Seagate 4TB External Hard Drive').first().click();
  await pageA.waitForTimeout(3000);

  console.log('Product page URL:', pageA.url());
  await pageA.screenshot({ path: 'product-page.png', fullPage: true });

  // Now click Add to Cart
  await pageA.getByTestId('add-to-cart-button').click();
  await pageA.waitForTimeout(1000);

  await expect(pageA.locator('text=1').first()).toBeVisible();
  console.log('User A cart badge visible');

  // user b
  const contextB = await browser.newContext();
  const pageB = await contextB.newPage();

  await pageB.goto('https://storedemo.testdino.com', { waitUntil: 'domcontentloaded' });
  await pageB.waitForTimeout(2000);

  const badge = pageB.locator('[class*="badge"], [class*="cart-count"], [class*="count"]');
  await expect(badge).not.toBeVisible();
  console.log('User B cart is empty ');

  await contextA.close();
  await contextB.close();
  await browser.close();
});