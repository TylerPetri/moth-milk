<script lang="ts">
  import type { DisplayProduct } from '$lib/types/content.js';
  let { product, number = '01' }: { product: DisplayProduct; number?: string } = $props();
</script>

<article class="product-card" data-product={product.slug}>
  <a class="product-card__image" href={`/product/${product.slug}`}>
    <img src={product.image} alt={product.imageAlt} />
    <span class="product-card__tag">{product.tag}</span>
    <span class="product-card__number">MM / {number}</span>
  </a>
  <div class="product-card__info">
    <div><h3><a href={`/product/${product.slug}`}>{product.name}</a></h3><p>{product.note}</p></div>
    <strong>${product.price} <small>CAD</small></strong>
  </div>
</article>
