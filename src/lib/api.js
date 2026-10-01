import { browser } from '$app/environment';

const base = (import.meta.env.PUBLIC_API_URL || '').replace(/\/$/, '');
/** @type {Promise<string> | undefined} */
let shopPromise;
export const configured = Boolean(import.meta.env.PUBLIC_API_URL || browser);

export async function shopId() {
  if (import.meta.env.PUBLIC_SHOP_ID) return import.meta.env.PUBLIC_SHOP_ID;
  if (!browser) throw new Error('The shop is not configured.');
  shopPromise ||= fetch(`${base}/v1/auth/storefront?host=${encodeURIComponent(location.host)}`, { signal: AbortSignal.timeout(15000) })
    .then(async (response) => { if (!response.ok) throw Object.assign(new Error('This room has not been linked to a shop yet.'), { status: response.status, retryable: response.status >= 500 }); return (await response.json()).shop_id; })
    .catch((error) => { shopPromise = undefined; throw error; });
  return shopPromise;
}

/**
 * @template {string} Path
 * @param {Path} path
 * @param {import('./types/api.js').ApiOptions} [options]
 * @returns {Promise<import('./types/api.js').ApiResponseFor<Path>>}
 */
export async function api(path, options = {}) {
  const { token, noShop, timeoutMs = 20000, ...request } = options;
  try {
    const headers = new Headers(request.headers);
    if (!noShop) headers.set('X-Shop-ID', await shopId());
    if (token) headers.set('Authorization', `Bearer ${token}`);
    if (request.body) headers.set('Content-Type', 'application/json');
    const signal = request.signal ? AbortSignal.any([request.signal, AbortSignal.timeout(timeoutMs)]) : AbortSignal.timeout(timeoutMs);
    const response = await fetch(`${browser && (path.startsWith('/v1/auth/') || path.endsWith('/checkout-status') || path === '/v1/orders/prepare' || path === '/v1/orders' || token) ? '/session' : base}${path}`, { ...request, headers, signal });
    const result = response.status === 204 ? {} : await response.json().catch(() => {
      if (response.ok) throw Object.assign(new Error('The shop response was incomplete.'), { retryable: true });
      return {};
    });
    if (!response.ok) throw Object.assign(new Error(result.message || result.error || `Request failed (${response.status})`), { status: response.status, code: result.error, retryable: response.status >= 500 || [408, 429].includes(response.status) });
    return result;
  } catch (error) {
    if (request.signal?.aborted) throw error;
    if (error instanceof TypeError || (error instanceof Error && error.name === 'TimeoutError')) throw Object.assign(new Error('Something’s wrong on our end. Please try again in a moment.'), { retryable: true });
    throw error;
  }
}
