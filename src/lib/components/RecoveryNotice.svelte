<script lang="ts">
  let { message, busy = false, retry }: { message: string; busy?: boolean; retry: () => unknown } = $props();
</script>
<div class="recovery-notice" aria-busy={busy}>
  <p role="status">{message}</p>
  <button type="button" disabled={busy} onclick={retry}>{busy ? 'Checking…' : 'Try again ↗'}</button>
</div>
<style>
  .recovery-notice { margin: 1.25rem 0; padding: 1rem 1.25rem; border: 1px solid #bd99804d; background: #251314d9; color: #eed8c3; }
  p { margin: 0 0 .8rem; font: inherit; line-height: 1.5; }
  button { padding: .35rem 0; color: inherit; border: 0; border-bottom: 1px solid #bd9980; background: transparent; font: inherit; cursor: pointer; }
  button:disabled { opacity: .6; cursor: wait; }
</style>
