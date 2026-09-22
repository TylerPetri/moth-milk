<script>
  import { page } from '$app/state';
  import { ui } from '$lib/stores/ui.svelte.js';

  const links = [
    { href: '/#library', label: 'library', path: '/' },
    { href: '/shop', label: 'shop', path: '/shop' },
    { href: '/lookbook', label: 'lookbook', path: '/lookbook' },
    { href: '/about', label: 'about', path: '/about' }
  ];
</script>

<header class="site-header">
  <a class="site-header__logo" href="/" aria-label="Moth Milk home">
    <img src="/images/hero-type/wordmark.webp" alt="" width="1200" height="210" />
  </a>

  <nav class:open={ui.menuOpen} aria-label="Main navigation">
    {#each links as link}
      <a class:active={link.path !== '/' && page.url.pathname.startsWith(link.path)} href={link.href} onclick={() => (ui.menuOpen = false)}>{link.label}</a>
    {/each}
  </nav>

  <div class="site-header__actions">
    <button class="bag-button" type="button" onclick={() => (ui.cartOpen = true)}>
      <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M7 8V6a5 5 0 0 1 10 0v2M5 8h14l1 13H4L5 8Z" /></svg>
      <span>{String(ui.cart.length).padStart(2, '0')}</span>
    </button>
    <button class="menu-button" type="button" onclick={() => (ui.menuOpen = !ui.menuOpen)} aria-label="Toggle menu" aria-expanded={ui.menuOpen}>
      <span></span><span></span>
    </button>
  </div>
</header>
