<script lang="ts">
  import type { Product } from '$lib/types/api.js';
  import ProductCard from '$lib/components/ProductCard.svelte';
  import { products } from '$lib/data/products.js';
  import { catalog, variantFor } from '$lib/catalog.js';
  import RecoveryNotice from '$lib/components/RecoveryNotice.svelte';
  import { friendlyError, watchRecovery } from '$lib/recovery.js';
  import { onMount } from 'svelte';
  let listings = $state<Product[]>([]); let catalogNotice = $state(''); let loading = $state(true); let refreshing = false; let disposed = false;
  async function loadShop() {
    if (refreshing || disposed) return;
    refreshing = true; loading = true;
    try { const items = await catalog(); if (!disposed) { listings = items; catalogNotice = ''; } }
    catch (error) { if (!disposed) catalogNotice = friendlyError(error, 'Something’s wrong on our end. The shop is temporarily unavailable. Please try again or come back later.'); }
    finally { refreshing = false; if (!disposed) loading = false; }
  }
  onMount(() => { void loadShop(); const stop = watchRecovery(() => { if (catalogNotice) return loadShop(); }); return () => { disposed = true; stop(); }; });
  let filter = $state('all');
  const availableProducts = $derived(products.map((product) => { const variant = variantFor(listings, product.slug, product.sizes[0]); return variant ? { ...product, price: variant.amount / 100 } : null; }).filter((product) => product !== null));
  const visibleProducts = $derived(filter === 'all' ? availableProducts : availableProducts.filter((product) => product.category === filter));
</script>

<svelte:head><title>Shop — MOTH MILK</title><meta name="description" content="Shop Moth Milk apparel, plush and small objects." /></svelte:head>

<main class="shop-page page-shell">
  <header class="page-heading shop-page__heading">
    <p class="shop-kicker">Apparel · plush · objects</p>
    <h1><img src="/images/shop-type/shop.webp" alt="Shop" width="1959" height="648" /></h1>
    <p><span>Small-run Moth Milk apparel and objects from the room.</span></p>
  </header>

  <div class="shop-toolbar">
    <div aria-label="Product filters">
      {#each ['all', 'apparel', 'plush'] as item}
        <button class:active={filter === item} type="button" onclick={() => (filter = item)}>{item}</button>
      {/each}
    </div>
    <span>{availableProducts.length} objects / CAD</span>
  </div>

  {#if catalogNotice}<RecoveryNotice message={catalogNotice} busy={loading} retry={loadShop} />{:else if loading}<p class="shop-notice" role="status">Finding your things…</p>{:else if visibleProducts.length === 0}<p class="shop-notice" role="status">Nothing here right now. Try another filter or come back later.</p>{/if}
  <div class="shop-grid">
    {#each visibleProducts as product, index}
      <ProductCard {product} number={String(index + 1).padStart(2, '0')} />
    {/each}
  </div>
</main>
