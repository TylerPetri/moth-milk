<script lang="ts">
  let { data }: import('./$types').PageProps = $props();
  let hydrated = $state(false);
  const roomUser = $derived(hydrated ? auth.userId : data.session?.userId || '');
  const roomReady = $derived(hydrated ? auth.ready : Boolean(data.session));
  import type { LibraryBook } from '$lib/types/content.ts';
  import { libraryBooks } from '$lib/data/library.ts';
  import CheckoutAttempts from '$lib/components/CheckoutAttempts.svelte';
  import SofaBooks from '$lib/SofaBooks.svelte';
  import { onMount } from 'svelte';
  import { auth, initAuth, syncVerification, signIn, register, signOut, requestReset, withAuth } from '$lib/stores/auth.svelte.ts';
  import { corner, loadCorner } from '$lib/stores/corner.svelte.ts';
  import RecoveryNotice from '$lib/components/RecoveryNotice.svelte';
  import { friendlyError, watchRecovery, accountError, accountValidation } from '$lib/recovery.ts';
  let sceneBusy = $state(false); let disposed = false;
  import { catalog } from '$lib/catalog.ts';

  const previewBooks = libraryBooks.filter((book) => ['static', 'hush', 'underbed'].includes(book.slug)).sort((a, b) => ['static', 'hush', 'underbed'].indexOf(a.slug) - ['static', 'hush', 'underbed'].indexOf(b.slug));
  const roomBooks = $derived(hydrated ? corner.slugs : data.room?.books || []);
  const selectedBooks = $derived(!roomReady ? [] : roomUser ? roomBooks.map((slug) => libraryBooks.find((book) => book.slug === slug)).filter((book) => book !== undefined) : previewBooks);
  const couchBooks = $derived(selectedBooks.slice(0, 3));
  let loadedOwned = $state<string[]>([]);
  const owned = $derived(hydrated ? loadedOwned : data.room?.owned || []);
  let sceneNotice = $state('');
  let busy = $state(false);
  let registryMode = $state('sign-in');
  let registryNotice = $state('');
  let registryEmail = $state('');
  let emailProof = $state('');
  let registryPassword = $state('');
  async function loadScene() {
    if (sceneBusy || disposed) return;
    sceneBusy = true;
    try {
      await initAuth();
      await syncVerification();
      await loadCorner();
      if (corner.error) { sceneNotice = corner.error; return; }
      if (!auth.userId || !auth.verified) { loadedOwned = []; sceneNotice = ''; return; }
      await withAuth('/v1/orders/claim', { method: 'POST' });
      const [history, items] = await Promise.all([withAuth(`/v1/users/${auth.userId}/orders?limit=100`), catalog()]);
      if (!disposed) {
        loadedOwned = [...new Set(history.orders.filter((order) => order.status === 'confirmed').flatMap((order) => order.items).map((item) => items.find((product) => product.id === item.product_id)?.attributes?.style_slug).filter((slug): slug is string => Boolean(slug)))];
        sceneNotice = '';
      }
    } catch (error) { if (!disposed) sceneNotice = friendlyError(error, 'Something’s wrong on our end. Your room could not be updated. Try again or come back later.'); }
    finally { sceneBusy = false; }
  }
  onMount(() => {
    if (data.session && data.room) { Object.assign(corner, { slugs: data.room.books, loaded: data.room.loaded }); loadedOwned = data.room.owned; }
    hydrated = true;
    void loadScene();
    try {
      const pending = JSON.parse(sessionStorage.getItem('moth-milk-proof') || 'null');
      if (pending?.proof && pending?.email && pending?.mode) {
        emailProof = pending.proof; registryEmail = pending.email; registryMode = pending.mode;
        sessionStorage.removeItem('moth-milk-proof'); openRegistry();
      }
    } catch { /* Invalid saved proof cannot prevent the room opening. */ }
    const stop = watchRecovery(() => { if (sceneNotice || (auth.refresh && !auth.verified)) return loadScene(); });
    return () => { disposed = true; stop(); };
  });
  async function leaveRoom() { try { await signOut(); loadedOwned = []; await loadCorner(); } catch (error) { sceneNotice = friendlyError(error); } }
  let listOpen = $state(false);
  let registryDialog: HTMLDialogElement;
  let selectedBook = $state<LibraryBook | null>(null);

  function closeReader() { selectedBook = null; }
  function trackCornerCursor(event: PointerEvent & { currentTarget: HTMLElement }) {
    if (event.pointerType === 'touch') return;
    const rect = event.currentTarget.getBoundingClientRect();
    event.currentTarget.style.setProperty('--cursor-x', `${event.clientX - rect.left}px`);
    event.currentTarget.style.setProperty('--cursor-y', `${event.clientY - rect.top}px`);
  }
  function handleKeydown(event: KeyboardEvent) { if (event.key === 'Escape') closeReader(); }

  function openRegistry() { registryNotice = ''; registryDialog.showModal(); }
  function closeRegistry() { registryDialog.close(); registryPassword = ''; }
  function handleRegistryClick(event: MouseEvent) { if (event.target === registryDialog) closeRegistry(); }
  function handleRegistryClose() { registryPassword = ''; }
  async function submitRegistry(event: SubmitEvent) {
    event.preventDefault();
    if (busy) return;
    registryNotice = accountValidation(registryEmail, registryPassword, registryMode);
    if (registryNotice) return;
    busy = true;
    try {
      if (registryMode === 'recover') {
        await requestReset(registryEmail);
        registryNotice = 'If this address belongs here, a note is on its way.';
      } else {
        if (registryMode === 'register') await register(registryEmail, registryPassword, emailProof);
        else await signIn(registryEmail, registryPassword, emailProof);
        emailProof = ''; closeRegistry();
        await loadScene();
      }
    } catch (error) { registryNotice = accountError(error, registryMode); }
    finally { busy = false; }
  }
