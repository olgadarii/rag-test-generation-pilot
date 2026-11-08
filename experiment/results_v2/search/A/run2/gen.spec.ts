import { test, expect } from '@playwright/test';

test.describe('Product Search', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('http://localhost:3000');
    });

    test('should search for products by name and return matching products', async ({ page }) => {
        await page.fill('input[name="search"]', 'laptop');
        await page.click('button[type="submit"]');

        const products = await page.locator('.product-list .product');
        expect(await products.count()).toBeGreaterThanOrEqual(1);
    });

    test('search field should not execute injected script content', async ({ page }) => {
        const payload = `<script>alert('XSS')</script>`;
        await page.fill('input[name="search"]', payload);
        await page.click('button[type="submit"]');

        const alertMessage = await page.evaluate(() => window.alert === undefined);
        expect(alertMessage).toBe(true);
    });
});
