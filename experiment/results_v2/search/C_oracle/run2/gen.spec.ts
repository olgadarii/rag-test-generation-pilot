import { test, expect } from '@playwright/test'

test.describe('/#/search', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/#/search')
  })

  test('search query should return matching products', async ({ page }) => {
    const searchQuery = 'example product'
    await page.fill('#searchQuery', searchQuery)
    await page.press('#searchQuery', 'Enter')
    await page.waitForSelector('.product-list .product-name', { state: 'visible' })
    const products = await page.locator('.product-list .product-name').allTextContents()
    expect(products).toContain(searchQuery)
  })

  test('search field must resist reflected XSS attacks', async ({ page }) => {
    const xssPayload = '<iframe src="javascript:alert(`xss`)">'
    await page.fill('#searchQuery', xssPayload)
    await page.press('#searchQuery', 'Enter')
    await page.waitForSelector('body', { state: 'none' })
    expect(page).not.toThrowError(() => page.evalOnSelector('body', (body) => body.innerHTML))
  })
})

test.describe('/rest/products/search', () => {
  test('should not reveal logically deleted products via SQL injection', async ({ request }) => {
    const searchQuery = "'))--"
    const response = await request.get(`/rest/products/search?q=${searchQuery}`)
    const products = await response.json()
    expect(products).not.toContain('Christmas Special Product')
  })
})
