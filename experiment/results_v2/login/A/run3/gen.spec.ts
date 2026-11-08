import { test, expect } from '@playwright/test';

test.describe('Login functionality', () => {
  test('valid credentials should log in successfully', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: 'Login' }).click();
    await page.fill('input[name="email"]', 'validuser@example.com');
    await page.fill('input[name="password"]', 'validpassword');
    await page.getByRole('button', { name: 'Login' }).click();
    await expect(page).toHaveURL('/dashboard');
  });

  test('invalid credentials should not log in', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: 'Login' }).click();
    await page.fill('input[name="email"]', 'invaliduser@example.com');
    await page.fill('input[name="password"]', 'invalidpassword');
    await page.getByRole('button', { name: 'Login' }).click();
    await expect(page).toHaveURL('/login');
  });

  test.describe('Security regression tests', () => {
    test('SQL injection in the email field should not bypass authentication', async ({ page }) => {
      await page.goto('/');
      await page.getByRole('link', { name: 'Login' }).click();
      await page.fill('input[name="email"]', "'; -- ");
      await page.fill('input[name="password"]', 'validpassword');
      await page.getByRole('button', { name: 'Login' }).click();
      await expect(page).toHaveURL('/login');
    });

    test('known weak credentials should not bypass authentication', async ({ page }) => {
      await page.goto('/');
      await page.getByRole('link', { name: 'Login' }).click();
      await page.fill('input[name="email"]', 'weakuser@example.com');
      await page.fill('input[name="password"]', 'weakpassword');
      await page.getByRole('button', { name: 'Login' }).click();
      await expect(page).toHaveURL('/login');
    });
  });

  test.describe('Two-factor authentication', () => {
    test('should require valid TOTP code after password step', async ({ page }) => {
      await page.goto('/');
      await page.getByRole('link', { name: 'Login' }).click();
      await page.fill('input[name="email"]', '2fauser@example.com');
      await page.fill('input[name="password"]', 'validpassword');
      await page.getByRole('button', { name: 'Login' }).click();
      await page.getByRole('heading', { name: 'Enter TOTP code' }).waitFor();
      await page.fill('input[name="totpCode"]', '123456');
      await page.getByRole('button', { name: 'Verify' }).click();
      await expect(page).toHaveURL('/dashboard');
    });
  });
});
