import { test, expect } from '@playwright/test'

test.describe('/#/search', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/#/search')
  })

  test('search query should return matching products', async ({ page }) => {
    const searchQuery = 'example product'
    await page.locator('#searchQuery').fill(searchQuery)
    await page.locator('app-mat-search-bar input').press('Enter')
    const products = await page.locator('.product-card').count()
    expect(products).toBeGreaterThan(0)
  })

  test('search field must resist reflected cross-site scripting', async ({ page }) => {
    const xssPayload = '<iframe src="javascript:alert(`xss`)">'
    await page.locator('#searchQuery').fill(xssPayload)
    await page.locator('app-mat-search-bar input').press('Enter')
    await page.waitForSelector('.alert', { state: 'hidden' })
    expect(await page.evaluate(() => window.alert)).not.toHaveBeenCalled()
  })
})
