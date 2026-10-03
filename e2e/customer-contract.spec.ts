import { test, expect } from '@playwright/test';
const headers = { Origin: 'http://127.0.0.1:4173', 'X-Shop-ID': '55555555-5555-4555-8555-555555555555', Authorization: 'Bearer STALE_BROWSER_TOKEN' };
test('fresh customer authentication fixes shop scope and omits stale credentials', async ({ request }) => {
 for (const action of ['register', 'login']) {
  const result = await request.post(`/session/v1/auth/${action}`, { headers, data: { email: 'reader@example.test', password: 'fixture-password' } });
  expect(result.status()).toBe(200); expect((await result.json()).shop_id).toBe('11111111-1111-4111-8111-111111111111');
 }
 for (const action of ['email/verify/confirm', 'password/reset/request', 'password/reset/confirm']) {
  expect((await request.post(`/session/v1/auth/${action}`, { headers, data: { token: 'fixture', email: 'reader@example.test', new_password: 'fixture-password' } })).status()).toBe(200);
 }
 expect((await request.post('/session/v1/auth/refresh', { headers })).status()).toBe(401); // Reset revoked local session.
});
test('wrong-shop and operator sessions are rejected and dashboard routes unavailable', async ({ request }) => {
 for (const email of ['wrong-shop@example.test', 'operator@example.test']) {
  const response = await request.post('/session/v1/auth/login', { headers, data: { email, password: 'fixture-password' } });
  expect(response.status()).toBe(403); expect(JSON.stringify(await response.json())).not.toContain('SERVER_ONLY');
 }
 for (const route of ['me/shops/switch', 'dashboard/login', 'dashboard/shops/switch']) {
  expect((await request.post(`/session/v1/auth/${route}`, { headers, data: {} })).status()).toBe(404);
 }
});
test('overlapping cookie refreshes share one rotation and verification request retains customer authorization', async ({ request }) => {
 expect((await request.post('/session/v1/auth/login', { headers, data: { email: 'rotation@example.test', password: 'fixture-password' } })).ok()).toBeTruthy();
 const rotated = await Promise.all([request.post('/session/v1/auth/refresh', { headers }), request.post('/session/v1/auth/refresh', { headers })]);
 expect(rotated.map(response => response.status())).toEqual([200, 200]);
 expect((await request.get('/session/v1/auth/me')).ok()).toBeTruthy();
 expect((await request.post('/session/v1/auth/email/verify/request', { headers, data: { locale: 'en' } })).ok()).toBeTruthy();
 expect((await request.post('/session/v1/auth/logout', { headers })).ok()).toBeTruthy();
 expect((await request.post('/session/v1/auth/refresh', { headers })).status()).toBe(401);
});
test('receipt batch without every required key keeps unrelated cookie authorization', async ({ request }) => {
 await request.post('/session/v1/auth/login', { headers, data: { email: 'invalid-signature@example.test', password: 'fixture-password' } });
 const response = await request.post('/session/v1/checkouts/query', { headers, data: { attempts: [{ id: '22222222-2222-4222-8222-222222222222' }] } });
 expect(response.status()).toBe(401);
});
test('storefront resolution ignores supplied host and identity headers', async ({ request }) => {
 const response = await request.get('/session/v1/auth/storefront?host=unrelated.example', { headers });
 expect(response.status()).toBe(200);
 expect((await response.json()).shop_id).toBe('11111111-1111-4111-8111-111111111111');
});
