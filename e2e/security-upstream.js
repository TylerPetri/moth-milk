// Disposable local upstream for testing the REAL storefront cookie boundary.
import http from 'node:http';
let statusDown = false;
const server = http.createServer(async (req, res) => {
 let raw = ''; for await (const part of req) raw += part;
 let body = {}; try { body = JSON.parse(raw || '{}'); } catch {}
 const send = (status, data) => { res.writeHead(status, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(data)); };
 if (req.url === '/_fixture/status') { statusDown = body.down; return send(200, { ok: true }); }
 if (req.url === '/health') return send(200, { ok: true });
 if (req.url === '/v1/auth/login' || req.url === '/v1/auth/register' || req.url === '/v1/auth/refresh') {
   if (req.url.endsWith('/refresh') && body.refresh_token !== 'SERVER_ONLY_REFRESH') return send(401, { error: 'unauthorized' });
   return send(200, { access_token: 'SERVER_ONLY_ACCESS', refresh_token: 'SERVER_ONLY_REFRESH', access_expires_at: new Date(Date.now() + 3600000).toISOString(), user_id: 'reader', email_verified: true, shop_id: '11111111-1111-4111-8111-111111111111' });
 }
 if (req.url === '/v1/auth/me') return req.headers.authorization === 'Bearer SERVER_ONLY_ACCESS' ? send(200, { user_id: 'reader', email: 'reader@example.test', email_verified: true }) : send(401, { error: 'unauthorized' });
 if (req.url === '/v1/auth/logout') return send(200, { ok: true });
 if (req.url === '/v1/orders/prepare') return send(202, { id: '22222222-2222-4222-8222-222222222222', status: 'reserved', total: 4200, payment_client_secret: 'fixture_secret' });
 if (req.url.endsWith('/checkout-status') && statusDown) return send(503, { error: 'unavailable' });
 if (req.url.endsWith('/checkout-status')) return body.tracking_proof === 'VALID_EMAIL_PROOF' || body.idempotency_key === '33333333-3333-4333-8333-333333333333' ? send(200, { id: req.url.split('/')[3], status: 'confirmed' }) : send(404, { error: 'not_found' });
 return send(404, { error: 'not_found' });
});
server.listen(4174, '127.0.0.1');
