import { test, expect } from '@playwright/test';

/**
 * This test file demonstrates visual mismatch detection
 * Run with: npx playwright test visual-mismatch-demo.spec.ts
 */

test.describe('Visual Mismatch Detection Demo', { tag: ['@visual-demo'] }, () => {

  const BASE_URL = 'https://storedemo.testdino.com';

  test('TEST 1: Baseline - Create the original snapshot', { tag: ['@baseline', '@regression'] }, async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
    await page.evaluate(() => document.fonts.ready);
    
    // This creates the baseline
    await expect(page).toHaveScreenshot('demo-baseline.png');
  });

  test('TEST 2: Add red banner - Should show mismatch', { tag: ['@banner-diff', '@critical'] }, async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
    await page.evaluate(() => document.fonts.ready);
    
    // Add a visible red banner at the top
    await page.evaluate(() => {
      const banner = document.createElement('div');
      banner.id = 'test-banner';
      banner.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        background: #ff0000;
        color: white;
        padding: 15px;
        text-align: center;
        z-index: 99999;
        font-size: 20px;
        font-weight: bold;
      `;
      banner.textContent = '⚠️ VISUAL MISMATCH DEMO';
      document.body.prepend(banner);
    });
    
    await page.waitForTimeout(500);
    
    // Compare against baseline - should fail and show diff
    await expect(page).toHaveScreenshot('demo-baseline.png', {
      maxDiffPixelRatio: 0.001,  // Very strict
      threshold: 0.1,
    });
  });

  test('TEST 3: Change button color - Should show mismatch', { tag: ['@color-diff', '@smoke'] }, async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
    await page.evaluate(() => document.fonts.ready);
    
    // Change all buttons to bright green
    await page.evaluate(() => {
      const buttons = document.querySelectorAll('button');
      buttons.forEach(btn => {
        btn.style.backgroundColor = '#00ff00';
        btn.style.color = '#000000';
      });
    });
    
    await page.waitForTimeout(300);
    
    // Should detect the color change
    await expect(page).toHaveScreenshot('demo-baseline.png', {
      maxDiffPixelRatio: 0.001,
      threshold: 0.1,
    });
  });

  test('TEST 4: Hide header - Should show mismatch', { tag: ['@hidden-header', '@regression'] }, async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
    await page.evaluate(() => document.fonts.ready);
    
    // Hide the header/nav
    await page.evaluate(() => {
      const header = document.querySelector('header, nav');
      if (header) {
        (header as HTMLElement).style.display = 'none';
      }
    });
    
    await page.waitForTimeout(300);
    
    // Should detect missing header
    await expect(page).toHaveScreenshot('demo-baseline.png', {
      maxDiffPixelRatio: 0.001,
      threshold: 0.1,
    });
  });

  test('TEST 5: Add extra spacing - Should show layout mismatch', { tag: ['@layout-shift', '@critical'] }, async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
    await page.evaluate(() => document.fonts.ready);
    
    // Add padding to body to shift everything down
    await page.evaluate(() => {
      document.body.style.paddingTop = '100px';
    });
    
    await page.waitForTimeout(300);
    
    // Should detect layout shift
    await expect(page).toHaveScreenshot('demo-baseline.png', {
      maxDiffPixelRatio: 0.001,
      threshold: 0.1,
    });
  });

  test('TEST 6: Strict comparison - Catch even tiny differences', { tag: ['@pixel-perfect', '@smoke'] }, async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
    await page.evaluate(() => document.fonts.ready);
    
    // Make a very subtle change - add 1px border
    await page.evaluate(() => {
      document.body.style.border = '1px solid rgba(255,0,0,0.1)';
    });
    
    await page.waitForTimeout(300);
    
    // Ultra-strict settings to catch even 1px border
    await expect(page).toHaveScreenshot('demo-baseline.png', {
      maxDiffPixelRatio: 0.0001,  // 0.01% tolerance
      threshold: 0.05,             // Very sensitive
    });
  });

  test('TEST 7: Element-level mismatch', { tag: ['@element-baseline', '@regression'] }, async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
    await page.evaluate(() => document.fonts.ready);
    
    // Find first product card
    const productCard = page.locator('[data-testid="product-card"]').first();
    
    // Take baseline of product card
    await expect(productCard).toHaveScreenshot('product-card-baseline.png');
  });

  test('TEST 8: Element-level mismatch - Modified card', { tag: ['@card-modified', '@critical'] }, async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
    await page.evaluate(() => document.fonts.ready);
    
    // Modify the first product card
    await page.evaluate(() => {
      const card = document.querySelector('[data-testid="product-card"]');
      if (card) {
        (card as HTMLElement).style.backgroundColor = '#ffeb3b';
        (card as HTMLElement).style.border = '3px solid red';
      }
    });
    
    await page.waitForTimeout(300);
    
    const productCard = page.locator('[data-testid="product-card"]').first();
    
    // Should detect the styling changes
    await expect(productCard).toHaveScreenshot('product-card-baseline.png', {
      maxDiffPixelRatio: 0.001,
      threshold: 0.1,
    });
  });

});

test.describe('Visual Testing - Showing Tolerant vs Strict', { tag: ['@tolerance'] }, () => {

  const BASE_URL = 'https://storedemo.testdino.com';

  test('DEMO A: Tolerant test - Small change passes', { tag: ['@tolerant', '@smoke'] }, async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
    await page.evaluate(() => document.fonts.ready);
    
    // Small change - add semi-transparent overlay
    await page.evaluate(() => {
      const overlay = document.createElement('div');
      overlay.style.cssText = `
        position: fixed;
        top: 50%;
        right: 20px;
        background: rgba(0, 0, 0, 0.05);
        padding: 5px;
        font-size: 10px;
        color: rgba(0, 0, 0, 0.3);
      `;
      overlay.textContent = 'v1.0';
      document.body.appendChild(overlay);
    });
    
    await page.waitForTimeout(300);
    
    // Tolerant settings - small change might pass
    await expect(page).toHaveScreenshot('tolerant-demo.png', {
      maxDiffPixelRatio: 0.05,  // 5% tolerance
      threshold: 0.5,            // Very tolerant
    });
  });

  test('DEMO B: Strict test - Same small change fails', { tag: ['@strict', '@regression'] }, async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
    await page.evaluate(() => document.fonts.ready);
    
    // Same small change as above
    await page.evaluate(() => {
      const overlay = document.createElement('div');
      overlay.style.cssText = `
        position: fixed;
        top: 50%;
        right: 20px;
        background: rgba(0, 0, 0, 0.05);
        padding: 5px;
        font-size: 10px;
        color: rgba(0, 0, 0, 0.3);
      `;
      overlay.textContent = 'v1.0';
      document.body.appendChild(overlay);
    });
    
    await page.waitForTimeout(300);
    
    // Strict settings - should catch the change
    await expect(page).toHaveScreenshot('tolerant-demo.png', {
      maxDiffPixelRatio: 0.001,  // 0.1% tolerance
      threshold: 0.1,             // Strict
    });
  });

});
