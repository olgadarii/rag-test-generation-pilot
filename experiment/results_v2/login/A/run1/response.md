```typescript
import { test, expect } from '@playwright/test';

test.describe('Login functionality', () => {
    test('valid credentials login', async ({ page }) => {
        await page.goto('/login');
        await page.fill('#email', 'validuser@example.com');
        await page.fill('#password', 'correctpassword');
        await page.click('#login-button');
        await expect(page).toHaveURL('/dashboard');
    });

    test('invalid credentials login', async ({ page }) => {
        await page.goto('/login');
        await page.fill('#email', 'invaliduser@example.com');
        await page.fill('#password', 'wrongpassword');
        await page.click('#login-button');
        await expect(page).toHaveURL('/login');
    });

    test('SQL injection in email field', async ({ page }) => {
        await page.goto('/login');
        await page.fill('#email', "admin' OR '1'='1");
        await page.fill('#password', 'anyPassword');
        await page.click('#login-button');
        await expect(page).toHaveURL('/login');
    });

    test('known weak credentials', async ({ page }) => {
        await page.goto('/login');
        await page.fill('#email', 'knownweakuser@example.com');
        await page.fill('#password', 'weakpassword123');
        await page.click('#login-button');
        await expect(page).toHaveURL('/login');
    });

    test('2FA required for enabled account', async ({ page }) => {
        await page.goto('/login');
        await page.fill('#email', '2fauser@example.com');
        await page.fill('#password', 'correctpassword');
        await page.click('#login-button');
        await page.waitForSelector('#totp-code');
        await page.fill('#totp-code', '123456'); // Assuming valid TOTP code
        await page.click('#2fa-verify-button');
        await expect(page).toHaveURL('/dashboard');
    });
});
```