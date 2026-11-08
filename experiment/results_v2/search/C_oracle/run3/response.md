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

    const products = await page.locator('.product-item')
    const productNames = await products.map((product) => product.textContent())
    expect(productNames).toContain(searchQuery)
  })

  test('search field must resist reflected cross-site scripting', async ({ page }) => {
    const payload = '<iframe src="javascript:alert(`xss`)">'
    await page.type('#searchQuery', payload)
    await page.press('#searchQuery', 'Enter')

    await page.waitForSelector('alert(xss)', { timeout: 10000, state: 'none' })
  })
})
```