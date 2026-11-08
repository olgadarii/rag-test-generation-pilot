```typescript
import { test, expect } from '@playwright/test'

test.describe('Login functionality', () => {
  test('valid credentials login', async ({ page }) => {
    await page.goto('/#/login')
    await page.fill('#email', 'wurstbrot@example.com')
    await page.fill('#password', 'EinBelegtesBrotMitSchinkenSCHINKEN!')
    await page.click('#loginButton')
    await expect(page).toHaveURL(/\/#\/home/)
  })

  test('invalid credentials login', async ({ page }) => {
    await page.goto('/#/login')
    await page.fill('#email', 'invalid@example.com')
    await page.fill('#password', 'wrongpassword')
    await page.click('#loginButton')
    await expect(page).toHaveURL(/\/#\/login/)
  })

  test('security regression - SQL injection in email', async ({ page }) => {
    await page.goto('/#/login')
    await page.fill('#email', "' OR '1'='1")
    await page.fill('#password', 'anything')
    await page.click('#loginButton')
    await expect(page).toHaveURL(/\/#\/login/)
  })

  test('security regression - known weak password', async ({ page }) => {
    await page.goto('/#/login')
    await page.fill('#email', 'amy@example.com')
    await page.fill('#password', 'K1f.....................')
    await page.click('#loginButton')
    await expect(page).toHaveURL(/\/#\/login/)
  })

  test('2FA enabled account login', async ({ page }) => {
    await page.goto('/#/login')
    await page.fill('#email', 'wurstbrot@example.com')
    await page.fill('#password', 'EinBelegtesBrotMitSchinkenSCHINKEN!')
    await page.fill('#totpInput', '000000') // Example TOTP code
    await page.click('#loginButton')
    await expect(page).toHaveURL(/\/#\/privacy-security\/two-factor-authentication/)
  })

  test('2FA setup for account without 2FA', async ({ page }) => {
    await page.goto('/#/login')
    await page.fill('#email', 'amy@example.com')
    await page.fill('#password', 'K1f.....................')
    await page.click('#setupTwoFactorAuth')
    await expect(page).toHaveURL(/\/#\/privacy-security\/two-factor-authentication/)
  })
})
```