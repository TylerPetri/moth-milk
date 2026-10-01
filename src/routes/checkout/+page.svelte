<script>
  // @ts-nocheck
  import { onMount, tick } from 'svelte';
  import { ui, persistCart } from '$lib/stores/ui.svelte.js';
  import { auth, initAuth } from '$lib/stores/auth.svelte.js';
  import { catalog, variantFor } from '$lib/catalog.js';
  import { api } from '$lib/api.js';
  import { loadStripe } from '$lib/stripe.js';
  import { friendlyError, isUnavailable, watchRecovery } from '$lib/recovery.js';
  import { readSaved, writeSaved, saveReceipt, receipts, money, shipmentLabel } from '$lib/checkout.js';

  const checkoutKey = 'moth-milk-pending-checkout';
  const draftKey = 'moth-milk-checkout-details';
  const stubKey = 'moth-milk-stub-checkout';
  const stubMode = import.meta.env.PUBLIC_PAYMENT_MODE === 'stub';
  const testMode = import.meta.env.PUBLIC_STRIPE_PUBLISHABLE_KEY?.startsWith('pk_test_');
  const subtotal = $derived(ui.cart.reduce((sum, item) => sum + Number(item.price || 0), 0));
  let email = $state(''); let firstName = $state(''); let lastName = $state('');
  let line1 = $state(''); let city = $state(''); let province = $state(''); let postalCode = $state(''); let country = $state('CA');
  let error = $state(''); let notice = $state(''); let phase = $state('restoring'); let processing = $state(false);
  let total = $state(null); let checkout = $state(null); let stripe; let elements; let paymentElement;
  let stubCheckout = $state(null);
  let recoveryConflict = $state(false);
  let trackingView = $state(false);
  async function showTracking(value) {
    trackingView = value;
    const url = new URL(location.href);
    if (value) url.searchParams.set('view', 'tracking'); else url.searchParams.delete('view');
    history.replaceState(history.state, '', url);
    await tick(); document.getElementById('checkout-title')?.focus();
    if (value) await recover();
  }
  let paymentContainer = $state(null); let currentCheckoutStatus = $state(''); let returnedFromStripe = false;
  let stopped = false; let polling = $state(false); let pollController; let receipt = $state(null);
  let currency = $state('CAD'); let recovering = $state(false); let initialized = $state(false);
  const checkoutOutage = 'Something’s wrong on our end. Your checkout is saved—come back here to check it. Please don’t pay again.';
  function showError(err) {
    if (receipt?.status === 'confirmed') { error = friendlyError(err, 'Shipping updates are temporarily unavailable. Your order is still confirmed.'); return; }
    error = friendlyError(err, checkout || stubCheckout || receipt ? checkoutOutage : 'Something’s wrong on our end. Your bag and details are saved. Please try again or come back later.');
  }
  $effect(() => {
    const details = { customer_email: email, customer_name: `${firstName} ${lastName}`.trim(), shipping: { line1, city, state: province, postal_code: postalCode, country } };
    if (initialized && phase === 'details') writeSaved(draftKey, details);
  });
  const summaryItems = $derived(receipt?.items || checkout?.items || stubCheckout?.items || ui.cart);
  function restore(saved) {
    const body = saved.body || {}; const address = body.shipping || {};
    email = body.customer_email || email;
    [firstName, ...nameParts] = (body.customer_name || '').split(' '); lastName = nameParts.join(' ');
    line1 = address.line1 || ''; city = address.city || ''; province = address.state || '';
    postalCode = address.postal_code || ''; country = address.country || 'CA';
    total = saved.total ?? saved.estimatedTotal ?? null; currency = body.currency || saved.currency || 'CAD';
  }
  let nameParts = [];
  function finish(current) {
    const saved = checkout || stubCheckout;
    receipt = saveReceipt({ ...saved, ...current, total: current.total ?? saved.total ?? total, currency: current.currency || saved.body?.currency || currency, confirmedAt: saved.confirmedAt || new Date().toISOString() });
    const purchased = new Set((saved.items || []).map(item => item.lineId));
    ui.cart = ui.cart.filter(item => !purchased.has(item.lineId)); persistCart();
    history.replaceState(history.state, '', `/checkout?order=${encodeURIComponent(receipt.id)}`);
    clearCheckout(); clearStub(); writeSaved(draftKey, null); destroyPaymentElement(); phase = 'confirmed'; notice = 'It is yours. Your order is confirmed.';
  }

  function saveCheckout(value) { checkout = value; if (!writeSaved(checkoutKey, value)) throw new Error('This browser cannot save your checkout. Enable site storage before paying.'); }
  function clearCheckout() { checkout = null; writeSaved(checkoutKey, null); }
  function saveStub(value) { stubCheckout = value; if (!writeSaved(stubKey, value)) throw new Error('This browser cannot save your checkout. Enable site storage before paying.'); }
  function clearStub() { stubCheckout = null; writeSaved(stubKey, null); }
  function destroyPaymentElement() {
    const element = paymentElement;
    paymentElement = null;
    element?.destroy();
  }
  async function paymentScreen(secret) {
    stripe = await loadStripe();
    if (stopped) return;
    if (!stripe) throw new Error('Secure card entry is unavailable.');
    destroyPaymentElement();
    elements = stripe.elements({ clientSecret: secret, appearance: {
      theme: 'night',
      variables: {
        colorPrimary: '#d6a3a5', colorBackground: '#211619', colorText: '#f2e2d6',
        colorDanger: '#ffb7af', colorTextSecondary: '#cfb7b2', colorTextPlaceholder: '#a58c8b',
        fontFamily: 'Georgia, serif', fontSizeBase: '16px', borderRadius: '4px', spacingUnit: '5px'
      },
      rules: {
        '.Input': { border: '1px solid #886d70', boxShadow: 'inset 0 1px 5px rgba(0,0,0,.25)' },
        '.Input:focus': { border: '1px solid #e0b3aa', boxShadow: '0 0 0 2px rgba(214,163,165,.24)' },
        '.Tab': { border: '1px solid #806267' },
        '.Tab--selected': { border: '1px solid #d6a3a5', backgroundColor: '#352127' }
      }
    } });
    paymentElement = elements.create('payment', { layout: 'tabs' });
    phase = 'payment';
    await tick();
    if (stopped) { destroyPaymentElement(); return; }
    paymentElement.mount(paymentContainer);
  }
  async function status(signal) {
    const saved = checkout || receipt;
    if (!saved?.id) return;
    const current = await api(`/v1/orders/${saved.id}/checkout-status`, { method: 'POST', signal, timeoutMs: 15000, body: JSON.stringify({ idempotency_key: saved.idempotency_key, ...(saved.tracking_proof ? { tracking_proof: saved.tracking_proof } : {}) }) });
    if (stopped || signal?.aborted) return;
    if (!['reserved', 'paid', 'confirmed', 'failed', 'cancelled'].includes(current.status)) throw Object.assign(new Error('Checkout response unavailable.'), { retryable: true });
    error = ''; currentCheckoutStatus = current.status;
    if (current.status === 'confirmed') {
      if (checkout) finish(current);
      else { receipt = saveReceipt({ ...receipt, ...current, shipment: current.shipment_unavailable ? receipt.shipment : current.shipment || null, shipment_unavailable: Boolean(current.shipment_unavailable) }); phase = 'confirmed'; notice = 'It is yours. Your order is confirmed.'; }
      return;
    }
    if (current.status === 'failed' || current.status === 'cancelled') {
      destroyPaymentElement(); phase = 'failed';
      notice = current.status === 'cancelled' ? 'This checkout was cancelled. Your bag is still here.' : 'Your order could not be completed. Check with the shop before trying another payment if your card was charged.';
      return;
    }
    phase = 'waiting';
    notice = current.status === 'paid' ? 'Payment received. We are confirming your order. Please do not pay again.' : 'Waiting for payment confirmation. Please do not pay again.';
  }
  async function waitForConfirmation() {
    if (polling || stopped || phase === 'failed') return;
    polling = true; const started = Date.now(); pollController = new AbortController();
    const signal = pollController.signal;
    try {
      for (let attempt = 0; attempt < 15 && !signal.aborted; attempt++) {
        try { await status(signal); }
        catch (err) {
          if (signal.aborted) return;
          if (err.status === 404) error = 'This receipt could not be verified. Keep your order number and contact the shop.'; else showError(err);
          if (err.status === 404 || isUnavailable(err)) return;
        }
        if (phase === 'waiting' && currentCheckoutStatus === 'reserved' && recoveryConflict) { error = checkoutOutage; notice = 'Your checkout is saved. Come back a little later to check it. Please don’t pay again.'; return; }
        if (Date.now() - started >= 45000) break;
        if (phase === 'confirmed' || phase === 'failed' || (!checkout?.id && !receipt?.id)) return;
        await new Promise(resolve => { const timer = setTimeout(done, Math.min(2000 * (attempt + 1), 10000)); function done() { clearTimeout(timer); signal.removeEventListener('abort', done); resolve(); } signal.addEventListener('abort', done, { once: true }); });
      }
      if (phase === 'waiting') notice = 'Confirmation is taking longer than usual. Your checkout is saved. Check again here; please do not pay again.';
    } finally { polling = false; }
  }
  async function resume() {
    if (recovering || polling || processing || stopped) return;
    recovering = true;
    try { await restoreCheckout(); } catch (err) { if (!stopped) showError(err); } finally { recovering = false; }
  }
  async function restoreCheckout() {
    const recovered = await api('/v1/auth/recovery', { noShop: true }).catch(() => null);
    for (const key of [checkoutKey, stubKey]) { const saved = readSaved(key); if (saved && recovered?.body?.idempotency_key === saved.idempotency_key) { saved.body = { ...saved.body, ...recovered.body }; if (key === checkoutKey) checkout = saved; else stubCheckout = saved; } }
    const urlParams = new URL(location.href).searchParams;
    trackingView = urlParams.get('view') === 'tracking';
    const orderId = urlParams.get('order');
    const proof = new URLSearchParams(location.hash.slice(1)).get('proof') || urlParams.get('tracking_proof');
    receipt = orderId ? receipts().find(item => item.id === orderId) : null;
    if (orderId && proof) { await api('/v1/auth/receipt', { method: 'POST', body: JSON.stringify({ id: orderId, tracking_proof: proof }) }); receipt = saveReceipt({ ...receipt, id: orderId, tracking_proof: proof }); history.replaceState(history.state, '', `/checkout?order=${encodeURIComponent(orderId)}`); }
    if (receipt) { total = receipt.total ?? null; currency = receipt.currency || 'CAD'; phase = receipt.status === 'confirmed' ? 'confirmed' : 'waiting'; notice = receipt.status === 'confirmed' ? 'It is yours. Your order is confirmed.' : 'Checking your receipt…'; await waitForConfirmation(); return; }
    if (orderId) { error = 'This receipt is not saved on this device. Open the tracking link from your order email.'; return; }
    if (stubMode) {
      const savedStub = stubCheckout || readSaved(stubKey);
      if (!savedStub?.idempotency_key) { const draft = readSaved(draftKey); if (draft) restore({ body: draft }); phase = 'details'; return; }
      stubCheckout = savedStub; restore(savedStub);
      if (savedStub.id) {
        checkout = savedStub; phase = 'waiting'; notice = 'Checking your saved checkout. Please don’t pay again.';
        await waitForConfirmation();
      } else if (savedStub.paymentSubmitted) {
        phase = 'waiting'; notice = checkoutOutage;
        try { const response = await api('/v1/orders', { method: 'POST', body: JSON.stringify(savedStub.body), ...(auth.access ? { token: auth.access } : {}) }); const saved = { ...savedStub, id: response.id, total: response.total }; saveStub(saved); checkout = saved; await waitForConfirmation(); } catch (err) { showError(err); }
      } else { phase = 'payment'; total = savedStub.estimatedTotal; }
      return;
    }
    const saved = checkout || readSaved(checkoutKey);
    const url = new URL(location.href);
    returnedFromStripe = url.searchParams.has('payment_intent') || url.searchParams.has('redirect_status');
    if (returnedFromStripe) history.replaceState(history.state, '', location.pathname);
    if (!saved?.idempotency_key) { const draft = readSaved(draftKey); if (draft) restore({ body: draft }); phase = 'details'; return; }
    checkout = saved; restore(saved); phase = 'waiting'; notice = 'Checking your saved checkout. Please don’t pay again.';
    if (!saved.id && !saved.body?.customer_email) { phase = 'waiting'; notice = 'Your checkout is saved, but its details could not be recovered. Please don’t pay again. Return using your order email or contact the shop.'; return; }
    if (!saved.id) {
      try { const response = await api('/v1/orders/prepare', { method: 'POST', timeoutMs: 15000, body: JSON.stringify(saved.body), ...(auth.access ? { token: auth.access } : {}) }); saveCheckout({ ...saved, id: response.id, total: response.total }); total = response.total; await paymentScreen(response.payment_client_secret); }
      catch (err) { showError(err); }
      return;
    }
    try {
      await status();
      if (phase === 'waiting' && currentCheckoutStatus === 'reserved' && !returnedFromStripe) {
        try {
          const response = await api('/v1/orders/prepare', { method: 'POST', body: JSON.stringify(saved.body), ...(auth.access ? { token: auth.access } : {}) });
          total = response.total; saveCheckout({ ...checkout, total });
          const stripeClient = await loadStripe();
          const intent = await stripeClient.retrievePaymentIntent(response.payment_client_secret);
          if (intent.paymentIntent?.status === 'succeeded' || intent.paymentIntent?.status === 'processing') await waitForConfirmation();
          else await paymentScreen(response.payment_client_secret);
        } catch (err) {
          if (err.status === 409) { recoveryConflict = true; await status(); if (phase === 'waiting') { error = checkoutOutage; notice = 'Your checkout is saved. Come back a little later to check it. Please don’t pay again.'; } return; }
          showError(err);
          if (!isUnavailable(err)) await waitForConfirmation();
        }
      } else if (phase === 'waiting') await waitForConfirmation();
    } catch (err) { showError(err); }
  }
  async function recover() {
    if (recovering || processing || polling || stopped || phase === 'failed') return;
    if (phase === 'confirmed' || (phase === 'waiting' && checkout?.id)) await waitForConfirmation();
    else if (phase === 'waiting') await resume();
  }
  onMount(() => {
    const stopRecovery = watchRecovery(recover);
    const pause = () => { if (document.visibilityState === 'hidden') pollController?.abort(); };
    document.addEventListener('visibilitychange', pause);
    void (async () => { try { await initAuth(); } catch { /* Guest checkout remains available. */ } if (auth.email) email = auth.email; await resume(); })().catch(showError).finally(() => { initialized = true; if (phase === 'restoring') phase = 'details'; });
    return () => { stopped = true; stopRecovery(); document.removeEventListener('visibilitychange', pause); pollController?.abort(); destroyPaymentElement(); };
  });
  async function prepare(event) {
    event.preventDefault(); if (processing || recovering || polling) return;
    processing = true; error = '';
    try {
      if (!ui.cart.length) throw new Error('Your bag is empty.');
      if (!stubMode && !import.meta.env.PUBLIC_STRIPE_PUBLISHABLE_KEY) throw new Error('This room is not ready to take payments yet.');
      writeSaved(draftKey, { customer_email: email, customer_name: `${firstName} ${lastName}`.trim(), shipping: { line1, city, state: province, postal_code: postalCode, country } });
      const products = await catalog();
      const lines = ui.cart.map((item) => variantFor(products, item.slug, item.selectedSize));
      if (lines.some((item) => !item)) throw new Error('One of your things is no longer available in this shop. Please check your bag.');
      const currencies = [...new Set(lines.map((item) => item.currency))];
      if (currencies.length !== 1) throw new Error('These things cannot be checked out together.');
      currency = currencies[0];
      const items = lines.map((item) => ({ product_id: item.id, quantity: 1 }));
      const fingerprint = JSON.stringify({ items, name: `${firstName} ${lastName}`.trim(), email: email.toLowerCase().trim(), shipping: { line1, city, state: province, postal_code: postalCode, country } });
      if (stubMode) {
        const existingStub = readSaved(stubKey);
        if (existingStub && existingStub.fingerprint !== fingerprint) throw new Error('Finish the earlier checkout before changing your bag.');
        const body = {
          idempotency_key: existingStub?.idempotency_key || crypto.randomUUID(),
          stripe_payment_method_id: 'pm_card_visa', customer_email: email.trim(),
          customer_name: `${firstName} ${lastName}`.trim(), currency: currencies[0],
          tax_country: country, tax_region: province,
          shipping: { line1, city, state: province, postal_code: postalCode, country },
          items: lines.map((item) => ({ product_id: item.id, sku: item.sku, quantity: 1, unit_price: item.amount, currency: item.currency }))
        };
        const estimatedTotal = lines.reduce((sum, item) => sum + item.amount, 0);
        saveStub({ idempotency_key: body.idempotency_key, fingerprint, body, estimatedTotal, items: structuredClone($state.snapshot(ui.cart)), currency: currencies[0] });
        total = estimatedTotal; phase = 'payment'; return;
      }
      const existing = readSaved(checkoutKey);
      if (existing && existing.fingerprint !== fingerprint) throw new Error('Finish or cancel the earlier checkout before changing your bag.');
      const key = existing?.idempotency_key || crypto.randomUUID();
      const body = { idempotency_key: key, customer_email: email.trim(), customer_name: `${firstName} ${lastName}`.trim(), currency: currencies[0], tax_country: country, tax_region: province, shipping: { line1, city, state: province, postal_code: postalCode, country }, items };
      // Store the UUID before sending: retry the same reservation after a lost response.
      saveCheckout({ id: existing?.id || '', idempotency_key: key, fingerprint, body, items: structuredClone($state.snapshot(ui.cart)), currency: currencies[0] });
      const response = await api('/v1/orders/prepare', { method: 'POST', body: JSON.stringify(body), ...(auth.access ? { token: auth.access } : {}) });
      saveCheckout({ ...checkout, id: response.id, total: response.total });
      total = response.total;
      await paymentScreen(response.payment_client_secret);
    } catch (err) { showError(err); if (checkout && isUnavailable(err)) { phase = 'waiting'; notice = checkoutOutage; } }
    finally { processing = false; }
  }
  async function pay() {
    if (stubMode) {
      if (!stubCheckout?.body || processing || recovering || polling) return;
      processing = true; error = '';
      try {
        saveStub({ ...stubCheckout, paymentSubmitted: true });
        const response = await api('/v1/orders', { method: 'POST', body: JSON.stringify(stubCheckout.body), ...(auth.access ? { token: auth.access } : {}) });
        const updated = { ...stubCheckout, id: response.id, total: response.total };
        saveStub(updated); checkout = updated;
        if (response.status === 'confirmed') {
          finish(response);
        }
        else { phase = 'waiting'; notice = 'The room is finishing your order…'; await waitForConfirmation(); }
      } catch (err) { showError(err); if (isUnavailable(err)) { checkout = stubCheckout; phase = 'waiting'; notice = checkoutOutage; } }
      finally { processing = false; }
      return;
    }
    if (!stripe || !elements || processing || recovering || polling) return;
    processing = true; error = '';
    try {
      const { error: submissionError } = await elements.submit();
      if (submissionError) throw new Error(submissionError.message);
      saveCheckout({ ...checkout, paymentSubmitted: true });
      const result = await stripe.confirmPayment({ elements, confirmParams: { return_url: `${location.origin}/checkout`, payment_method_data: { billing_details: { email, name: `${firstName} ${lastName}`.trim() } } }, redirect: 'if_required' });
      if (result.error) {
        if (['validation_error', 'card_error'].includes(result.error.type)) { saveCheckout({ ...checkout, paymentSubmitted: false }); throw new Error(result.error.message); }
        throw Object.assign(new Error(checkoutOutage), { retryable: true });
      }
      phase = 'waiting';
      await waitForConfirmation();
    } catch (err) { showError(err); if (checkout?.paymentSubmitted) { phase = 'waiting'; notice = checkoutOutage; destroyPaymentElement(); } }
    finally { processing = false; }
  }
  function cancelPending() {
    if (phase !== 'failed') return;
    clearCheckout(); clearStub(); destroyPaymentElement(); phase = 'details'; notice = ''; error = '';
  }
