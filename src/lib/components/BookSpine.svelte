<script>
  let { book, selected = false, onclick = undefined } = $props();

  const spineStyle = $derived([
    `--spine-width:${book.spine.width}rem`,
    `--spine-height:${book.spine.height}%`,
    `--spine-lean:${book.spine.lean}deg`,
    `--spine-accent:${book.spine.accent}`,
    `--ornament-y:${book.spine.ornamentY ?? 54}%`
  ].join(';'));

  const shelfStyle = $derived([
    `--shelf-x:${(book.shelf.x / 9.79).toFixed(4)}%`,
    `--shelf-y:${(book.shelf.y / 2.48).toFixed(4)}%`,
    `--shelf-width:${(book.shelf.width / 9.79).toFixed(4)}%`,
    `--shelf-height:${(book.shelf.height / 2.48).toFixed(4)}%`,
    `--shelf-image:url('/images/transparent-spines-v1/${book.shelf.image}')`
  ].join(';'));
</script>

<span class={`book-spine-slot book-spine-slot--${book.theme}`} style={shelfStyle}>
  <button
    class:selected
    class={`book-spine book-spine--texture-${book.spine.texture} book-spine--${book.spine.decor} book-spine--${book.theme}`}
    style={spineStyle}
    type="button"
    aria-label={`Select ${book.title}`}
    aria-pressed={selected}
    {onclick}
  >
    <i class="book-spine__headband"></i>
    <span>{book.title}</span>
    <small>MM {book.issue}</small>
    <b class="book-spine__ornament">{book.spine.mark ?? ''}</b>
    <i class="book-spine__footband"></i>
  </button>
</span>
