import { test, expect, seed, receipt, pending, orderId, key } from './helpers.ts';
const closed = { id: orderId, status: 'failed', checkout_state: 'closed', total: 4200, currency: 'CAD', restart_allowed: true, actions: { resume: false, cancel: false, restart: true, check: false } };
test('closed checkouts stay tucked away; hiding survives reload and can be reversed', async ({ page, app }, testInfo) => {
 app.signedIn = true; app.checkoutList = [closed];
 await seed(page, { 'moth-milk-checkout-attempts': [pending] });
 await page.goto('/your-corner', { waitUntil: 'domcontentloaded' });
 await expect(page.getByText('reader@example.test', { exact: true })).toBeVisible();
 await expect(page.getByText('This checkout is closed.')).toHaveCount(0);
 const launch = page.getByRole('button', { name: 'Your receipts', exact: true });
 await expect(launch).not.toContainText('↗');
 await launch.click();
 const drawer = page.getByRole('dialog', { name: 'Your receipts.' });
 await expect(drawer.getByRole('region', { name: 'Your current receipts' }).getByRole('article')).toHaveCount(0);
 await drawer.getByRole('button', { name: 'History', exact: true }).click();
 const note = drawer.getByRole('article', { name: `Order ${orderId.slice(0,8)}` });
 await expect(note).toContainText('This checkout is closed.');
 await expect(note.getByRole('button', { name: 'Check on it' })).toHaveCount(0);
 await page.screenshot({ path: testInfo.outputPath('corner-history.png') });
 await note.getByRole('button', { name: 'Hide from this device' }).click();
 await expect(note).toHaveCount(0);
 expect(await page.evaluate(() => JSON.parse(localStorage.getItem('moth-milk-checkout-attempts'))[0].idempotency_key)).toBe(key);
 await page.reload({ waitUntil: 'domcontentloaded' }); await launch.click();
 await drawer.getByRole('button', { name: 'History', exact: true }).click();
 await expect(note).toHaveCount(0);
 await drawer.getByRole('button', { name: 'Show hidden receipts' }).click();
 await expect(note).toBeVisible();
 await note.getByRole('button', { name: 'Show on this device' }).click();
 await drawer.getByRole('button', { name: 'Back to the room' }).click();
 await expect(launch).toBeFocused();
 expect(app.cancelCalls || []).toHaveLength(0);
});
test('active payment cannot be hidden; a check shows closure until resolved, then moves it to History', async ({ page, app }) => {
 app.checkoutList = [{ ...closed, status: 'paid', checkout_state: 'payment_received', actions: { resume: false, cancel: false, restart: false, check: true } }];
 app.status = 'failed'; app.checkoutSnapshot = { checkout_state: 'closed', restart_allowed: true, actions: closed.actions };
 await seed(page, { 'moth-milk-checkout-attempts': [pending], 'moth-milk-hidden-receipts': [orderId] });
 await page.goto('/your-corner', { waitUntil: 'domcontentloaded' });
 await page.getByRole('button', { name: 'Your receipts', exact: true }).click();
 const drawer = page.getByRole('dialog');
 await expect(drawer.getByRole('article')).toBeVisible();
 await expect(drawer.getByRole('button', { name: 'Hide from this device' })).toHaveCount(0);
 await drawer.getByRole('button', { name: 'Check on it' }).click();
 await expect(drawer.getByRole('article')).toContainText('This checkout is closed.');
 await expect(drawer.getByRole('button', { name: 'Check on it' })).toHaveCount(0);
 await drawer.getByRole('button', { name: 'Resolve' }).click();
 await expect(drawer.getByRole('article')).toHaveCount(0);
 await drawer.getByRole('button', { name: 'History', exact: true }).click();
 await drawer.getByRole('button', { name: 'Show hidden receipts' }).click();
 await expect(drawer.getByRole('article')).toContainText('This checkout is closed.');
 await page.keyboard.press('Escape'); await expect(drawer).not.toBeVisible();
});
test('delivered receipts are history; shipped receipts remain current and textured actions have no arrows', async ({ page, app }, testInfo) => {
 const delivered = { ...receipt, id: '44444444-4444-4444-8444-444444444444', shipment: { status: 'delivered' } };
 await seed(page, { 'moth-milk-receipts': [{ ...receipt, shipment: { status: 'shipped' } }, delivered] });
 await page.goto('/your-corner', { waitUntil: 'domcontentloaded' });
 await page.getByRole('button', { name: 'Your receipts', exact: true }).click();
 const drawer = page.getByRole('dialog');
 await expect(drawer.getByRole('article')).toHaveCount(1);
 await expect(drawer.getByRole('article')).toContainText(orderId.slice(0,8));
 for (const action of await drawer.locator('.checkout-receipt__action').all()) await expect(action).not.toContainText('↗');
 await page.screenshot({ path: testInfo.outputPath('corner-current.png') });
 await drawer.getByRole('button', { name: 'History', exact: true }).click();
 await expect(drawer.getByRole('article')).toHaveCount(1);
 await expect(drawer.getByRole('status')).toContainText('Your things have arrived.');
});

