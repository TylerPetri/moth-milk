// @ts-nocheck
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { friendlyError, isUnavailable } from '../src/lib/recovery.js';
test('server and network details never appear in outage messages', () => {
 for (const error of [{ status: 503, message: 'private database password' }, new TypeError('Failed to fetch'), { name: 'TimeoutError' }]) {
   assert.equal(isUnavailable(error), true);
   assert.equal(friendlyError(error), 'Something’s wrong on our end. Please try again in a moment.');
 }
});
test('actionable stock errors differ from temporary outages', () => {
 assert.equal(isUnavailable({ status: 409, code: 'insufficient_stock' }), false);
 assert.match(friendlyError({ status: 409, code: 'insufficient_stock' }), /no longer in stock/);
 assert.doesNotMatch(friendlyError({ status: 422, message: 'internal stack trace' }), /stack/);
});
