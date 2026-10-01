// @ts-nocheck
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { friendlyError, isUnavailable, accountError, accountValidation } from '../src/lib/recovery.js';
test('server and network details never appear in outage messages', () => {
 for (const error of [{ status: 503, message: 'private database password' }, new TypeError('Failed to fetch'), { name: 'TimeoutError' }]) {
   assert.equal(isUnavailable(error), true);
   assert.equal(friendlyError(error), 'Something’s wrong on our end. Please come back a little later.');
 }
});
test('actionable stock errors differ from temporary outages', () => {
 assert.equal(isUnavailable({ status: 409, code: 'insufficient_stock' }), false);
 assert.match(friendlyError({ status: 409, code: 'insufficient_stock' }), /no longer in stock/);
 assert.doesNotMatch(friendlyError({ status: 422, message: 'internal stack trace' }), /stack/);
});

test('unknown exceptions and backend conflicts cannot leak internal messages', () => { for (const error of [new Error('PRIVATE signing secret'), { status: 409, code: 'conflict', message: 'PRIVATE Stripe secret' }]) assert.equal(friendlyError(error), 'Something’s wrong on our end. Please come back a little later.'); });

test('account messages are actionable and preserve neutral login/reset responses', () => { assert.match(accountError({ code: 'already_exists' }, 'register'), /Already in the books/); assert.match(accountError({ code: 'unauthorized' }, 'sign-in'), /don’t match/); assert.match(accountValidation('a@b.test', 'short', 'register'), /8 characters/); assert.equal(accountValidation('a@b.test', 'short', 'sign-in'), ''); assert.doesNotMatch(accountError(new Error('PRIVATE'), 'verify'), /PRIVATE/); });
