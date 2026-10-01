<script lang="ts">import { broadcasts } from '$lib/data/products.ts';</script>

<svelte:head><title>Broadcasts — MOTH MILK</title><meta name="description" content="Notes, fittings and small transmissions from Moth Milk." /></svelte:head>

<main class="broadcasts-page page-shell">
  <header class="page-heading broadcasts-heading">
    <p class="eyebrow"><span class="live-dot"></span> low-power transmission</p>
    <h1>Notes from<br /><em>the floor.</em></h1>
    <p>No content calendar. Just evidence that real people touched the work.</p>
  </header>

  <div class="broadcast-index">
    {#each broadcasts as broadcast, index}
      <article>
        <div class="broadcast-index__number">0{index + 1}</div>
        <div><p>{broadcast.date} / {broadcast.type}</p><h2>{broadcast.title}</h2></div>
        <span>↗</span>
      </article>
    {/each}
  </div>

  <aside class="signal-note"><strong>SIGNAL WEAK</strong><p>That means you are probably far enough from the internet to have a nice day.</p></aside>
</main>
