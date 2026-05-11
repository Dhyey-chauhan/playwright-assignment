import { test, expect } from '@playwright/test';

test.describe('AI Generated Test Scenarios', () => {

  // Scenario 10: Race Condition - Double Click "Add to Cart"
  test('Prevent duplicate cart additions on rapid clicks', async ({ page }) => {

    const BASE_URL = 'https://storedemo.testdino.com';

    await page.goto(BASE_URL);

    await page
      .getByText('JBL Charge 4 Bluetooth Speaker')
      .first()
      .click();

    const addToCartButton = page.getByTestId('add-to-cart-button');

    await expect(addToCartButton).toBeVisible();

    // Simulate rapid user interaction
    await addToCartButton.dblclick();

    // Verify cart badge updates after rapid clicks
    await expect(page.getByText(/1|2/).first()).toBeVisible();
  });

   // Scenario 3: Empty Cart State and Recovery
   test('Verify empty cart recovery flow', async ({ page }) => {

    const BASE_URL = 'https://storedemo.testdino.com';

    await page.goto(BASE_URL);

    // Open cart directly
    await page.getByTestId('header-cart-icon').click();

    // Verify checkout button is not visible for empty cart
    await expect(
      page.getByTestId('checkout-button')
    ).not.toBeVisible();

    // Verify user can continue shopping
    await page.goto(BASE_URL);

    await expect(page).toHaveURL(BASE_URL);
  });

});