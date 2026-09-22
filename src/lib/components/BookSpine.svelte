<script>
  let { book, selected = false, filler = false, onclick = undefined } = $props();
  const fillerStyle = $derived(`--spine-width:${book.width}rem;--spine-height:${book.height}%;--spine-lean:${book.lean}deg;--spine-accent:${book.accent};--ornament-y:${book.ornamentY ?? 54}%`);
</script>

{#if filler}
  <span class={`book-spine book-spine--texture-${book.texture} book-spine--${book.decor} book-spine--filler`} style={fillerStyle} aria-hidden="true">
    <i class="book-spine__headband"></i>
    <b class="book-spine__ornament">{book.mark ?? ''}</b>
    <i class="book-spine__footband"></i>
  </span>
{:else}
  <button
    class:selected
    class={`book-spine book-spine--texture-${book.spine.texture} book-spine--${book.spine.decor} book-spine--${book.theme}`}
    style={`--spine-width:${book.spine.width}rem;--spine-height:${book.spine.height}%;--spine-lean:${book.spine.lean}deg;--spine-accent:${book.spine.accent};--ornament-y:${book.spine.ornamentY ?? 54}%`}
    type="button"
    aria-label={`Select ${book.title}`}
    {onclick}
  >
    <i class="book-spine__headband"></i>
    <span>{book.title}</span>
    <small>MM {book.issue}</small>
    <b class="book-spine__ornament">{book.spine.mark ?? ''}</b>
    <i class="book-spine__footband"></i>
  </button>
{/if}
