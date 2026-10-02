<script lang="ts">
  import ProductCard from '$lib/components/ProductCard.svelte';
  import LibrarySection from '$lib/components/LibrarySection.svelte';
  import { products } from '$lib/data/products.ts';

  function trackCursor(event: PointerEvent & { currentTarget: HTMLElement }) {
    const surfaces = event.currentTarget.querySelectorAll('.after-hours-hero, .library-collection');

    for (const surface of surfaces) {
      if (!(surface instanceof HTMLElement)) continue;
      const rect = surface.getBoundingClientRect();
      surface.style.setProperty('--cursor-x', `${event.clientX - rect.left}px`);
      surface.style.setProperty('--cursor-y', `${event.clientY - rect.top}px`);
    }
  }
</script>

<svelte:head>
  <title>MOTH MILK — Free Horror Library & After-Hours Goods</title>
  <meta
    name="description"
    content="Read original horror fiction for free and shop Moth Milk apparel, objects and Mimi plush."
  />
</svelte:head>

<main class="after-hours-home" onpointermove={trackCursor}>
  <section class="after-hours-hero" aria-labelledby="hero-title">
    <img
      class="after-hours-hero__image"
      src="/images/after-hours-library-hero-v3.webp"
      alt="A late-night bedroom with horror books spread across an oxblood bed, a model in the Night Shift Hoodie, Mimi plush and a CRT television"
      fetchpriority="high"
    />
    <div class="after-hours-hero__shade"></div>
    <div class="after-hours-hero__grain"></div>

    <div class="after-hours-hero__copy">
      <h1 id="hero-title"><img src="/images/hero-type/wordmark.webp" alt="Moth Milk" width="1200" height="210" /></h1>
      <p><img src="/images/hero-type/subtitle.webp" alt="Free horror fiction · apparel · odd things" width="1200" height="44" /></p>
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

  </section>

  <LibrarySection />

  <section class="home-shop" id="shop" aria-labelledby="shop-title">
    <header class="home-shop__header">
      <div>
        <span class="shop-kicker">Apparel · plush · objects</span>
        <h2 id="shop-title"><img src="/images/shop-type/shop.webp" alt="Shop" width="1959" height="648" /></h2>
      </div>
      <a href="/shop">View everything </a>
    </header>

    <div class="home-shop__grid">
      {#each products as product, index}
        <ProductCard {product} number={String(index + 1).padStart(2, '0')} />
      {/each}
    </div>
  </section>
</main>
