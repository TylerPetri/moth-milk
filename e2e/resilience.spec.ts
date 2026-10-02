// @ts-nocheck
import { test, expect, seed, item, pending, receipt, orderId, key, details } from './helpers.ts';
test('shop outage is useful, hides server internals and retries on reconnect', async ({ page, app }) => {
 app.catalogDown = true; await page.goto('/shop');
 await expect(page.getByRole('status')).toContainText('Something’s wrong on our end');
 await expect(page.getByText('PRIVATE database unreachable')).toHaveCount(0);
 app.catalogDown = false; await page.evaluate(() => window.dispatchEvent(new Event('online')));
 await expect(page.locator('.product-card')).toHaveCount(3);
});
test('product stock failure is not sold out; manual retry enables bag', async ({ page, app }) => {
 app.stockDown = true; await page.goto('/product/mimi-plush');
 await expect(page.getByRole('button', { name: /stock unavailable/ })).toBeDisabled();
 await expect(page.getByRole('status')).toContainText('could not check stock');
 await expect(page.getByRole('button', { name: /sold out/ })).toHaveCount(0);
 app.stockDown = false; await page.getByRole('button', { name: 'Try again ↗' }).click();
 await expect(page.getByRole('button', { name: /add to bag/ })).toBeEnabled();
 await page.getByRole('button', { name: /add to bag/ }).click();
 await expect(page.getByRole('complementary', { name: 'Shopping bag' })).toContainText('Mimi Moth Plush');
});
test('product catalog outage retries on focus', async ({ page, app }) => {
 app.catalogDown = true; await page.goto('/product/mimi-plush');
 await expect(page.getByRole('status')).toContainText('Prices are temporarily unavailable');
 app.catalogDown = false; await page.evaluate(() => window.dispatchEvent(new Event('focus')));
 await expect(page.getByRole('button', { name: /add to bag/ })).toBeEnabled();
});
test('saved payment outage retains checkout and reconnect confirms only purchased lines', async ({ page, app }) => {
 app.statusDown = true;
 const newItem = { ...item, lineId: 'new-line' };
 await seed(page, { 'moth-milk-pending-checkout': pending, 'moth-milk-bag': [item, newItem] });
 await page.goto('/checkout');
 await expect(page.getByRole('alert')).toContainText('Your checkout is saved');
 await expect(page.getByRole('alert')).toContainText('Please don’t pay again');
 expect(await page.evaluate(() => JSON.parse(localStorage.getItem('moth-milk-pending-checkout')).id)).toBe(orderId);
 app.statusDown = false; app.status = 'confirmed';
 await page.evaluate(() => window.dispatchEvent(new Event('online')));
 await expect(page.getByRole('status')).toContainText('Your order is confirmed');
 expect(await page.evaluate(() => JSON.parse(localStorage.getItem('moth-milk-bag')).map(i => i.lineId))).toEqual(['new-line']);
 expect(app.prepares).toHaveLength(0); expect(app.statusReads.every(r => r.idempotency_key === key)).toBe(true);
 await page.reload(); await expect(page.getByRole('status')).toContainText('Your order is confirmed');
});
test('receipt remains visible while shipping service is unavailable', async ({ page, app }) => {
 app.status = 'confirmed'; app.shipmentUnavailable = true;
 await seed(page, { 'moth-milk-receipts': [receipt] }); await page.goto(`/checkout?order=${orderId}`);
 await page.getByRole('button', { name: 'Track your things ↗' }).click();
 await expect(page.getByText('Shipping updates are temporarily unavailable. Your order is still confirmed.', { exact: true })).toBeVisible();
 await expect(page.getByRole('complementary', { name: 'Order summary' })).toContainText('Mimi Moth Plush');
 app.shipmentUnavailable = false; app.shipment = { status: 'in_transit', carrier: 'Canada Post', tracking_number: 'TEST123' };
 await page.getByRole('button', { name: 'Refresh update ↗' }).click();
 await expect(page.getByText('Your things are on their way.', { exact: true })).toBeVisible();
 await expect(page.getByText('Canada Post · TEST123', { exact: true })).toBeVisible();
 app.statusDown = true; await page.getByRole('button', { name: 'Refresh update ↗' }).click();
 await expect(page.getByRole('alert')).toContainText('Shipping updates are temporarily unavailable');
 await expect(page.getByRole('status')).toContainText('Your order is confirmed');
});
test('status polling cannot overlap when return events fire repeatedly', async ({ page, app }) => {
 app.status = 'confirmed'; app.statusDelay = 1200;
 await seed(page, { 'moth-milk-receipts': [receipt] }); await page.goto(`/checkout?order=${orderId}`);
 await page.getByRole('button', { name: 'Track your things ↗' }).click();
 await expect(page.getByRole('button', { name: 'Checking…' })).toBeDisabled();
 await page.evaluate(() => { for (let i = 0; i < 10; i++) { window.dispatchEvent(new Event('focus')); window.dispatchEvent(new Event('online')); } });
 await expect(page.getByRole('button', { name: 'Refresh update ↗' })).toBeEnabled();
 expect(app.maxActiveReads).toBe(1);
});
test('private guest link recovers after outage and removes credential from URL', async ({ page, app }) => {
 app.statusDown = true; await page.goto(`/checkout?order=${orderId}#proof=private-fixture-proof`);
 await expect(page.getByRole('alert')).toContainText('Your checkout is saved');
 expect(new URL(page.url()).hash).toBe('');
 app.statusDown = false; app.status = 'confirmed'; await page.reload();
 await expect(page.getByRole('status')).toContainText('Your order is confirmed');
 expect(app.statusReads.some(r => r.tracking_proof === 'private-fixture-proof')).toBe(true);
 expect(await page.evaluate(() => localStorage.getItem('moth-milk-receipts'))).not.toContain('private-fixture-proof');
});
test('checkout before payment preserves bag and contact details through API outage and reload', async ({ page, app }) => {
 app.catalogDown = true; await seed(page, { 'moth-milk-bag': [item] }); await page.goto('/checkout');
 await details(page); await page.getByRole('button', { name: /Continue to payment/ }).click();
 await expect(page.getByRole('alert')).toContainText('Your bag and details are saved');
 await page.reload(); await expect(page.getByLabel('Email address')).toHaveValue('reader@example.test');
 await expect(page.getByLabel('City', { exact: true })).toHaveValue('Montreal');
 app.catalogDown = false; await page.getByRole('button', { name: /Continue to payment/ }).click();
 await expect(page.getByRole('button', { name: /Place order/ })).toBeEnabled();
});
test('lost reservation response retries the same key instead of creating another checkout', async ({ page, app }) => {
 app.prepareDown = true; await seed(page, { 'moth-milk-bag': [item] }); await page.goto('/checkout'); await details(page);
 await page.getByRole('button', { name: /Continue to payment/ }).click(); await expect(page.getByRole('alert')).toContainText('Your checkout is saved');
 const originalKey = app.prepares[0].idempotency_key;
 app.prepareDown = false; await page.evaluate(() => window.dispatchEvent(new Event('online')));
 await expect(page.getByRole('button', { name: /Place order/ })).toBeEnabled();
 expect(app.prepares).toHaveLength(2); expect(app.prepares[1].idempotency_key).toBe(originalKey);
});
test('pay waits for backend confirmation, and refresh never submits a second payment', async ({ page, app }) => {
 app.status = 'paid'; await seed(page, { 'moth-milk-bag': [item] }); await page.goto('/checkout'); await details(page);
 await page.getByRole('button', { name: /Continue to payment/ }).click(); await page.getByRole('button', { name: /Place order/ }).click();
 await expect(page.getByRole('status')).toContainText('Payment received');
 expect(await page.evaluate(() => window.__confirms)).toBe(1);
 await expect(page.getByRole('button', { name: /Place order/ })).toHaveCount(0);
 app.status = 'confirmed'; await page.reload(); await expect(page.getByRole('status')).toContainText('Your order is confirmed');
 expect(await page.evaluate(() => window.__confirms || 0)).toBe(0); expect(app.prepares).toHaveLength(1);
});
test('Your Corner preserves login during outage and recovers on return', async ({ page, app }) => {
 app.authDown = true;
 app.signedIn = true;
 await page.goto('/your-corner'); await expect(page.getByRole('status')).toContainText('Something’s wrong on our end');
 expect(await page.evaluate(() => sessionStorage.getItem('moth-milk-session'))).toBeNull();
 app.authDown = false; await page.evaluate(() => window.dispatchEvent(new Event('focus')));
 await expect(page.locator('.recovery-notice')).toHaveCount(0);
 await expect(page.getByText('reader@example.test', { exact: true })).toBeVisible();
});
test('malformed checkout storage does not crash the page', async ({ page, app }) => {
 await page.addInitScript(() => localStorage.setItem('moth-milk-pending-checkout', '{bad'));
 await seed(page, { 'moth-milk-bag': [item] }); await page.goto('/checkout'); await expect(page.getByLabel('Email address')).toBeVisible();
});

