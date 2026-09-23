<script>
  // @ts-nocheck
  import { onMount } from 'svelte';
  import { ui, persistCart } from '$lib/stores/ui.svelte.js';
  import { auth, initAuth } from '$lib/stores/auth.svelte.js';
  import { catalog, variantFor } from '$lib/catalog.js';
  import { api } from '$lib/api.js';
  import { loadStripe } from '$lib/stripe.js';

  const checkoutKey = 'moth-milk-pending-checkout';
  const subtotal = $derived(ui.cart.reduce((sum, item) => sum + Number(item.price || 0), 0));
  let email = $state(''); let firstName = $state(''); let lastName = $state('');
  let line1 = $state(''); let city = $state(''); let province = $state(''); let postalCode = $state(''); let country = $state('CA');
  let error = $state(''); let notice = $state(''); let phase = $state('details'); let processing = $state(false);
  let total = $state(null); let checkout = $state(null); let stripe; let elements; let paymentElement;
  let paymentContainer = $state(null); let currentCheckoutStatus = ''; let returnedFromStripe = false;
  let stopped = false;

  function saveCheckout(value) { checkout = value; sessionStorage.setItem(checkoutKey, JSON.stringify(value)); }
  function clearCheckout() { checkout = null; sessionStorage.removeItem(checkoutKey); }
  async function paymentScreen(secret) {
    stripe = await loadStripe();
    if (!stripe) throw new Error('Secure card entry is unavailable.');
    paymentElement?.destroy();
    elements = stripe.elements({ clientSecret: secret, appearance: { theme: 'night', variables: { colorPrimary: '#bb9391', colorBackground: '#201719', colorText: '#f1e2d6', fontFamily: 'Georgia, serif', borderRadius: '2px' } } });
    paymentElement = elements.create('payment', { layout: 'tabs' });
    phase = 'payment';
    await new Promise((resolve) => requestAnimationFrame(resolve));
    paymentElement.mount(paymentContainer);
  }
  async function status() {
    if (!checkout) return;
    const current = await api(`/v1/orders/${checkout.id}/checkout-status`, { method: 'POST', body: JSON.stringify({ idempotency_key: checkout.idempotency_key }) });
    currentCheckoutStatus = current.status;
    if (current.status === 'confirmed') {
      clearCheckout(); ui.cart = []; persistCart(); paymentElement?.destroy();
      phase = 'confirmed'; notice = 'It is yours. A note is on its way.'; return;
    }
    if (current.status === 'failed' || current.status === 'cancelled') {
      clearCheckout(); paymentElement?.destroy(); phase = 'failed'; notice = 'This checkout did not finish. Your bag is still here.'; return;
    }
    phase = 'waiting';
    notice = current.status === 'paid' ? 'Payment received. The room is finishing your order.' : 'Waiting for the payment confirmation…';
  }
  async function waitForConfirmation() {
    for (let attempt = 0; attempt < 30 && !stopped && checkout; attempt++) {
      try { await status(); } catch (err) { if (err.status === 404) { error = err.message; return; } }
      if (phase === 'confirmed' || phase === 'failed') return;
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
    if (phase === 'waiting') notice = 'Still waiting. You can return later; this checkout will be here.';
  }
  async function resume() {
    const saved = JSON.parse(sessionStorage.getItem(checkoutKey) || 'null');
    const url = new URL(location.href);
    returnedFromStripe = url.searchParams.has('payment_intent') || url.searchParams.has('redirect_status');
    if (returnedFromStripe) history.replaceState(history.state, '', location.pathname);
    if (!saved?.id || !saved?.idempotency_key) return;
    checkout = saved;
    try {
      await status();
      if (phase === 'waiting' && currentCheckoutStatus === 'reserved' && !returnedFromStripe) {
        try {
          const response = await api('/v1/orders/prepare', { method: 'POST', body: JSON.stringify(saved.body), ...(auth.access ? { token: auth.access } : {}) });
          total = response.total;
          const stripeClient = await loadStripe();
          const intent = await stripeClient.retrievePaymentIntent(response.payment_client_secret);
          if (intent.paymentIntent?.status === 'succeeded' || intent.paymentIntent?.status === 'processing') await waitForConfirmation();
          else await paymentScreen(response.payment_client_secret);
        } catch (err) {
          // An intent already completing at Stripe cannot return its client secret again.
          await waitForConfirmation();
        }
      } else if (phase === 'waiting') await waitForConfirmation();
    } catch (err) { error = err.message; }
  }
  onMount(() => {
    void (async () => { await initAuth(); if (auth.email) email = auth.email; await resume(); })();
    return () => { stopped = true; paymentElement?.destroy(); };
  });
  async function prepare(event) {
    event.preventDefault(); if (processing) return;
    processing = true; error = '';
    try {
      if (!ui.cart.length) throw new Error('Your bag is empty.');
      if (!import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY) throw new Error('This room is not ready to take payments yet.');
      const products = await catalog();
      const lines = ui.cart.map((item) => variantFor(products, item.slug, item.selectedSize));
      if (lines.some((item) => !item)) throw new Error('One of your things is no longer available in this shop. Please check your bag.');
      const currencies = [...new Set(lines.map((item) => item.currency))];
      if (currencies.length !== 1) throw new Error('These things cannot be checked out together.');
      const items = lines.map((item) => ({ product_id: item.id, quantity: 1 }));
      const fingerprint = JSON.stringify({ items, email: email.toLowerCase().trim(), shipping: { line1, city, state: province, postal_code: postalCode, country } });
      const existing = JSON.parse(sessionStorage.getItem(checkoutKey) || 'null');
      if (existing && existing.fingerprint !== fingerprint) throw new Error('Finish or cancel the earlier checkout before changing your bag.');
      const key = existing?.idempotency_key || crypto.randomUUID();
      const body = { idempotency_key: key, customer_email: email.trim(), customer_name: `${firstName} ${lastName}`.trim(), currency: currencies[0], tax_country: country, tax_region: province, shipping: { line1, city, state: province, postal_code: postalCode, country }, items };
      // Store the UUID before sending: retry the same reservation after a lost response.
      saveCheckout({ id: existing?.id || '', idempotency_key: key, fingerprint, body });
      const response = await api('/v1/orders/prepare', { method: 'POST', body: JSON.stringify(body), ...(auth.access ? { token: auth.access } : {}) });
      saveCheckout({ ...checkout, id: response.id });
      total = response.total;
      await paymentScreen(response.payment_client_secret);
    } catch (err) { error = err.message; }
    finally { processing = false; }
  }
  async function pay() {
    if (!stripe || !elements || processing) return;
    processing = true; error = '';
    try {
      const { error: submissionError } = await elements.submit();
      if (submissionError) throw new Error(submissionError.message);
      const result = await stripe.confirmPayment({ elements, confirmParams: { return_url: `${location.origin}/checkout`, payment_method_data: { billing_details: { email, name: `${firstName} ${lastName}`.trim() } } }, redirect: 'if_required' });
      if (result.error) throw new Error(result.error.message);
      phase = 'waiting';
      await waitForConfirmation();
    } catch (err) { error = err.message; }
    finally { processing = false; }
  }
  function cancelPending() {
    // The backend's reservation worker cancels the unpaid intent and releases stock.
    clearCheckout(); paymentElement?.destroy(); phase = 'details'; notice = '';
  }
</script>

<svelte:head><title>Checkout — MOTH MILK</title><meta name="description" content="Checkout with Moth Milk." /></svelte:head>
<main class="checkout-page page-shell">
  <div class="checkout-page__top"><a href="/shop">← Back to shop</a><span>After hours / checkout</span></div>
  <div class="checkout-layout">
    <section class="checkout-tv" aria-labelledby="checkout-title">
      <div class="checkout-tv__screen"><div class="checkout-tv__content">
        <p class="checkout-tv__channel">Moth Milk / Checkout</p><h1 id="checkout-title">Almost <em>yours.</em></h1>
        {#if phase === 'confirmed'}<div class="checkout-tv__empty"><p role="status">{notice}</p><a href="/your-corner">Back to your corner →</a></div>
        {:else if ui.cart.length === 0}<div class="checkout-tv__empty"><p>Your bag is empty.</p><a href="/shop">Find something to take home →</a></div>
        {:else if phase === 'waiting' || phase === 'failed'}<div class="checkout-tv__empty"><p role="status">{notice}</p>{#if phase === 'failed'}<button type="button" onclick={() => (phase = 'details')}>Try again ↗</button>{:else}<button type="button" onclick={waitForConfirmation}>Check again ↗</button>{/if}</div>
        {:else if phase === 'payment'}
          <p class="checkout-tv__intro">One last thing.</p>
          <div class="checkout-form"><fieldset class="checkout-form__payment"><legend>03 / Payment</legend><div class="checkout-form__card checkout-form__card--stripe" bind:this={paymentContainer}></div></fieldset>
            {#if total !== null}<p>Amount from the shop / ${(total / 100).toFixed(2)} CAD</p>{/if}
            <button type="button" disabled={processing} onclick={pay}>{processing ? 'One moment…' : 'Place order'} <span aria-hidden="true">→</span></button>
            <button class="checkout-form__secondary" type="button" onclick={cancelPending}>Start over</button></div>
        {:else}
          <p class="checkout-tv__intro">Where should your things go?</p>
          <form class="checkout-form" onsubmit={prepare}>
            <fieldset><legend>01 / Contact</legend><div class="checkout-form__fields"><label class="checkout-form__full">Email address<input type="email" autocomplete="email" bind:value={email} required /></label></div></fieldset>
            <fieldset><legend>02 / Delivery</legend><div class="checkout-form__fields">
              <label>First name<input autocomplete="given-name" bind:value={firstName} required /></label><label>Last name<input autocomplete="family-name" bind:value={lastName} required /></label>
              <label class="checkout-form__full">Street address<input autocomplete="street-address" bind:value={line1} required /></label><label>City<input autocomplete="address-level2" bind:value={city} required /></label>
              <label>Province / region<input autocomplete="address-level1" bind:value={province} required /></label><label>Postal code<input autocomplete="postal-code" bind:value={postalCode} required /></label>
              <label>Country code<input autocomplete="country" bind:value={country} maxlength="2" required /></label>
            </div></fieldset>
            <button type="submit" disabled={processing}>{processing ? 'A moment…' : 'Continue to payment'} <span aria-hidden="true">→</span></button>
          </form>
        {/if}
        {#if error}<p class="checkout-form__notice" role="alert">{error}</p>{/if}
      </div></div>
      <div class="checkout-tv__controls" aria-hidden="true"><span class="checkout-tv__brand">MM</span><span class="checkout-tv__dial"></span><span class="checkout-tv__dial checkout-tv__dial--small"></span><span class="checkout-tv__power"></span></div><div class="checkout-tv__foot" aria-hidden="true"><span></span><span></span></div>
    </section>
    <aside class="checkout-summary" aria-label="Order summary"><span class="checkout-summary__eyebrow">Your things</span><h2>In your bag.</h2>
      {#if ui.cart.length === 0}<p>Nothing here yet.</p>{:else}<ul>{#each ui.cart as item (item.lineId)}<li><img src={item.image} alt="" /><div><strong>{item.name}</strong><span>{item.selectedSize} · {item.color}</span></div><b>${item.price}</b></li>{/each}</ul><div class="checkout-summary__subtotal"><span>Estimated subtotal / CAD</span><strong>${subtotal}</strong></div><p>Final amount appears on the TV before payment.</p>{/if}<a href="/shop">Keep looking ↗</a>
    </aside>
  </div>
</main>
