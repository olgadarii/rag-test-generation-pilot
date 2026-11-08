```typescript
import { test, expect } from '@playwright/test'

test.describe('/#/search', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/#/search')
  })

  test('search query should return matching products', async ({ page }) => {
    await page.locator('#searchQuery').fill('test product')
    await page.locator('app-mat-search-bar input').press('Enter')
    await expect(page.locator('.product-list .product-item')).toBeVisible()
  })

  test('search field must resist reflected XSS attacks', async ({ page }) => {
    await page.locator('#searchQuery').fill('<iframe src="javascript:alert(`xss`)">')
    await page.locator('app-mat-search-bar input').press('Enter')
    await page.waitForSelector('.alert', { state: 'hidden' })
  })
})

test.describe('/rest/products/search', () => {
  test('query param in product search endpoint should return matching products', async ({ page }) => {
    const response = await page.request.get('/rest/products/search?q=test product')
    expect(response.ok()).toBeTruthy()
    expect(await response.json()).toContain('test product')
  })
})
```