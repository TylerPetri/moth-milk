import { validatePublicConfig } from './scripts/public-config.ts';
import adapter from '@sveltejs/adapter-vercel';
import { loadEnv } from 'vite';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

import type { Config } from '@sveltejs/kit';
const settings = { ...loadEnv(process.env.NODE_ENV || 'production', process.cwd(), ''), ...process.env };
validatePublicConfig(settings);
let apiOrigin; try { apiOrigin = new URL(settings.PUBLIC_API_URL || '').origin; } catch {}
const config: Config = {
  preprocess: vitePreprocess(),
  kit: { adapter: adapter(), csp: { mode: 'auto', directives: {
    'default-src': ['self'], 'script-src': ['self', 'https://js.stripe.com', 'https://*.js.stripe.com'],
    'worker-src': ['self', ...(process.env.NODE_ENV === 'development' ? ['blob:'] : [])],
    'style-src': ['self', 'unsafe-inline'], 'img-src': ['self', 'data:', 'https:'],
    'font-src': ['self'], 'connect-src': ['self', ...(apiOrigin ? [apiOrigin] : []), 'https://api.stripe.com', 'https://*.stripe.com', 'https://link.com', 'https://*.link.com'],
    'frame-src': ['https://js.stripe.com', 'https://hooks.stripe.com', 'https://*.js.stripe.com', 'https://link.com', 'https://*.link.com'],
    'object-src': ['none'], 'base-uri': ['self'], 'form-action': ['self'], 'frame-ancestors': ['none']
  } } }
};

export default config;
