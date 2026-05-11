import { test, expect, chromium } from '@playwright/test';

test('Network state: empty catalog', async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  // product api return empty error
  await page.route('**/api/products**', route => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([]),
    });
  });

  await page.goto('https://storedemo.testdino.com', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);
  await page.screenshot({ path: 'empty-catalog.png', fullPage: true });
  console.log('Empty catalog state captured');

  await browser.close();
});

test('Network state: server error 500', async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  // return 500 error
  await page.route('**/api/products**', route => {
    route.fulfill({
      status: 500,
      contentType: 'application/json',
      body: JSON.stringify({ error: 'Internal Server Error' }),
    });
  });

  await page.goto('https://storedemo.testdino.com', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);
  await page.screenshot({ path: 'server-error.png', fullPage: true });
  console.log('Server error state captured');

  await browser.close();
});

test('Network state: slow network delay', async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  // 3 second delay
  await page.route('**/api/products**', async route => {
    await new Promise(resolve => setTimeout(resolve, 3000));
    route.continue();
  });

  const startTime = Date.now();
  await page.goto('https://storedemo.testdino.com', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'slow-network.png', fullPage: true });

  const elapsed = Date.now() - startTime;
  console.log(`Page loaded in ${elapsed}ms — slow network simulated `);

  await browser.close();
});