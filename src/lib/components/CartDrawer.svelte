<script>
  import { ui, removeFromCart } from '$lib/stores/ui.svelte.js';
  const total = $derived(ui.cart.reduce((sum, item) => sum + item.price, 0));
</script>

{#if ui.cartOpen}
  <button class="cart-backdrop" type="button" aria-label="Close bag" onclick={() => (ui.cartOpen = false)}></button>
  <aside class="cart-drawer" aria-label="Shopping bag">
    <div class="cart-drawer__header">
      <div><span>packing slip</span><strong>MM / {String(ui.cart.length).padStart(2, '0')}</strong></div>
      <button type="button" onclick={() => (ui.cartOpen = false)} aria-label="Close bag">×</button>
    </div>

    {#if ui.cart.length === 0}
      <div class="cart-empty">
        <h2>Your bag is empty.</h2>
        <a href="/shop" onclick={() => (ui.cartOpen = false)}>Continue shopping →</a>
      </div>
    {:else}
      <div class="cart-lines">
        {#each ui.cart as item (item.lineId)}
          <article>
            <img src={item.image} alt="" />
            <div><h3>{item.name}</h3><p>{item.selectedSize} · {item.color}</p><strong>${item.price}</strong></div>
            <button type="button" onclick={() => removeFromCart(item.lineId)}>remove</button>
          </article>
        {/each}
      </div>
      <div class="cart-total"><span>total / CAD</span><strong>${total}</strong></div>
      <button class="checkout-button" type="button">check out <span>→</span></button>
    {/if}
  </aside>
{/if}
