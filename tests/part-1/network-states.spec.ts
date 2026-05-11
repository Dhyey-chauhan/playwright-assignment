import { test, expect } from '@playwright/test';

test.describe('Network-driven state coverage', () => {

  test('Empty catalog state', async ({ page }) => {

    // Mock empty product response
    await page.route('**/api/products**', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      });
    });

    await page.goto('https://storedemo.testdino.com');

    // Wait until page finishes loading
    await page.waitForLoadState('networkidle');

    // Capture UI state
    await expect(page).toHaveURL(/storedemo/);

    await page.screenshot({
      path: 'screenshots/empty-catalog.png',
      fullPage: true,
    });

    console.log('Empty catalog state captured successfully');
  });


  test('Server error 500 state', async ({ page }) => {

    // Mock server error response
    await page.route('**/api/products**', async route => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({
          error: 'Internal Server Error',
        }),
      });
    });

    await page.goto('https://storedemo.testdino.com');

    await page.waitForLoadState('networkidle');

    // Basic verification page loaded
    await expect(page).toHaveURL(/storedemo/);

    await page.screenshot({
      path: 'screenshots/server-error.png',
      fullPage: true,
    });

    console.log('500 error state captured successfully');
  });


  test('Slow network delay state', async ({ page }) => {

    // Simulate slow API response
    await page.route('**/api/products**', async route => {
      await new Promise(resolve => setTimeout(resolve, 3000));

      await route.continue();
    });

    const startTime = Date.now();

    await page.goto('https://storedemo.testdino.com');

    await page.waitForLoadState('networkidle');

    const loadTime = Date.now() - startTime;

    // Verify page still loads under delayed network
    await expect(page).toHaveURL(/storedemo/);

    await page.screenshot({
      path: 'screenshots/slow-network.png',
      fullPage: true,
    });

    console.log(`Slow network simulated successfully`);
    console.log(`Page loaded in ${loadTime}ms`);
  });

});