test('saved checkout survives a fresh browser context with no session storage', async ({ page, context, browser, app }) => {
 app.statusDown = true; await seed(page, { 'moth-milk-pending-checkout': pending, 'moth-milk-bag': [item] });
 await page.goto('/checkout'); await expect(page.getByRole('alert')).toContainText('Your checkout is saved');
 const savedBrowser = await context.storageState(); await page.close();
 app.statusDown = false; app.status = 'confirmed';
 const reopened = await browser.newContext({ storageState: savedBrowser, baseURL: 'http://127.0.0.1:4173' });
 try { const next = await reopened.newPage(); await app.attach(next); await next.goto('/checkout'); await expect(next.getByRole('status')).toContainText('Your order is confirmed'); }
 finally { await reopened.close(); }
 expect(app.prepares).toHaveLength(0);
});

test('connection loss after payment never exposes another pay button', async ({ page, app }) => {
 app.abortStatus = true; await seed(page, { 'moth-milk-pending-checkout': pending, 'moth-milk-bag': [item] });
 await page.goto('/checkout'); await expect(page.getByRole('alert')).toContainText('Please don’t pay again');
 await expect(page.getByRole('button', { name: /Place order/ })).toHaveCount(0);
 app.abortStatus = false; app.status = 'confirmed';
 await expect(page.getByRole('status')).toContainText('Your order is confirmed'); expect(app.prepares).toHaveLength(0);
});

