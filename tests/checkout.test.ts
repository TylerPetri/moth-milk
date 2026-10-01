// @ts-nocheck — Node test harness uses isolated browser storage doubles.
import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { readSaved, writeSaved, saveReceipt, receipts, shipmentLabel, money } from '../src/lib/checkout.ts';
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
