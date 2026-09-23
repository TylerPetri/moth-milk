<script>
  // @ts-nocheck
  import { onMount } from 'svelte';
  import { confirmReset } from '$lib/stores/auth.svelte.js';
  let token = $state(''); let password = $state(''); let notice = $state(''); let done = $state(false); let busy = $state(false);
  onMount(() => { token = new URL(location.href).searchParams.get('token') || ''; history.replaceState(history.state, '', location.pathname); if (!token) notice = 'This link is missing its page.'; });
  async function submit(event) {
    event.preventDefault(); if (!token || busy) return; busy = true;
    try { await confirmReset(token, password); done = true; notice = 'The book will let you in with your new password.'; token = ''; }
    catch (error) { notice = error.message; } finally { busy = false; password = ''; }
  }
</script>
<svelte:head><title>Find your way back — Moth Milk</title></svelte:head>
<main class="account-note page-shell"><p class="account-note__eyebrow">Moth Milk / After hours</p><h1>A way back in.</h1>
  {#if !done && token}<form onsubmit={submit}><label>New password<input type="password" autocomplete="new-password" minlength="8" bind:value={password} required /></label><button disabled={busy} type="submit">{busy ? 'One moment…' : 'Turn the page ↗'}</button></form>{/if}
  {#if notice}<p role="status">{notice}</p>{/if}<a href="/your-corner">Back to your corner ↗</a>
</main>