test('checked closure goes straight to History on reload without resolving; launcher stays beside leave room', async ({ page, app }) => {
 app.signedIn = true; app.checkoutList = [{ ...closed, status: 'paid', checkout_state: 'payment_received', actions: { check: true } }];
 app.status = 'failed'; app.checkoutSnapshot = { checkout_state: 'closed', restart_allowed: true, actions: closed.actions };
 await seed(page, { 'moth-milk-checkout-attempts': [pending] });
 await page.goto('/your-corner');
 const bar = page.locator('.corner-personal-note');
 await expect(bar.getByRole('button', { name: 'Your receipts', exact: true })).toBeVisible();
 await expect(bar.getByRole('button', { name: 'leave the room' })).toBeVisible();
 expect(await page.locator('.corner-hotspot__label').allTextContents()).not.toEqual(expect.arrayContaining([expect.stringContaining('yours')]));
 await bar.getByRole('button', { name: 'Your receipts', exact: true }).click();
 const drawer = page.getByRole('dialog');
 await drawer.getByRole('button', { name: 'Check on it' }).click();
 await expect(drawer.getByRole('button', { name: 'Resolve' })).toBeVisible();
 // Keep the listing stale: the verified status must survive reload.
 await page.reload();
 await bar.getByRole('button', { name: 'Your receipts', exact: true }).click();
 await expect(drawer.getByRole('article')).toHaveCount(0);
 await drawer.getByRole('button', { name: 'History', exact: true }).click();
 await expect(drawer.getByRole('article')).toContainText('This checkout is closed.');
});

test('checking a closed receipt preserves its position among current receipts', async ({ page, app }) => {
 const otherId = '77777777-7777-4777-8777-777777777777';
 app.checkoutList = [
  { ...closed, status: 'reserved', checkout_state: 'awaiting_payment', actions: { check: true } },
  { ...closed, id: otherId, status: 'reserved', checkout_state: 'awaiting_payment', actions: { check: true } }
 ];
 app.status = 'failed'; app.checkoutSnapshot = { checkout_state: 'closed', restart_allowed: true, actions: closed.actions };
 await seed(page, { 'moth-milk-checkout-attempts': [pending] });
 await page.goto('/your-corner');
 await page.getByRole('button', { name: 'Your receipts', exact: true }).click();
 const notes = page.getByRole('dialog').getByRole('article');
 await expect(notes).toHaveCount(2);
 await notes.first().getByRole('button', { name: 'Check on it' }).click();
 await expect(notes.first()).toContainText(orderId.slice(0, 8));
 await expect(notes.first()).toContainText('This checkout is closed.');
 await notes.first().getByRole('button', { name: 'Resolve' }).click();
 await expect(notes).toHaveCount(1);
 await page.reload();
 await page.getByRole('button', { name: 'Your receipts', exact: true }).click();
 await expect(notes).toHaveCount(1);
 await expect(notes.first()).toContainText(otherId.slice(0, 8));
});
