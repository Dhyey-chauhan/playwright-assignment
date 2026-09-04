import { test, expect } from '@playwright/test';

test.describe('Visual Regression Testing', { tag: ['@visual'] }, () => {

  const BASE_URL = 'https://storedemo.testdino.com';

  // Test with VERY strict settings to catch mismatches
  test('Strict visual test - will catch small differences', { tag: ['@strict-diff', '@smoke'] }, async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
    await page.evaluate(() => document.fonts.ready);
    
    // Very strict settings - even tiny differences will fail
    await expect(page).toHaveScreenshot('strict-homepage.png', {
      maxDiffPixelRatio: 0.001,  // Only 0.1% pixels can differ
      threshold: 0.1,             // Very low threshold for color difference
    });
  });

  test('Homepage visual comparison', { tag: ['@homepage', '@regression'] }, async ({ page }) => {
    await page.goto(BASE_URL);
    
    // Wait for page to be fully loaded and fonts to load
    await page.waitForLoadState('networkidle');
    await page.evaluate(() => document.fonts.ready);
    
    // Visual comparison of the homepage
    await expect(page).toHaveScreenshot('homepage.png');
  });

  test('Product page visual comparison', { tag: ['@product-page', '@critical'] }, async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
    await page.evaluate(() => document.fonts.ready);
    
    // Click on a product to navigate to product page
    await page.getByText('Seagate 4TB External Hard Drive').first().click();
    await page.waitForLoadState('networkidle');
    
    // Wait for product details to load
    await expect(page.getByTestId('add-to-cart-button')).toBeVisible();
    
    // Visual comparison of product page
    await expect(page).toHaveScreenshot('product-page.png');
  });

  test('Cart badge visual comparison', { tag: ['@cart-badge', '@smoke'] }, async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
    
    // Add a product to cart
    await page.getByText('Seagate 4TB External Hard Drive').first().click();
    await page.waitForLoadState('networkidle');
    
    const addToCartButton = page.getByTestId('add-to-cart-button');
    await expect(addToCartButton).toBeVisible();
    await addToCartButton.click();
    
    // Wait for cart to update
    await page.waitForTimeout(1000);
    
    // Navigate back to homepage to see cart badge
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
    
    // Visual comparison with cart badge visible
    await expect(page).toHaveScreenshot('cart-with-badge.png');
  });

  test('Product card visual comparison', { tag: ['@product-card', '@regression'] }, async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
    await page.evaluate(() => document.fonts.ready);
    
    // Get first product card and take screenshot of specific element
    const productCard = page.locator('[data-testid="product-card"]').first();
    await expect(productCard).toBeVisible();
    
    // Element-level screenshot is more stable than full-page
    await expect(productCard).toHaveScreenshot('product-card.png');
  });

  test('Navigation header visual comparison', { tag: ['@navigation', '@critical'] }, async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
    
    // Get the header/navigation area
    const header = page.locator('header, nav, [role="banner"]').first();
    
    if (await header.isVisible()) {
      // Visual comparison of navigation header
      await expect(header).toHaveScreenshot('navigation-header.png');
    }
  });

  test('Empty catalog visual comparison', { tag: ['@empty-catalog', '@smoke'] }, async ({ page }) => {
    // Test empty state if search returns no results
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
    
    // Try to search for something that doesn't exist
    const searchInput = page.locator('input[type="search"], input[placeholder*="search" i]').first();
    
    if (await searchInput.isVisible()) {
      await searchInput.fill('nonexistentproduct123456');
      await page.keyboard.press('Enter');
      await page.waitForTimeout(1000);
      
      // Visual comparison of empty search results
      await expect(page).toHaveScreenshot('empty-search-results.png');
    }
  });

  test('Full page scroll visual comparison', { tag: ['@full-page', '@regression'] }, async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
    await page.evaluate(() => document.fonts.ready);
    
    // Take full page screenshot with proper options
    await expect(page).toHaveScreenshot('full-page.png', {
      fullPage: true,
      maxDiffPixelRatio: 0.01,
      threshold: 0.2,
    });
  });

  test('Responsive design - mobile viewport', { tag: ['@mobile', '@critical'] }, async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
    
    // Visual comparison for mobile view
    await expect(page).toHaveScreenshot('homepage-mobile.png');
  });

  test('Responsive design - tablet viewport', { tag: ['@tablet', '@smoke'] }, async ({ page }) => {
    // Set tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
    
    // Visual comparison for tablet view
    await expect(page).toHaveScreenshot('homepage-tablet.png');
  });

  test('Product page with custom threshold', { tag: ['@threshold', '@regression'] }, async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
    
    await page.getByText('JBL Charge 4 Bluetooth Speaker').first().click();
    await page.waitForLoadState('networkidle');
    
    // Visual comparison with custom threshold settings
    await expect(page).toHaveScreenshot('product-page-custom-threshold.png', {
      maxDiffPixelRatio: 0.02,
      threshold: 0.3,
    });
  });

  // Test to demonstrate mismatch detection
  // test('Intentional mismatch - viewport change', { tag: ['@viewport-mismatch', '@critical'] }, async ({ page }) => {
  //   // Use slightly different viewport than baseline to trigger mismatch
  //   await page.setViewportSize({ width: 1281, height: 721 }); // Different from default
    
  //   await page.goto(BASE_URL);
  //   await page.waitForLoadState('networkidle');
  //   await page.evaluate(() => document.fonts.ready);
    
  //   // This should fail and show diff if baseline was created with different viewport
  //   await expect(page).toHaveScreenshot('homepage.png', {
  //     maxDiffPixelRatio: 0.001,
  //     threshold: 0.1,
  //   });
  // });

  // Test to demonstrate mismatch with element injection
  test('Intentional mismatch - with added element', { tag: ['@injected-element', '@smoke'] }, async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
    await page.evaluate(() => document.fonts.ready);
    
    // Inject a visible element to cause mismatch
    await page.evaluate(() => {
      const banner = document.createElement('div');
      banner.style.cssText = 'position: fixed; top: 0; left: 0; right: 0; background: red; color: white; padding: 20px; text-align: center; z-index: 9999; font-size: 24px;';
      banner.textContent = 'THIS WILL CAUSE A VISUAL MISMATCH';
      document.body.prepend(banner);
    });
    
    // Take screenshot - should show diff with red banner
    await expect(page).toHaveScreenshot('homepage.png', {
      maxDiffPixelRatio: 0.001,
      threshold: 0.1,
    });
  });

});
