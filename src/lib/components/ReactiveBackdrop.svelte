<script>
  import { onMount } from 'svelte';

  /** @type {HTMLDivElement | undefined} */
  let field;

  onMount(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) return;

    /** @param {PointerEvent} event */
    const move = (event) => {
      const x = (event.clientX / window.innerWidth) * 100;
      const y = (event.clientY / window.innerHeight) * 100;
      field?.style.setProperty('--mx', `${x}%`);
      field?.style.setProperty('--my', `${y}%`);
      field?.style.setProperty('--dx', `${(x - 50) * 0.12}px`);
      field?.style.setProperty('--dy', `${(y - 50) * 0.12}px`);
    };
    window.addEventListener('pointermove', move, { passive: true });
    return () => window.removeEventListener('pointermove', move);
  });
</script>

<div bind:this={field} class="signal-field" aria-hidden="true">
  <div class="signal-field__wash"></div>
  <div class="signal-field__ink signal-field__ink--one"><span>soft is not</span> <strong>harmless</strong></div>
  <div class="signal-field__ink signal-field__ink--two">02:14 AM</div>
  <div class="signal-field__ink signal-field__ink--three">MM-001</div>
</div>
