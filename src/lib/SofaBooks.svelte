<script>
  // @ts-nocheck
  import { onMount } from 'svelte';
  import sofaPositions from '$lib/data/sofa-positions.json';
  let { books = [] } = $props();
  let canvas = $state();
  const scenes = {
    desktop: { size:[1670,942], crops:sofaPositions.desktop },
    mobile: { size:[1024,1536], crops:sofaPositions.mobile }
  };
  const imageLoads = new Map();
  function load(src) {
    if (!imageLoads.has(src)) {
      imageLoads.set(src, new Promise((resolve) => {
        const img = new Image();
        img.addEventListener('load', () => resolve(img), { once: true });
        img.addEventListener('error', () => { imageLoads.delete(src); resolve(null); }, { once: true });
        img.src = src;
      }));
    }
    return imageLoads.get(src);
  }
  let token = 0;
  async function draw(items,mobile) {
    if (!canvas) return;
    const current=++token,mode=mobile?'mobile':'desktop',scene=scenes[mode];
    canvas.width=scene.size[0];canvas.height=scene.size[1];
    const selected=items.slice(0,3);
    if (!selected.length) return;
    const images=await Promise.all(selected.map((book,index)=>
      load(`/images/sofa-books/${book.slug}-${mode}-${index+1}.webp`)));
    if (current!==token || !canvas.isConnected) return;
    const ctx=canvas.getContext('2d');
    images.forEach((image,index)=>{
      if(!image)return;
      const [x,y,w,h]=scene.crops[index];
      ctx.drawImage(image,x,y,w,h);
    });
  }
  let mobile=$state(false);
  onMount(()=>{
    const media=matchMedia('(max-width: 900px)');mobile=media.matches;
    const changed=()=>{mobile=media.matches;};
    media.addEventListener('change',changed);
    return()=>media.removeEventListener('change',changed);
  });
  $effect(()=>{draw(books,mobile);});
</script>
<canvas bind:this={canvas} class="sofa-books-canvas" aria-hidden="true"></canvas>
