import { test } from 'node:test';
import assert from 'node:assert/strict';
import { receiptGroup, receiptLabel } from '../src/lib/receipt-history.ts';
test('closed and terminal attempts belong to history without active payment actions', () => {
  for (const status of ['failed', 'cancelled', 'expired', 'refunded'] as const) assert.equal(receiptGroup({ status }), 'history');
  assert.equal(receiptGroup({ status: 'reserved', checkout_state: 'closed' }), 'history');
  assert.equal(receiptLabel({ status: 'failed', checkout_state: 'closed' }), 'This checkout is closed.');
});
test('uncertain payment and refund progress remain current even after an order fails', () => {
  for (const checkout_state of ['processing', 'payment_received', 'refund_pending', 'recovery_pending']) assert.equal(receiptGroup({ status: 'failed', checkout_state }), 'current');
  assert.equal(receiptGroup({ status: 'paid' }), 'current');
  assert.equal(receiptGroup({}), 'current');
});
test('packing and shipping remain current; completed purchases and delivered shipments are history', () => {
  for (const status of ['pending', 'packed', 'shipped', 'in_transit']) assert.equal(receiptGroup({ status: 'confirmed', shipment: { status } }), 'current');
  assert.equal(receiptGroup({ status: 'confirmed', shipment: { status: 'delivered' } }), 'history');
  assert.equal(receiptGroup({ status: 'confirmed' }), 'history');
  assert.equal(receiptLabel({ status: 'confirmed', shipment: { status: 'delivered' } }), 'Your things have arrived.');
});
