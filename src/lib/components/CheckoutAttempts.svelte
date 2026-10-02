<script lang="ts">
  import { onMount } from 'svelte';
  import type { CheckoutStatusResponse } from '$lib/types/api.ts';
  import type { PendingCheckout, Receipt } from '$lib/types/checkout.ts';
  import { api } from '$lib/api.ts';
  import { auth, initAuth, withAuth } from '$lib/stores/auth.svelte.ts';
  import { checkoutAttempts, readSaved, writeSaved, removeCheckoutAttempt, money, receipts, saveReceipt, forgetReceipts } from '$lib/checkout.ts';
  import { receiptGroup, receiptLabel } from '$lib/receipt-history.ts';
  import { friendlyError } from '$lib/recovery.ts';
  type Entry = CheckoutStatusResponse & { source: 'attempt' | 'receipt'; date?: string };
  const closedKey = 'moth-milk-verified-closed-checkouts';
  let verifiedClosed = $state<string[]>([]);
  const hiddenKey = 'moth-milk-hidden-receipts';
  let justClosed = $state<string[]>([]);
  let attempts = $state<CheckoutStatusResponse[]>([]); let saved = $state<Receipt[]>([]);
  let hidden = $state<string[]>([]); let showHidden = $state(false); let tab = $state<'current' | 'history'>('current');
  let dialog: HTMLDialogElement; let open = $state(false);
  let busy = $state(''); let loading = $state(false); let error = $state(''); let disposed = false;
  let mounted = $state(false); let lastActor: string | undefined; let generation = 0;
  const entries = $derived([...new Map([
    ...saved.map(item => ({ ...item, status: item.status || 'reserved', source: 'receipt', date: item.confirmedAt }) as Entry),
    ...attempts.map(item => { const receipt = saved.find(entry => entry.id === item.id); return { ...receipt, ...item, shipment: item.shipment ?? receipt?.shipment, date: item.created_at || receipt?.confirmedAt, source: receipt ? 'receipt' : 'attempt' } as Entry; })
  ].map(item => [item.id, item])).values()].map((item): Entry => verifiedClosed.includes(item.id) && item.status !== 'confirmed' ? { ...item, status: 'failed', checkout_state: 'closed', actions: { check: false, resume: false, cancel: false, restart: false } } : item));
  const current = $derived(entries.filter(item => receiptGroup(item) === 'current' || justClosed.includes(item.id)));
  const history = $derived(entries.filter(item => receiptGroup(item) === 'history' && !justClosed.includes(item.id)));
  const shown = $derived(tab === 'current' ? current : history.filter(item => showHidden || !hidden.includes(item.id)));
  $effect(() => {
    const actor = auth.verified ? auth.userId || 'guest' : 'guest';
    if (mounted && actor !== lastActor) { lastActor = actor; attempts = []; justClosed = []; void load(); }
  });
  async function load() {
    if (busy) return;
    const version = ++generation; loading = true; saved = receipts();
    try {
      await initAuth(); const actor = auth.userId;
      const deviceKeys = checkoutAttempts();
      const results = await Promise.allSettled([
        api('/v1/checkouts/query', { method: 'POST', body: JSON.stringify({ attempts: deviceKeys.map(({ id, idempotency_key }) => ({ id, idempotency_key })) }) }),
        auth.userId && auth.verified ? withAuth('/v1/checkouts') : Promise.resolve({ checkouts: [] })
      ]);
      if (disposed || version !== generation || auth.userId !== actor) return;
      const returned = results.flatMap(result => result.status === 'fulfilled' ? result.value.checkouts : []);
      attempts = [...new Map([...attempts, ...returned].filter(item => item?.id).map(item => [item.id, item])).values()];
      error = results.some(result => result.status === 'rejected') ? 'Some updates are taking a little longer. Your saved receipts are still here.' : '';
    } catch (err) { if (!disposed && version === generation) error = friendlyError(err, 'Your receipts could not be checked. Come back in a moment.'); }
    finally { if (version === generation) loading = false; }
  }
  function openDrawer() { tab = 'current'; showHidden = false; open = true; dialog.showModal(); }
  function closeDrawer() { dialog.close(); }
  function backdrop(event: MouseEvent) { if (event.target === dialog) closeDrawer(); }
  function changeHidden(item: Entry, value: boolean) {
    if (receiptGroup(item) !== 'history') return;
    const next = value ? [...new Set([...hidden, item.id])].slice(-200) : hidden.filter(id => id !== item.id);
    if (!writeSaved(hiddenKey, next)) { error = 'This device couldn’t save that change. Try again in a moment.'; return; }
    hidden = next;
  }
  async function forget() {
    if (busy || loading) return;
    busy = 'forget'; error = '';
    try { await api('/v1/auth/receipts/forget', { method: 'POST' }); forgetReceipts(); saved = []; }
    catch (err) { error = friendlyError(err, 'We couldn’t forget this device just yet. Please try again.'); }
    finally { busy = ''; }
  }
  async function check(item: Entry) {
    if (busy || loading || receiptGroup(item) !== 'current') return;
    busy = item.id; error = ''; const actor = auth.userId;
    try {
      const key = checkoutAttempts().find(attempt => attempt.id === item.id)?.idempotency_key;
      const response = await api(`/v1/orders/${item.id}/checkout-status`, { method: 'POST', body: JSON.stringify({ idempotency_key: key }) });
      if (response.id !== item.id) throw new Error('Unverified checkout response.');
      if (disposed || actor !== auth.userId) return;
      attempts = attempts.some(attempt => attempt.id === item.id) ? attempts.map(attempt => attempt.id === item.id ? { ...attempt, ...response } : attempt) : [...attempts, response];
      if (response.checkout_state === 'closed' || ['failed', 'cancelled', 'expired', 'refunded'].includes(response.status || '')) {
        if (receiptGroup(response) === 'history') {
          justClosed = [...new Set([...justClosed, item.id])];
          verifiedClosed = [...new Set([...verifiedClosed, item.id])];
          if (!writeSaved(closedKey, verifiedClosed)) error = 'This device couldn’t save the closure. Please check again after reloading.';
        }
      }
      if (item.source === 'receipt') { const receipt = saved.find(entry => entry.id === item.id); if (receipt) saveReceipt({ ...receipt, ...response }); const refreshed = receipts(); saved = saved.map(entry => refreshed.find(value => value.id === entry.id) || entry); }
    } catch (err) { if (!disposed && actor === auth.userId) error = friendlyError(err); }
    finally { busy = ''; }
  }
  async function close(item: Entry) {
    if (busy || loading || !item.actions?.cancel || receiptGroup(item) !== 'current') return;
    busy = item.id; error = ''; const actor = auth.userId;
    try {
      const key = checkoutAttempts().find(attempt => attempt.id === item.id)?.idempotency_key;
      const result = await api(`/v1/orders/${item.id}/checkout-cancel`, { method: 'POST', body: JSON.stringify({ idempotency_key: key }) });
      if (result.id !== item.id || result.restart_allowed !== true || result.status !== 'failed') throw new Error('Unverified checkout closure.');
      removeCheckoutAttempt(item.id);
      const active = readSaved<PendingCheckout>('moth-milk-pending-checkout');
      if (active?.id === item.id) writeSaved('moth-milk-pending-checkout', null);
      if (!disposed && actor === auth.userId) attempts = attempts.map(attempt => attempt.id === item.id ? { ...attempt, status: 'failed', checkout_state: 'closed', actions: { resume: false, cancel: false, restart: true, check: false } } : attempt);
    } catch (err) { if (!disposed && actor === auth.userId) error = friendlyError(err, 'This checkout is still saved. Check on it before paying again.'); }
    finally { busy = ''; }
  }
  onMount(() => {
    const closures = readSaved<unknown>(closedKey);
    verifiedClosed = Array.isArray(closures) ? closures.filter((id): id is string => typeof id === 'string') : [];
    saved = receipts(); const preferences = readSaved<unknown>(hiddenKey);
    hidden = Array.isArray(preferences) ? preferences.filter((id): id is string => typeof id === 'string') : [];
    mounted = true; return () => { disposed = true; generation++; };
  });
