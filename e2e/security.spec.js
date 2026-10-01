import { test, expect } from '@playwright/test';
const origin = 'http://127.0.0.1:4173';
test('real server keeps tokens HttpOnly, rejects forged origins and clears logout', async ({ page, context }) => {
 const login = await page.request.post('/session/v1/auth/login', { headers: { Origin: origin }, data: { email: 'reader@example.test', password: 'fixture-password' } });
 expect(login.ok()).toBeTruthy(); const data = await login.json();
 expect(JSON.stringify(data)).not.toContain('SERVER_ONLY');
 const cookies = await context.cookies(origin + '/session');
 expect(cookies.filter(c => c.name.startsWith('mm_')).every(c => c.httpOnly && c.sameSite === 'Strict')).toBeTruthy();
 expect(cookies.find(c => c.name === 'mm_refresh').value).toBe('SERVER_ONLY_REFRESH');
 await context.clearCookies({ name: 'mm_access' });
 await page.goto('/your-corner');
 await expect(page.getByText('reader@example.test', { exact: true })).toBeVisible();
 expect((await context.cookies(origin + '/session')).some(c => c.name === 'mm_access')).toBeTruthy();
 expect(await page.evaluate(() => document.cookie)).not.toContain('mm_refresh');
 expect(await page.evaluate(() => sessionStorage.getItem('moth-milk-session'))).toBeNull();
 const forged = await page.request.post('/session/v1/auth/logout', { headers: { Origin: 'https://evil.example' } });
 expect(forged.status()).toBe(403);
 const blocked = await page.request.post('/session/v1/auth/bootstrap-admin', { headers: { Origin: origin } });
 expect(blocked.status()).toBe(404);
 const refreshed = await page.request.post('/session/v1/auth/refresh', { headers: { Origin: origin }, data: { refresh_token: 'ATTACKER_SUPPLIED' } });
 expect(refreshed.ok()).toBeTruthy(); expect(JSON.stringify(await refreshed.json())).not.toContain('SERVER_ONLY');
 await page.request.post('/session/v1/auth/logout', { headers: { Origin: origin } });
 expect((await context.cookies(origin + '/session')).filter(c => ['mm_access', 'mm_refresh'].includes(c.name))).toHaveLength(0);
});
test('receipt credentials survive reload in HttpOnly cookies and can be forgotten', async ({ page, context }) => {
 const path = '/session/v1/orders/22222222-2222-4222-8222-222222222222/checkout-status';
 const first = await page.request.post(path, { headers: { Origin: origin }, data: { idempotency_key: '33333333-3333-4333-8333-333333333333' } });
 expect(first.ok()).toBeTruthy();
 expect((await context.cookies(origin + '/session')).find(c => c.name.startsWith('mm_receipt_')).httpOnly).toBeTruthy();
 expect((await page.request.post(path, { headers: { Origin: origin }, data: {} })).ok()).toBeTruthy();
 await page.request.post('/session/v1/auth/receipts/forget', { headers: { Origin: origin } });
 expect((await page.request.post(path, { headers: { Origin: origin }, data: {} })).status()).toBe(404);
});
test('document headers restrict scripts, embedding and referrers', async ({ page }) => {
 const response = await page.goto('/checkout'); const headers = response.headers();
 expect(headers['content-security-policy']).toContain("frame-ancestors 'none'");
 expect(headers['content-security-policy']).toContain('https://js.stripe.com');
 expect(headers['x-content-type-options']).toBe('nosniff');
 expect(headers['referrer-policy']).toBe('no-referrer');
 expect(headers['cache-control']).toContain('no-store');
});

test('emailed receipt persists through upstream outage without storing proof in browser storage', async ({ page }) => {
 await page.request.post('http://127.0.0.1:4174/_fixture/status', { data: { down: true } });
 try {
  await page.goto('/checkout?order=22222222-2222-4222-8222-222222222222#proof=VALID_EMAIL_PROOF');
  await expect(page.getByRole('alert')).toContainText('Please don’t pay again');
  expect(new URL(page.url()).hash).toBe('');
  expect(await page.evaluate(() => localStorage.getItem('moth-milk-receipts'))).not.toContain('VALID_EMAIL_PROOF');
  await page.request.post('http://127.0.0.1:4174/_fixture/status', { data: { down: false } });
  await page.reload(); await expect(page.getByRole('status')).toContainText('Your order is confirmed');
 } finally { await page.request.post('http://127.0.0.1:4174/_fixture/status', { data: { down: false } }); }
});

test('pending contact recovery is cookie backed and never forwarded to public browser storage', async ({ page, context }) => {
 const body = { idempotency_key: '33333333-3333-4333-8333-333333333333', customer_email: 'reader@example.test', customer_name: 'June', shipping: { line1: 'PRIVATE_ADDRESS' }, items: Array.from({ length: 100 }, () => ({ product_id: 'plush-id', quantity: 1 })) };
 const prepared = await page.request.post('/session/v1/orders/prepare', { headers: { Origin: origin, 'X-Shop-ID': 'attacker-shop' }, data: body });
 expect(prepared.status()).toBe(202);
 const cookie = (await context.cookies(origin + '/session')).find(c => c.name === 'mm_checkout');
 expect(cookie.httpOnly).toBeTruthy(); expect(cookie.sameSite).toBe('Strict');
 const restored = await page.request.get('/session/v1/auth/recovery');
 expect((await restored.json()).body.shipping.line1).toBe('PRIVATE_ADDRESS');
 await page.request.post('/session/v1/orders/22222222-2222-4222-8222-222222222222/checkout-status', { headers: { Origin: origin }, data: { idempotency_key: body.idempotency_key } });
 expect((await context.cookies(origin + '/session')).find(c => c.name === 'mm_checkout')).toBeUndefined();
});
