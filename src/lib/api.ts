import { isShopId } from './customer-contract.ts';
import type { ApiOptions, ApiResponseFor, ApiErrorResponse } from './types/api.ts';
import { browser } from '$app/environment';

const base = (import.meta.env.PUBLIC_API_URL || '').replace(/\/$/, '');
let shopPromise: Promise<string> | undefined;
export const configured = Boolean(import.meta.env.PUBLIC_API_URL || browser);

export async function shopId() {
  if (import.meta.env.PUBLIC_SHOP_ID) { if (!isShopId(import.meta.env.PUBLIC_SHOP_ID)) throw new Error('The shop is not configured.'); return import.meta.env.PUBLIC_SHOP_ID.toLowerCase(); }
  if (!browser) throw new Error('The shop is not configured.');
  shopPromise ||= fetch('/session/v1/auth/storefront', { signal: AbortSignal.timeout(15000) })
    .then(async (response) => { if (!response.ok) throw Object.assign(new Error('This room has not been linked to a shop yet.'), { status: response.status, retryable: response.status >= 500 }); const shop = (await response.json()).shop_id; if (!isShopId(shop)) throw new Error('This room has not been linked to a shop yet.'); return shop.toLowerCase(); })
    .catch((error) => { shopPromise = undefined; throw error; });
  return shopPromise;
}

export async function api<Path extends string>(path: Path, options: ApiOptions = {}): Promise<ApiResponseFor<Path>> {
  const { token, noShop, timeoutMs = 20000, ...request } = options;
  try {
    const headers = new Headers(request.headers);
    if (!noShop) headers.set('X-Shop-ID', await shopId());
    if (token) headers.set('Authorization', `Bearer ${token}`);
    if (request.body) headers.set('Content-Type', 'application/json');
    const signal = request.signal ? AbortSignal.any([request.signal, AbortSignal.timeout(timeoutMs)]) : AbortSignal.timeout(timeoutMs);
    const response = await fetch(`${browser && (path.startsWith('/v1/auth/') || path.endsWith('/checkout-status') || path.endsWith('/checkout-cancel') || path.endsWith('/checkout-resume') || path.startsWith('/v1/checkouts') || path === '/v1/orders/prepare' || path === '/v1/orders' || token) ? '/session' : base}${path}`, { ...request, headers, signal });
    const result: unknown = response.status === 204 ? {} : await response.json().catch(() => {
      if (response.ok) throw Object.assign(new Error('The shop response was incomplete.'), { retryable: true });
      return {};
    });
    if (!response.ok) {
      const failure = result as Partial<ApiErrorResponse>;
      throw Object.assign(new Error(failure.message || failure.error || `Request failed (${response.status})`), { status: response.status, code: failure.error, requestId: failure.request_id, retryable: response.status >= 500 || [408, 429].includes(response.status) });
    }
    return result as ApiResponseFor<Path>;
  } catch (error) {
    if (request.signal?.aborted) throw error;
    if (error instanceof TypeError || (error instanceof Error && error.name === 'TimeoutError')) throw Object.assign(new Error('Something’s wrong on our end. Please try again in a moment.'), { retryable: true });
    throw error;
  }
}
