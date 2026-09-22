<script>
  let { book, compact = false } = $props();
</script>

<div class:compact class={`book-cover book-cover--${book.theme}`} aria-hidden="true">
  <div class="book-cover__art"></div>
  <span class="book-cover__edge"></span>
  <span class="book-cover__issue">MML · {book.issue}</span>
  <strong>{book.title}</strong>
  <small>Moth Milk Library</small>
  <span class="book-cover__wear"></span>
</div>
