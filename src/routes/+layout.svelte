<script lang="ts">
  import '@fontsource/ibm-plex-sans-condensed/latin-400.css';
  import '@fontsource/ibm-plex-sans-condensed/latin-500.css';
  import '@fontsource/ibm-plex-sans-condensed/latin-600.css';
  import '@fontsource/cormorant-garamond/latin-500.css';
  import '@fontsource/cormorant-garamond/latin-600.css';
  import '@fontsource/cormorant-garamond/latin-700.css';
  import '@fontsource/cormorant-garamond/latin-600-italic.css';
  import '@fontsource/bodoni-moda/latin-700.css';
  import '@fontsource/courier-prime/latin-400.css';
  import '@fontsource/courier-prime/latin-700.css';
  import bodyFont from '@fontsource/ibm-plex-sans-condensed/files/ibm-plex-sans-condensed-latin-400-normal.woff2?url';
  import navFont from '@fontsource/ibm-plex-sans-condensed/files/ibm-plex-sans-condensed-latin-500-normal.woff2?url';
  import roomFont from '@fontsource/cormorant-garamond/files/cormorant-garamond-latin-500-normal.woff2?url';
  import monoFont from '@fontsource/courier-prime/files/courier-prime-latin-400-normal.woff2?url';
  import '../styles/main.scss';
  import SiteHeader from '$lib/components/SiteHeader.svelte';
  import SiteFooter from '$lib/components/SiteFooter.svelte';
  import ReactiveBackdrop from '$lib/components/ReactiveBackdrop.svelte';
  import CartDrawer from '$lib/components/CartDrawer.svelte';
  import { ui, initCart } from '$lib/stores/ui.svelte.ts';
  import { auth, initAuth } from '$lib/stores/auth.svelte.ts';
  import { loadCorner } from '$lib/stores/corner.svelte.ts';
  import { onMount } from 'svelte';
  onMount(() => { initCart(); void initAuth().then(() => { if (auth.userId && page.url.pathname !== '/your-corner') return loadCorner(); }).catch(() => { /* Pages expose their own retry states. */ }); });
  import { page } from '$app/state';
  import { browser } from '$app/environment';

  let { children, data }: import('./$types').LayoutProps = $props();
  function seedSession() {
  if (browser && data.session && !auth.ready) Object.assign(auth, { ...data.session, ready: true, access: 'cookie-session', refresh: 'cookie-session', expires: Date.now() + 60000 });
  }
  seedSession();

  import { api } from '$lib/api.ts';
  import { receipts, saveReceipt, readSaved, writeSaved } from '$lib/checkout.ts';
  onMount(() => { void (async () => {
    // Migrate older saved receipts without losing recovery during an outage.
    for (const receipt of receipts().slice(0, 10)) {
      if (!receipt.idempotency_key && !receipt.tracking_proof) continue;
      try { await api('/v1/auth/receipt', { method: 'POST', body: JSON.stringify({ id: receipt.id, idempotency_key: receipt.idempotency_key, tracking_proof: receipt.tracking_proof }) }); if (receipts().some(saved => saved.id === receipt.id)) saveReceipt(receipt); } catch { /* Keep legacy recovery until the server is reachable. */ }
    }
    for (const key of ['moth-milk-pending-checkout', 'moth-milk-stub-checkout', 'moth-milk-checkout-details']) { const saved = readSaved(key); if (saved) writeSaved(key, saved); }
  })(); });
</script>

<svelte:head>
  {#each [bodyFont, navFont, roomFont, monoFont] as font}<link rel="preload" href={font} as="font" type="font/woff2" crossorigin="anonymous" />{/each}
  <link rel="preload" as="image" href="/images/header-brocade.webp" />
  <link rel="preload" as="image" href="/images/hero-type/wordmark.webp" />
  <link rel="icon" href="/favicon.svg" />
</svelte:head>

<div class:feral={ui.mood === 'feral'} class:quiet-backdrop={page.url.pathname === '/lookbook' || page.url.pathname === '/checkout' || page.url.pathname === '/your-corner' || page.url.pathname.startsWith('/product/')} class="app-shell">
  <ReactiveBackdrop />
  <SiteHeader />
  {@render children()}
  <SiteFooter />
  <CartDrawer />
</div>
