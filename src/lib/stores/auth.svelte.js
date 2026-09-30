// @ts-nocheck
import { browser } from '$app/environment';
import { api, shopId } from '$lib/api.js';

const key = 'moth-milk-session';
let initPending;
let refreshPending;
export const auth = $state({ ready: false, access: '', refresh: '', expires: 0, userId: '', email: '', verified: false });

function persist() {
  if (browser) sessionStorage.setItem(key, JSON.stringify({ access: auth.access, refresh: auth.refresh, expires: auth.expires, userId: auth.userId, email: auth.email, verified: auth.verified }));
}
export function clearSession() {
  Object.assign(auth, { access: '', refresh: '', expires: 0, userId: '', email: '', verified: false, ready: true });
  if (browser) sessionStorage.removeItem(key);
}
function accept(tokens, email = auth.email) {
  Object.assign(auth, { access: tokens.access_token, refresh: tokens.refresh_token, expires: new Date(tokens.access_expires_at).getTime(), userId: tokens.user_id, email, verified: tokens.email_verified, ready: true });
  persist();
}
export async function initAuth() {
  if (auth.ready || !browser) return;
  initPending ||= (async () => {
    try {
      const saved = JSON.parse(sessionStorage.getItem(key) || 'null');
      if (saved?.refresh) {
        Object.assign(auth, saved);
        const me = await withAuth('/v1/auth/me', { noShop: true });
        auth.verified = Boolean(me.email_verified); auth.email = me.email; persist();
        return;
      }
    } catch (error) { if (!auth.refresh || [401, 403].includes(error.status)) clearSession(); else { auth.ready = true; throw error; } }
    auth.ready = true;
  })().finally(() => { initPending = null; });
  return initPending;
}
export async function withAuth(path, options = {}) {
  if (!auth.refresh) throw new Error('Open the book to sign in.');
  if (!auth.access || auth.expires - Date.now() < 60_000) await refreshSession();
  const used = auth.access;
  try { return await api(path, { ...options, token: used }); }
  catch (error) {
    if (error.status !== 401) throw error;
    if (auth.access === used) await refreshSession();
    return api(path, { ...options, token: auth.access });
  }
}
export async function refreshSession() {
  if (!auth.refresh) throw new Error('Open the book to sign in.');
  refreshPending ||= (async () => {
    try {
      const tokens = await api('/v1/auth/refresh', { method: 'POST', noShop: true, body: JSON.stringify({ refresh_token: auth.refresh }) });
      accept(tokens);
    } catch (error) { if ([400, 401, 403].includes(error.status)) clearSession(); throw error; }
  })().finally(() => { refreshPending = null; });
  return refreshPending;
}
// Verification can finish in another tab while this tab still holds an older access token.
export async function syncVerification() {
  if (!auth.refresh || auth.verified) return false;
  await refreshSession();
  return auth.verified;
}
export async function signIn(email, password, proof = '') {
  const tokens = await api('/v1/auth/login', { method: 'POST', body: JSON.stringify({ email, password, email_proof_token: proof }) });
  const target = await shopId();
  if (tokens.shop_id !== target) {
    try {
      const switched = await api('/v1/auth/me/shops/switch', { method: 'POST', noShop: true, token: tokens.access_token, body: JSON.stringify({ shop_id: target }) });
      accept(switched, email);
    } catch (error) { clearSession(); throw error; }
  } else accept(tokens, email);
}
export async function register(email, password, proof = '') {
  const tokens = await api('/v1/auth/register', { method: 'POST', body: JSON.stringify({ email, password, locale: 'en', email_proof_token: proof }) });
  accept(tokens, email);
}
export async function signOut() {
  const refresh = auth.refresh;
  clearSession();
  if (refresh) await api('/v1/auth/logout', { method: 'POST', noShop: true, body: JSON.stringify({ refresh_token: refresh }) });
}
export async function requestReset(email) { return api('/v1/auth/password/reset/request', { method: 'POST', body: JSON.stringify({ email, locale: 'en' }) }); }
export async function confirmReset(token, newPassword) { return api('/v1/auth/password/reset/confirm', { method: 'POST', noShop: true, body: JSON.stringify({ token, new_password: newPassword }) }); }
