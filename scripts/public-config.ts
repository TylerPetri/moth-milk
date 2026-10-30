// PUBLIC_* values are serialized to browser code. Fail builds on accidental secrets.
export function validatePublicConfig(settings: Record<string, string | undefined>) {
  const allowed = new Set(['PUBLIC_API_URL', 'PUBLIC_SHOP_ID', 'PUBLIC_PAYMENT_MODE', 'PUBLIC_STRIPE_PUBLISHABLE_KEY']);
  for (const name of Object.keys(settings)) {
    if (name.startsWith('PUBLIC_') && !allowed.has(name)) throw new Error(`Unsupported public setting: ${name}`);
  }
  if (settings.PUBLIC_API_URL) {
    let url: URL;
    try { url = new URL(settings.PUBLIC_API_URL); } catch { throw new Error('PUBLIC_API_URL must be an HTTP(S) origin'); }
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.search || url.hash || url.pathname !== '/') {
      throw new Error('PUBLIC_API_URL must be an HTTP(S) origin without credentials, path, query or fragment');
    }
  }
  if (settings.PUBLIC_SHOP_ID && !/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(settings.PUBLIC_SHOP_ID)) throw new Error('PUBLIC_SHOP_ID must be a shop UUID');
  if (settings.PUBLIC_PAYMENT_MODE && !['stripe', 'stub'].includes(settings.PUBLIC_PAYMENT_MODE)) throw new Error('PUBLIC_PAYMENT_MODE must be stripe or stub');
  if (settings.PUBLIC_STRIPE_PUBLISHABLE_KEY && !/^pk_(test|live)_[A-Za-z0-9_]+$/.test(settings.PUBLIC_STRIPE_PUBLISHABLE_KEY)) throw new Error('PUBLIC_STRIPE_PUBLISHABLE_KEY must be a publishable key');
}
