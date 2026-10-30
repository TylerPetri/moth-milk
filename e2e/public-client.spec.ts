// @ts-nocheck
import { test, expect, seed, item, details, pending, key } from './helpers.ts';
test('pending fingerprints never persist plaintext contact details', async ({ page, app }) => {
 await seed(page, { 'moth-milk-bag': [item] }); await page.goto('/checkout'); await details(page);
 await page.getByRole('button', { name: /Continue to payment/ }).click();
 await expect(page.getByText('Secure card fixture')).toBeVisible();
 const values = await page.evaluate(() => Object.values(localStorage).join(' '));
 for (const value of ['reader@example.test', '12 Moon Street', 'June Reader']) expect(values).not.toContain(value);
 expect(await page.evaluate(() => JSON.parse(localStorage.getItem('moth-milk-pending-checkout')).fingerprint)).toMatch(/^sha256:[a-f0-9]{64}$/);
});
test('backend live key cannot switch a test reservation into a real payment', async ({ page, app }) => {
 app.prepareKey = 'pk_live_unexpected_fixture'; await seed(page, { 'moth-milk-bag': [item] });
 await page.goto('/checkout'); await details(page); await page.getByRole('button', { name: /Continue to payment/ }).click();
 await expect(page.getByRole('alert')).toContainText('Please don’t pay again');
 await expect(page.getByRole('button', { name: /Place order/ })).toHaveCount(0);
 expect(await page.evaluate(() => window.__stripeKeys || [])).toEqual([]);
 expect(await page.evaluate(() => window.__confirms || 0)).toBe(0);
 expect(app.prepares).toHaveLength(1);
 expect(await page.evaluate(() => JSON.parse(localStorage.getItem('moth-milk-pending-checkout')).idempotency_key)).toBe(app.prepares[0].idempotency_key);
});
test('backend live key on resume retains the original attempt and never confirms payment', async ({ page, app }) => {
 app.status = 'reserved'; app.checkoutSnapshot = { actions: { resume: true } }; app.resumeKey = 'pk_live_unexpected_fixture';
 await seed(page, { 'moth-milk-pending-checkout': { ...pending, paymentSubmitted: false } });
 await page.goto('/checkout'); await expect(page.getByRole('alert')).toContainText('Please don’t pay again');
 expect(await page.evaluate(() => window.__stripeKeys || [])).toEqual([]);
 expect(await page.evaluate(() => window.__confirms || 0)).toBe(0);
 expect(await page.evaluate(() => JSON.parse(localStorage.getItem('moth-milk-pending-checkout')).idempotency_key)).toBe(key);
 expect(app.prepares).toHaveLength(0);
});
