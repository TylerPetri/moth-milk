// @ts-nocheck
let stripePromise;
export function loadStripe() {
  if (typeof window === 'undefined') return Promise.reject(new Error('Checkout is available in the browser.'));
  if (!import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY) return Promise.reject(new Error('Stripe publishable key is not configured.'));
  stripePromise ||= new Promise((resolve, reject) => {
    const ready = () => {
      if (window.Stripe) resolve(window.Stripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY));
      else reject(new Error('Stripe could not load.'));
    };
    if (window.Stripe) return ready();
    const script = document.createElement('script');
    script.src = 'https://js.stripe.com/v3/'; script.async = true;
    script.onload = ready; script.onerror = () => reject(new Error('Secure payment could not load.'));
    document.head.appendChild(script);
  }).catch((error) => { stripePromise = null; throw error; });
  return stripePromise;
}
