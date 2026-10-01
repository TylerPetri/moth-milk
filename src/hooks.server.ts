import type { Handle } from '@sveltejs/kit';
export const handle: Handle = async ({ event, resolve }) => {
  const response = await resolve(event);
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'no-referrer');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  if (event.url.protocol === 'https:') response.headers.set('Strict-Transport-Security', 'max-age=31536000');
  if (event.url.pathname.startsWith('/checkout') || event.url.pathname.startsWith('/session') || event.url.pathname.includes('verify-email') || event.url.pathname.includes('reset-password')) response.headers.set('Cache-Control', 'no-store');
  return response;
};
