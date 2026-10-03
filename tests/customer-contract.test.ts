import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isShopId, validCustomer, validCustomerSession } from '../src/lib/customer-contract.ts';
import { coordinatedRefresh } from '../src/lib/server/refresh.ts';
const a = '11111111-1111-4111-8111-111111111111';
const b = '55555555-5555-4555-8555-555555555555';
const customer = { shop_id: a, user_id: 'customer-a', email: 'same@example.test', email_verified: true, identity_kind: 'customer', roles: ['customer'] };
test('same email does not confer identity across shops or operator roles', () => {
 assert.equal(validCustomer(customer, a, true), true);
 assert.equal(validCustomer(customer, b, true), false);
 assert.equal(validCustomer({ ...customer, shop_id: b, user_id: 'customer-b' }, b, true), true);
 assert.equal(validCustomer({ ...customer, roles: ['platform_admin'] }, a, true), false);
 assert.equal(validCustomer({ ...customer, identity_kind: 'dashboard' }, a, true), false);
 assert.equal(isShopId('00000000-0000-0000-0000-000000000000'), false);
 assert.equal(isShopId(undefined), false);
});
test('sessions must match shop and contain unexpired customer credentials', () => {
 const session = { ...customer, access_token: 'access', refresh_token: 'refresh', access_expires_at: new Date(Date.now() + 60000).toISOString() };
 assert.equal(validCustomerSession(session, a), true);
 assert.equal(validCustomerSession(session, b), false);
 assert.equal(validCustomerSession({ ...session, identity_kind: 'dashboard' }, a), false);
 assert.equal(validCustomerSession({ ...session, access_expires_at: 'bad' }, a), false);
});
test('overlapping refresh rotation happens once and result mutation is isolated', async () => {
 let finish!: (value: { status: number; data: Record<string, unknown> }) => void;
 let calls = 0;
 const renew = () => { calls++; return new Promise<{ status: number; data: Record<string, unknown> }>(resolve => { finish = resolve; }); };
 const first = coordinatedRefresh(a, 'private-token', renew);
 const second = coordinatedRefresh(a, 'private-token', renew);
 finish({ status: 200, data: { access_token: 'secret' } });
 const [one, two] = await Promise.all([first, second]);
 assert.equal(calls, 1); one.data.access_token = 'cookie-session'; assert.equal(two.data.access_token, 'secret');
 await coordinatedRefresh(a, 'private-token', async () => { calls++; return { status: 401, data: {} }; });
 assert.equal(calls, 2);
});
