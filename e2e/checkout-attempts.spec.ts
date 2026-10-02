import { test, expect, seed, pending, item, orderId, key } from './helpers.ts';
const actions = { resume: false, cancel: false, restart: false, check: true };
test('verified provider closure offers Start again and preserves the bag', async ({ page, app }) => {
 app.status = 'failed'; app.checkoutSnapshot = { checkout_state: 'closed', restart_allowed: true, actions: { ...actions, restart: true, check: false } };
 await seed(page, { 'moth-milk-pending-checkout': pending, 'moth-milk-bag': [item] });
 await page.goto('/checkout');
 await expect(page.getByRole('button', { name: 'Start again' })).toBeVisible();
 await expect(page.getByRole('button', { name: 'Close checkout & try again' })).toHaveCount(0);
 await page.getByRole('button', { name: 'Start again' }).click();
 await expect(page.getByLabel('Email address')).toBeVisible();
 expect(await page.evaluate(() => localStorage.getItem('moth-milk-pending-checkout'))).toBeNull();
 expect(app.prepares).toHaveLength(0);
});
test('server processing state allows checking but no cancellation or second payment', async ({ page, app }) => {
 app.status = 'reserved'; app.checkoutSnapshot = { checkout_state: 'processing', actions };
 await seed(page, { 'moth-milk-pending-checkout': pending });
 await page.goto('/checkout');
 await expect(page.getByRole('button', { name: 'Cancel this checkout' })).toHaveCount(0);
 await expect(page.getByRole('button', { name: /Place order/ })).toHaveCount(0);
 expect(app.prepares).toHaveLength(0);
});
test('Your Corner closes an ongoing attempt and offers a fresh start', async ({ page, app }) => {
 app.status = 'reserved'; app.checkoutSnapshot = { checkout_state: 'awaiting_payment', actions: { ...actions, resume: true, cancel: true } };
 app.checkoutList = [{ id: orderId, status: 'reserved', checkout_state: 'recovery_pending', actions, total: 4200, currency: 'CAD' }];
 await seed(page, { 'moth-milk-pending-checkout': pending, 'moth-milk-bag': [item] });
 await page.goto('/your-corner');
 await page.getByRole('button', { name: 'Your receipts', exact: true }).click();
 const drawer = page.getByRole('dialog', { name: 'Your receipts.' });
 const list = drawer.getByRole('region', { name: 'Your current receipts' });
 await list.getByRole('button', { name: 'Check on it' }).click();
 await expect(list.getByRole('link', { name: 'Pick this up again' })).toBeVisible();
 await page.screenshot({ path: test.info().outputPath('ongoing-checkouts.png'), fullPage: true });
 await list.getByRole('button', { name: 'Leave this one' }).click();
 await expect(list.getByRole('article')).toHaveCount(0);
 await drawer.getByRole('button', { name: 'History', exact: true }).click();
 await expect(drawer.getByRole('status')).toContainText('This checkout is closed');
 await expect(drawer.getByRole('button', { name: 'Check on it' })).toHaveCount(0);
 expect(app.cancelCalls).toEqual([{ idempotency_key: key }]);
 expect(await page.evaluate(() => localStorage.getItem('moth-milk-pending-checkout'))).toBeNull();
 await drawer.getByRole('button', { name: 'Back to the room' }).click();
 await page.goto('/checkout');
 await expect(page.getByLabel('Email address')).toBeVisible();
});
test('saved attempts resume through the backend using their original key', async ({ page, app }) => {
 app.status = 'reserved'; app.checkoutSnapshot = { checkout_state: 'awaiting_payment', actions: { ...actions, resume: true, cancel: true } };
 await page.addInitScript(() => { window.__stripeIntent = 'requires_payment_method'; });
 await seed(page, { 'moth-milk-checkout-attempts': [pending] });
 await page.goto(`/checkout?attempt=${orderId}`);
 await expect(page.getByRole('button', { name: /Place order/ })).toBeVisible();
 expect(app.resumes).toEqual([{ idempotency_key: key }]);
 expect(await page.evaluate(() => window.__stripeKeys)).toContain('pk_test_saved_profile');
 expect(app.prepares).toHaveLength(0);
});

test('a closed status for another order cannot authorize a fresh checkout', async ({ page, app }) => {
 app.status = 'failed'; app.statusID = '44444444-4444-4444-8444-444444444444';
 app.checkoutSnapshot = { checkout_state: 'closed', restart_allowed: true, actions: { ...actions, restart: true } };
 await seed(page, { 'moth-milk-pending-checkout': pending });
 await page.goto('/checkout');
 await expect(page.getByRole('alert')).toBeVisible();
 await expect(page.getByRole('button', { name: 'Start again' })).toHaveCount(0);
 expect(await page.evaluate(() => JSON.parse(localStorage.getItem('moth-milk-pending-checkout')).idempotency_key)).toBe(key);
 expect(app.prepares).toHaveLength(0);
});
