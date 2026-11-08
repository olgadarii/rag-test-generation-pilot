```typescript
import { test, expect } from '@playwright/test'

test.describe('/#/search', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/#/search')
  })

  test('search query should return matching products', async ({ page }) => {
    const searchQuery = 'test product'
    await page.locator('#searchQuery').fill(searchQuery)
    await page.locator('app-mat-search-bar input').press('Enter')

    const expectedProducts = await page.locator('.product-list .product')
    expect(await expectedProducts.count()).toBeGreaterThan(0)
  })

  test('search field must resist reflected XSS attacks', async ({ page }) => {
    const xssPayload = '<iframe src="javascript:alert(`xss`)">'
    await page.locator('#searchQuery').fill(xssPayload)
    await page.locator('app-mat-search-bar input').press('Enter')

    await page.waitForSelector('.alert', { state: 'hidden' })
  })
})

test.describe('/rest/products/search', () => {
  test('query param in product search endpoint should not return sensitive information', async ({ request }) => {
    const query = "'--"
    const response = await request.get(`/rest/products/search?q=${query}`)
    expect(response.ok()).toBeTruthy()
    const body = await response.json()
    expect(body.data).not.toContain('password')
  })
})
```