<script>
  import { ui } from '$lib/stores/ui.svelte.js';

  function toggleMood() {
    ui.mood = ui.mood === 'soft' ? 'feral' : 'soft';
  }
</script>

<button class="mood-switch" type="button" onclick={toggleMood} aria-label={`Switch to ${ui.mood === 'soft' ? 'feral' : 'soft'} mood`}>
  <span class:active={ui.mood === 'soft'}>low light</span>
  <i aria-hidden="true"></i>
  <span class:active={ui.mood === 'feral'}>flash</span>
</button>
