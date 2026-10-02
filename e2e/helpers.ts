// @ts-nocheck
import { test as base, expect } from '@playwright/test';
export { expect };
export const orderId = '22222222-2222-4222-8222-222222222222';
export const key = '33333333-3333-4333-8333-333333333333';
export const item = { slug: 'mimi-plush', name: 'Mimi Moth Plush', selectedSize: 'One soft size', price: 42, lineId: 'purchased-line', image: '/images/mimi-plush.webp', color: 'Sleepy charcoal', sizes: ['One soft size'] };
export const body = { idempotency_key: key, customer_email: 'reader@example.test', customer_name: 'June Reader', currency: 'CAD', shipping: { line1: '12 Moon Street', city: 'Montreal', state: 'QC', postal_code: 'H2H2H2', country: 'CA' }, items: [{ product_id: 'plush-id', quantity: 1 }] };
export const pending = { id: orderId, idempotency_key: key, body, items: [item], total: 4200, currency: 'CAD', paymentSubmitted: true };
export const receipt = { ...pending, status: 'confirmed', confirmedAt: '2026-09-30T20:00:00Z' };
export const products = [
 { id: 'plush-id', is_active: true, amount: 4200, currency: 'CAD', attributes: { style_slug: 'mimi-plush', size: 'One soft size' } },
 { id: 'hoodie-id', is_active: true, amount: 11800, currency: 'CAD', attributes: { style_slug: 'night-shift-hoodie', size: 'XS' } },
 { id: 'tee-id', is_active: true, amount: 5400, currency: 'CAD', attributes: { style_slug: 'after-hours-baby-tee', size: 'XS' } }
];
export async function seed(page, entries) {
 await page.addInitScript(values => {
   if (sessionStorage.getItem('e2e-seeded')) return;
   for (const [name, value] of Object.entries(values)) localStorage.setItem(name, JSON.stringify(value));
   sessionStorage.setItem('e2e-seeded', 'true');
 }, entries);
}
export const test = base.extend({
 app: async ({ page }, use) => {
   const state = { catalogDown: false, stockDown: false, statusDown: false, authDown: false, signedIn: false, prepareDown: false, prepareConflict: false, status: 'paid', shipment: null, shipmentUnavailable: false, prepares: [], confirms: 0, statusReads: [], activeReads: 0, maxActiveReads: 0, statusDelay: 0, prepareDelay: 0, abortStatus: false, authCalls: 0, stripeIntent: 'processing', orderItems: [{ product_id: 'plush-id' }] };
   await page.addInitScript(() => {
     // External Stripe boundary only. The real storefront and API client execute.
     window.Stripe = (publishableKey) => (window.__stripeKeys = [...(window.__stripeKeys || []), publishableKey], {
       elements: () => ({ submit: async () => ({}), create: () => { let destroyed = false; return { mount: node => { if (destroyed) throw new Error('This Element has already been destroyed'); node.textContent = 'Secure card fixture'; }, destroy() { if (destroyed) throw new Error('This Element has already been destroyed'); destroyed = true; } }; } }),
       retrievePaymentIntent: async () => ({ paymentIntent: { status: window.__stripeIntent || 'processing' } }),
       confirmPayment: async () => { window.__confirms = (window.__confirms || 0) + 1; if (window.__holdConfirm) await new Promise(resolve => { window.__releaseConfirm = resolve; }); if (window.__stripeNetworkFailure) throw new TypeError('Connection lost'); return {}; }
     });
   });
   const errors = []; page.on('pageerror', error => errors.push(error.message));
   const handleApi = async route => {
     const path = new URL(route.request().url()).pathname.replace(/^\/session/, '');
     const json = (value, status = 200) => route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(value) });
     const down = () => json({ error: 'database_internal', message: 'PRIVATE database unreachable' }, 503);
     if (path === '/v1/auth/receipt' || path === '/v1/auth/receipts/forget') return json({ ok: true });
     if (path === '/v1/auth/register') return json({ error: 'already_exists', message: 'PRIVATE database email collision' }, 409);
     if (path === '/v1/auth/login') return json({ error: 'unauthorized', message: 'PRIVATE authentication detail' }, 401);
     if (path === '/v1/checkouts/query' || path === '/v1/checkouts') return json({ checkouts: state.checkoutList || [], count: (state.checkoutList || []).length });
     if (path.endsWith('/checkout-resume')) { state.resumes ||= []; state.resumes.push(route.request().postDataJSON()); return json({ id: orderId, total: 4200, status: 'reserved', payment_client_secret: 'fixture_secret', publishable_key: 'pk_test_saved_profile' }); }
     if (path === '/v1/auth/recovery') return json({ body: null });
     if (path === '/v1/products') return state.catalogDown ? down() : json({ products });
     if (path.startsWith('/v1/stock/')) return state.stockDown ? down() : json({ available: 20 });
     if (path.endsWith('/checkout-cancel')) { state.cancelCalls ||= []; state.cancelCalls.push(route.request().postDataJSON()); if (state.cancelWait) await state.cancelWait; return state.cancelDown ? down() : state.cancelRefused ? json({ error: 'checkout_recovery_pending', message: 'PRIVATE payment processing', request_id: 'recovery-reference-123' }, 409) : json({ id: orderId, status: 'failed', restart_allowed: !state.cancelInvalid }); }
     if (path.endsWith('/checkout-status')) {
       state.statusReads.push(route.request().postDataJSON()); state.activeReads++; state.maxActiveReads = Math.max(state.maxActiveReads, state.activeReads);
       try { if (state.abortStatus) return await route.abort('connectionfailed'); if (state.statusDelay) await new Promise(r => setTimeout(r, state.statusDelay)); return await (state.statusDown ? down() : json({ ...(state.checkoutSnapshot || {}), id: state.statusID || orderId, status: state.status, shipment: state.shipment, shipment_unavailable: state.shipmentUnavailable })); }
       finally { state.activeReads--; }
     }
     if (path === '/v1/orders/prepare') { state.prepares.push(route.request().postDataJSON()); if (state.prepareWait) await state.prepareWait; if (state.prepareDelay) await new Promise(r => setTimeout(r, state.prepareDelay)); return state.prepareConflict ? json({ error: state.restartAllowed ? 'checkout_restart_allowed' : 'conflict', message: 'PRIVATE backend signing secret' }, 409) : state.prepareDown ? down() : json({ id: orderId, total: 4200, status: 'reserved', payment_client_secret: 'fixture_secret' }, 202); }
     if (path === '/v1/auth/me' || path === '/v1/auth/refresh') { if (!state.signedIn) return json({ error: 'unauthorized' }, 401); state.authCalls++; return state.authDown ? down() : path.endsWith('/refresh') ? json({ access_token: 'renewed', refresh_token: 'refresh', access_expires_at: '2099-01-01', user_id: 'reader', email_verified: true }) : json({ user_id: 'reader', email: 'reader@example.test', email_verified: true }); }
     if (path === '/v1/auth/me/books') return state.authDown ? down() : json({ books: ['static'] });
     if (path === '/v1/orders/claim') return state.authDown ? down() : json({ claimed: 1 });
     if (path.startsWith('/v1/users/')) return state.authDown ? down() : json({ orders: [{ status: 'confirmed', items: state.orderItems }] });
     throw new Error(`Unmocked API request: ${route.request().method()} ${path}`);
   };
   state.attach = target => target.route('**/v1/**', handleApi);
   await state.attach(page);
   await use(state);
   expect(errors, 'No uncaught browser errors').toEqual([]);
 }
});
export async function details(page) {
 await page.getByLabel('Email address').fill('reader@example.test');
 await page.getByLabel('First name').fill('June'); await page.getByLabel('Last name').fill('Reader');
 await page.getByLabel('Street address').fill('12 Moon Street'); await page.getByLabel('City', { exact: true }).fill('Montreal');
 await page.getByLabel('Province / region').fill('QC'); await page.getByLabel('Postal code').fill('H2H2H2');
}
