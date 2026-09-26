import { browser } from '$app/environment';

const base = (import.meta.env.PUBLIC_API_URL || '').replace(/\/$/, '');
let shopPromise;
export const configured = Boolean(import.meta.env.PUBLIC_API_URL || browser);

export async function shopId() {
  if (import.meta.env.PUBLIC_SHOP_ID) return import.meta.env.PUBLIC_SHOP_ID;
  if (!browser) throw new Error('The shop is not configured.');
  shopPromise ||= fetch(`${base}/v1/auth/storefront?host=${encodeURIComponent(location.host)}`)
    .then(async (response) => { if (!response.ok) throw new Error('This room has not been linked to a shop yet.'); return (await response.json()).shop_id; })
    .catch((error) => { shopPromise = undefined; throw error; });
  return shopPromise;
}

/** @param {string} path @param {RequestInit & { token?: string, noShop?: boolean }} [options] */
export async function api(path, options = {}) {
  const { token, noShop, ...request } = options;
  const headers = new Headers(request.headers);
  if (!noShop) headers.set('X-Shop-ID', await shopId());
  if (token) headers.set('Authorization', `Bearer ${token}`);
  if (request.body) headers.set('Content-Type', 'application/json');
  const response = await fetch(`${base}${path}`, { ...request, headers });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw Object.assign(new Error(result.message || result.error || `Request failed (${response.status})`), { status: response.status, code: result.error });
  return result;
}
