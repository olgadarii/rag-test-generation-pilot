```typescript
import { test, expect } from '@playwright/test';

test('search for products by name', async ({ page }) => {
  // Navigate to the home page
  await page.goto('/');

  // Find the search field and enter a valid search query
  const searchField = await page.locator('[data-testid="search-field"]');
  await searchField.fill('Laptop');
  await searchField.press('Enter');

  // Verify that the search results contain the expected product
  await expect(page.locator('[data-testid="product-list"]')).toHaveCount(1);
  await expect(page.locator('[data-testid="product-list"] >> text="Laptop"}')).toBeVisible();

  // Security check: verify that the search field does not execute injected script content
  await searchField.fill('<img src=x onerror=alert(1) />');
  await searchField.press('Enter');

  // Check that no alert is triggered
  await page.waitForTimeout(1000); // Small delay to ensure the potential alert has time to appear
  await expect(page).toHaveNoAlerts();
});
```