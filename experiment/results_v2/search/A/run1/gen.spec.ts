import { test, expect } from '@playwright/test';

test.describe('Search functionality', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('http://localhost:3000');
    });

    test('search for a product and validate matching results', async ({ page }) => {
        // Given the search field is present
        const searchField = page.locator('#search-input');

        // When a search term is entered
        await searchField.type('Laptop');

        // And the search button is clicked
        await searchField.press('Enter');

        // Then the search results should display matching products
        const resultItems = page.locator('.product-item');
        expect(await resultItems.count()).toBeGreaterThan(0);
    });

    test('search field should not execute injected script content', async ({ page }) => {
        // Given the search field is present
        const searchField = page.locator('#search-input');

        // When a malicious search term is entered
        await searchField.type('"> <script>alert("XSS")</script>');

        // And the search button is clicked
        await searchField.press('Enter');

        // Then no alert should be triggered
        await expect(page).not.toHaveHTML('script');
    });
});
