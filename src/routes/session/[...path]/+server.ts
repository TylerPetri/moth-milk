// Browser tokens stay in HttpOnly cookies; upstream requests are server-to-server.
import { env } from '$env/dynamic/private';
import { env as publicEnv } from '$env/dynamic/public';
import type { RequestHandler } from '@sveltejs/kit';
import type { CheckoutStatusRequest, ShippingAddress } from '$lib/types/api.ts';
import { isShopId, validCustomer, validCustomerSession } from '$lib/customer-contract.ts';
import { isLoopback } from '$lib/payment-policy.ts';
import { coordinatedRefresh } from '$lib/server/refresh.ts';
import { json } from '@sveltejs/kit';
interface ProxyPayload {
 [key: string]: unknown;
 idempotency_key?: string; tracking_proof?: string; customer_email?: string;
 customer_name?: string; shipping?: ShippingAddress; refresh_token?: string;
 shop_id?: string; status?: string; access_token?: string; access_expires_at?: string;
}
const allowed = new Set(['GET /v1/auth/storefront', 'POST /v1/auth/login', 'POST /v1/auth/register', 'POST /v1/auth/refresh', 'POST /v1/auth/logout', 'GET /v1/auth/me', 'GET /v1/auth/me/books', 'PUT /v1/auth/me/books', 'POST /v1/auth/email/verify/request', 'POST /v1/auth/email/verify/confirm', 'POST /v1/auth/password/reset/request', 'POST /v1/auth/password/reset/confirm', 'POST /v1/orders/claim', 'POST /v1/orders/prepare', 'POST /v1/orders', 'POST /v1/checkouts/query', 'GET /v1/checkouts', 'GET /v1/products']);
async function readBody(request: Request, limit = 65536) {
  const reader = request.body?.getReader(); if (!reader) return '';
  const decoder = new TextDecoder(); let text = ''; let size = 0;
  while (true) { const { done, value } = await reader.read(); if (done) break; size += value.byteLength; if (size > limit) { await reader.cancel(); throw Object.assign(new Error('Request too large'), { status: 413 }); } text += decoder.decode(value, { stream: true }); }
  return text + decoder.decode();
}
const handle: RequestHandler = async ({ request, params, url, cookies }) => {
  const path = '/' + params.path;
  if (path === '/v1/auth/receipt' && request.method === 'POST') {
    if (request.headers.get('origin') !== url.origin) return json({ error: 'forbidden' }, { status: 403 });
    try {
      const raw = await readBody(request, 2048); if (raw.length > 2048) return json({ error: 'invalid_input' }, { status: 413 });
      const { id, idempotency_key, tracking_proof } = JSON.parse(raw);
      if (!/^[a-f0-9-]{36}$/.test(id || '') || (!/^[a-f0-9-]{36}$/.test(idempotency_key || '') && !(typeof tracking_proof === 'string' && tracking_proof.length > 0 && tracking_proof.length <= 1024))) return json({ error: 'invalid_input' }, { status: 400 });
      const name = `mm_receipt_${id}`;
      const existing = cookies.getAll().filter(c => c.name.startsWith('mm_receipt_') && c.name !== name);
      for (const c of existing.slice(0, Math.max(0, existing.length - 9))) cookies.delete(c.name, { path: '/session' });
      cookies.set(name, JSON.stringify({ idempotency_key, tracking_proof }), { path: '/session', httpOnly: true, secure: url.protocol === 'https:', sameSite: 'strict', maxAge: 86400 * 30 });
      return json({ ok: true }, { headers: { 'Cache-Control': 'no-store' } });
    } catch { return json({ error: 'invalid_input' }, { status: 400 }); }
  }
  if (path === '/v1/auth/recovery' && request.method === 'GET') {
    let body = null; try { body = JSON.parse(cookies.get('mm_checkout') || 'null'); } catch {}
    return json({ body }, { headers: { 'Cache-Control': 'no-store' } });
  }
  if (path === '/v1/auth/receipts/forget' && request.method === 'POST') {
    if (request.headers.get('origin') !== url.origin) return json({ error: 'forbidden' }, { status: 403 });
    for (const cookie of cookies.getAll()) if (cookie.name.startsWith('mm_receipt_')) cookies.delete(cookie.name, { path: '/session' });
    return json({ ok: true }, { headers: { 'Cache-Control': 'no-store' } });
  }
  if (!allowed.has(`${request.method} ${path}`) && !(request.method === 'POST' && /^\/v1\/orders\/[a-f0-9-]{36}\/checkout-(?:status|cancel|resume)$/.test(path)) && !(request.method === 'GET' && /^\/v1\/users\/[a-zA-Z0-9-]+\/orders$/.test(path))) return json({ error: 'not_found' }, { status: 404 });
  if (request.method !== 'GET' && request.headers.get('origin') !== url.origin) return json({ error: 'forbidden' }, { status: 403 });
  const clear = () => { for (const path of ['/', '/session']) { cookies.delete('mm_access', { path }); cookies.delete('mm_refresh', { path }); } };
  const logoutRefresh = path.endsWith('/logout') ? cookies.get('mm_refresh') : undefined;
  if (path.endsWith('/logout')) clear();
  try {
    const upstream = new URL(env.API_ORIGIN || publicEnv.PUBLIC_API_URL || '');
    if (upstream.username || upstream.password || upstream.search || upstream.hash || !['http:', 'https:'].includes(upstream.protocol) || (url.protocol === 'https:' && upstream.protocol !== 'https:')) throw new Error('Invalid API origin');
    // Stub order submission is reserved for a loopback test upstream.
    if (path === '/v1/orders' && publicEnv.PUBLIC_PAYMENT_MODE === 'stub' && !isLoopback(upstream.hostname)) return json({ error: 'unavailable' }, { status: 503 });
    const headers = new Headers({ 'Content-Type': 'application/json' });
    // Do not pass browser Authorization, Cookie, forwarding headers, or arbitrary shop switches upstream.
    let shop = publicEnv.PUBLIC_SHOP_ID;
    if (!shop) {
      const resolved = await globalThis.fetch(new URL(`/v1/auth/storefront?host=${encodeURIComponent(url.host)}`, upstream), { redirect: 'error', signal: AbortSignal.timeout(15000) });
      if (!resolved.ok) return json({ error: 'unavailable' }, { status: 503 });
      shop = (await resolved.json()).shop_id;
    }
    if (!isShopId(shop)) return json({ error: 'shop_unresolved' }, { status: 503 });
    shop = shop.toLowerCase();
    if (path === '/v1/auth/storefront') return json({ shop_id: shop }, { headers: { 'Cache-Control': 'no-store' } });
    headers.set('X-Shop-ID', shop);
    const access = cookies.get('mm_access');
    const credentialAuth = request.method === 'POST' && ['/v1/auth/login', '/v1/auth/register', '/v1/auth/refresh', '/v1/auth/logout', '/v1/auth/email/verify/confirm', '/v1/auth/password/reset/request', '/v1/auth/password/reset/confirm'].includes(path);
    if (access && !credentialAuth) headers.set('Authorization', `Bearer ${access}`);
    let body: ProxyPayload | undefined;
    const receiptCookie = (path.endsWith('/checkout-status') || path.endsWith('/checkout-cancel') || path.endsWith('/checkout-resume')) ? `mm_receipt_${path.split('/')[3]}` : '';
    let receiptCredential: CheckoutStatusRequest | undefined;
    if (request.method !== 'GET') {
      const raw = await readBody(request);
      if (new TextEncoder().encode(raw).length > 65536) return json({ error: 'invalid_input' }, { status: 413 });
      body = (raw ? JSON.parse(raw) : {}) as ProxyPayload;
      if (path === '/v1/orders/prepare' || path === '/v1/orders') {
        const encoded = JSON.stringify({ idempotency_key: body.idempotency_key, customer_email: body.customer_email, customer_name: body.customer_name, shipping: body.shipping });
        if (encodeURIComponent(encoded).length > 3600) return json({ error: 'invalid_input', message: 'Checkout details are too long.' }, { status: 400 });
        cookies.set('mm_checkout', encoded, { path: '/session', httpOnly: true, secure: url.protocol === 'https:', sameSite: 'strict', maxAge: 86400 * 30 });
      }
      if (receiptCookie) {
        let saved: CheckoutStatusRequest; try { saved = JSON.parse(cookies.get(receiptCookie) || '{}'); } catch { saved = {}; }
        receiptCredential = { idempotency_key: body.idempotency_key || saved.idempotency_key, tracking_proof: body.tracking_proof || saved.tracking_proof };
        body = (path.endsWith('/checkout-cancel') || path.endsWith('/checkout-resume')) ? { idempotency_key: receiptCredential.idempotency_key } : { ...receiptCredential };
      }
      if (path === '/v1/checkouts/query') {
        if (!Array.isArray(body.attempts) || body.attempts.length > 10) return json({ error: 'invalid_input' }, { status: 400 });
        body = { attempts: body.attempts.map((item: { id?: string; idempotency_key?: string }) => {
          let saved: CheckoutStatusRequest = {}; try { saved = JSON.parse(cookies.get(`mm_receipt_${item.id}`) || '{}'); } catch {}
          return { id: item.id, idempotency_key: item.idempotency_key || saved.idempotency_key };
        }) };
      }
      if (path.endsWith('/refresh') || path.endsWith('/logout')) {
        body = { refresh_token: path.endsWith('/logout') ? logoutRefresh : cookies.get('mm_refresh') };
        if (!body.refresh_token) return path.endsWith('/logout') ? json({ ok: true }) : json({ error: 'unauthorized' }, { status: 401 });
      }
    }
    // Receipt routes have their own shop-scoped authorization. An unrelated
    // login cookie must not prevent the backend from verifying that capability.
    // Account-only reads and checkout creation still require their usual JWT.
    const receiptRoute = request.method === 'POST' && /^\/v1\/orders\/[a-f0-9-]{36}\/checkout-(?:status|cancel|resume)$/.test(path);
    const hasReceiptKey = typeof body?.idempotency_key === 'string' && /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/.test(body.idempotency_key) && body.idempotency_key !== '00000000-0000-0000-0000-000000000000';
    const hasReadProof = path.endsWith('/checkout-status') && typeof body?.tracking_proof === 'string' && body.tracking_proof.length > 0 && body.tracking_proof.length <= 1024;
    if ((receiptRoute && (hasReceiptKey || hasReadProof)) || (request.method === 'POST' && path === '/v1/checkouts/query' && Array.isArray(body?.attempts) && body.attempts.length > 0 && body.attempts.every((item: { id?: unknown; idempotency_key?: unknown }) => isShopId(item.id) && isShopId(item.idempotency_key)))) headers.delete('Authorization');
    const send = async () => {
      const result = await globalThis.fetch(new URL(path + url.search, upstream), { method: request.method, headers, body: body ? JSON.stringify(body) : undefined, redirect: 'error', signal: AbortSignal.timeout(20000) });
      return { status: result.status, data: result.status === 204 ? {} : await result.json() };
    };
    const result = path === '/v1/auth/refresh' && body?.refresh_token ? await coordinatedRefresh(shop, body.refresh_token, send) : await send();
    const response = { status: result.status, ok: result.status >= 200 && result.status < 300 };
    const data: ProxyPayload = result.data;
    if (response.ok && ((['/v1/auth/login', '/v1/auth/register', '/v1/auth/refresh'].includes(path) && !validCustomerSession(data, shop)) || (path === '/v1/auth/me' && !validCustomer(data, shop, true)))) {
      clear();
      return json({ error: 'invalid_customer_session' }, { status: 403, headers: { 'Cache-Control': 'no-store' } });
    }
    if (response.ok && path === '/v1/auth/password/reset/confirm') clear();
    if (response.ok && (path === '/v1/orders/prepare' || path === '/v1/orders') && typeof data.id === 'string' && body?.idempotency_key) {
      const existing = cookies.getAll().filter(c => c.name.startsWith('mm_receipt_') && c.name !== `mm_receipt_${data.id}`);
      for (const c of existing.slice(0, Math.max(0, existing.length - 9))) cookies.delete(c.name, { path: '/session' });
      cookies.set(`mm_receipt_${data.id}`, JSON.stringify({ idempotency_key: body.idempotency_key }), { path: '/session', httpOnly: true, secure: url.protocol === 'https:', sameSite: 'strict', maxAge: 86400 * 30 });
    }
    if (path === '/v1/orders/prepare' && response.status === 409 && data.error === 'checkout_restart_allowed') cookies.delete('mm_checkout', { path: '/session' });
    const closed = path.endsWith('/checkout-cancel') && response.ok && data.restart_allowed === true && data.id === path.split('/')[3] && data.status === 'failed';
    if (closed) {
      let recovered: CheckoutStatusRequest = {}; try { recovered = JSON.parse(cookies.get('mm_checkout') || '{}'); } catch {}
      if (recovered.idempotency_key && recovered.idempotency_key === receiptCredential?.idempotency_key) cookies.delete('mm_checkout', { path: '/session' });
      cookies.delete(receiptCookie, { path: '/session' });
    }
    if (response.ok && receiptCookie && data.status === 'confirmed') cookies.delete('mm_checkout', { path: '/session' });
    if (response.ok && receiptCookie && receiptCredential && !closed) {
      const existing = cookies.getAll().filter(c => c.name.startsWith('mm_receipt_') && c.name !== receiptCookie);
      for (const c of existing.slice(0, Math.max(0, existing.length - 9))) cookies.delete(c.name, { path: '/session' });
      cookies.set(receiptCookie, JSON.stringify(receiptCredential), { path: '/session', httpOnly: true, secure: url.protocol === 'https:', sameSite: 'strict', maxAge: 60 * 60 * 24 * 30 });
    }
    if (response.ok && path === '/v1/auth/me' && access) {
      const options = { path: '/', httpOnly: true, secure: url.protocol === 'https:', sameSite: 'strict' as const };
      const refresh = cookies.get('mm_refresh');
      cookies.delete('mm_access', { path: '/session' }); cookies.delete('mm_refresh', { path: '/session' });
      cookies.set('mm_access', access, { ...options, maxAge: 900 });
      if (refresh) cookies.set('mm_refresh', refresh, { ...options, maxAge: 86400 * 30 });
    }
    if (path.endsWith('/logout')) clear();
    if (path.endsWith('/refresh') && [400, 401, 403].includes(response.status)) clear();
    if (response.ok && ['/v1/auth/login', '/v1/auth/register', '/v1/auth/refresh'].includes(path) && data.access_token && data.refresh_token) {
      cookies.delete('mm_access', { path: '/session' }); cookies.delete('mm_refresh', { path: '/session' });
      const options = { path: '/', httpOnly: true, secure: url.protocol === 'https:', sameSite: 'strict' as const };
      cookies.set('mm_access', data.access_token, { ...options, maxAge: Math.max(1, Math.min(3600, Math.floor((Date.parse(data.access_expires_at || '') - Date.now()) / 1000) || 900)) });
      cookies.set('mm_refresh', data.refresh_token, { ...options, maxAge: 60 * 60 * 24 * 30 });
      data.access_token = 'cookie-session'; data.refresh_token = 'cookie-session';
    }
    return json(data, { status: response.status === 204 ? 200 : response.status, headers: { 'Cache-Control': 'no-store' } });
  } catch (error) { if (error && typeof error === 'object' && 'status' in error && error.status === 413) return json({ error: 'invalid_input' }, { status: 413 }); return json({ error: 'unavailable', message: 'The room is temporarily unavailable.' }, { status: 503, headers: { 'Cache-Control': 'no-store' } }); }
};
export const GET = handle;
export const POST = handle;
export const PUT = handle;
