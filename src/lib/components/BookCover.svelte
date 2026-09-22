<script>
  let { book, compact = false } = $props();
</script>

<div class:compact class={`book-cover book-cover--${book.theme}`} aria-hidden="true">
  <span class="book-cover__edge"></span>
  <span class="book-cover__issue">MML · {book.issue}</span>

  <div class="book-cover__art">
    {#if book.theme === 'signal'}
      <svg viewBox="0 0 160 190">
        <path class="fine" d="M18 34h124M26 47h109M16 158h129M31 170h98" />
        <path class="bold" d="M80 43 68 145h24L80 43Zm-7 48h14M69 114h22" />
        <path class="fine" d="M62 63c-21 12-21 43 0 54M98 63c21 12 21 43 0 54M50 52c-35 23-35 63 0 79M110 52c35 23 35 63 0 79" />
      </svg>
    {:else if book.theme === 'hush'}
      <svg viewBox="0 0 160 190">
        <ellipse class="fine" cx="80" cy="88" rx="41" ry="57" />
        <path class="bold" d="M48 87c17-17 47-17 64 0-17 18-47 18-64 0Z" />
        <path class="paper" d="m50 88 16-4 13 6 14-6 17 4-17 5-14-3-13 3Z" />
        <path class="fine" d="m25 28 18 19M135 28l-18 19M23 148l25-18M137 148l-25-18" />
      </svg>
    {:else if book.theme === 'hall'}
      <svg viewBox="0 0 160 190">
        <path class="fine" d="M18 18h124v154H18zM34 35h92v121H34zM52 53h56v87H52z" />
        <path class="bold" d="M64 70h32v70H64z" />
        <circle class="paper" cx="89" cy="107" r="2.4" />
        <path class="fine" d="M18 18 64 70M142 18 96 70M18 172l46-32M142 172l-46-32" />
      </svg>
    {:else if book.theme === 'void'}
      <svg viewBox="0 0 160 190">
        <rect class="fine" x="24" y="28" width="112" height="120" rx="4" />
        <path class="fine" d="M29 43h102M29 132h102" />
        <path class="bold" d="m36 83 12-8 9 21 12-49 10 67 13-44 9 25 10-12 13 4" />
        <path class="fine" d="M57 160h46M66 148l-4 12M94 148l4 12" />
      </svg>
    {:else}
      <svg viewBox="0 0 160 190">
        <path class="fine" d="M24 88h112v37H24zM34 125v23M126 125v23M31 80h98M43 61h74v19H43z" />
        <path class="bold" d="M24 125h112v36H24z" />
        <path class="paper" d="M57 139c8-9 18-9 23 1 6-10 16-10 23-1" />
        <path class="fine" d="M16 161h128" />
      </svg>
    {/if}
  </div>

  <strong>{book.title}</strong>
  <span class="book-cover__rule"></span>
  <small>Moth Milk Library</small>
  <span class="book-cover__wear"></span>
</div>
