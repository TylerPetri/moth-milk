<script>
  import ProductCard from '$lib/components/ProductCard.svelte';
  import LibrarySection from '$lib/components/LibrarySection.svelte';
  import { products } from '$lib/data/products.js';

  /** @param {PointerEvent & { currentTarget: HTMLElement }} event */
  function trackCursor(event) {
    const rect = event.currentTarget.getBoundingClientRect();
    event.currentTarget.style.setProperty('--cursor-x', `${event.clientX - rect.left}px`);
    event.currentTarget.style.setProperty('--cursor-y', `${event.clientY - rect.top}px`);
  }
</script>

<svelte:head>
  <title>MOTH MILK — Free Horror Library & After-Hours Goods</title>
  <meta
    name="description"
    content="Read original horror fiction for free and shop Moth Milk apparel, objects and Mimi plush."
  />
</svelte:head>

<main class="after-hours-home">
  <section class="after-hours-hero" aria-labelledby="hero-title" onpointermove={trackCursor}>
    <img
      class="after-hours-hero__image"
      src="/images/after-hours-library-hero.webp"
      alt="A late-night bedroom with horror books spread across an oxblood bed, a model in the Night Shift Hoodie, Mimi plush and a CRT television"
      fetchpriority="high"
    />
    <div class="after-hours-hero__shade"></div>
    <div class="after-hours-hero__grain"></div>

    <div class="after-hours-hero__copy">
      <h1 id="hero-title">Moth Milk</h1>
      <p>Free horror fiction <i></i> apparel <i></i> odd things</p>
      <div class="after-hours-hero__actions">
        <a class="room-button room-button--paper" href="#library">Open library</a>
        <a class="room-button room-button--wine" href="#shop">Shop now</a>
      </div>
    </div>

    <a class="room-hotspot room-hotspot--tv" href="/lookbook" aria-label="Open the lookbook">
      <span>Lookbook</span>
    </a>
    <a class="room-hotspot room-hotspot--books" href="#library" aria-label="Browse the free horror library">
      <span>Library</span>
    </a>
    <a class="room-hotspot room-hotspot--hoodie" href="/product/night-shift-hoodie" aria-label="View the Night Shift Hoodie">
      <span>Night Shift Hoodie</span>
    </a>
    <a class="room-hotspot room-hotspot--mimi" href="/product/mimi-plush" aria-label="View Mimi Moth Plush">
      <span>Mimi Plush</span>
    </a>

    <a class="after-hours-hero__scroll" href="#library" aria-label="Scroll to library">
      <span></span>
    </a>
  </section>

  <LibrarySection />

  <section class="home-shop" id="shop" aria-labelledby="shop-title">
    <header class="home-shop__header">
      <div>
        <span>Apparel · plush · objects</span>
        <h2 id="shop-title">Shop</h2>
      </div>
      <a href="/shop">View everything <span>↗</span></a>
    </header>

    <div class="home-shop__grid">
      {#each products as product, index}
        <ProductCard {product} number={String(index + 1).padStart(2, '0')} />
      {/each}
    </div>
  </section>
</main>
