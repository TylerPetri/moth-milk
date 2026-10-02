import { test, expect, seed, pending, item, key, details } from './helpers.ts';

test('cancel safely closes the saved checkout, preserves the bag and uses a new key', async ({ page, app }) => {
  app.status = 'reserved'; app.stripeIntent = 'requires_payment_method';
  await page.addInitScript(() => { window.__stripeIntent = 'requires_payment_method'; });
  await seed(page, { 'moth-milk-pending-checkout': { ...pending, paymentSubmitted: false }, 'moth-milk-bag': [item] });
  await page.goto('/checkout', { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('button', { name: /Place order/ })).toBeVisible();
  app.cancelWait = new Promise(resolve => { app.releaseCancel = resolve; });
  const cancel = page.getByRole('button', { name: 'Cancel this checkout ↗' });
  await expect(cancel).toHaveClass('checkout-receipt__action');
  await cancel.click();
  await expect(page.getByRole('button', { name: 'Closing…' })).toBeDisabled();
  app.releaseCancel();
  await expect(page.getByRole('status')).toContainText('That checkout is closed');
  expect(app.cancelCalls).toEqual([{ idempotency_key: key }]);
  expect(await page.evaluate(() => localStorage.getItem('moth-milk-pending-checkout'))).toBeNull();
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('moth-milk-bag')).length)).toBe(1);
  await details(page);
  await page.getByRole('button', { name: /Continue to payment/ }).click();
  await expect(page.getByRole('button', { name: /Place order/ })).toBeVisible();
  expect(app.prepares.at(-1).idempotency_key).not.toBe(key);
});

for (const failure of ['cancelDown', 'cancelRefused', 'cancelInvalid']) {
  test(`${failure} keeps the original checkout and hides backend errors`, async ({ page, app }) => {
    app.status = 'reserved'; app.prepareConflict = true; app[failure] = true;
    await seed(page, { 'moth-milk-pending-checkout': pending, 'moth-milk-bag': [item] });
    await page.goto('/checkout', { waitUntil: 'domcontentloaded' });
    await page.getByRole('button', { name: 'Cancel this checkout ↗' }).click();
    await expect(page.getByRole('alert')).toContainText('We couldn’t close this checkout');
    expect(await page.evaluate(() => JSON.parse(localStorage.getItem('moth-milk-pending-checkout')).idempotency_key)).toBe(key);
    await expect(page.locator('body')).not.toContainText('PRIVATE');
    await expect(page.getByRole('button', { name: /Place order/ })).toHaveCount(0);
    await page.reload({ waitUntil: 'domcontentloaded' });
    expect(await page.evaluate(() => JSON.parse(localStorage.getItem('moth-milk-pending-checkout')).idempotency_key)).toBe(key);
    app[failure] = false;
    await page.getByRole('button', { name: 'Cancel this checkout ↗' }).click();
    await expect(page.getByLabel('Email address')).toBeVisible();
  });
}

test('paid and confirmed orders have no cancellation action', async ({ page, app }) => {
  app.status = 'paid';
  await seed(page, { 'moth-milk-pending-checkout': pending });
  await page.goto('/checkout', { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('status')).toContainText('Payment received');
  await expect(page.getByRole('button', { name: 'Cancel this checkout ↗' })).toHaveCount(0);
  app.status = 'confirmed'; await page.reload({ waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('status')).toContainText('Your order is confirmed');
  await expect(page.getByRole('button', { name: /Cancel this checkout/ })).toHaveCount(0);
});

test('failed checkout requires server closure before Try again clears it', async ({ page, app }) => {
  app.status = 'failed';
  await seed(page, { 'moth-milk-pending-checkout': pending, 'moth-milk-bag': [item] });
  await page.goto('/checkout', { waitUntil: 'domcontentloaded' });
  await page.getByRole('button', { name: 'Close checkout & try again ↗' }).click();
  await expect(page.getByLabel('Email address')).toBeVisible();
  expect(app.cancelCalls).toEqual([{ idempotency_key: key }]);
});


test('server-verified automatic closure returns to details without submitting a new payment', async ({ page, app }) => {
  app.status = 'reserved'; app.prepareConflict = true; app.restartAllowed = true;
  await seed(page, { 'moth-milk-pending-checkout': { ...pending, paymentSubmitted: false }, 'moth-milk-bag': [item] });
  await page.goto('/checkout', { waitUntil: 'domcontentloaded' });
  await expect(page.getByLabel('Email address')).toBeVisible();
  await expect(page.getByRole('status')).toContainText('The earlier checkout is closed');
  expect(await page.evaluate(() => localStorage.getItem('moth-milk-pending-checkout'))).toBeNull();
  expect(app.prepares).toHaveLength(1);
  expect(await page.evaluate(() => window.__confirms || 0)).toBe(0);
});

test('refused closure keeps checking the original payment and confirms without a second charge', async ({ page, app }) => {
  app.status = 'reserved'; app.prepareConflict = true; app.cancelRefused = true;
  await seed(page, { 'moth-milk-pending-checkout': pending, 'moth-milk-bag': [item] });
  await page.goto('/checkout', { waitUntil: 'domcontentloaded' });
  await page.getByRole('button', { name: 'Cancel this checkout ↗' }).click();
  await expect(page.getByRole('alert')).toContainText('may already have completed');
  await expect(page.locator('body')).toContainText('recovery-reference-123');
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('moth-milk-pending-checkout')).idempotency_key)).toBe(key);
  app.status = 'confirmed';
  await expect(page.getByRole('status')).toContainText('Your order is confirmed');
  expect(await page.evaluate(() => window.__confirms || 0)).toBe(0);
  await expect(page.getByRole('button', { name: 'Cancel this checkout ↗' })).toHaveCount(0);
});
