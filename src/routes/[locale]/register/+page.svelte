<script>
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  onMount(() => { const url = new URL(location.href); const email = url.searchParams.get('email'); const proof = url.searchParams.get('proof'); history.replaceState(history.state, '', location.pathname); if (email && proof) sessionStorage.setItem('moth-milk-proof', JSON.stringify({ email, proof, mode: 'register' })); void goto('/your-corner'); });
</script>
<svelte:head><title>Enter the room — Moth Milk</title></svelte:head><main class="account-note page-shell"><h1>Find your place in the room.</h1></main>
