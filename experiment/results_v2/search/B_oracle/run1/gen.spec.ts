import { test, expect } from '@playwright/test'

test.describe('/#/search', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/#/search')
  })

  test('search query should return matching products', async ({ page }) => {
    await page.locator('#searchQuery').fill('test product')
    await page.locator('app-mat-search-bar input').press('Enter')
    const productNames = await page.locator('.product-name').textContent()
    expect(productNames).toContain('test product')
  })

  test('search field must resist reflected XSS attacks', async ({ page }) => {
    await page.locator('#searchQuery').fill('<script>alert("xss")</script>')
    await page.locator('app-mat-search-bar input').press('Enter')
    await expect(page).not.toHaveDialog()
  })

  test('search query should be susceptible to reflected XSS attacks (Bonus Payload)', async ({ page }) => {
    await page.locator('#searchQuery').fill(
      '<iframe width="100%" height="166" scrolling="no" frameborder="no" allow="autoplay" src="https://w.soundcloud.com/player/?url=https%3A//api.soundcloud.com/tracks/771984076&color=%23ff5500&auto_play=true&hide_related=false&show_comments=true&show_user=true&show_reposts=false&show_teaser=true"></iframe>'
    )
    await page.locator('app-mat-search-bar input').press('Enter')
    await expect(page).not.toHaveHTML('<iframe>')
  })
})

test.describe('/rest/products/search', () => {
  test('should return matching products', async ({ page }) => {
    const response = await page.request.get('/rest/products/search?q=test')
    const products = response.jsonValue()
    expect(products.filter(product => product.name.includes('test')).length).toBeGreaterThan(0)
  })

  test('should resist SQL injection attacks', async () => {
    const response = await page.request.get('/rest/products/search?q=%29%20union%20select%201,2,3,4,5,6,7,8,9,10--')
    const products = response.jsonValue()
    expect(products.length).toBeGreaterThan(0)
  })

  test('should not reveal logically deleted products on SQL injection attack', async () => {
    const response = await page.request.get('/rest/products/search?q=%29--')
    const products = response.jsonValue()
    const christmasProduct = await page.evaluate(() => {
      return JSON.parse(localStorage.getItem('christmasProduct'))
    })
    expect(products.find(product => product.name === christmasProduct.name)).toBeUndefined()
  })

  test('should be able to place Christmas product into shopping card by id', async () => {
    const response = await page.request.get('/api/products')
    const products = response.jsonValue()
    const christmasProduct = products.find(product => product.name.includes('Christmas Special'))
    if (christmasProduct) {
      await page.request.post('/api/BasketItems/', {
        method: 'POST',
        cache: 'no-cache',
        headers: {
          'Content-type': 'application/json',
          Authorization: `Bearer ${page.context().storageState().cookies.find(cookie => cookie.name === 'token').value}`
        },
        body: JSON.stringify({
          BasketId: sessionStorage.getItem('bid'),
          ProductId: christmasProduct.id,
          quantity: 1
        })
      })
    }

    await page.goto('/#/basket')
    await page.locator('#checkoutButton').click()
    await page.waitForSelector('.checkout-success')
  })
})
