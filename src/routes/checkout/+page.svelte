<script>
  import { ui } from '$lib/stores/ui.svelte.js';
  const subtotal = $derived(ui.cart.reduce((sum, item) => sum + item.price, 0));
</script>

<svelte:head>
  <title>Checkout — MOTH MILK</title>
  <meta name="description" content="Checkout with Moth Milk." />
</svelte:head>

<main class="checkout-page page-shell">
  <div class="checkout-page__top"><a href="/shop">← Back to shop</a><span>Checkout preview</span></div>
  <div class="checkout-layout">
    <section class="checkout-tv" aria-labelledby="checkout-title">
      <div class="checkout-tv__screen">
        <div class="checkout-tv__content">
          <p class="checkout-tv__channel">Moth Milk / Checkout</p>
          <h1 id="checkout-title">Almost <em>yours.</em></h1>
          {#if ui.cart.length === 0}
            <div class="checkout-tv__empty">
              <p>Your bag is empty.</p>
              <a href="/shop">Find something to take home →</a>
            </div>
          {:else}
            <p class="checkout-tv__intro">Where should your things go?</p>
            <form class="checkout-form" onsubmit={(event) => event.preventDefault()}>
              <fieldset>
                <legend>01 / Contact</legend>
                <div class="checkout-form__fields">
                  <label class="checkout-form__full">Email address<input type="email" name="email" autocomplete="email" placeholder="you@example.com" /></label>
                </div>
              </fieldset>
              <fieldset>
                <legend>02 / Delivery</legend>
                <div class="checkout-form__fields">
                  <label>First name<input name="given-name" autocomplete="given-name" placeholder="First name" /></label>
                  <label>Last name<input name="family-name" autocomplete="family-name" placeholder="Last name" /></label>
                  <label class="checkout-form__full">Street address<input name="street-address" autocomplete="street-address" placeholder="Street address" /></label>
                  <label>City<input name="address-level2" autocomplete="address-level2" placeholder="City" /></label>
                  <label>Province / region<input name="address-level1" autocomplete="address-level1" placeholder="Province or region" /></label>
                  <label>Postal code<input name="postal-code" autocomplete="postal-code" placeholder="Postal code" /></label>
                  <label>Country<input name="country-name" autocomplete="country-name" placeholder="Country" /></label>
                </div>
              </fieldset>
              <fieldset class="checkout-form__payment">
                <legend>03 / Payment</legend>
                <div class="checkout-form__card"><span aria-hidden="true">✦</span><p>Secure card entry will appear here when checkout is connected.</p></div>
              </fieldset>
              <button type="button" disabled>Place order <span aria-hidden="true">→</span></button>
              <p class="checkout-form__notice">This is a design preview. Orders and payments are not available yet.</p>
            </form>
          {/if}
        </div>
      </div>
      <div class="checkout-tv__controls" aria-hidden="true"><span class="checkout-tv__brand">MM</span><span class="checkout-tv__dial"></span><span class="checkout-tv__dial checkout-tv__dial--small"></span><span class="checkout-tv__power"></span></div>
      <div class="checkout-tv__foot" aria-hidden="true"><span></span><span></span></div>
    </section>

    <aside class="checkout-summary" aria-label="Order summary">
      <span class="checkout-summary__eyebrow">Your things</span>
      <h2>In your bag.</h2>
      {#if ui.cart.length === 0}
        <p>Nothing here yet.</p>
      {:else}
        <ul>
          {#each ui.cart as item (item.lineId)}
            <li><img src={item.image} alt="" /><div><strong>{item.name}</strong><span>{item.selectedSize} · {item.color}</span></div><b>${item.price}</b></li>
          {/each}
        </ul>
        <div class="checkout-summary__subtotal"><span>Subtotal / CAD</span><strong>${subtotal}</strong></div>
        <p>Shipping and taxes will be shown when checkout is connected.</p>
      {/if}
      <a href="/shop">Keep looking ↗</a>
    </aside>
  </div>
</main>
