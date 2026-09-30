// @ts-nocheck
import { test, expect } from '@playwright/test';
import { details } from './helpers.js';
// This suite creates one real test order. It never mocks API or Stripe results.
test('live Stripe test order is confirmed by backend and remains recoverable', async ({ page }) => {
 const shop = process.env.E2E_SHOP_ID;
 let checkedTestKey = false;
 await page.addInitScript(() => {
   // Guard the actual publishable key passed by the deployed storefront.
   let factory;
   Object.defineProperty(window, 'Stripe', { configurable: true, get: () => factory, set: value => {
     factory = (...args) => { if (!String(args[0]).startsWith('pk_test_')) throw new Error('Live test refused a non-test Stripe key.'); window.__e2eStripeTestKey = true; return value(...args); };
   } });
 });
 await page.route('**/v1/orders/prepare', async route => {
   if (route.request().headers()['x-shop-id'] !== shop) return route.abort();
   checkedTestKey = await page.evaluate(() => Boolean(window.__e2eStripeTestKey));
   // Preparation reserves stock; no payment is submitted until the key guard passes below.
   await route.continue();
 });
 await page.goto(`/product/${process.env.E2E_PRODUCT_SLUG || 'mimi-plush'}`);
 await page.getByRole('button', { name: /add to bag/i }).click();
 await page.getByRole('link', { name: /check out/i }).click();
 await details(page);
 await page.getByLabel('Email address').fill(process.env.E2E_CUSTOMER_EMAIL || `reader-${Date.now()}@example.test`);
 await page.getByRole('button', { name: /Continue to payment/ }).click();
 await expect(page.getByRole('button', { name: /^Place order/ })).toBeVisible();
 checkedTestKey = await page.evaluate(() => Boolean(window.__e2eStripeTestKey));
 expect(checkedTestKey, 'Stripe TEST key must be active before submitting payment').toBe(true);
 const card = page.frameLocator('iframe[title="Secure payment input frame"]');
 await card.getByRole('textbox', { name: /card number/i }).fill('4242424242424242');
 await card.getByRole('textbox', { name: /expiration/i }).fill('1230');
 await card.getByRole('textbox', { name: /security code|cvc/i }).fill('123');
 const postcode = card.getByRole('textbox', { name: /postal|zip/i });
 if (await postcode.count()) await postcode.fill('H2H2H2');
 await page.getByRole('button', { name: /^Place order/ }).click();
 await expect(page.getByRole('status')).toContainText('Your order is confirmed', { timeout: 120000 });
 const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('moth-milk-receipts'))[0]);
 expect(saved.status).toBe('confirmed'); expect(saved.total).toBeGreaterThan(0);
 expect(saved.idempotency_key).toBeTruthy();
 await page.reload(); await expect(page.getByRole('status')).toContainText('Your order is confirmed');
 await page.getByRole('button', { name: 'Check shipping ↗' }).click();
 await expect(page.getByRole('button', { name: 'Check shipping ↗' })).toBeEnabled();
 await expect(page.getByRole('status')).toContainText('Your order is confirmed');
});
