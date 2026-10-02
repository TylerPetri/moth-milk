import { test, expect } from '@playwright/test';
const origin = 'http://127.0.0.1:4173';
const id = '22222222-2222-4222-8222-222222222222';
const key = '33333333-3333-4333-8333-333333333333';
const headers = { Origin: origin };
test.beforeEach(async ({ request }) => {
 await request.post('/session/v1/auth/login', { headers, data: { email: 'invalid-signature@example.test', password: 'fixture' } });
 expect((await request.storageState()).cookies.find(cookie => cookie.name === 'mm_access')?.value).toBe('BROKEN_ACCESS');
});
for (const action of ['status', 'resume', 'cancel']) {
 test(`receipt-authorized ${action} survives an invalid login signature`, async ({ request }) => {
  await request.post('/session/v1/auth/receipt', { headers, data: { id, idempotency_key: key } });
  const result = await request.post(`/session/v1/orders/${id}/checkout-${action}`, { headers, data: {} });
  expect(result.ok()).toBeTruthy();
  expect((await result.json()).id).toBe(id);
  expect((await request.storageState()).cookies.find(cookie => cookie.name === 'mm_access')?.value).toBe('BROKEN_ACCESS');
 });
}
test('tracking proof can read status but cannot resume or cancel', async ({ request }) => {
 await request.post('/session/v1/auth/receipt', { headers, data: { id, tracking_proof: 'VALID_EMAIL_PROOF' } });
 expect((await request.post(`/session/v1/orders/${id}/checkout-status`, { headers, data: {} })).status()).toBe(200);
 for (const action of ['resume', 'cancel']) expect((await request.post(`/session/v1/orders/${id}/checkout-${action}`, { headers, data: {} })).status()).toBe(401);
});
test('account-only operations and creation keep JWT verification', async ({ request }) => {
 const result = await request.post(`/session/v1/orders/${id}/checkout-status`, { headers, data: {} });
 expect(result.status()).toBe(401); expect((await result.json()).error).toBe('invalid_token');
 expect((await request.get('/session/v1/checkouts')).status()).toBe(401);
 expect((await request.post('/session/v1/orders/prepare', { headers, data: { idempotency_key: key } })).status()).toBe(401);
});
test('device receipt listing works independently of a stale account cookie', async ({ request }) => {
 const result = await request.post('/session/v1/checkouts/query', { headers, data: { attempts: [{ id, idempotency_key: key }] } });
 expect(result.status()).toBe(200);
});
