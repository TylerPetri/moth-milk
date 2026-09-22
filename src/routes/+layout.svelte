<script>
  import '@fontsource/ibm-plex-sans-condensed/latin-400.css';
  import '@fontsource/ibm-plex-sans-condensed/latin-500.css';
  import '@fontsource/ibm-plex-sans-condensed/latin-600.css';
  import '@fontsource/cormorant-garamond/latin-500.css';
  import '@fontsource/cormorant-garamond/latin-600.css';
  import '@fontsource/cormorant-garamond/latin-700.css';
  import '@fontsource/bodoni-moda/latin-700.css';
  import '@fontsource/courier-prime/latin-400.css';
  import '@fontsource/courier-prime/latin-700.css';
  import '../styles/main.scss';
  import SiteHeader from '$lib/components/SiteHeader.svelte';
  import SiteFooter from '$lib/components/SiteFooter.svelte';
  import ReactiveBackdrop from '$lib/components/ReactiveBackdrop.svelte';
  import CartDrawer from '$lib/components/CartDrawer.svelte';
  import { ui } from '$lib/stores/ui.svelte.js';

  let { children } = $props();
</script>

<svelte:head>
  <link rel="icon" href="/favicon.svg" />
</svelte:head>

<div class:feral={ui.mood === 'feral'} class="app-shell">
  <ReactiveBackdrop />
  <SiteHeader />
  {@render children()}
  <SiteFooter />
  <CartDrawer />
</div>
