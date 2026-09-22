<script>
  import BookCover from './BookCover.svelte';
  import { libraryBooks } from '$lib/data/library.js';

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
  <header class="night-library__header">
    <div>
      <span>Free to read in-browser</span>
      <h2 id="library-title">Library</h2>
    </div>

    <div class="library-view" aria-label="Library view">
      <button class:active={view === 'list'} type="button" onclick={() => (view = 'list')}>List</button>
      <button class:active={view === 'shelf'} type="button" onclick={() => (view = 'shelf')}>Shelf</button>
    </div>
  </header>

  <div class="library-browser">
    <article class="library-feature" aria-live="polite">
      <BookCover book={selectedBook} />
      <div class="library-feature__copy">
        <span>MM / {selectedBook.issue} · {selectedBook.minutes} min read</span>
        <h3>{selectedBook.title}</h3>
        <p>{selectedBook.description}</p>
        <button type="button" onclick={() => (readerOpen = true)}>Read free <span>↗</span></button>
      </div>
    </article>

    {#if view === 'list'}
      <div class="library-list">
        {#each libraryBooks as book, index}
          <button class:selected={selectedIndex === index} type="button" onclick={() => selectBook(index)}>
            <BookCover {book} compact />
            <span><strong>{book.title}</strong><small>{book.minutes} min</small></span>
            <i>MM / {book.issue}</i>
          </button>
        {/each}
      </div>
    {:else}
      <div class="library-shelf" aria-label="Bookshelf">
        <div class="library-shelf__books">
          {#each libraryBooks as book, index}
            <button
              class:selected={selectedIndex === index}
              class={`spine spine--${book.theme}`}
              type="button"
              onclick={() => selectBook(index)}
              aria-label={`Select ${book.title}`}
            >
              <span>{book.title}</span>
              <small>MM {book.issue}</small>
            </button>
          {/each}
          {#each Array(8) as _, index}
            <span class={`spine spine--filler spine--filler-${index + 1}`} aria-hidden="true"></span>
          {/each}
        </div>
        <div class="library-shelf__wood"></div>
      </div>
    {/if}
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
