/** @param {any} error */
export function isUnavailable(error) {
  return Boolean(error?.retryable || error?.name === 'TypeError' || error?.name === 'TimeoutError' || error?.status >= 500 || [408, 429].includes(error?.status));
}
/** @param {any} error @param {string} [fallback] */
export function friendlyError(error, fallback = 'Something’s wrong on our end. Please try again in a moment.') {
  if (isUnavailable(error)) return fallback;
  /** @type {Record<string, string>} */
  const messages = {
    insufficient_stock: 'One of your things is no longer in stock. Check your bag before continuing.',
    email_unverified: 'Check your email before viewing your orders.',
    invalid_credentials: 'That email and password did not match. Try again.',
    rate_limited: 'Please wait a moment before trying again.',
    not_found: 'We could not find that item. Please check again or return to the shop.'
  };
  return messages[error?.code] || (error?.status ? 'We could not complete that request. Please try again.' : error?.message || fallback);
}
/** Retry reads on return/reconnection, without a background polling loop.
 * @param {() => unknown} recover
 */
export function watchRecovery(recover) {
  /** @type {ReturnType<typeof setTimeout> | undefined} */
  let timer;
  const schedule = () => {
    if (document.visibilityState === 'hidden' || !navigator.onLine) return;
    clearTimeout(timer); timer = setTimeout(() => { void recover(); }, 400);
  };
  window.addEventListener('online', schedule);
  window.addEventListener('focus', schedule);
  document.addEventListener('visibilitychange', schedule);
  return () => { clearTimeout(timer); window.removeEventListener('online', schedule); window.removeEventListener('focus', schedule); document.removeEventListener('visibilitychange', schedule); };
}
