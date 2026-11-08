```typescript
import { test, expect } from '@playwright/test'

test.describe('/#/search', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/#/search')
  })

  test('search query should return matching products', async ({ page }) => {
    await page.type('#searchQuery', 'example product')
    await page.press('#searchQuery', 'Enter')
    await expect(page.locator('.product')).toHaveCount(1)
  })

  test('search field must resist reflected cross-site scripting', async ({ page }) => {
    await page.type('#searchQuery', '<iframe src="javascript:alert(`xss`)">')
    await page.press('#searchQuery', 'Enter')
    await page.waitForSelector('.alert', { state: 'hidden' })
    await expect(page).not.toHaveDialog('alert')
  })

  test('search field must resist reflected cross-site scripting (Bonus Payload)', async ({ page }) => {
    await page.type('#searchQuery', '<iframe width="100%" height="166" scrolling="no" frameborder="no" allow="autoplay" src="https://w.soundcloud.com/player/?url=https%3A//api.soundcloud.com/tracks/771984076&color=%23ff5500&auto_play=true&hide_related=false&show_comments=true&show_user=true&show_reposts=false&show_teaser=true"></iframe>')
    await page.press('#searchQuery', 'Enter')
    await page.waitForSelector('.alert', { state: 'hidden' })
    await expect(page).not.toHaveDialog('alert')
  })
})
```