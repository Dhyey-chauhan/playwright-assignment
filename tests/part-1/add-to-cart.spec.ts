import { test, expect, chromium } from '@playwright/test';

test('Add 3 products to cart and verify count', async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Go to homepage first 
  await page.goto('https://storedemo.testdino.com', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);

  // add product 1
  await page.getByText('Seagate 4TB External Hard Drive').first().click();
  await page.waitForTimeout(2000);
  await page.getByTestId('add-to-cart-button').click();
  await page.waitForTimeout(1000);
  console.log('Product 1 added');

  // add product 2
  await page.goto('https://storedemo.testdino.com', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);
  await page.getByText('JBL Charge 4 Bluetooth Speaker').first().click();
  await page.waitForTimeout(2000);
  await page.getByTestId('add-to-cart-button').click();
  await page.waitForTimeout(1000);
  console.log('Product 2 added');

  // add product 3
  await page.goto('https://storedemo.testdino.com', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);
  await page.getByText('Rode NT-A Condenser Mic').first().click();
  await page.waitForTimeout(2000);
  await page.getByTestId('add-to-cart-button').click();
  await page.waitForTimeout(1000);
  console.log('Product 3 added ');

  // verify cart badge shows 3
  await expect(page.getByText('3').first()).toBeVisible();
  console.log('Cart badge shows 3 ');

  await browser.close();
});