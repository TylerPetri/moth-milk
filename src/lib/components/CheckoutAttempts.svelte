<script lang="ts">
  import { onMount } from 'svelte';
  import type { CheckoutStatusResponse } from '$lib/types/api.ts';
  import { api } from '$lib/api.ts';
  import { auth, initAuth, withAuth } from '$lib/stores/auth.svelte.ts';
  import { checkoutAttempts, readSaved, writeSaved, removeCheckoutAttempt, money } from '$lib/checkout.ts';
  import type { PendingCheckout } from '$lib/types/checkout.ts';
  import { friendlyError } from '$lib/recovery.ts';
  let attempts = $state<CheckoutStatusResponse[]>([]);
  let busy = $state(''); let error = $state(''); let disposed = false;
  let mounted = $state(false); let lastActor: string | undefined; let generation = 0;
  $effect(() => {
    const actor = auth.verified ? auth.userId || 'guest' : 'guest';
    if (mounted && actor !== lastActor) { lastActor = actor; void load(); }
  });
  const labels: Record<string, string> = { not_started: 'This one never reached payment. You can leave it here.', recovery_pending: 'Still waiting for news.', awaiting_payment: 'You left this one open.', processing: 'Your payment is still moving. Check back here.', payment_received: 'Payment received. Your order is being confirmed.', refund_pending: 'Your payment is being returned. Check back here.', refunded: 'Your payment was returned. Close this one before starting again.', closed: 'This one is closed. Your bag is still here.' };
  async function load() {
    const version = ++generation;
    try {
      await initAuth();
      const actor = auth.userId;
      const saved = checkoutAttempts();
      const [device, account] = await Promise.all([
        api('/v1/checkouts/query', { method: 'POST', body: JSON.stringify({ attempts: saved.map(({ id, idempotency_key }) => ({ id, idempotency_key })) }) }),
        auth.userId && auth.verified ? withAuth('/v1/checkouts') : Promise.resolve({ checkouts: [] })
      ]);
      if (!disposed && version === generation && auth.userId === actor) { error = ''; attempts = [...new Map([...device.checkouts, ...account.checkouts].filter(item => item.status !== 'confirmed').map(item => [item.id, item])).values()]; }
    } catch (err) { if (!disposed && version === generation) error = friendlyError(err, 'Your saved checkouts could not be checked. Come back in a moment.'); }
  }
  async function check(item: CheckoutStatusResponse) {
    if (busy) return;
    busy = item.id; error = '';
    try {
      const saved = checkoutAttempts().find(attempt => attempt.id === item.id);
      const current = await api(`/v1/orders/${item.id}/checkout-status`, { method: 'POST', body: JSON.stringify({ idempotency_key: saved?.idempotency_key }) });
      if (current.id !== item.id) throw new Error('This checkout response could not be verified.');
      if (!disposed) attempts = attempts.map(attempt => attempt.id === item.id ? current : attempt);
    } catch (err) { if (!disposed) error = friendlyError(err); }
    finally { busy = ''; }
  }
  async function close(item: CheckoutStatusResponse) {
    if (busy || !item.actions?.cancel) return;
    busy = item.id; error = '';
    try {
      const saved = checkoutAttempts().find(attempt => attempt.id === item.id);
      const result = await api(`/v1/orders/${item.id}/checkout-cancel`, { method: 'POST', body: JSON.stringify({ idempotency_key: saved?.idempotency_key }) });
      if (result.id !== item.id || result.restart_allowed !== true || result.status !== 'failed') throw new Error('We could not verify that this checkout closed. Check on it before paying again.');
      removeCheckoutAttempt(item.id);
      const active = readSaved<PendingCheckout>('moth-milk-pending-checkout');
      if (active?.id === item.id) writeSaved('moth-milk-pending-checkout', null);
      if (!disposed) attempts = attempts.map(attempt => attempt.id === item.id ? { ...item, status: 'failed', checkout_state: 'closed', restart_allowed: true, actions: { resume: false, cancel: false, restart: true, check: false } } : attempt);
    } catch (err) { if (!disposed) error = friendlyError(err, 'This checkout is still saved. Check on it before paying again.'); }
    finally { busy = ''; }
  }
  onMount(() => { mounted = true; return () => { disposed = true; }; });
</script>

{#if attempts.length || error}
<section class="corner-list checkout-attempts" aria-label="Your ongoing checkouts">
  <div><h2>Still waiting.</h2><p>A few things you left before the lights went out.</p>
    {#if error}<p role="alert">{error}</p><button type="button" onclick={load}>Check again ↗</button>{/if}
    {#each attempts as item (item.id)}
      <article aria-label={`Checkout ${item.id.slice(0, 8)}`}>
        <p>Checkout {item.id.slice(0, 8)} {#if item.total != null}· {money(item.total, item.currency)}{/if}{#if item.payment_environment === 'test'} · test{/if}</p>
        <p role="status">{item.status === 'confirmed' ? 'It is yours. Your order is confirmed.' : labels[item.checkout_state || ''] || labels.recovery_pending}</p>
        <div class="attempt-actions">
          {#if item.status === 'confirmed'}<a href={`/checkout?order=${encodeURIComponent(item.id)}`}>Your receipt ↗</a>
          {:else if item.restart_allowed && item.actions?.restart}<a href="/checkout">Start again ↗</a>
          {:else}
            {#if item.actions?.resume}<a href={`/checkout?attempt=${encodeURIComponent(item.id)}`}>Pick this up again ↗</a>{/if}
            {#if item.actions?.cancel}<button type="button" disabled={!!busy} onclick={() => close(item)}>{busy === item.id ? 'Closing…' : 'Leave this one ↗'}</button>{/if}
            <button type="button" disabled={!!busy} onclick={() => check(item)}>{busy === item.id ? 'Checking…' : 'Check on it ↗'}</button>
          {/if}
        </div>
      </article>
    {/each}
  </div>
</section>
{/if}
<style>
  .checkout-attempts article { padding: 1.25rem 0; border-top: 1px solid #795c63; }
  .attempt-actions { display: flex; flex-wrap: wrap; gap: .8rem; align-items: center; }
  .attempt-actions a, .attempt-actions button { font: inherit; color: inherit; background: transparent; border: 1px solid #795c63; padding: .7rem 1rem; text-decoration: none; cursor: pointer; }
  .attempt-actions button:disabled { opacity: .55; cursor: wait; }
</style>
