import type { LayoutServerLoad } from './$types';
export const load: LayoutServerLoad = async ({ cookies, fetch, url, setHeaders }) => {
  setHeaders({ 'Cache-Control': 'private, no-store' });
  // Legacy /session cookies cannot be read on a document request. The browser
  // restores those once, then the proxy migrates validated credentials to /.
  if (!cookies.get('mm_access') && !cookies.get('mm_refresh')) return { session: null };
  try {
    let response = await fetch('/session/v1/auth/me');
    if (response.status === 401 && cookies.get('mm_refresh')) {
      const renewal = await fetch('/session/v1/auth/refresh', { method: 'POST', headers: { Origin: url.origin } });
      if (renewal.ok) response = await fetch('/session/v1/auth/me');
    }
    if (!response.ok) return { session: null };
    const me = await response.json();
    if (typeof me.user_id !== 'string') return { session: null };
    return { session: { userId: me.user_id, email: typeof me.email === 'string' ? me.email : '', verified: Boolean(me.email_verified) } };
  } catch { return { session: null }; }
};
