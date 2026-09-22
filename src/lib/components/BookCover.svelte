<script>
  let { book, compact = false } = $props();
</script>

<div class:compact class={`book-cover book-cover--${book.theme}`} aria-hidden="true">
  <span class="book-cover__issue">MM / {book.issue}</span>
  <strong>{book.title}</strong>
  <i></i>
  <small>Moth Milk Library</small>
</div>
