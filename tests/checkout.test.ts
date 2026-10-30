// @ts-nocheck — Node test harness uses isolated browser storage doubles.
import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { readSaved, writeSaved, saveReceipt, receipts, shipmentLabel, money, checkoutAttempts, saveCheckoutAttempt, removeCheckoutAttempt } from '../src/lib/checkout.ts';
function storage() { const data = new Map(); return { getItem: key => data.get(key) || null, setItem: (key, value) => data.set(key, value), removeItem: key => data.delete(key) }; }
beforeEach(() => { globalThis.localStorage = storage(); globalThis.sessionStorage = storage(); });
test('recovers legacy session checkout and migrates on save', () => {
  sessionStorage.setItem('checkout', JSON.stringify({ idempotency_key: 'key', body: { customer_email: 'a@b.c' } }));
  const saved = readSaved('checkout'); writeSaved('checkout', saved);
  assert.equal(readSaved('checkout').body.customer_email, 'a@b.c');
  assert.equal(sessionStorage.getItem('checkout'), null);
});
test('malformed storage does not crash recovery', () => { localStorage.setItem('checkout', '{'); assert.equal(readSaved('checkout'), null); });
test('confirmed receipts remain available after pending checkout is cleared', () => {
  writeSaved('checkout', { id: 'one' });
  saveReceipt({ id: 'one', idempotency_key: 'key', total: 4200, items: [{ name: 'Mimi' }] });
  writeSaved('checkout', null);
  assert.equal(receipts()[0].items[0].name, 'Mimi'); assert.equal(receipts()[0].total, 4200);
  saveReceipt({ ...receipts()[0], shipment: { status: 'shipped' } });
  assert.equal(receipts().length, 1); assert.equal(receipts()[0].shipment.status, 'shipped');
});
test('blocked persistent storage falls back to session', () => { globalThis.localStorage = { getItem() { throw Error(); }, setItem() { throw Error(); }, removeItem() { throw Error(); } }; assert.equal(writeSaved('checkout', { id: 'one' }), true); assert.equal(JSON.parse(sessionStorage.getItem('checkout')).id, 'one'); });
test('shipping labels and money do not imply shipment before fulfillment', () => { assert.match(shipmentLabel(undefined), /not started/); assert.match(shipmentLabel('in_transit'), /on their way/); assert.match(money(4200, 'USD'), /42\.00/); });

test('both blocked storage implementations report persistence failure', () => {
 const blocked = { getItem() { throw Error(); }, setItem() { throw Error(); }, removeItem() { throw Error(); } };
 globalThis.localStorage = blocked; globalThis.sessionStorage = blocked;
 assert.equal(writeSaved('checkout', { id: 'one' }), false);
 assert.throws(() => saveReceipt({ id: 'one', idempotency_key: 'key' }), /could not save the receipt/);
});

test('confirmed receipt storage excludes contact data and bearer credentials', () => {
 saveReceipt({ id: 'one', idempotency_key: 'SECRET_KEY', tracking_proof: 'SECRET_PROOF', body: { shipping: { line1: 'PRIVATE_ADDRESS' }, customer_email: 'PRIVATE_EMAIL' }, customer_email: 'PRIVATE_EMAIL', items: [{ name: 'Mimi' }] });
 const stored = localStorage.getItem('moth-milk-receipts');
 for (const secret of ['SECRET_KEY', 'SECRET_PROOF', 'PRIVATE_ADDRESS', 'PRIVATE_EMAIL']) assert.equal(stored.includes(secret), false);
});
test('drafts expire but uncertain payments retain their recovery marker', () => {
 localStorage.setItem('moth-milk-checkout-details', JSON.stringify({ savedAt: Date.now() - 90000000, customer_email: 'private@example.test' }));
 assert.equal(readSaved('moth-milk-checkout-details'), null);
 writeSaved('moth-milk-pending-checkout', { id: 'one', idempotency_key: 'key', paymentSubmitted: true, body: { customer_email: 'private@example.test', shipping: { line1: 'PRIVATE_ADDRESS' } } });
 assert.equal(localStorage.getItem('moth-milk-pending-checkout').includes('PRIVATE_ADDRESS'), false);
 assert.equal(readSaved('moth-milk-pending-checkout').paymentSubmitted, true);
 assert.equal(readSaved('moth-milk-pending-checkout').body.shipping.line1, 'PRIVATE_ADDRESS');
});

