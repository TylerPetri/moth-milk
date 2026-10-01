import type { ApiFailure } from './types/api.ts';
function failure(value: unknown): Partial<ApiFailure> {
 return typeof value === 'object' && value !== null ? value as Partial<ApiFailure> : {};
}
export function isUnavailable(thrown: unknown) {
  const error = failure(thrown);
  return Boolean(error?.retryable || error?.name === 'TypeError' || error?.name === 'TimeoutError' || (error.status ?? 0) >= 500 || [408, 429].includes(error.status ?? 0));
}
export function friendlyError(thrown: unknown, fallback = 'Something’s wrong on our end. Please come back a little later.') {
  if (isUnavailable(thrown)) return fallback;
  const error = failure(thrown);
  const messages: Record<string, string> = {
    insufficient_stock: 'One of your things is no longer in stock. Check your bag before continuing.',
    email_unverified: 'Check your email before viewing your orders.',
    invalid_credentials: 'That email and password did not match. Try again.',
    rate_limited: 'Please wait a moment before trying again.',
    not_found: 'We could not find that item. Please check again or return to the shop.'
  };
  return messages[error.code || ''] || fallback;
}
/** Retry reads on return/reconnection, without a background polling loop.
 * @param {() => unknown} recover
 */
export function watchRecovery(recover: () => unknown) {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const schedule = () => {
    if (document.visibilityState === 'hidden' || !navigator.onLine) return;
    clearTimeout(timer); timer = setTimeout(() => { void recover(); }, 400);
  };
  window.addEventListener('online', schedule);
  window.addEventListener('focus', schedule);
  document.addEventListener('visibilitychange', schedule);
  return () => { clearTimeout(timer); window.removeEventListener('online', schedule); window.removeEventListener('focus', schedule); document.removeEventListener('visibilitychange', schedule); };
}

export function accountError(thrown: unknown, action: string) {
  const error = failure(thrown);
  if (isUnavailable(error)) return 'Something’s wrong on our end tonight. Come back a little later.';
  if (action === 'register' && ['already_exists', 'email_exists'].includes(error.code || '')) return 'Already in the books. Sign in, or send yourself a reset note.';
  if (action === 'sign-in' && ['unauthorized', 'invalid_credentials'].includes(error.code || '')) return 'That email and password don’t match. Try them once more, or send yourself a reset note.';
  if (['rate_limited'].includes(error.code || '') || error?.status === 429) return 'A little too fast. Give it a moment, then try again.';
  if (['reset', 'verify'].includes(action) && ['invalid_input', 'invalid_token', 'expired_token', 'not_found', 'unauthorized'].includes(error.code || '')) return 'That note has expired or already been used. Ask for a fresh one in Your Corner.';
  return friendlyError(error, 'We couldn’t open the book just now. Please try again a little later.');
}
export function accountValidation(email: string, password: string, action: string) {
  if (action !== 'reset' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return 'That email looks a little off. Check it once more.';
  if (action === 'recover') return '';
  if (!password) return 'Your password is missing. Add it to open the book.';
  if (['register', 'reset'].includes(action) && Array.from(password).length < 8) return 'A little longer, please. Your password needs at least 8 characters.';
  if (new TextEncoder().encode(password).length > 72) return 'That password is a little too long. Try a shorter one—up to 72 plain letters, numbers or symbols.';
  return '';
}
