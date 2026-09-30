// @ts-nocheck
let stripePromise;
export function loadStripe() {
  if (typeof window === 'undefined') return Promise.reject(new Error('Checkout is available in the browser.'));
  if (!import.meta.env.PUBLIC_STRIPE_PUBLISHABLE_KEY) return Promise.reject(new Error('Stripe publishable key is not configured.'));
  stripePromise ||= new Promise((resolve, reject) => {
    const ready = () => {
      if (window.Stripe) resolve(window.Stripe(import.meta.env.PUBLIC_STRIPE_PUBLISHABLE_KEY));
      else reject(Object.assign(new Error('Secure card entry is temporarily unavailable.'), { retryable: true }));
    };
    if (window.Stripe) return ready();
    const script = document.createElement('script');
    script.src = 'https://js.stripe.com/v3/'; script.async = true;
    script.onload = ready; script.onerror = () => reject(Object.assign(new Error('Secure card entry is temporarily unavailable.'), { retryable: true }));
    document.head.appendChild(script);
  }).catch((error) => { stripePromise = null; throw error; });
  return stripePromise;
}
