```typescript
import { test, expect } from '@playwright/test';

test.describe('Login', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000/login');
  });

  test('valid credentials should log in successfully', async ({ page }) => {
    await page.fill('#email', 'wurstbrot');
    await page.fill('#password', 'EinBelegtesBrotMitSchinkenSCHINKEN!');
    await page.click('#loginButton');
    await expect(page).toHaveURL('http://localhost:3000/privacy-security/two-factor-authentication');
  });

  test('invalid credentials should not log in', async ({ page }) => {
    await page.fill('#email', 'invalidemail');
    await page.fill('#password', 'wrongpassword');
    await page.click('#loginButton');
    await expect(page).toHaveURL('http://localhost:3000/login');
  });

  test('SQL injection in the email field should be rejected', async ({ page }) => {
    await page.fill('#email', "'; DROP TABLE users; -- ");
    await page.fill('#password', 'wrongpassword');
    await page.click('#loginButton');
    await expect(page).toHaveURL('http://localhost:3000/login');
  });

  test('known leaked credentials should be rejected', async ({ page }) => {
    await page.fill('#email', 'amy');
    await page.fill('#password', 'K1f.....................');
    await page.click('#loginButton');
    await expect(page).toHaveURL('http://localhost:3000/login');
  });

  test('2FA enabled accounts require a valid TOTP code', async ({ page }) => {
    await page.fill('#email', 'wurstbrot');
    await page.fill('#password', 'EinBelegtesBrotMitSchinkenSCHINKEN!');
    await page.click('#loginButton');
    await expect(page).toHaveURL('http://localhost:3000/privacy-security/two-factor-authentication');

    const secret = await page.locator('#initialToken').getAttribute('data-test-totp-secret');
    await page.fill('#initialToken', secret);
    await page.fill('#currentPasswordSetup', 'K1f.....................');
    await page.click('#setupTwoFactorAuth');

    await expect(page).toHaveURL('http://localhost:3000/privacy-security/two-factor-authentication');
    await page.fill('#currentPasswordDisable', 'K1f.....................');
    await page.click('#disableTwoFactorAuth');
    await expect(page).toHaveURL('http://localhost:3000/privacy-security/two-factor-authentication');
  });
});
```