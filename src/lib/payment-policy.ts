// A backend key may select another account in the same environment, never switch test/live.
export function assertPaymentEnvironment(configuredKey: string | undefined, effectiveKey: string | undefined) {
  const mode = (key: string | undefined) => key?.match(/^pk_(test|live)_/)?.[1];
  if (!mode(effectiveKey) || (mode(configuredKey) && mode(configuredKey) !== mode(effectiveKey))) {
    throw Object.assign(new Error('Payment environment does not match this storefront. Your checkout is saved; please contact the shop before trying again.'), { code: 'payment_environment_mismatch', retryable: true });
  }
}
export function isLoopback(hostname: string) {
  return ['localhost', '127.0.0.1', '[::1]'].includes(hostname);
}
