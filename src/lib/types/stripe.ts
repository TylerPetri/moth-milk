// Use Stripe's maintained types while loading its script through our existing loader.
export type {
  Stripe as StripeClient,
  StripeElements,
  StripePaymentElement as PaymentElement
} from '@stripe/stripe-js';
