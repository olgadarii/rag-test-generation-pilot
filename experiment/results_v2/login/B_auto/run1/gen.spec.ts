import { test, expect } from '@playwright/test';

test.describe('/#/login', () => {
  test('valid credentials', async ({ page }) => {
    await page.goto('/#/login');
    await page.fill('#email', 'wurstbrot');
    await page.fill('#password', 'EinBelegtesBrotMitSchinkenSCHINKEN!');
    await page.click('#loginButton');
    await expect(page).toHaveURL('/#/privacy-security/two-factor-authentication');
  });

  test('invalid credentials', async ({ page }) => {
    await page.goto('/#/login');
    await page.fill('#email', 'invalidemail');
    await page.fill('#password', 'wrongpassword');
    await page.click('#loginButton');
    await expect(page).toHaveURL('/#/login');
  });

  test('SQL injection in the email field', async ({ page }) => {
    await page.goto('/#/login');
    await page.fill('#email', 'x\' OR 1=1 --');
    await page.fill('#password', 'anything');
    await page.click('#loginButton');
    await expect(page).toHaveURL('/#/login');
  });

  test('known leaked or weak credentials', async ({ page }) => {
    await page.goto('/#/login');
    await page.fill('#email', 'amy');
    await page.fill('#password', 'K1f.....................');
    await page.click('#loginButton');
    await expect(page).toHaveURL('/#/privacy-security/two-factor-authentication');
  });

  test('2FA enabled account', async ({ page }) => {
    await page.goto('/#/login');
    await page.fill('#email', 'wurstbrot');
    await page.fill('#password', 'EinBelegtesBrotMitSchinkenSCHINKEN!');
    await page.click('#loginButton');
    await page.waitForSelector('#initialToken');
    await page.fill('#initialToken', 'IFTXE3SPOEYVURT2MRYGI52TKJ4HC3KH');
    await page.click('#setupTwoFactorAuth');
    await page.fill('#currentPasswordDisable', 'K1f.....................');
    await page.click('#disableTwoFactorAuth');
    await expect(page).toHaveText('Two-Factor Authentication has been removed.');
  });
});
