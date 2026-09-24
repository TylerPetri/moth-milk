<script>
  // @ts-nocheck
  import { onMount } from 'svelte';
  let { books = [], coverArt = {} } = $props();
  let canvas = $state();
  // Book silhouettes, page edges and contact shadows come from the photographed preview.
  // Only the printed face varies by story; the room backgrounds never change.
  const scenes = {
    desktop: { size:[1670,942], photo:'/images/your-corner-room.webp', slots:[
      { crop:[493,582,238,176], shape:[[500,618],[651,601],[720,719],[551,747]], face:[[510,627],[646,609],[704,707],[558,727]] },
      { crop:[739,587,238,169], shape:[[748,617],[892,607],[963,720],[783,748]], face:[[755,626],[889,614],[948,706],[793,729]] },
      { crop:[921,565,270,184], shape:[[932,614],[1068,582],[1182,702],[1020,740]], face:[[944,621],[1062,591],[1168,694],[1029,718]] }
    ] },
    mobile: { size:[1024,1536], photo:'/images/your-corner-mobile.webp', slots:[
      { crop:[323,902,257,203], shape:[[332,944],[482,918],[568,1072],[387,1095]], face:[[347,954],[473,934],[548,1052],[398,1071]] },
      { crop:[525,900,264,202], shape:[[532,935],[696,914],[779,1058],[590,1090]], face:[[546,944],[686,925],[764,1042],[603,1066]] },
      { crop:[719,877,284,194], shape:[[727,919],[868,889],[996,1019],[815,1062]], face:[[740,927],[854,902],[982,1006],[830,1040]] }
    ] }
  };
  // Concurrent renders share the same pending load instead of replacing onload.
  const imageLoads = new Map();
  function load(src) {
    if (!imageLoads.has(src)) {
      imageLoads.set(src, new Promise((resolve) => {
        const img = new Image();
        img.addEventListener('load', () => resolve(img), { once: true });
        img.addEventListener('error', () => { imageLoads.delete(src); resolve(img); }, { once: true });
        img.src = src;
      }));
    }
    return imageLoads.get(src);
  }
  function point(face,u,v) {
    const [a,b,c,d]=face;
    return [a[0]*(1-u)*(1-v)+b[0]*u*(1-v)+c[0]*u*v+d[0]*(1-u)*v,
      a[1]*(1-u)*(1-v)+b[1]*u*(1-v)+c[1]*u*v+d[1]*(1-u)*v];
  }
  function mapTriangle(ctx,img,src,dst) {
    const [a,b,c]=src,[p,q,r]=dst;
    const det=(a[0]-c[0])*(b[1]-c[1])-(b[0]-c[0])*(a[1]-c[1]);
    if(!det)return;
    const xx=((p[0]-r[0])*(b[1]-c[1])-(q[0]-r[0])*(a[1]-c[1]))/det;
    const xy=((q[0]-r[0])*(a[0]-c[0])-(p[0]-r[0])*(b[0]-c[0]))/det;
    const yx=((p[1]-r[1])*(b[1]-c[1])-(q[1]-r[1])*(a[1]-c[1]))/det;
    const yy=((q[1]-r[1])*(a[0]-c[0])-(p[1]-r[1])*(b[0]-c[0]))/det;
    ctx.save();ctx.beginPath();ctx.moveTo(...p);ctx.lineTo(...q);ctx.lineTo(...r);ctx.closePath();ctx.clip();
    ctx.setTransform(xx,yx,xy,yy,p[0]-xx*a[0]-xy*a[1],p[1]-yx*a[0]-yy*a[1]);
    ctx.drawImage(img,0,0);ctx.restore();
  }
  function cover(book,art,atlas) {
    const out=document.createElement('canvas');out.width=240;out.height=320;
    const c=out.getContext('2d');const w=atlas.naturalWidth/3,h=atlas.naturalHeight/2;
    c.fillStyle='#1b1012';c.fillRect(0,0,240,320);
    c.drawImage(atlas,(art.x/50)*w,(art.y/100)*h,w,h,0,0,240,320);
    const shade=c.createLinearGradient(0,0,0,320);
    shade.addColorStop(0,'rgba(20,8,10,.42)');shade.addColorStop(.5,'rgba(15,7,8,.12)');shade.addColorStop(1,'rgba(12,5,6,.65)');
    c.fillStyle=shade;c.fillRect(0,0,240,320);
    c.strokeStyle='#bba080';c.lineWidth=2;c.strokeRect(13,13,214,294);
    c.textAlign='center';c.fillStyle='#f3d8ae';c.shadowColor='#140b0b';c.shadowBlur=7;
    c.font='bold 12px Georgia';c.fillText('MOTH MILK',120,39);
    c.font=`bold ${book.title.length>17?25:32}px Georgia`;
    const lines=[],words=book.title.toUpperCase().split(' ');let line='';
    for(const word of words){const next=line?line+' '+word:word;if(c.measureText(next).width>196&&line){lines.push(line);line=word;}else line=next;}if(line)lines.push(line);
    lines.forEach((text,i)=>c.fillText(text,120,220+(i-(lines.length-1)/2)*34));
    c.font='12px Georgia';c.fillText('AFTER HOURS',120,289);
    return out;
  }
  let token=0;
  async function draw(items,artwork,mobile) {
    if(!canvas)return;
    const current=++token,scene=mobile?scenes.mobile:scenes.desktop,books=items.slice(0,3);
    if (!books.length) {
      canvas.width=scene.size[0];canvas.height=scene.size[1];
      return;
    }
    const [photo,...atlases]=await Promise.all([load(scene.photo),...books.map(b=>load(`/images/sofa-cover-atlas-${artwork[b.slug]?.sheet}.png`))]);
    if(current!==token||!canvas.isConnected||!photo.naturalWidth)return;
    canvas.width=scene.size[0];canvas.height=scene.size[1];
    const ctx=canvas.getContext('2d');
    books.forEach((book,i)=>{
      const slot=scene.slots[i], [x,y,w,h]=slot.crop, f=slot.face;
      // A feathered contour keeps the original cushion indentation and page block.
      const layer=document.createElement('canvas');layer.width=scene.size[0];layer.height=scene.size[1];
      const lc=layer.getContext('2d');lc.drawImage(photo,x,y,w,h,x,y,w,h);
      const mask=document.createElement('canvas');mask.width=layer.width;mask.height=layer.height;
      const mc=mask.getContext('2d');mc.filter='blur(4px)';mc.fillStyle='#fff';
      mc.beginPath();mc.moveTo(...slot.shape[0]);
      for(const corner of slot.shape.slice(1))mc.lineTo(...corner);
      mc.closePath();mc.fill();
      lc.globalCompositeOperation='destination-in';lc.drawImage(mask,0,0);
      ctx.drawImage(layer,0,0);
      const atlas=atlases[i],art=artwork[book.slug];if(!atlas?.naturalWidth||!art)return;
      const printed=cover(book,art,atlas);
      ctx.globalCompositeOperation='source-over';ctx.globalAlpha=.82;
      for(let row=0;row<8;row++)for(let col=0;col<8;col++){
        const u=col/8,v=row/8,U=(col+1)/8,V=(row+1)/8;
        const p=(a,b)=>[a*240,b*320],q=(a,b)=>point(f,a,b);
        mapTriangle(ctx,printed,[p(u,v),p(U,v),p(U,V)],[q(u,v),q(U,v),q(U,V)]);
        mapTriangle(ctx,printed,[p(u,v),p(U,V),p(u,V)],[q(u,v),q(U,V),q(u,V)]);
      }
      ctx.globalCompositeOperation='source-over';ctx.globalAlpha=1;
      ctx.save();ctx.beginPath();ctx.moveTo(...f[0]);
      for(const corner of f.slice(1))ctx.lineTo(...corner);
      ctx.closePath();ctx.clip();ctx.globalAlpha=.16;ctx.drawImage(photo,0,0);ctx.restore();
    });
  }
  let mobile=$state(false);
  onMount(()=>{
    const media=matchMedia('(max-width: 900px)');mobile=media.matches;
    const changed=()=>{mobile=media.matches;};
    media.addEventListener('change',changed);
    return()=>media.removeEventListener('change',changed);
  });
  $effect(()=>{draw(books,coverArt,mobile);});
</script>
<canvas bind:this={canvas} class="sofa-books-canvas" aria-hidden="true"></canvas>