</script>
<div class="corner-receipts-launcher">
  <button class="corner-receipts-drawer__quiet" type="button" aria-haspopup="dialog" aria-expanded={open} onclick={openDrawer}>Your receipts</button>

</div>
<dialog class="corner-receipts-drawer" bind:this={dialog} aria-labelledby="receipt-drawer-title" onclick={backdrop} onclose={() => { open = false; }}>
  <div class="corner-receipts-drawer__content">
    <header><div><p class="corner-receipts-drawer__eyebrow">Little things kept</p><h2 id="receipt-drawer-title">Your receipts.</h2></div><button class="corner-receipts-drawer__quiet" type="button" onclick={closeDrawer}>Back to the room</button></header>
    <nav class="corner-receipts-tabs" aria-label="Receipt view">
      <button type="button" aria-pressed={tab === 'current'} onclick={() => { tab = 'current'; }}>Current {#if current.length}<span>{current.length}</span>{/if}</button>
      <button type="button" aria-pressed={tab === 'history'} onclick={() => { tab = 'history'; }}>History</button>
    </nav>
    {#if error}<p class="corner-receipts-drawer__notice" role="alert">{error}</p>{/if}
    <section aria-label={tab === 'current' ? 'Your current receipts' : 'Your receipt history'}>
      {#if !shown.length}<p class="corner-receipts-drawer__empty">{loading ? 'Gathering your receipts…' : tab === 'current' ? 'Nothing waiting right now. Make yourself at home.' : 'Nothing tucked away here yet.'}</p>{/if}
      {#each shown as item (item.id)}
        <article class="corner-receipt-note" aria-label={`Order ${item.id.slice(0, 8)}`}>
          <div class="corner-receipt-note__reference"><span>Order {item.id.slice(0, 8)}</span>{#if item.total != null}<span>{money(item.total, item.currency)}</span>{/if}</div>
          {#if item.date}<p class="corner-receipt-note__date">{new Date(item.date).toLocaleDateString('en-CA', { month: 'short', day: 'numeric', year: 'numeric' })}</p>{/if}
          <p class="corner-receipt-note__status" role="status">{receiptLabel(item)}</p>
          <div class="corner-receipt-note__actions">
            {#if item.status === 'confirmed'}<a class="checkout-receipt__action" href={`/checkout?order=${encodeURIComponent(item.id)}`}>Your receipt</a>{/if}
            {#if justClosed.includes(item.id)}
              <button class="corner-receipts-drawer__quiet" type="button" onclick={() => { justClosed = justClosed.filter(id => id !== item.id); }}>Resolve <span aria-hidden="true">×</span></button>
            {:else if receiptGroup(item) === 'current'}
              {#if item.actions?.resume}<a class="checkout-receipt__action" href={`/checkout?attempt=${encodeURIComponent(item.id)}`}>Pick this up again</a>{/if}
              {#if item.actions?.cancel}<button class="checkout-receipt__action" type="button" disabled={!!busy || loading} onclick={() => close(item)}>{busy === item.id ? 'Closing…' : 'Leave this one'}</button>{/if}
              {#if item.actions?.check !== false}<button class="checkout-receipt__action" type="button" disabled={!!busy || loading} onclick={() => check(item)}>{busy === item.id ? 'Checking…' : 'Check on it'}</button>{/if}
            {:else}<button class="corner-receipts-drawer__quiet" type="button" onclick={() => changeHidden(item, !hidden.includes(item.id))}>{hidden.includes(item.id) ? 'Show on this device' : 'Hide from this device'}</button>{/if}
          </div>
        </article>
      {/each}
    </section>
    <footer>
      <button class="corner-receipts-drawer__quiet" type="button" disabled={loading || !!busy} onclick={load}>{loading ? 'Checking…' : 'Refresh receipts'}</button>
      {#if tab === 'history' && hidden.length}<button class="corner-receipts-drawer__quiet" type="button" aria-pressed={showHidden} onclick={() => { showHidden = !showHidden; }}>{showHidden ? 'Keep hidden receipts tucked away' : 'Show hidden receipts'}</button>{/if}
      {#if saved.length}<button class="corner-receipts-drawer__quiet" type="button" disabled={loading || !!busy} onclick={forget}>{busy === 'forget' ? 'Forgetting…' : 'Forget this device’s receipts'}</button>{/if}
      <p>Hiding a receipt only changes this device. Your order stays with the shop.</p>
    </footer>
  </div>
</dialog>
