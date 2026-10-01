<script lang="ts">
  import type { Product } from '$lib/types/api.ts';
  import { addToCart } from '$lib/stores/ui.svelte.ts';
  import { catalog, variantFor } from '$lib/catalog.ts';
  import { api } from '$lib/api.ts';
  import RecoveryNotice from '$lib/components/RecoveryNotice.svelte';
  import { friendlyError, watchRecovery } from '$lib/recovery.ts';
  import { onMount } from 'svelte';
  import { page } from '$app/state';
  const fromCorner = $derived(page.url.searchParams.get('from') === 'your-corner');
  let listings = $state<Product[]>([]);
  let catalogNotice = $state('');
  let loading = $state(true); let retrying = $state(false); let stockNotice = $state(''); let stockRevision = $state(0); let disposed = false;
  async function loadProduct() {
    if (retrying || disposed) return;
    retrying = true; loading = true;
    try { const items = await catalog(); if (!disposed) { listings = items; catalogNotice = ''; stockRevision++; } }
    catch (error) { if (!disposed) catalogNotice = friendlyError(error, 'Something’s wrong on our end. Prices are temporarily unavailable. Try again or come back later.'); }
    finally { retrying = false; if (!disposed) loading = false; }
  }
  async function retryProduct() { if (catalogNotice) await loadProduct(); else if (!retrying) stockRevision++; }
  onMount(() => { void loadProduct(); const stop = watchRecovery(() => { if (catalogNotice || stockNotice) return retryProduct(); }); return () => { disposed = true; stop(); }; });
  let { data }: import('./$types').PageProps = $props();
  let size = $state('');
  const variant = $derived(variantFor(listings, data.product.slug, size));
  const price = $derived(variant ? (variant.amount / 100).toFixed(2) : null);
  let stock = $state<number | null>(null);
  $effect(() => {
    const id = variant?.id; const revision = stockRevision; stock = null; stockNotice = ''; if (!id) return;
    let active = true; const controller = new AbortController();
    void api(`/v1/stock/${id}`, { signal: controller.signal }).then((data) => { if (typeof data.available !== 'number' || !Number.isFinite(data.available)) throw Object.assign(new Error('Stock response unavailable.'), { retryable: true }); if (active) stock = data.available; }).catch(error => { if (active) stockNotice = friendlyError(error, 'Something’s wrong on our end. We could not check stock. Try again before adding this to your bag.'); });
    return () => { active = false; controller.abort(); };
  });
  $effect(() => {
    if (!size) size = data.product.sizes[0];
  });
</script>

<svelte:head><title>{data.product.name} — MOTH MILK</title><meta name="description" content={`${data.product.name}. ${data.product.note}`} /></svelte:head>

<main class="product-page page-shell" data-product={data.product.slug}>
  <a class="product-page__back" href={fromCorner ? "/your-corner" : "/shop"}>← back to {fromCorner ? "your corner" : "shop"}</a>
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

      <button class="add-button" type="button" disabled={!variant || stock === null || stock <= 0} onclick={() => variant && stock !== null && stock > 0 && addToCart({ ...data.product, price: variant.amount / 100 }, size)}><span>{variant ? stockNotice ? "stock unavailable" : stock === null ? "checking stock" : stock > 0 ? "add to bag" : "sold out" : "unavailable"}</span><strong>{price === null ? "" : `$${price}`}</strong></button>
      {#if catalogNotice || stockNotice}<RecoveryNotice message={catalogNotice || stockNotice} busy={loading || (Boolean(variant) && stock === null && !stockNotice)} retry={retryProduct} />{:else if loading}<p role="status">Finding your things…</p>{:else if !variant}<p role="status">This size is unavailable right now. Try another size.</p>{/if}

      <dl class="product-specs">
        <div><dt>fit</dt><dd>{data.product.fit}</dd></div>
        <div><dt>material</dt><dd>{data.product.material}</dd></div>
        <div><dt>care</dt><dd>Cold wash / gentle cycle</dd></div>
        <div><dt>production</dt><dd>Small run</dd></div>
      </dl>
    </div>
  </section>
</main>
