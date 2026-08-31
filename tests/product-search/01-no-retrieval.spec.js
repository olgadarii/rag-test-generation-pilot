import { test, expect } from '@playwright/test';

test.describe('Product Search', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000');
  });

  test('search icon opens search input field', async ({ page }) => {
    const searchIcon = page.locator('.search-icon');
    await searchIcon.click();
    expect(await page.locator('.search-input').isVisible()).toBe(true);
  });

  test('typing keyword and pressing Enter shows matching products', async ({ page }) => {
    const searchInput = page.locator('.search-input');
    await searchInput.fill('example product');
    await searchInput.press('Enter');
    expect(await page.locator('.product-list .product-item').count()).toBeGreaterThan(0);
  });

  test('search input safely handles arbitrary user input', async ({ page }) => {
    const searchInput = page.locator('.search-input');
    await searchInput.fill('<script>alert("XSS")</script>');
    await searchInput.press('Enter');
    expect(await page.locator('text=alert("XSS")')).not.toBeVisible();
  });
});
