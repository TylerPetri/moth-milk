<script lang="ts">
  import type { LibraryBook } from '$lib/types/content.ts';
  import sofaPositions from '$lib/data/sofa-positions.json';
  let { books = [] }: { books?: LibraryBook[] } = $props();
  function position(index: number) {
    const [x, y, width, height] = sofaPositions.desktop[index];
    const [mx, my, mw, mh] = sofaPositions.mobile[index];
    return `--book-x:${x / 1670 * 100}%;--book-y:${y / 942 * 100}%;--book-width:${width / 1670 * 100}%;--book-height:${height / 942 * 100}%;--mobile-book-x:${mx / 1024 * 100}%;--mobile-book-y:${my / 1536 * 100}%;--mobile-book-width:${mw / 1024 * 100}%;--mobile-book-height:${mh / 1536 * 100}%`;
  }
</script>

<div class="sofa-books" aria-hidden="true">
  {#each books.slice(0, 3) as book, index (index)}
    <picture style={position(index)}>
      <source media="(max-width: 900px)" srcset={`/images/sofa-books/${book.slug}-mobile-${index + 1}.webp`} />
      <img src={`/images/sofa-books/${book.slug}-desktop-${index + 1}.webp`} width={sofaPositions.desktop[index][2]} height={sofaPositions.desktop[index][3]} alt="" decoding="async" />
    </picture>
  {/each}
</div>

<style>
  .sofa-books { position: absolute; inset: 0; pointer-events: none; }
  picture { position: absolute; display: block; left: var(--book-x); top: var(--book-y); width: var(--book-width); height: var(--book-height); }
  img { display: block; width: 100%; height: 100%; }
  @media (max-width: 900px) {
    picture { left: var(--mobile-book-x); top: var(--mobile-book-y); width: var(--mobile-book-width); height: var(--mobile-book-height); }
  }
</style>
