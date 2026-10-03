// Disposable local upstream for testing the REAL storefront cookie boundary.
import http from 'node:http';
const unavailableOrders = new Set();
const rotations = new Map();
let sequence = 0;
const server = http.createServer(async (req, res) => {
 let raw = ''; for await (const part of req) raw += part;
 let body = {}; try { body = JSON.parse(raw || '{}'); } catch {}
 const send = (status, data) => { res.writeHead(status, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(data)); };
 if (req.url === '/_fixture/status') { if (typeof body.order_id !== 'string') return send(400, { error: 'order_id_required' });
   if (body.down) unavailableOrders.add(body.order_id); else unavailableOrders.delete(body.order_id);
   return send(200, { ok: true }); }
 if (req.url?.startsWith('/v1/auth/storefront?')) {
   const host = new URL(req.url, 'http://fixture').searchParams.get('host');
   return host === '127.0.0.1:4173' ? send(200, { shop_id: '11111111-1111-4111-8111-111111111111' }) : send(404, { error: 'storefront_not_found' });
 }
 if (req.url === '/health') return send(200, { ok: true });
 if (req.url?.startsWith('/v1/auth/') && req.url !== '/v1/auth/me' && req.url !== '/v1/auth/me/books' && req.url !== '/v1/auth/email/verify/request') {
   if (req.headers['x-shop-id'] !== '11111111-1111-4111-8111-111111111111' || req.headers.authorization) return send(400, { error: 'fixture_wrong_customer_scope_or_authorization' });
 }
 if (req.url === '/v1/auth/login' || req.url === '/v1/auth/register' || req.url === '/v1/auth/refresh') {
   if (body.email === 'rotation@example.test' && !req.url.endsWith('/refresh')) {
     const token = `ROTATION_${++sequence}`; rotations.set(token, true);
     return send(200, { access_token: 'SERVER_ONLY_ACCESS', refresh_token: token, access_expires_at: new Date(Date.now() + 60000).toISOString(), user_id: 'reader', email_verified: true, shop_id: '11111111-1111-4111-8111-111111111111', roles: ['customer'] });
   }
   if (req.url.endsWith('/refresh') && body.refresh_token?.startsWith('ROTATION_')) {
     if (!rotations.delete(body.refresh_token)) return send(401, { error: 'fixture_refresh_replay' });
     const token = `ROTATION_${++sequence}`; rotations.set(token, true);
     await new Promise(resolve => setTimeout(resolve, 200));
     return send(200, { access_token: 'SERVER_ONLY_ACCESS', refresh_token: token, access_expires_at: new Date(Date.now() + 60000).toISOString(), user_id: 'reader', email_verified: true, shop_id: '11111111-1111-4111-8111-111111111111', roles: ['customer'] });
   }
   if (req.url.endsWith('/refresh') && body.refresh_token !== 'SERVER_ONLY_REFRESH') return send(401, { error: 'unauthorized' });
   return send(200, { access_token: body.email === 'invalid-signature@example.test' ? 'BROKEN_ACCESS' : 'SERVER_ONLY_ACCESS', refresh_token: 'SERVER_ONLY_REFRESH', access_expires_at: new Date(Date.now() + 3600000).toISOString(), user_id: 'reader', email_verified: true, shop_id: body.email === 'wrong-shop@example.test' ? '55555555-5555-4555-8555-555555555555' : '11111111-1111-4111-8111-111111111111', roles: body.email === 'operator@example.test' ? ['platform_admin'] : ['customer'] });
 }
 if (req.headers.authorization === 'Bearer BROKEN_ACCESS') return send(401, { error: 'invalid_token', message: 'token signature is invalid: crypto/rsa: verification error' });
 if (req.url === '/v1/auth/me') return req.headers.authorization === 'Bearer SERVER_ONLY_ACCESS' ? send(200, { user_id: 'reader', email: 'reader@example.test', email_verified: true, shop_id: '11111111-1111-4111-8111-111111111111', identity_kind: 'customer', roles: ['customer'] }) : send(401, { error: 'unauthorized' });
 if (req.url === '/v1/auth/email/verify/request') return req.headers.authorization === 'Bearer SERVER_ONLY_ACCESS' ? send(200, { ok: true }) : send(401, { error: 'unauthorized' });
 if (req.url === '/v1/auth/me/books') return send(200, { books: ['static'] });
 if (req.url === '/v1/orders/claim') return send(200, { claimed: 0 });
 if (req.url === '/v1/users/reader/orders?limit=100') return send(200, { orders: [{ status: 'confirmed', items: [{ product_id: 'plush-id' }] }] });
 if (req.url === '/v1/products?limit=100') return send(200, { products: [{ id: 'plush-id', is_active: true, amount: 4200, currency: 'CAD', attributes: { style_slug: 'mimi-plush', size: 'One soft size' } }] });
 if (req.url === '/v1/checkouts') return send(200, { checkouts: [], count: 0 });
 if (['/v1/auth/email/verify/confirm', '/v1/auth/password/reset/confirm', '/v1/auth/password/reset/request'].includes(req.url)) return send(200, { ok: true });
 if (req.url === '/v1/auth/logout') return send(200, { ok: true });
 if (req.url === '/v1/orders/prepare') return send(202, { id: '22222222-2222-4222-8222-222222222222', status: 'reserved', total: 4200, payment_client_secret: 'fixture_secret' });
 if (req.url.endsWith('/checkout-status') && unavailableOrders.has(req.url.split('/')[3])) return send(503, { error: 'unavailable' });
 if (req.url === '/v1/checkouts/query') return send(200, { checkouts: [], count: 0 });
 if (req.url.endsWith('/checkout-resume')) return body.idempotency_key === '33333333-3333-4333-8333-333333333333' ? send(202, { id: req.url.split('/')[3], payment_client_secret: 'fixture_secret', publishable_key: 'pk_test_saved_profile' }) : send(404, { error: 'not_found' });
 if (req.url.endsWith('/checkout-cancel')) return body.idempotency_key === '33333333-3333-4333-8333-333333333333' && !body.tracking_proof ? send(200, { id: req.url.split('/')[3], status: 'failed', restart_allowed: true }) : send(404, { error: 'not_found' });
 if (req.url.endsWith('/checkout-status')) return body.tracking_proof === 'VALID_EMAIL_PROOF' || body.idempotency_key === '33333333-3333-4333-8333-333333333333' ? send(200, { id: req.url.split('/')[3], status: 'confirmed' }) : send(404, { error: 'not_found' });
 return send(404, { error: 'not_found' });
});
server.listen(4174, '127.0.0.1');
