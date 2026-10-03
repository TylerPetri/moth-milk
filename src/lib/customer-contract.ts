/** Customer identities are bound to one explicitly resolved storefront. */
export function isShopId(value: unknown): value is string {
  return typeof value === 'string' && /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(value) && value !== '00000000-0000-0000-0000-000000000000';
}
export function validCustomer(value: Record<string, unknown>, shop: string, account = false) {
  return isShopId(shop) && value.shop_id === shop && typeof value.user_id === 'string' && value.user_id.length > 0 && typeof value.email_verified === 'boolean'
    && (value.identity_kind === 'customer' || (!account && value.identity_kind === undefined))
    && (value.roles === undefined ? !account : Array.isArray(value.roles) && value.roles.length === 1 && value.roles[0] === 'customer');
}
export function validCustomerSession(value: Record<string, unknown>, shop: string) {
  return validCustomer(value, shop) && typeof value.access_token === 'string' && value.access_token.length > 0 && typeof value.refresh_token === 'string' && value.refresh_token.length > 0 && typeof value.access_expires_at === 'string' && Date.parse(value.access_expires_at) > Date.now();
}
