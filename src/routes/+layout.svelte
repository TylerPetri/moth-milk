<script>
  import '@fontsource/figtree/400.css';
  import '@fontsource/figtree/600.css';
  import '@fontsource/fraunces/700.css';
  import '@fontsource/fraunces/900.css';
  import '@fontsource/caveat/600.css';
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
