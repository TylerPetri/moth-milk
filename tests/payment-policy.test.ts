import { test } from 'node:test';
import assert from 'node:assert/strict';
import { assertPaymentEnvironment } from '../src/lib/payment-policy.ts';
import { validatePublicConfig } from '../scripts/public-config.ts';
test('test/live mode cannot be switched by a backend publishable key', () => {
 for (const mode of ['test', 'live']) {
  assert.doesNotThrow(() => assertPaymentEnvironment(`pk_${mode}_configured`, `pk_${mode}_saved_account`));
  assert.throws(() => assertPaymentEnvironment(`pk_${mode}_configured`, `pk_${mode === 'test' ? 'live' : 'test'}_unexpected`));
 }
 assert.throws(() => assertPaymentEnvironment('pk_test_configured', 'sk_test_not_publishable'));
});
test('stub mode rejects public remote backends and live keys', () => {
 assert.doesNotThrow(() => validatePublicConfig({ PUBLIC_PAYMENT_MODE: 'stub', PUBLIC_API_URL: 'http://127.0.0.1:4174' }));
 assert.throws(() => validatePublicConfig({ PUBLIC_PAYMENT_MODE: 'stub', PUBLIC_API_URL: 'https://commerce.example' }));
 assert.throws(() => validatePublicConfig({ PUBLIC_PAYMENT_MODE: 'stub', PUBLIC_STRIPE_PUBLISHABLE_KEY: 'pk_live_fixture' }));
});
