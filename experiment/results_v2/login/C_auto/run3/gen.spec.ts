import { test, expect } from '@playwright/test'

test.describe('Login functionality', () => {
  test('valid credentials should log in successfully', async ({ page }) => {
    await page.goto('http://localhost:3000/#/login')
    await page.fill('#email', 'wurstbrot@localhost')
    await page.fill('#password', 'EinBelegtesBrotMitSchinkenSCHINKEN!')
    await page.click('#loginButton')
    await expect(page).toHaveURL('http://localhost:3000/#/privacy-security/two-factor-authentication')
  })

  test('invalid credentials should not log in', async ({ page }) => {
    await page.goto('http://localhost:3000/#/login')
    await page.fill('#email', 'invalid@user.com')
    await page.fill('#password', 'wrongpassword')
    await page.click('#loginButton')
    await expect(page).toHaveURL('http://localhost:3000/#/login')
  })

  test('SQL injection in the email field should not bypass authentication', async ({ page }) => {
    await page.goto('http://localhost:3000/#/login')
    await page.fill('#email', "'; DROP TABLE users; --")
    await page.fill('#password', 'EinBelegtesBrotMitSchinkenSCHINKEN!')
    await page.click('#loginButton')
    await expect(page).toHaveURL('http://localhost:3000/#/login')
  })

  test('known weak or leaked credentials should not bypass authentication', async ({ page }) => {
    await page.goto('http://localhost:3000/#/login')
    await page.fill('#email', 'amy@localhost')
    await page.fill('#password', 'K1f.....................')
    await page.click('#loginButton')
    await expect(page).toHaveURL('http://localhost:3000/#/privacy-security/two-factor-authentication')
  })

  test('2FA enabled account should require valid TOTP code', async ({ page }) => {
    await page.goto('http://localhost:3000/#/login')
    await page.fill('#email', 'wurstbrot@localhost')
    await page.fill('#password', 'EinBelegtesBrotMitSchinkenSCHINKEN!')
    await page.click('#loginButton')
    await page.waitForSelector('#two-factor-authentication-code-input')
    await page.fill('#two-factor-authentication-code-input', 'wrong-totp-code')
    await page.click('#two-factor-authentication-code-submit')
    await expect(page).toHaveURL('http://localhost:3000/#/login')
  })

  test('2FA setup for accounts without 2FA enabled should work', async ({ page }) => {
    await page.goto('http://localhost:3000/#/login')
    await page.fill('#email', 'amy@localhost')
    await page.fill('#password', 'K1f.....................')
    await page.click('#loginButton')
    await page.waitForSelector('#two-factor-authentication-code-input')
    await page.fill('#two-factor-authentication-code-input', 'correct-totp-code')
    await page.click('#two-factor-authentication-code-submit')
    await expect(page).toHaveURL('http://localhost:3000/#/privacy-security/two-factor-authentication')
    await page.click('#disableTwoFactorAuth')
    await expect(page).toHaveURL('http://localhost:3000/#/privacy-security/two-factor-authentication')
  })
})
