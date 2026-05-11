import { test, expect } from '@playwright/test';

test('Generated ecommerce checkout flow', async ({ page }) => {
  await page.goto('https://storedemo.testdino.com/');
  await page.getByTestId('header-menu-home').click();
  await page.getByTestId('featured-products-section').getByRole('link', { name: 'dp JBL Charge 4 Bluetooth' }).click();
  await page.getByTestId('add-to-cart-button').click();
  await page.getByText('1Your Cart').click();
  await page.getByTestId('close-cart').click();
  await page.getByTestId('featured-products-section').getByRole('link', { name: 'dp SanDisk Ultra Dual Drive' }).click();
  await page.getByTestId('add-to-cart-button').click();
  await page.getByTestId('header-cart-icon').locator('path').click();
  await page.getByTestId('checkout-button').click();
  await page.getByTestId('login-email-input').click();
});