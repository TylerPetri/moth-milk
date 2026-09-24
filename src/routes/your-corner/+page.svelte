<script>
  // @ts-nocheck
  import { libraryBooks } from '$lib/data/library.js';
  import SofaBooks from '$lib/SofaBooks.svelte';
  import { onMount } from 'svelte';
  import { auth, initAuth, syncVerification, signIn, register, signOut, requestReset, withAuth } from '$lib/stores/auth.svelte.js';
  import { corner, loadCorner } from '$lib/stores/corner.svelte.js';
  import { catalog } from '$lib/catalog.js';

  const previewBooks = libraryBooks.filter((book) => ['static', 'hush', 'underbed'].includes(book.slug)).sort((a, b) => ['static', 'hush', 'underbed'].indexOf(a.slug) - ['static', 'hush', 'underbed'].indexOf(b.slug));
  const selectedBooks = $derived(auth.userId ? corner.slugs.map((slug) => libraryBooks.find((book) => book.slug === slug)).filter(Boolean) : previewBooks);
  const couchBooks = $derived(selectedBooks.slice(0, 3));
  const coverArt = Object.fromEntries(libraryBooks.map((book, index) => [book.slug, {
    sheet: Math.floor(index / 6) + 1,
    x: (index % 3) * 50,
    y: Math.floor((index % 6) / 3) * 100
  }]));
  let owned = $state([]);
  let sceneNotice = $state('');
  let busy = $state(false);
  let registryMode = $state('sign-in');
  let registryNotice = $state('');
  let registryEmail = $state('');
  let emailProof = $state('');
  let registryPassword = $state('');
  async function loadScene() {
    sceneNotice = '';
    await loadCorner();
    owned = [];
    if (!auth.userId || !auth.verified) return;
    try {
      await withAuth('/v1/orders/claim', { method: 'POST' });
      const [history, items] = await Promise.all([withAuth(`/v1/users/${auth.userId}/orders?limit=100`), catalog()]);
      owned = [...new Set(history.orders.filter((order) => order.status === 'confirmed').flatMap((order) => order.items).map((item) => items.find((product) => product.id === item.product_id)?.attributes?.style_slug).filter(Boolean))];
    } catch (error) { sceneNotice = error.message; }
  }
  onMount(() => { void (async () => {
    await initAuth();
    try { await syncVerification(); } catch (error) { sceneNotice = error.message; }
    await loadScene();
    const pending = JSON.parse(sessionStorage.getItem('moth-milk-proof') || 'null');
    if (pending?.proof && pending?.email && pending?.mode) {
      emailProof = pending.proof; registryEmail = pending.email; registryMode = pending.mode;
      sessionStorage.removeItem('moth-milk-proof'); openRegistry();
    }
  })(); });
  async function checkVerification() {
    if (!auth.refresh || auth.verified) return;
    try { if (await syncVerification()) await loadScene(); } catch (error) { sceneNotice = error.message; }
  }
  async function leaveRoom() { try { await signOut(); owned = []; await loadCorner(); } catch (error) { sceneNotice = error.message; } }
  let listOpen = $state(false);
  /** @type {HTMLDialogElement} */
  let registryDialog;
  /** @type {(typeof libraryBooks)[number] | null} */
  let selectedBook = $state(null);

  function closeReader() { selectedBook = null; }
  /** @param {PointerEvent & { currentTarget: HTMLElement }} event */
  function trackCornerCursor(event) {
    if (event.pointerType === 'touch') return;
    const rect = event.currentTarget.getBoundingClientRect();
    event.currentTarget.style.setProperty('--cursor-x', `${event.clientX - rect.left}px`);
    event.currentTarget.style.setProperty('--cursor-y', `${event.clientY - rect.top}px`);
  }
  /** @param {KeyboardEvent} event */
  function handleKeydown(event) { if (event.key === 'Escape') closeReader(); }

  function openRegistry() { registryNotice = ''; registryDialog.showModal(); }
  function closeRegistry() { registryDialog.close(); registryPassword = ''; }
  /** @param {MouseEvent} event */
  function handleRegistryClick(event) { if (event.target === registryDialog) closeRegistry(); }
  function handleRegistryClose() { registryPassword = ''; }
  /** @param {SubmitEvent} event */
  async function submitRegistry(event) {
    event.preventDefault();
    if (busy) return;
    busy = true; registryNotice = '';
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
    } catch (error) { registryNotice = error.message; }
    finally { busy = false; }
  }
