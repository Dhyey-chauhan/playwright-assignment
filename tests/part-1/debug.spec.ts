import { test } from '@playwright/test';

test('debug - see what playwright sees', async ({ page }) => {
  // go to home page
  await page.goto('https://storedemo.testdino.com', { 
    waitUntil: 'domcontentloaded' 
  });
  
  await page.waitForTimeout(3000);
  await page.screenshot({ path: 'debug-home.png', fullPage: true });
  
  const buttons = await page.getByRole('button').all();
  console.log('Buttons on homepage:', buttons.length);
  
  const links = await page.getByRole('link').all();
  console.log('Links on homepage:', links.length);
});