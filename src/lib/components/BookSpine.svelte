<script>
  let { book, selected = false, filler = false, onclick = undefined } = $props();
  const fillerStyle = $derived(`--spine-width:${book.width}rem;--spine-height:${book.height}%;--spine-lean:${book.lean}deg;--spine-accent:${book.accent}`);
</script>

{#if filler}
  <span class={`book-spine book-spine--${book.material} book-spine--filler`} style={fillerStyle} aria-hidden="true">
    <i></i><b></b><i></i>
  </span>
{:else}
  <button
    class:selected
    class={`book-spine book-spine--${book.spine.material} book-spine--${book.theme}`}
    style={`--spine-width:${book.spine.width}rem;--spine-height:${book.spine.height}%;--spine-lean:${book.spine.lean}deg;--spine-accent:${book.spine.accent}`}
    type="button"
    aria-label={`Select ${book.title}`}
    {onclick}
  >
    <i></i>
    <span>{book.title}</span>
    <small>MM {book.issue}</small>
    <b></b>
  </button>
{/if}