</script>

<svelte:head>
  <title>Your Corner — Moth Milk</title>
  <meta name="description" content="Find a place for your books in the Moth Milk room." />
</svelte:head>
<svelte:window onkeydown={handleKeydown} onfocus={checkVerification} />

<main class="corner-page">
  <section class="corner-scene" aria-labelledby="corner-title" onpointermove={trackCornerCursor}>
    <picture class="corner-scene__picture">
      <source media="(max-width: 900px)" srcset="/images/your-corner-empty-mobile.png" />
      <img class="corner-scene__image" src="/images/your-corner-empty-desktop.png" width="1670" height="942" alt="A shared candlelit loft with a burgundy sofa and a clothing rack" />
    </picture>
    <picture class="corner-belonging corner-belonging--registry" aria-hidden="true"><source media="(max-width: 900px)" srcset="/images/your-corner-registry-mobile.webp" /><img src="/images/your-corner-room.webp" alt="" /></picture>
    {#each ['night-shift-hoodie', 'after-hours-baby-tee', 'mimi-plush'] as item}
      {#if !auth.userId || owned.includes(item)}<picture class={`corner-belonging corner-belonging--${item}`} aria-hidden="true"><source media="(max-width: 900px)" srcset="/images/your-corner-mobile.webp" /><img src="/images/your-corner-room.webp" alt="" /></picture>{/if}
    {/each}
    <SofaBooks books={couchBooks} {coverArt} />
    <div class="corner-scene__shade" aria-hidden="true"></div>
    <h1 class="sr-only" id="corner-title">Your corner</h1>
    {#if !auth.userId || owned.includes('mimi-plush')}<span class="corner-group-label corner-group-label--mimi" aria-hidden="true">Mimi</span>{/if}

    <a class="corner-room-link corner-room-link--library" href="/#library" aria-label="Browse the library and choose books"><span>library <span aria-hidden="true">↗</span></span></a>
    <a class="corner-room-link corner-room-link--shop" href="/shop" aria-label="Browse the Moth Milk shop"><span>shop <span aria-hidden="true">↗</span></span></a>

    <button class="registry-prop" type="button" aria-label="Open the dark Moth Milk book" onclick={openRegistry}><img src="/images/registry-closed.webp" alt="" aria-hidden="true" /></button>

    <div class="corner-books" aria-label="Books on the sofa">
      {#each couchBooks as book, index (book.slug)}
        <button class={`corner-hotspot corner-hotspot--book corner-hotspot--${index + 1}`} type="button" onclick={() => (selectedBook = book)} aria-label={`Read ${book.title}`}>
          <span class="corner-hotspot__target" aria-hidden="true"></span>
        </button>
      {/each}
    </div>

    <div class="corner-rack" aria-label="Clothes on the rack">
      {#if !auth.userId || owned.includes('night-shift-hoodie')}<a class="corner-hotspot corner-hotspot--hoodie" href="/product/night-shift-hoodie" aria-label="View Night Shift Hoodie"><span class="corner-hotspot__target" aria-hidden="true"></span><span class="corner-hotspot__label">Night Shift Hoodie {owned.includes('night-shift-hoodie') ? '· yours' : '↗'}</span></a>{/if}
      {#if !auth.userId || owned.includes('after-hours-baby-tee')}<a class="corner-hotspot corner-hotspot--tee" href="/product/after-hours-baby-tee" aria-label="View After Hours Baby Tee"><span class="corner-hotspot__target" aria-hidden="true"></span><span class="corner-hotspot__label">After Hours Tee {owned.includes('after-hours-baby-tee') ? '· yours' : '↗'}</span></a>{/if}
    </div>
    {#if !auth.userId || owned.includes('mimi-plush')}<a class="corner-plush" href="/product/mimi-plush" aria-label="Meet Mimi Moth Plush">{owned.includes('mimi-plush') ? 'Mimi · yours' : 'meet Mimi ↗'}</a>{/if}
    <button class="corner-list-toggle" type="button" aria-expanded={listOpen} aria-controls="corner-list" onclick={() => (listOpen = !listOpen)}>{listOpen ? 'hide list' : 'view as list'} <span aria-hidden="true">{listOpen ? '×' : '☰'}</span></button>
  </section>

  {#if sceneNotice}<p class="corner-scene-notice" role="status">{sceneNotice}</p>{/if}
  {#if auth.userId}<div class="corner-personal-note"><span>{auth.email}</span>{#if !auth.verified}<span>Check your email to see your past orders here.</span><button type="button" onclick={async () => { try { await withAuth('/v1/auth/email/verify/request', { method: 'POST', body: JSON.stringify({ locale: 'en' }) }); sceneNotice = 'A fresh note is on its way.'; } catch (error) { sceneNotice = error.message; } }}>resend note ↗</button>{/if}<button type="button" onclick={leaveRoom}>leave the room ↗</button></div>{/if}
  {#if listOpen}
    <section class="corner-list" id="corner-list" aria-label="Books and clothing in this corner">
      <div><h2>On the sofa</h2>{#each selectedBooks as book}<button class="corner-list-book" type="button" onclick={() => (selectedBook = book)}>
        <span class="corner-list-cover" aria-hidden="true" style={`--cover-art:url('/images/sofa-cover-atlas-${coverArt[book.slug].sheet}.png');--cover-x:${coverArt[book.slug].x}%;--cover-y:${coverArt[book.slug].y}%`}><span class="corner-list-cover__imprint"><small>MOTH MILK</small><strong>{book.title}</strong><small>AFTER HOURS</small></span></span>
        <span class="corner-list-book__title">{book.title}</span><span class="corner-list-book__time">{book.minutes} min read ↗</span>
      </button>{/each}
      {#if auth.userId && selectedBooks.length === 0}<p>Choose a story from the library and it will find its place here.</p>{/if}
      {#if selectedBooks.length > 3}<p>{selectedBooks.length - 3} more stories are here in the list.</p>{/if}</div>
      <div><h2>On the rack</h2>{#if !auth.userId || owned.includes('night-shift-hoodie')}<a href="/product/night-shift-hoodie">Night Shift Hoodie <span>{owned.includes('night-shift-hoodie') ? 'yours ↗' : 'view ↗'}</span></a>{/if}{#if !auth.userId || owned.includes('after-hours-baby-tee')}<a href="/product/after-hours-baby-tee">After Hours Tee <span>{owned.includes('after-hours-baby-tee') ? 'yours ↗' : 'view ↗'}</span></a>{/if}{#if !auth.userId || owned.includes('mimi-plush')}<a href="/product/mimi-plush">Mimi Moth Plush <span>{owned.includes('mimi-plush') ? 'yours ↗' : 'meet Mimi ↗'}</span></a>{/if}</div>
    </section>
  {/if}
</main>

<dialog class="registry-dialog" bind:this={registryDialog} aria-label="Moth Milk book" onclick={handleRegistryClick} onclose={handleRegistryClose}>
  <div class="registry-ambient" aria-hidden="true"></div>
  <div class="registry-spread">
    <div class="registry-shadow" aria-hidden="true"></div>
    <div class="registry-light" aria-hidden="true"></div>
    <div class="registry-light-blocked" aria-hidden="true"></div>
    <form class="registry-right" onsubmit={submitRegistry}>
      <div class="registry-modes" aria-label="Account action"><button type="button" class:active={registryMode === 'sign-in'} aria-pressed={registryMode === 'sign-in'} onclick={() => { registryMode = 'sign-in'; registryNotice = ''; }}>sign in</button><span aria-hidden="true">/</span><button type="button" class:active={registryMode === 'register'} aria-pressed={registryMode === 'register'} onclick={() => { registryMode = 'register'; registryNotice = ''; }}>register</button></div>
      <label for="registry-email">Email</label>
      <input id="registry-email" type="email" name="email" autocomplete="email" bind:value={registryEmail} required />
      {#if registryMode !== 'recover'}<label for="registry-password">Password</label>
      <input id="registry-password" type="password" name="password" autocomplete={registryMode === 'register' ? 'new-password' : 'current-password'} bind:value={registryPassword} minlength="8" required />{/if}
      <button class="registry-continue" type="submit" disabled={busy}>{registryMode === 'recover' ? 'send a note' : registryMode === 'register' ? 'register' : 'enter'} <span aria-hidden="true">↗</span></button>
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
