<script>
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  onMount(() => { const url = new URL(location.href); const email = url.searchParams.get('email'); const proof = url.searchParams.get('proof'); history.replaceState(history.state, '', location.pathname); if (email && proof) sessionStorage.setItem('moth-milk-proof', JSON.stringify({ email, proof, mode: 'sign-in' })); void goto('/your-corner'); });
</script>
<svelte:head><title>Back in the room — Moth Milk</title></svelte:head><main class="account-note page-shell"><h1>The book remembers you.</h1></main>
