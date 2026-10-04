<script lang="ts">
  import { page } from '$app/state';
  import { beforeNavigate } from '$app/navigation';
  import { onMount } from 'svelte';
  import { ui } from '$lib/stores/ui.svelte.ts';

  let navigation: HTMLElement;
  let menuButton: HTMLButtonElement;

  beforeNavigate(() => { ui.menuOpen = false; });
  onMount(() => {
    document.addEventListener('click', closeOutside, true);
    return () => document.removeEventListener('click', closeOutside, true);
  });

  function closeOutside(event: MouseEvent) {
    if (ui.menuOpen && event.target instanceof Node && !navigation?.contains(event.target) && !menuButton?.contains(event.target)) {
      ui.menuOpen = false;
    }
  }

  function closeOnEscape(event: KeyboardEvent) {
    if (event.key === 'Escape' && ui.menuOpen) {
      ui.menuOpen = false;
      menuButton?.focus();
    }
  }

  const links = [
    { href: '/#library', label: 'library', path: '/' },
    { href: '/shop', label: 'shop', path: '/shop' },
    { href: '/lookbook', label: 'lookbook', path: '/lookbook' },
    { href: '/your-corner', label: 'your corner', path: '/your-corner' }
  ];
</script>

<svelte:document onkeydown={closeOnEscape} />

<header class="site-header">
  <a class="site-header__logo" href="/" aria-label="Moth Milk home">
    <img src="/images/hero-type/wordmark.webp" alt="" width="1200" height="210" />
  </a>

  <nav bind:this={navigation} class:open={ui.menuOpen} aria-label="Main navigation">
    {#each links as link}
      <a class:active={link.path !== '/' && page.url.pathname.startsWith(link.path)} href={link.href} onclick={() => (ui.menuOpen = false)}>{link.label}</a>
    {/each}
  </nav>

  <div class="site-header__actions">
    <button class="bag-button" type="button" onclick={() => (ui.cartOpen = true)}>
      <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M7 8V6a5 5 0 0 1 10 0v2M5 8h14l1 13H4L5 8Z" /></svg>
      <span class:bag-count-pending={!ui.cartReady}>{String(ui.cart.length).padStart(2, '0')}</span>
    </button>
    <button bind:this={menuButton} class="menu-button" type="button" onclick={() => (ui.menuOpen = !ui.menuOpen)} aria-label="Toggle menu" aria-expanded={ui.menuOpen}>
      <span></span><span></span>
    </button>
  </div>
</header>
