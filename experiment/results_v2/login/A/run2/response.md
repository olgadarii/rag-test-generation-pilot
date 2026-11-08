```typescript
import { test, expect } from '@playwright/test';

test.describe('Login', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('http://localhost:3000/login');
    });

    test('valid credentials should log in successfully', async ({ page }) => {
        await page.fill('input[name="email"]', 'valid@example.com');
        await page.fill('input[name="password"]', 'ValidPassword123');
        await page.click('button[type="submit"]');

        await expect(page).toHaveURL(/\/dashboard/);
    });

    test('invalid credentials should fail to log in', async ({ page }) => {
        await page.fill('input[name="email"]', 'invalid@example.com');
        await page.fill('input[name="password"]', 'InvalidPassword123');
        await page.click('button[type="submit"]');

        await expect(page).toHaveURL(/\/login/);
    });

    test('SQL injection in email field should not bypass authentication', async ({ page }) => {
        await page.fill('input[name="email"]', "admin' --");
        await page.fill('input[name="password"]', 'password123');
        await page.click('button[type="submit"]');

        await expect(page).toHaveURL(/\/login/);
    });

    test('known weak credentials should fail', async ({ page }) => {
        await page.fill('input[name="email"]', 'knownweakuser@example.com');
        await page.fill('input[name="password"]', 'weakpassword123');
        await page.click('button[type="submit"]');

        await expect(page).toHaveURL(/\/login/);
    });

    test('two-factor authentication enabled should require TOTP code', async ({ page }) => {
        await page.fill('input[name="email"]', '2fa@example.com');
        await page.fill('input[name="password"]', '2faPassword123');
        await page.click('button[type="submit"]');

        await expect(page).toHaveURL(/\/2fa/);
    });
});
```