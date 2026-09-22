<script>
  import ProductCard from '$lib/components/ProductCard.svelte';
  import { products } from '$lib/data/products.js';
  let filter = $state('all');
  const visibleProducts = $derived(filter === 'all' ? products : products.filter((product) => product.category === filter));
</script>

<svelte:head><title>Shop — MOTH MILK</title><meta name="description" content="Shop Moth Milk apparel, plush and small objects." /></svelte:head>

<main class="shop-page page-shell">
  <header class="page-heading shop-page__heading">
    <p class="eyebrow">Apparel / plush / objects</p>
    <h1>Shop</h1>
    <p>Small-run Moth Milk apparel and objects from the room.</p>
  </header>

  <div class="shop-toolbar">
    <div aria-label="Product filters">
      {#each ['all', 'apparel', 'plush'] as item}
        <button class:active={filter === item} type="button" onclick={() => (filter = item)}>{item}</button>
      {/each}
    </div>
    <span>{products.length} objects / CAD</span>
  </div>

  <div class="shop-grid">
    {#each visibleProducts as product, index}
      <ProductCard {product} number={String(index + 1).padStart(2, '0')} />
    {/each}
  </div>
</main>
