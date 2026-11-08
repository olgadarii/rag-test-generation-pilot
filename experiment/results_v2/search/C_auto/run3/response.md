```typescript
import { test, expect } from '@playwright/test'

test.describe('/#/search', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/#/search')
  })

  test('search query should return matching products', async ({ page }) => {
    const searchQuery = 'test product'
    await page.type('#searchQuery', searchQuery)
    await page.press('#searchQuery', 'Enter')
    const products = await page.locator('.product-list .product').count()
    expect(products).toBeGreaterThan(0)
  })

  test('search field must resist reflected cross-site scripting', async ({ page }) => {
    const xssPayload = '<iframe src="javascript:alert(`xss`)">'
    await page.type('#searchQuery', xssPayload)
    await page.press('#searchQuery', 'Enter')
    await expect(page).not.toHaveAlert()
  })
})
```