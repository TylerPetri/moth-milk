<script>
  import BookCover from './BookCover.svelte';
  import BookSpine from './BookSpine.svelte';
  import { libraryBooks, shelfFillers } from '$lib/data/library.js';

  let view = $state('shelf');
  let selectedIndex = $state(0);
  let readerOpen = $state(false);
  const selectedBook = $derived(libraryBooks[selectedIndex]);

  /** @param {number} index */
  function selectBook(index) {
    selectedIndex = index;
  }

  /** @param {KeyboardEvent} event */
  function handleKeydown(event) {
    if (event.key === 'Escape') readerOpen = false;
  }
</script>

<svelte:window onkeydown={handleKeydown} />

<section class="night-library" id="library" aria-labelledby="library-title">
  <div class="library-browser">
    <article class="library-feature" aria-live="polite">
      <header class="library-feature__header">
        <h2 id="library-title">Library</h2>
        <span></span>
      </header>

      <div class="library-feature__body">
        <BookCover book={selectedBook} />
        <div class="library-feature__copy">
          <h3>{selectedBook.title}</h3>
          <span>{selectedBook.minutes} min read</span>
          <p>{selectedBook.description}</p>
          <button type="button" onclick={() => (readerOpen = true)}>Read free</button>
        </div>
      </div>
    </article>

    <div class="library-collection">
      <div class="library-view" aria-label="Library view">
        <button class:active={view === 'list'} type="button" onclick={() => (view = 'list')}>List</button>
        <button class:active={view === 'shelf'} type="button" onclick={() => (view = 'shelf')}>Shelf</button>
      </div>

      {#if view === 'list'}
        <div class="library-list">
          {#each libraryBooks as book, index}
            <button class:selected={selectedIndex === index} type="button" onclick={() => selectBook(index)}>
              <BookCover {book} compact />
              <span><strong>{book.title}</strong><small>{book.minutes} min read</small></span>
              <i>MM / {book.issue}</i>
            </button>
          {/each}
        </div>
      {:else}
        <div class="library-shelf" aria-label="Bookshelf">
          <div class="library-shelf__books">
            <BookSpine book={shelfFillers[0]} filler />
            <BookSpine book={shelfFillers[1]} filler />
            <BookSpine book={libraryBooks[0]} selected={selectedIndex === 0} onclick={() => selectBook(0)} />
            <BookSpine book={shelfFillers[2]} filler />
            <BookSpine book={libraryBooks[1]} selected={selectedIndex === 1} onclick={() => selectBook(1)} />
            <BookSpine book={libraryBooks[2]} selected={selectedIndex === 2} onclick={() => selectBook(2)} />
            <BookSpine book={shelfFillers[3]} filler />
            <BookSpine book={libraryBooks[3]} selected={selectedIndex === 3} onclick={() => selectBook(3)} />
            <BookSpine book={shelfFillers[4]} filler />
            <BookSpine book={shelfFillers[5]} filler />
            <BookSpine book={libraryBooks[4]} selected={selectedIndex === 4} onclick={() => selectBook(4)} />
            <BookSpine book={shelfFillers[6]} filler />
            <BookSpine book={shelfFillers[7]} filler />
          </div>
          <div class="library-shelf__wood"></div>
        </div>
      {/if}
    </div>
  </div>
</section>

{#if readerOpen}
  <div class="reader-layer" role="presentation">
    <button class="reader-layer__backdrop" type="button" aria-label="Close reader" onclick={() => (readerOpen = false)}></button>
    <div class="reader" role="dialog" aria-modal="true" aria-labelledby="reader-title">
      <header>
        <span>Moth Milk Library / {selectedBook.issue}</span>
        <button type="button" onclick={() => (readerOpen = false)} aria-label="Close reader">Close</button>
      </header>
      <div class="reader__page">
        <p class="reader__count">{selectedBook.minutes} min read</p>
        <h2 id="reader-title">{selectedBook.title}</h2>
        <div class="reader__text">
          {#each selectedBook.excerpt as paragraph}
            <p>{paragraph}</p>
          {/each}
        </div>
        <p class="reader__end">End of preview</p>
      </div>
    </div>
  </div>
{/if}
