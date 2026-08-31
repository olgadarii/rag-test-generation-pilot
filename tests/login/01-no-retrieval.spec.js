import { test, expect } from '@playwright/test';

test.describe('Login', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000');
  });

  test('should log in with valid credentials and navigate to product listing page', async ({ page }) => {
    await page.fill('#email', 'valid.email@example.com');
    await page.fill('#password', 'validpassword');
    await page.click('#login-button');

    await expect(page).toHaveURL('http://localhost:3000/products');
  });

  test('should show error message and stay on login page with invalid credentials', async ({ page }) => {
    await page.fill('#email', 'invalid.email@example.com');
    await page.fill('#password', 'invalidpassword');
    await page.click('#login-button');

    await expect(page).toHaveURL('http://localhost:3000/login');
    await expect(page.getByText('Invalid email or password')).toBeVisible();
  });
});
