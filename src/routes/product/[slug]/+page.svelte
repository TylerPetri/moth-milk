<script>
  // @ts-nocheck
  import { addToCart } from '$lib/stores/ui.svelte.js';
  import { catalog, variantFor } from '$lib/catalog.js';
  import { api } from '$lib/api.js';
  import { onMount } from 'svelte';
  let listings = $state([]);
  let catalogNotice = $state('');
  onMount(() => { void catalog().then((items) => (listings = items)).catch((error) => (catalogNotice = error.message)); });
  let { data } = $props();
  let size = $state('');
  const variant = $derived(variantFor(listings, data.product.slug, size));
  const price = $derived(variant ? (variant.amount / 100).toFixed(2) : null);
  let stock = $state(null);
  $effect(() => {
    const id = variant?.id; stock = null; if (!id) return;
    let active = true;
    void api(`/v1/stock/${id}`).then((data) => { if (active) stock = data.available; }).catch(() => { if (active) stock = 0; });
    return () => { active = false; };
  });
  $effect(() => {
    if (!size) size = data.product.sizes[0];
  });
</script>

<svelte:head><title>{data.product.name} — MOTH MILK</title><meta name="description" content={`${data.product.name}. ${data.product.note}`} /></svelte:head>

<main class="product-page page-shell" data-product={data.product.slug}>
  <a class="product-page__back" href="/shop">← back to shop</a>
  <section class="product-detail">
    <div class="product-detail__gallery">
      <figure><img src={data.product.image} alt={data.product.imageAlt} /><figcaption>Moth Milk / {data.product.shortName}</figcaption></figure>
      <div class="detail-swatch"><span style={`--swatch:${data.product.swatch}`}></span><p>{data.product.color}</p></div>
    </div>

    <div class="product-detail__info">
      <p class="eyebrow">{data.product.category}</p>
      <h1>{data.product.name}</h1>
      <p class="product-detail__note">{data.product.note}</p>
      <div class="product-detail__price">{price === null ? "—" : `$${price}`} <small>CAD</small></div>

      <div class="size-picker">
        <div><span class="size-picker__label">Choose a size</span><span class="size-picker__fit">{data.product.fit}</span></div>
        <div>{#each data.product.sizes as item}<button class:active={size === item} type="button" onclick={() => (size = item)}>{item}</button>{/each}</div>
      </div>

      <button class="add-button" type="button" disabled={!variant || stock === null || stock <= 0} onclick={() => variant && stock > 0 && addToCart({ ...data.product, price: variant.amount / 100 }, size)}><span>{variant ? stock === null ? "checking stock" : stock > 0 ? "add to bag" : "sold out" : "unavailable"}</span><strong>{price === null ? "" : `$${price}`}</strong></button>
      {#if catalogNotice}<p role="status">{catalogNotice}</p>{/if}

      <dl class="product-specs">
        <div><dt>fit</dt><dd>{data.product.fit}</dd></div>
        <div><dt>material</dt><dd>{data.product.material}</dd></div>
        <div><dt>care</dt><dd>Cold wash / gentle cycle</dd></div>
        <div><dt>production</dt><dd>Small run</dd></div>
      </dl>
    </div>
  </section>
</main>
