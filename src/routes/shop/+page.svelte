<script>
  // @ts-nocheck
  import ProductCard from '$lib/components/ProductCard.svelte';
  import { products } from '$lib/data/products.js';
  import { catalog, variantFor } from '$lib/catalog.js';
  import { onMount } from 'svelte';
  let listings = $state([]); let catalogNotice = $state('');
  onMount(() => { void catalog().then((items) => (listings = items)).catch((error) => (catalogNotice = error.message)); });
  let filter = $state('all');
  const availableProducts = $derived(products.map((product) => { const variant = variantFor(listings, product.slug, product.sizes[0]); return variant ? { ...product, price: variant.amount / 100 } : null; }).filter(Boolean));
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

  {#if catalogNotice}<p class="shop-notice" role="status">The shop is quiet right now. {catalogNotice}</p>{/if}
  <div class="shop-grid">
    {#each visibleProducts as product, index}
      <ProductCard {product} number={String(index + 1).padStart(2, '0')} />
    {/each}
  </div>
</main>
