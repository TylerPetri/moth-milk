<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { accountError } from '$lib/recovery.js';
  import { api } from '$lib/api.js';
  import { auth, refreshSession, initAuth } from '$lib/stores/auth.svelte.ts';
  let message = $state('Opening the note…');
  onMount(() => { void (async () => {
    const token = new URL(location.href).searchParams.get('token');
    history.replaceState(history.state, '', location.pathname);
    if (!token) { message = 'This note has no link inside.'; return; }
    try {
      await api('/v1/auth/email/verify/confirm', { method: 'POST', noShop: true, body: JSON.stringify({ token }) });
      await initAuth();
      if (auth.refresh) await refreshSession();
      await goto('/your-corner', { replaceState: true });
    } catch (error) { message = accountError(error, 'verify'); }
  })(); });
</script>
<svelte:head><title>A note from Moth Milk</title></svelte:head>
<main class="account-note page-shell"><p class="account-note__eyebrow">Moth Milk / After hours</p><h1>{message}</h1><a href="/your-corner">Back to your corner ↗</a></main>