test('prepare and pay are guarded; an uncertain Stripe result cannot invite another payment', async ({ page, app }) => {
 app.prepareWait = new Promise(resolve => { app.releasePrepare = resolve; }); await seed(page, { 'moth-milk-bag': [item] }); await page.goto('/checkout'); await details(page);
 await page.getByRole('button', { name: /Continue to payment/ }).click();
 await expect(page.getByRole('button', { name: /A moment/ })).toBeDisabled(); app.releasePrepare();
 await expect(page.getByRole('button', { name: /Place order/ })).toBeEnabled(); expect(app.prepares).toHaveLength(1);
 await page.evaluate(() => { window.__holdConfirm = true; window.__stripeNetworkFailure = true; });
 await page.getByRole('button', { name: /Place order/ }).click();
 await expect(page.getByRole('button', { name: /One moment/ })).toBeDisabled();
 await page.evaluate(() => window.__releaseConfirm());
 await expect(page.getByRole('alert')).toContainText('Please don’t pay again');
 await expect(page.getByRole('button', { name: /Place order/ })).toHaveCount(0);
 expect(await page.evaluate(() => window.__confirms)).toBe(1);
 expect(await page.evaluate(() => JSON.parse(localStorage.getItem('moth-milk-pending-checkout')).paymentSubmitted)).toBe(true);
});

test('reserved checkout conflict keeps checking, hides internals and confirms the same order', async ({ page, app }) => {
 app.status = 'reserved'; app.prepareConflict = true;
 await seed(page, { 'moth-milk-pending-checkout': { ...pending, paymentSubmitted: false } });
 await page.goto('/checkout');
 await expect(page.getByRole('alert')).toContainText('Please don’t pay again');
 await expect(page.getByRole('button', { name: 'Checking…' })).toBeDisabled();
 await expect(page.getByRole('button', { name: 'Cancel this checkout ↗' })).toBeEnabled();
 await expect(page.locator('body')).not.toContainText('PRIVATE');
 app.status = 'confirmed';
 await expect(page.getByRole('status')).toContainText('Your order is confirmed');
 expect(app.prepares).toHaveLength(1);
});