</script>

<svelte:head><title>Checkout — MOTH MILK</title><meta name="description" content="Checkout with Moth Milk." /></svelte:head>
<main class="checkout-page page-shell">
  <div class="checkout-page__top"><a href="/shop">← Back to shop</a><span>After hours / checkout</span></div>
  <div class="checkout-layout">
    <section class="checkout-tv" aria-labelledby="checkout-title">
      <div class="checkout-tv__screen"><div class="checkout-tv__content">
        <p class="checkout-tv__channel">Moth Milk / Checkout</p><h1 id="checkout-title" tabindex="-1">{#if phase === 'confirmed' && trackingView}Your <em>things.</em>{:else if phase === 'confirmed'}All <em>yours.</em>{:else}Almost <em>yours.</em>{/if}</h1>
        {#if phase === 'restoring'}<div class="checkout-tv__empty"><p role="status">Finding your saved checkout…</p></div>
        {:else if phase === 'confirmed'}
          <div class="checkout-receipt">
            <p class="checkout-receipt__status" role="status">{notice}</p>
            {#if receipt}
              <div class="checkout-receipt__reference"><span>Order</span><span>{receipt.id}</span></div>
              {#if trackingView}<div class="checkout-receipt__shipping">
                <h2>A note from the room</h2>
                <p>{receipt.shipment_unavailable ? 'Shipping updates are temporarily unavailable. Your order is still confirmed.' : receipt.shipment?.status ? shipmentLabel(receipt.shipment.status) : 'Your order is confirmed and waiting to be packed.'}</p>
                {#if receipt.shipment?.tracking_number}<p class="checkout-receipt__tracking">{receipt.shipment.carrier} · {receipt.shipment.tracking_number}</p>{/if}
              </div>{/if}
            {/if}
            <div class="checkout-receipt__actions">
              {#if receipt}
                {#if trackingView}
                  <button class="checkout-receipt__action" type="button" disabled={polling || recovering || processing} onclick={recover}>{polling || recovering ? 'Checking…' : 'Refresh update ↗'}</button>
                  <button class="checkout-receipt__back" type="button" onclick={() => showTracking(false)}>← Your receipt</button>
                {:else}<button class="checkout-receipt__action" type="button" onclick={() => showTracking(true)}>Track your things ↗</button>{/if}
              {/if}
              <a class="checkout-receipt__action" href="/your-corner">Your corner ↗</a>
            </div>
          </div>
        {:else if ui.cart.length === 0 && phase === 'details'}<div class="checkout-tv__empty"><p>Your bag is empty.</p><a href="/shop">Find something to take home →</a></div>
        {:else if phase === 'waiting' || phase === 'failed'}<div class="checkout-tv__empty"><p role="status">{notice}</p>{#if phase === 'failed'}<div class="checkout-receipt__actions"><button class="checkout-receipt__action" type="button" onclick={cancelPending}>Try again ↗</button></div>{:else}<div class="checkout-receipt__actions"><button class="checkout-receipt__action" type="button" disabled={polling || recovering || processing} onclick={recover}>{polling || recovering ? 'Checking…' : 'Check again ↗'}</button>{#if currentCheckoutStatus === 'reserved' && !polling && !recovering && !checkout?.paymentSubmitted}<button class="checkout-receipt__action" type="button" disabled={recovering || processing} onclick={resume}>Return to saved card entry ↗</button>{/if}</div>{/if}</div>
        {:else if phase === 'payment'}
          <p class="checkout-tv__intro">One last thing.</p>
          <div class="checkout-form"><fieldset class="checkout-form__payment"><legend>03 / Payment</legend>
            <div class="checkout-payment">
              <div class="checkout-payment__header"><span class="checkout-payment__stitch" aria-hidden="true">✳</span><div><strong>Keep this one close.</strong><small>{stubMode ? 'A test card for this room.' : 'Card details go straight to Stripe.'}</small></div><span class="checkout-payment__star" aria-hidden="true">✦</span></div>
              {#if stubMode}<div class="checkout-payment__demo" role="status"><span>✦ MOTH MILK · TEST CARD</span><strong>•••• &nbsp; •••• &nbsp; •••• &nbsp; 4242</strong><small>Visa test payment · no card details needed</small></div>
              {:else}<div class="checkout-form__card checkout-form__card--stripe" bind:this={paymentContainer}></div>{/if}
              <div class="checkout-payment__footer"><span aria-hidden="true">✧ · ✧ · ✧</span><span>Safe inside the screen</span></div>
            </div>
            {#if !stubMode && testMode}<p class="checkout-payment__test">Testing the room? Use 4242 4242 4242 4242, any future expiry, and any three digits for CVC.</p>{/if}
          </fieldset>
            {#if total !== null}<p>Amount from the shop / {money(total, currency)}</p>{/if}
            <button type="button" disabled={processing} onclick={pay}>{processing ? 'One moment…' : stubMode ? 'Place test order' : 'Place order'} <span aria-hidden="true">→</span></button>
            <p>Your checkout is saved on this device. Return here to finish it.</p></div>
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
    <aside class="checkout-summary" aria-label="Order summary"><span class="checkout-summary__eyebrow">Your things</span><h2>{receipt ? 'Yours.' : checkout || stubCheckout ? 'This checkout.' : 'In your bag.'}</h2>
      {#if summaryItems.length === 0}<p>{receipt ? 'See your order email for the item details.' : 'Nothing here yet.'}</p>{:else}<ul>{#each summaryItems as item (item.lineId)}<li><img src={item.image} alt="" /><div><strong>{item.name}</strong><span>{item.selectedSize} · {item.color}</span></div><b>${item.price}</b></li>{/each}</ul><div class="checkout-summary__subtotal"><span>{total !== null ? 'Shop total' : 'Estimated subtotal / CAD'}</span><strong>{total !== null ? money(total, currency) : `$${subtotal}`}</strong></div>{#if !receipt}<p>Final amount appears on the TV before payment.</p>{/if}{/if}<a href="/shop">Keep looking ↗</a>
    </aside>
  </div>
</main>
