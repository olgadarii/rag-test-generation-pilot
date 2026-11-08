```typescript
import { test, expect } from '@playwright/test'

test.describe('/#/login', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/#/login')
  })

  test('valid credentials should log in successfully', async ({ page }) => {
    await page.fill('#email', 'wurstbrot@localhost')
    await page.fill('#password', 'EinBelegtesBrotMitSchinkenSCHINKEN!')
    await page.click('#loginButton')
    await expect(page).toHaveURL(/#/dashboard/)
  })

  test('invalid credentials should not log in', async ({ page }) => {
    await page.fill('#email', 'invalid@localhost')
    await page.fill('#password', 'wrongpassword')
    await page.click('#loginButton')
    await expect(page).toHaveURL(/#/login/)
    await expect(page.locator('.alert-danger')).toHaveText('Invalid email or password.')
  })

  test('SQL injection in email field should fail', async ({ page }) => {
    await page.fill('#email', "test'); drop table users; --")
    await page.fill('#password', 'password')
    await page.click('#loginButton')
    await expect(page).toHaveURL(/#/login/)
    await expect(page.locator('.alert-danger')).toHaveText('Invalid email or password.')
  })

  test('known weak credentials should fail', async ({ page }) => {
    await page.fill('#email', 'amy@localhost')
    await page.fill('#password', 'K1f.....................')
    await page.click('#loginButton')
    await expect(page).toHaveURL(/#/login/)
    await expect(page.locator('.alert-danger')).toHaveText('Invalid email or password.')
  })

  test('2FA enabled accounts should require TOTP code', async ({ page }) => {
    await page.fill('#email', 'wurstbrot@localhost')
    await page.fill('#password', 'EinBelegtesBrotMitSchinkenSCHINKEN!')
    await page.click('#loginButton')
    await expect(page).toHaveURL(/#/privacy-security/two-factor-authentication/)
    await page.fill('#currentPasswordSetup', 'EinBelegtesBrotMitSchinkenSCHINKEN!')
    await page.fill('#initialToken', 'IFTXE3SPOEYVURT2MRYGI52TKJ4HC3KH')
    await page.click('#setupTwoFactorAuth')
    await expect(page).toHaveURL(/#/privacy-security/two-factor-authentication/)
    await page.fill('#currentPasswordDisable', 'EinBelegtesBrotMitSchinkenSCHINKEN!')
    await page.click('#disableTwoFactorAuth')
    await expect(page).toHaveURL(/#/privacy-security/two-factor-authentication/)
    await expect(page.locator('.mat-snack-bar-container')).toContainText('Two-Factor Authentication has been removed.')
  })
})
```