test('ongoing attempts migrate active checkout and never archive contact details', () => {
 writeSaved('moth-milk-pending-checkout', { id: 'one', idempotency_key: 'key-one', body: { customer_email: 'PRIVATE_EMAIL', shipping: { line1: 'PRIVATE_ADDRESS' } }, items: [] });
 assert.equal(checkoutAttempts()[0].id, 'one');
 saveCheckoutAttempt({ id: 'two', idempotency_key: 'key-two', body: { customer_name: 'PRIVATE_NAME' }, items: [] });
 const stored = localStorage.getItem('moth-milk-checkout-attempts');
 for (const secret of ['PRIVATE_EMAIL', 'PRIVATE_ADDRESS', 'PRIVATE_NAME']) assert.equal(stored.includes(secret), false);
 assert.equal(checkoutAttempts().length, 2);
 removeCheckoutAttempt('one'); writeSaved('moth-milk-pending-checkout', null);
 assert.equal(checkoutAttempts().length, 1);
});

test('removing another attempt never archives the active checkout contact details', () => {
 writeSaved('moth-milk-pending-checkout', { id: 'one', idempotency_key: 'key-one', body: { customer_email: 'PRIVATE_EMAIL', shipping: { line1: 'PRIVATE_ADDRESS' } }, items: [] });
 removeCheckoutAttempt('two');
 const stored = localStorage.getItem('moth-milk-checkout-attempts');
 assert.equal(stored.includes('PRIVATE_EMAIL'), false); assert.equal(stored.includes('PRIVATE_ADDRESS'), false);
 assert.equal(checkoutAttempts()[0].id, 'one');
});

test('legacy contact fingerprints migrate without changing recovery credentials or payment state', async () => {
 const { checkoutFingerprint, migrateCheckoutFingerprints } = await import('../src/lib/checkout.ts');
 const fingerprint = JSON.stringify({ name: 'PRIVATE_NAME', email: 'private@example.test', shipping: { line1: 'PRIVATE_ADDRESS' } });
 for (const storage of [localStorage, sessionStorage]) {
  for (const key of ['moth-milk-pending-checkout', 'moth-milk-stub-checkout', 'moth-milk-checkout-attempts']) {
   const value = { id: 'one', idempotency_key: 'original-key', paymentSubmitted: true, fingerprint };
   storage.setItem(key, JSON.stringify(key.endsWith('attempts') ? [value] : value));
  }
 }
 await migrateCheckoutFingerprints();
 for (const storage of [localStorage, sessionStorage]) {
  for (const key of ['moth-milk-pending-checkout', 'moth-milk-stub-checkout', 'moth-milk-checkout-attempts']) {
   const raw = storage.getItem(key); assert.equal(raw.includes('PRIVATE_'), false);
   const value = key.endsWith('attempts') ? JSON.parse(raw)[0] : JSON.parse(raw);
   assert.equal(value.fingerprint, await checkoutFingerprint(fingerprint));
   assert.equal(value.idempotency_key, 'original-key'); assert.equal(value.paymentSubmitted, true);
  }
 }
});

test('fingerprint migration never overwrites recovery saved during asynchronous hashing', async () => {
 const { migrateCheckoutFingerprints } = await import('../src/lib/checkout.ts');
 const key = 'moth-milk-pending-checkout';
 localStorage.setItem(key, JSON.stringify({ idempotency_key: 'old', fingerprint: 'legacy-contact' }));
 const original = crypto.subtle.digest;
 crypto.subtle.digest = async function (...args) {
  localStorage.setItem(key, JSON.stringify({ idempotency_key: 'new', paymentSubmitted: true }));
  return original.apply(this, args);
 };
 try { await migrateCheckoutFingerprints(); }
 finally { crypto.subtle.digest = original; }
 assert.deepEqual(JSON.parse(localStorage.getItem(key)), { idempotency_key: 'new', paymentSubmitted: true });
});
