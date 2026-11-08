import { test, expect } from '@playwright/test';

test.describe('Login page acceptance criteria', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/#/login');
  });

  test('should log in with valid credentials', async ({ page }) => {
    await page.fill('#email', 'test@example.com');
    await page.fill('#password', 'testpassword');
    await page.click('#loginButton');
    await expect(page).toHaveURL('/#/dashboard');
  });

  test('should reject invalid credentials', async ({ page }) => {
    await page.fill('#email', 'invalid@example.com');
    await page.fill('#password', 'wrongpassword');
    await page.click('#loginButton');
    await expect(page).toHaveURL('/#/login');
  });

  test('should reject SQL injection in email field - admin@<juice-sh.op>\'--"', async ({ page }) => {
    await page.fill('#email', `admin@${process.env.APPLICATION_DOMAIN}'--`);
    await page.fill('#password', 'a');
    await page.click('#loginButton');
    await expect(page).toHaveURL('/#/login');
  });

  test('should reject SQL injection in email field - \' or 1=1--"', async ({ page }) => {
    await page.fill('#email', "' or 1=1--");
    await page.fill('#password', 'a');
    await page.click('#loginButton');
    await expect(page).toHaveURL('/#/login');
  });

  test('should reject known weak credentials - admin@<juice-sh.op>\'--"', async ({ page }) => {
    await page.fill('#email', `admin@${process.env.APPLICATION_DOMAIN}'--`);
    await page.fill('#password', 'admin123');
    await page.click('#loginButton');
    await expect(page).toHaveURL('/#/login');
  });

  test('should reject known weak credentials - support@<juice-sh.op>\'--"', async ({ page }) => {
    await page.fill('#email', `support@${process.env.APPLICATION_DOMAIN}'--`);
    await page.fill('#password', 'J6aVjTgOpRs@?5l!Zkq2AYnCE@RF$P');
    await page.click('#loginButton');
    await expect(page).toHaveURL('/#/login');
  });

  test('should reject known weak credentials - mc.safesearch@<juice-sh.op>\'--"', async ({ page }) => {
    await page.fill('#email', `mc.safesearch@${process.env.APPLICATION_DOMAIN}'--`);
    await page.fill('#password', 'Mr. N00dles');
    await page.click('#loginButton');
    await expect(page).toHaveURL('/#/login');
  });

  test('should reject known weak credentials - amy@<juice-sh.op>\'--"', async ({ page }) => {
    await page.fill('#email', `amy@${process.env.APPLICATION_DOMAIN}'--`);
    await page.fill('#password', 'K1f.....................');
    await page.click('#loginButton');
    await expect(page).toHaveURL('/#/login');
  });

  test('should reject known weak credentials - J12934@<juice-sh.op>\'--"', async ({ page }) => {
    await page.fill('#email', `J12934@${process.env.APPLICATION_DOMAIN}'--`);
    await page.fill('#password', '0Y8rMnww$*9VFYE§59-!Fg1L6t&6lB');
    await page.click('#loginButton');
    await expect(page).toHaveURL('/#/login');
  });

  test('should reject SQL injection in email field - chris.pike@juice-sh.op\'--"', async ({ page }) => {
    await page.fill('#email', `chris.pike@${process.env.APPLICATION_DOMAIN}'--`);
    await page.fill('#password', 'a');
    await page.click('#loginButton');
    await expect(page).toHaveURL('/#/login');
  });

  test('should reject SQL injection in email field - \' or deletedAt IS NOT NULL --"', async ({ page }) => {
    await page.fill('#email', "' or deletedAt IS NOT NULL--");
    await page.fill('#password', 'a');
    await page.click('#loginButton');
    await expect(page).toHaveURL('/#/login');
  });

  test('should reject ephemeral account - UNION SELECT payload', async ({ page }) => {
    await page.fill('#email', "' UNION SELECT * FROM (SELECT 15 as 'id', '' as 'username', 'acc0unt4nt@juice-sh.op' as 'email', '12345' as 'password', 'accounting' as 'role', '123' as 'deluxeToken', '1.2.3.4' as 'lastLoginIp' , '/assets/public/images/uploads/default.svg' as 'profileImage', '' as 'totpSecret', 1 as 'isActive', '1999-08-16 14:14:41.644 +00:00' as 'createdAt', '1999-08-16 14:33:41.930 +00:00' as 'updatedAt', null as 'deletedAt')--");
    await page.fill('#password', 'a');
    await page.click('#loginButton');
    await expect(page).toHaveURL('/#/login');
  });

  test('should reject exposed credentials - testing@<juice-sh.op>\'--"', async ({ page }) => {
    await page.fill('#email', `testing@${process.env.APPLICATION_DOMAIN}'--`);
    await page.fill('#password', 'IamUsedForTesting');
    await page.click('#loginButton');
    await expect(page).toHaveURL('/#/login');
  });

  test('should require TOTP for accounts with 2FA enabled', async ({ page }) => {
    await page.fill('#email', 'test@example.com');
    await page.fill('#password', 'testpassword');
    await page.click('#loginButton');
    await expect(page).toHaveURL('/#/2fa');
  });
});
