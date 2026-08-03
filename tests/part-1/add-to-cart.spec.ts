import { test, expect } from '@playwright/test';

// ✅ TestDino Recommended: Tags declared cleanly via details object
test.describe('Race-safe Add-to-Cart', { tag: ['@regression', '@cart'] }, () => {
  
  // ✅ Clean, isolated worker test with specific '@fast' tag array
  test('Add 3 products to cart and verify count', { tag: ['@fast', '@smoke'] }, async ({ page }) => {
    
    const products = [
      'Seagate 4TB External Hard Drive',
      'JBL Charge 4 Bluetooth Speaker',
      'Rode NT1-A Condenser Mic',
    ];

    // ✅ Navigates using baseURL defined in playwright.config.ts
    await page.goto('/');

    for (const product of products) {
      await page.goto('/');
      await page.getByText(product).first().click();
      
      const addToCartButton = page.getByTestId('add-to-cart-button');
      await expect(addToCartButton).toBeVisible();
      await addToCartButton.click();
      
      console.log(`${product} added successfully`);
    }

    const cartBadge = page.getByText('3').first();
    await expect(cartBadge).toBeVisible();

    await page.screenshot({ path: 'screenshots/cart-with-3-products.png', fullPage: true });
    
    // Manual browser/context closes are no longer needed; Playwright handles cleanup cleanly!
  });
});
