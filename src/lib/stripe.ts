import type { StripeClient } from '$lib/types/stripe.ts';
const clients = new Map<string, Promise<StripeClient>>();
let scriptPromise: Promise<void> | undefined;
export function loadStripe(publishableKey = import.meta.env.PUBLIC_STRIPE_PUBLISHABLE_KEY) {
  if (typeof window === 'undefined') return Promise.reject(new Error('Checkout is available in the browser.'));
  if (!publishableKey || !/^pk_(test|live)_/.test(publishableKey)) return Promise.reject(new Error('Stripe publishable key is not configured.'));
  if (clients.has(publishableKey)) return clients.get(publishableKey)!;
  scriptPromise ||= new Promise<void>((resolve, reject) => {
    if (window.Stripe) return resolve();
    const script = document.createElement('script');
    script.src = 'https://js.stripe.com/v3/'; script.async = true;
    script.onload = () => window.Stripe ? resolve() : reject(new Error('Secure card entry is temporarily unavailable.'));
    script.onerror = () => reject(Object.assign(new Error('Secure card entry is temporarily unavailable.'), { retryable: true }));
    document.head.appendChild(script);
  }).catch(error => { scriptPromise = undefined; throw error; });
  const promise = scriptPromise.then(() => window.Stripe!(publishableKey)).catch(error => { clients.delete(publishableKey); throw error; });
  clients.set(publishableKey, promise);
  return promise;
}
