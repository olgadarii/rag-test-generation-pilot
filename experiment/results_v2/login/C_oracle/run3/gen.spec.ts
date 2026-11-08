import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('http://localhost:3000/#/login');
});

test.describe('login page acceptance criteria', () => {
  test('valid credentials should log in successfully', async ({ page }) => {
    await page.fill('#email', 'admin@localhost');
    await page.fill('#password', 'admin123');
    await page.click('#loginButton');
    await expect(page).toHaveURL('http://localhost:3000/#/dashboard');
  });

  test.each([
    ['\' or 1=1--', 'admin@localhost', 'a'],
    ['admin@localhost\'--', 'a'],
    ['jim@localhost\'--', 'a'],
    ['bender@localhost\'--', 'a'],
    ['\' UNION SELECT * FROM (SELECT 15 as "id", "" as "username", "acc0unt4nt@localhost" as "email", "12345" as "password", "accounting" as "role", "123" as "deluxeToken", "1.2.3.4" as "lastLoginIp" , "/assets/public/images/uploads/default.svg" as "profileImage", "" as "totpSecret", 1 as "isActive", "1999-08-16 14:14:41.644 +00:00" as "createdAt", "1999-08-16 14:33:41.930 +00:00" as "updatedAt", null as "deletedAt")--', 'admin123'],
    ['testing@localhost', 'IamUsedForTesting'],
    ['mc.safesearch@localhost', 'Mr. N00dles'],
    ['support@localhost', 'J6aVjTgOpRs@?5l!Zkq2AYnCE@RF$P'],
    ['amy@localhost', 'K1f.....................'],
    ['wurstbrot@localhost\'--', 'Never mind...'],
    ['bjoern.kimminich@gmail.com', 'bW9jLmxpYW1nQGhjaW5pbW1pay5ucmVvamI='],
    ['chris.pike@localhost\' or deletedAt IS NOT NULL--', 'a'],
    ['chris.pike@localhost\'--', 'a']
  ])('SQL injection or known weak credentials should be rejected', async ({ email, password, totpToken }) => {
    await page.fill('#email', email);
    await page.fill('#password', password);
    await page.click('#loginButton');
    await expect(page).toHaveURL('http://localhost:3000/#/login');

    if (totpToken) {
      await page.fill('#totpToken', totpToken);
      await page.click('#totpSubmitButton');
      await expect(page).toHaveURL('http://localhost:3000/#/dashboard');
    }
  });
});
