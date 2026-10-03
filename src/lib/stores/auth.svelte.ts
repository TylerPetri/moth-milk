import { failureStatus } from '$lib/errors.ts';
import { browser } from '$app/environment';
import type { SessionResponse, ApiOptions, ApiResponseFor } from '$lib/types/api.ts';
import { api, shopId } from '$lib/api.ts';

let revision = 0;
const key = 'moth-milk-session';
let initPending: Promise<void> | undefined;
let refreshPending: Promise<void> | undefined;
export const auth = $state({ ready: false, access: '', refresh: '', expires: 0, userId: '', email: '', verified: false });

function persist() { /* Tokens are held only in HttpOnly cookies. */ }
export function clearSession() {
  revision++;
  Object.assign(auth, { access: '', refresh: '', expires: 0, userId: '', email: '', verified: false, ready: true });
  if (browser) { try { sessionStorage.removeItem(key); } catch {} }
}
function accept(tokens: SessionResponse, email = auth.email) {
  revision++;
  Object.assign(auth, { access: tokens.access_token, refresh: tokens.refresh_token, expires: new Date(tokens.access_expires_at).getTime(), userId: tokens.user_id, email, verified: tokens.email_verified, ready: true });
  persist();
}
export async function initAuth() {
  if (auth.ready || !browser) return;
  initPending ||= (async () => {
    try {
      try { sessionStorage.removeItem(key); } catch {} // Remove legacy browser-readable tokens.
      let me;
      try { me = await api('/v1/auth/me'); }
      catch (error: unknown) { if (failureStatus(error) !== 401) throw error; await refreshSession(false); me = await api('/v1/auth/me'); }
      Object.assign(auth, { access: 'cookie-session', refresh: 'cookie-session', expires: Date.now() + 60000, userId: me.user_id || auth.userId, verified: Boolean(me.email_verified), email: me.email, ready: true });
      return;
    } catch (error: unknown) { if ([400, 401, 403].includes(failureStatus(error) ?? 0)) clearSession(); else { auth.ready = false; throw error; } }
    auth.ready = true;
  })().finally(() => { initPending = undefined; });
  return initPending;
}
export async function withAuth<Path extends string>(path: Path, options: ApiOptions = {}): Promise<ApiResponseFor<Path>> {
  if (!auth.refresh) throw new Error('Open the book to sign in.');
  if (!auth.access) await refreshSession();
  const used = auth.access;
  const usedRevision = revision;
  try { return await api(path, { ...options, token: used }); }
  catch (error: unknown) {
    if (failureStatus(error) !== 401) throw error;
    if (revision === usedRevision) await refreshSession(false);
    return api(path, { ...options, token: auth.access });
  }
}
export async function refreshSession(force = true) {
  const renew = async () => {
    try {
      if (!force) {
        try { const me = await api('/v1/auth/me'); Object.assign(auth, { access: 'cookie-session', refresh: 'cookie-session', userId: me.user_id, email: me.email, verified: me.email_verified, ready: true }); revision++; return; }
        catch (error) { if (failureStatus(error) !== 401) throw error; }
      }
      const tokens = await api('/v1/auth/refresh', { method: 'POST', body: JSON.stringify({ refresh_token: auth.refresh }) });
      accept(tokens);
    } catch (error: unknown) { if ([400, 401, 403].includes(failureStatus(error) ?? 0)) clearSession(); throw error; }
  };
  refreshPending ||= (browser && navigator.locks ? navigator.locks.request('moth-milk-session-refresh', renew).then(() => {}) : renew()).finally(() => { refreshPending = undefined; });
  return refreshPending;
}
// Verification can finish in another tab while this tab still holds an older access token.
export async function syncVerification() {
  if (!auth.refresh || auth.verified) return false;
  await refreshSession();
  return auth.verified;
}
export async function signIn(email: string, password: string, proof = '') {
  await shopId();
  const tokens = await api('/v1/auth/login', { method: 'POST', body: JSON.stringify({ email, password, email_proof_token: proof }) });
  accept(tokens, email);
}

export async function register(email: string, password: string, proof = '') {
  await shopId();
  const tokens = await api('/v1/auth/register', { method: 'POST', body: JSON.stringify({ email, password, locale: 'en', email_proof_token: proof }) });
  accept(tokens, email);
}
export async function signOut() {
  if (refreshPending) await refreshPending.catch(() => {});
  const logout = async () => { clearSession(); try { await api('/v1/auth/logout', { method: 'POST' }); } finally { clearSession(); } };
  if (browser && navigator.locks) await navigator.locks.request('moth-milk-session-refresh', logout);
  else await logout();
}
export async function requestReset(email: string) { return api('/v1/auth/password/reset/request', { method: 'POST', body: JSON.stringify({ email, locale: 'en' }) }); }
export async function confirmReset(token: string, newPassword: string) { const result = await api('/v1/auth/password/reset/confirm', { method: 'POST', body: JSON.stringify({ token, new_password: newPassword }) }); clearSession(); return result; }