</script>

<svelte:head>
  <link rel="preload" as="image" href="/images/your-corner-empty-desktop.png" media="(min-width: 901px)" />
  <link rel="preload" as="image" href="/images/your-corner-empty-mobile.png" media="(max-width: 900px)" />
  <title>Your Corner — Moth Milk</title>
  <meta name="description" content="Find a place for your books in the Moth Milk room." />
</svelte:head>
<svelte:window onkeydown={handleKeydown} />

<main class="corner-page">
  <section class="corner-scene" aria-labelledby="corner-title" onpointermove={trackCornerCursor}>
    <picture class="corner-scene__picture">
      <source media="(max-width: 900px)" srcset="/images/your-corner-empty-mobile.png" />
      <img fetchpriority="high" class="corner-scene__image" src="/images/your-corner-empty-desktop.png" width="1670" height="942" alt="A shared candlelit loft with a burgundy sofa and a clothing rack" />
    </picture>
    <picture class="corner-belonging corner-belonging--registry" aria-hidden="true"><source media="(max-width: 900px)" srcset="/images/your-corner-registry-mobile.webp" /><img src="/images/your-corner-room.webp" alt="" /></picture>
    {#each ['night-shift-hoodie', 'after-hours-baby-tee', 'mimi-plush'] as item}
      {#if roomReady && (!roomUser || owned.includes(item))}<picture class={`corner-belonging corner-belonging--${item}`} aria-hidden="true"><source media="(max-width: 900px)" srcset="/images/your-corner-mobile.webp" /><img src="/images/your-corner-room.webp" alt="" /></picture>{/if}
    {/each}
    <SofaBooks books={couchBooks} />
    <div class="corner-scene__shade" aria-hidden="true"></div>
    <h1 class="sr-only" id="corner-title">Your corner</h1>
    {#if roomReady && (!roomUser || owned.includes('mimi-plush'))}<span class="corner-group-label corner-group-label--mimi" aria-hidden="true">Mimi</span>{/if}

    <a class="corner-room-link corner-room-link--library" href="/#library" aria-label="Browse the library and choose books"><span>library <span aria-hidden="true">↗</span></span></a>
    <a class="corner-room-link corner-room-link--shop" href="/shop" aria-label="Browse the Moth Milk shop"><span>shop <span aria-hidden="true">↗</span></span></a>

    <button class="registry-prop" type="button" aria-label="Open the sign-in and registration book" onclick={openRegistry}><img src="/images/registry-closed-mobile-preview.png" alt="" aria-hidden="true" /></button>

    <div class="corner-books" aria-label="Books on the sofa">
      {#each couchBooks as book, index (book.slug)}
        <button class={`corner-hotspot corner-hotspot--book corner-hotspot--${index + 1}`} type="button" onclick={() => (selectedBook = book)} aria-label={`Read ${book.title}`}>
          <span class="corner-hotspot__target" aria-hidden="true"></span>
        </button>
      {/each}
    </div>

    <div class="corner-rack" aria-label="Clothes on the rack">
      {#if roomReady && (!roomUser || owned.includes('night-shift-hoodie'))}<a class="corner-hotspot corner-hotspot--hoodie" href="/product/night-shift-hoodie?from=your-corner" aria-label="View Night Shift Hoodie"><span class="corner-hotspot__target" aria-hidden="true"></span><span class="corner-hotspot__label">Night Shift Hoodie </span></a>{/if}
      {#if roomReady && (!roomUser || owned.includes('after-hours-baby-tee'))}<a class="corner-hotspot corner-hotspot--tee" href="/product/after-hours-baby-tee?from=your-corner" aria-label="View After Hours Baby Tee"><span class="corner-hotspot__target" aria-hidden="true"></span><span class="corner-hotspot__label">After Hours Tee </span></a>{/if}
    </div>
    {#if roomReady && (!roomUser || owned.includes('mimi-plush'))}<a class="corner-hotspot corner-hotspot--mimi" href="/product/mimi-plush?from=your-corner" aria-label="Meet Mimi Moth Plush"><span class="corner-hotspot__target" aria-hidden="true"></span><span class="corner-hotspot__label">{owned.includes('mimi-plush') ? 'Mimi' : 'meet Mimi'}</span></a>{/if}
    <button class="corner-list-toggle" type="button" aria-expanded={listOpen} aria-controls="corner-list" onclick={() => (listOpen = !listOpen)}>{listOpen ? 'hide list' : 'view as list'} <span aria-hidden="true">{listOpen ? '×' : '☰'}</span></button>
  </section>


  {#if sceneNotice}<RecoveryNotice message={sceneNotice} busy={sceneBusy} retry={loadScene} />{/if}
  <div class="corner-personal-note">{#if roomUser}<span>{hydrated ? auth.email : data.session?.email}</span>{#if !(hydrated ? auth.verified : data.session?.verified)}<span>Check your email to see your past orders here.</span><button type="button" onclick={async () => { try { await withAuth('/v1/auth/email/verify/request', { method: 'POST', body: JSON.stringify({ locale: 'en' }) }); sceneNotice = 'A fresh note is on its way.'; } catch (error) { sceneNotice = friendlyError(error); } }}>resend note</button>{/if}{/if}<CheckoutAttempts />{#if roomUser}<button type="button" onclick={leaveRoom}>leave the room</button>{/if}</div>
  {#if listOpen}
    <section class="corner-list" id="corner-list" aria-label="Books and clothing in this corner">
      <div><h2>On the sofa</h2>{#each selectedBooks as book}<button class="corner-list-book" type="button" onclick={() => (selectedBook = book)}>
        <span class="corner-list-cover" aria-hidden="true" style={`--cover-art:url('/images/sofa-books/${book.slug}-cover.webp')`}></span>
        <span class="corner-list-book__title">{book.title}</span><span class="corner-list-book__time">{book.minutes} min read</span>
      </button>{/each}
      {#if auth.userId && selectedBooks.length === 0}<p>Choose a story from the library and it will find its place here.</p>{/if}
      {#if selectedBooks.length > 3}<p>{selectedBooks.length - 3} more stories are here in the list.</p>{/if}</div>
      <div><h2>On the rack</h2>{#if roomReady && (!roomUser || owned.includes('night-shift-hoodie'))}<a href="/product/night-shift-hoodie?from=your-corner">Night Shift Hoodie <span>{auth.userId ? '' : 'view'}</span></a>{/if}{#if roomReady && (!roomUser || owned.includes('after-hours-baby-tee'))}<a href="/product/after-hours-baby-tee?from=your-corner">After Hours Tee <span>{auth.userId ? '' : 'view'}</span></a>{/if}{#if roomReady && (!roomUser || owned.includes('mimi-plush'))}<a href="/product/mimi-plush?from=your-corner">Mimi Moth Plush <span>{auth.userId ? '' : 'meet Mimi'}</span></a>{/if}</div>
    </section>
  {/if}
</main>

<dialog class="registry-dialog" bind:this={registryDialog} aria-label="Moth Milk book" onclick={handleRegistryClick} onclose={handleRegistryClose}>
  <div class="registry-ambient" aria-hidden="true"></div>
  <div class="registry-spread">
    <div class="registry-shadow" aria-hidden="true"></div>
    <div class="registry-light" aria-hidden="true"></div>
    <div class="registry-light-blocked" aria-hidden="true"></div>
    <form class="registry-right" novalidate onsubmit={submitRegistry}>
      <div class="registry-modes" aria-label="Account action"><button type="button" class:active={registryMode === 'sign-in'} aria-pressed={registryMode === 'sign-in'} onclick={() => { registryMode = 'sign-in'; registryNotice = ''; }}>sign in</button><span aria-hidden="true">/</span><button type="button" class:active={registryMode === 'register'} aria-pressed={registryMode === 'register'} onclick={() => { registryMode = 'register'; registryNotice = ''; }}>register</button></div>
      <label for="registry-email">Email</label>
      <input id="registry-email" type="email" name="email" autocomplete="email" bind:value={registryEmail} required />
      {#if registryMode !== 'recover'}<label for="registry-password">Password</label>
      <input id="registry-password" type="password" name="password" autocomplete={registryMode === 'register' ? 'new-password' : 'current-password'} bind:value={registryPassword} required />{/if}
      <button class="registry-continue" type="submit" disabled={busy}>{registryMode === 'recover' ? 'send a note' : registryMode === 'register' ? 'register' : 'enter'} </button>
      <button class="registry-recover" type="button" onclick={() => { registryMode = registryMode === 'recover' ? 'sign-in' : 'recover'; registryNotice = ''; }}>{registryMode === 'recover' ? 'back to the book' : 'lost your way in?'}</button>
      {#if registryNotice}<p class="registry-notice" role="status">{registryNotice}</p>{/if}
    </form>
  </div>
  <button class="registry-light-close" type="button" aria-label="Close book" onclick={closeRegistry}></button>
</dialog>

{#if selectedBook}
  <div class="reader-layer" role="presentation">
    <button class="reader-layer__backdrop" type="button" aria-label="Close reader" onclick={closeReader}></button>
    <div class="reader" role="dialog" aria-modal="true" aria-labelledby="corner-reader-title">
      <header><span>Moth Milk Library / {selectedBook.issue}</span><button type="button" onclick={closeReader} aria-label="Close reader">Close</button></header>
      <div class="reader__page"><p class="reader__count">{selectedBook.minutes} min read</p><h2 id="corner-reader-title">{selectedBook.title}</h2><div class="reader__text">{#each selectedBook.excerpt as paragraph}<p>{paragraph}</p>{/each}</div><p class="reader__end">End of preview</p></div>
    </div>
  </div>
{/if}
