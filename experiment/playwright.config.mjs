import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: '.',
  testMatch: /gen\.spec\.ts$/,
  timeout: 30000,
  retries: 0,
  workers: 1,
  reporter: [['json']],
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
    headless: true,
    actionTimeout: 10000,
    navigationTimeout: 15000
  }
})
