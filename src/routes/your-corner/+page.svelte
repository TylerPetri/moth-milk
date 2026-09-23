<script>
  import { libraryBooks } from '$lib/data/library.js';

  const cornerBooks = libraryBooks.filter((book) => ['static', 'hush', 'underbed'].includes(book.slug)).sort((a, b) => ['static', 'hush', 'underbed'].indexOf(a.slug) - ['static', 'hush', 'underbed'].indexOf(b.slug));
  let listOpen = $state(false);
  /** @type {HTMLDialogElement} */
  let registryDialog;
  let registryMode = $state('sign-in');
  let registryEmail = $state('');
  let registryPassword = $state('');
  let registryNotice = $state('');
  /** @type {(typeof libraryBooks)[number] | null} */
  let selectedBook = $state(null);

  function closeReader() { selectedBook = null; }
  /** @param {KeyboardEvent} event */
  function handleKeydown(event) { if (event.key === 'Escape') closeReader(); }

  function openRegistry() { registryNotice = ''; registryDialog.showModal(); }
  function closeRegistry() { registryDialog.close(); registryPassword = ''; }
  /** @param {MouseEvent} event */
  function handleRegistryClick(event) { if (event.target === registryDialog) closeRegistry(); }
  function handleRegistryClose() { registryPassword = ''; }
  /** @param {SubmitEvent} event */
  function submitRegistry(event) {
    event.preventDefault();
    registryNotice = 'Accounts are not connected in this preview. Your details were not sent or saved.';
  }
</script>

<svelte:head>
  <title>Your Corner — Moth Milk</title>
  <meta name="description" content="Find a place for your books in the Moth Milk room." />
</svelte:head>
<svelte:window onkeydown={handleKeydown} />

<main class="corner-page">
  <section class="corner-scene" aria-labelledby="corner-title">
    <picture class="corner-scene__picture">
      <source media="(max-width: 900px)" srcset="/images/your-corner-mobile.webp" />
      <img class="corner-scene__image" src="/images/your-corner-room.webp" srcset="/images/your-corner-room.webp 1670w, /images/your-corner-room-4k.webp 3840w" sizes="100vw" width="1670" height="942" alt="A shared candlelit loft with readers in the distance, books on a burgundy sofa, a moth plush and a clothing rack" />
    </picture>
    <div class="corner-scene__shade" aria-hidden="true"></div>
    <h1 class="sr-only" id="corner-title">Your corner</h1>
    <span class="corner-group-label corner-group-label--stories" aria-hidden="true">stories</span>
    <span class="corner-group-label corner-group-label--rack" aria-hidden="true">on the rack</span>
    <span class="corner-group-label corner-group-label--mimi" aria-hidden="true">Mimi</span>

    <button class="registry-prop" type="button" aria-label="Open the dark Moth Milk book" onclick={openRegistry}><img src="/images/registry-closed.webp" alt="" aria-hidden="true" /></button>

    <div class="corner-books" aria-label="Books on the sofa">
      {#each cornerBooks as book, index (book.slug)}
        <button class={`corner-hotspot corner-hotspot--book corner-hotspot--${index + 1}`} type="button" onclick={() => (selectedBook = book)} aria-label={`Read ${book.title}`}>
          <span class="corner-hotspot__target" aria-hidden="true"></span>
          <span class="corner-hotspot__label">{book.title} <span aria-hidden="true">↗</span></span>
        </button>
      {/each}
    </div>

    <div class="corner-rack" aria-label="Clothes on the rack">
      <a class="corner-hotspot corner-hotspot--hoodie" href="/product/night-shift-hoodie" aria-label="View Night Shift Hoodie"><span class="corner-hotspot__target" aria-hidden="true"></span><span class="corner-hotspot__label">Night Shift Hoodie ↗</span></a>
      <a class="corner-hotspot corner-hotspot--tee" href="/product/after-hours-baby-tee" aria-label="View After Hours Baby Tee"><span class="corner-hotspot__target" aria-hidden="true"></span><span class="corner-hotspot__label">After Hours Tee ↗</span></a>
    </div>
    <a class="corner-plush" href="/product/mimi-plush" aria-label="Meet Mimi Moth Plush">meet Mimi ↗</a>
    <button class="corner-list-toggle" type="button" aria-expanded={listOpen} aria-controls="corner-list" onclick={() => (listOpen = !listOpen)}>{listOpen ? 'hide list' : 'view as list'} <span aria-hidden="true">{listOpen ? '×' : '☰'}</span></button>
  </section>

  {#if listOpen}
    <section class="corner-list" id="corner-list" aria-label="Books and clothing in this corner">
      <div><h2>On the sofa</h2>{#each cornerBooks as book}<button type="button" onclick={() => (selectedBook = book)}>{book.title}<span>{book.minutes} min read ↗</span></button>{/each}</div>
      <div><h2>On the rack</h2><a href="/product/night-shift-hoodie">Night Shift Hoodie <span>view ↗</span></a><a href="/product/after-hours-baby-tee">After Hours Tee <span>view ↗</span></a><a href="/product/mimi-plush">Mimi Moth Plush <span>meet Mimi ↗</span></a></div>
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
      <label for="registry-password">Password</label>
      <input id="registry-password" type="password" name="password" autocomplete={registryMode === 'register' ? 'new-password' : 'current-password'} bind:value={registryPassword} minlength="8" required />
      <button class="registry-continue" type="submit">{registryMode === 'register' ? 'register' : 'enter'} <span aria-hidden="true">↗</span></button>
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
