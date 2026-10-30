import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validatePublicConfig } from '../scripts/public-config.ts';

test('accepts documented public configuration and private backend secrets', () => {
  validatePublicConfig({ PUBLIC_API_URL: 'http://localhost:8080', PUBLIC_SHOP_ID: '11111111-1111-4111-8111-111111111111', PUBLIC_PAYMENT_MODE: 'stripe', PUBLIC_STRIPE_PUBLISHABLE_KEY: 'pk_test_fixture', API_ORIGIN: 'https://backend.example', STRIPE_SECRET_KEY: 'private' });
  validatePublicConfig({ PUBLIC_API_URL: '' });
});
test('rejects accidental public backend credentials and receipt capabilities without echoing values', () => {
  for (const name of ['PUBLIC_API_KEY', 'PUBLIC_RECEIPT_PROOF', 'PUBLIC_STRIPE_SECRET_KEY']) {
    assert.throws(() => validatePublicConfig({ [name]: 'sensitive-value' }), error => error instanceof Error && !error.message.includes('sensitive-value'));
  }
  for (const value of ['https://user:password@example.com', 'https://example.com?proof=secret', 'https://example.com/#proof=secret', 'https://example.com/private', 'file:///etc/passwd']) assert.throws(() => validatePublicConfig({ PUBLIC_API_URL: value }));
  assert.throws(() => validatePublicConfig({ PUBLIC_STRIPE_PUBLISHABLE_KEY: 'sk_test_fixture' }));
  assert.throws(() => validatePublicConfig({ PUBLIC_SHOP_ID: 'receipt-proof' }));
});
