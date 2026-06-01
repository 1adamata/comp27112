/* ============================================================
   COMP27112 Ch.8 — interactive notes
   ============================================================ */
'use strict';

/* ---------- helpers ---------- */
const $  = (s, r=document) => r.querySelector(s);
const $$ = (s, r=document) => [...r.querySelectorAll(s)];
const clamp = (v,a,b)=>Math.max(a,Math.min(b,v));
const lerp = (a,b,t)=>a+(b-a)*t;
const ease = t => t<.5 ? 2*t*t : 1-Math.pow(-2*t+2,2)/2;

const COL = {
  bg:'#0a0b0e', grid:'#222733', ink:'#e9e7e1', mute:'#7c828f',
  green:'#74c93f', cyan:'#3ba6dd', orange:'#ef7d3a', red:'#e2584b', amber:'#f3c34a'
};

/* crisp canvas sized to CSS box; returns {ctx,w,h} and keeps it updated */
function setupCanvas(canvas){
  const ctx = canvas.getContext('2d');
  function resize(){
    const dpr = Math.min(window.devicePixelRatio||1, 2);
    const rect = canvas.getBoundingClientRect();
    const cssH = canvas.getAttribute('height') ? +canvas.getAttribute('height') : rect.height;
    canvas.style.height = cssH + 'px';
    canvas.width  = Math.max(1, Math.round(rect.width  * dpr));
    canvas.height = Math.max(1, Math.round(cssH * dpr));
    ctx.setTransform(dpr,0,0,dpr,0,0);
  }
  resize();
  window.addEventListener('resize', ()=>{ resize(); canvas._draw && canvas._draw(); });
  return { ctx, get w(){return canvas.getBoundingClientRect().width;}, get h(){return +canvas.getAttribute('height');} };
}

/* ============================================================
   1. CANONICAL VIEW VOLUME  (arbitrary box -> -1..1 cube)
   ============================================================ */
function widgetCanonical(root){
  const canvas = $('canvas', root);
  const out = $('[data-out]', root);
  const { ctx } = setupCanvas(canvas);
  let t = 0, target = 0; // 0 = arbitrary, 1 = canonical

  // a slanted/oblique box (arbitrary) vs aligned cube
  function isoPt(x,y,z, w,h){
    // simple oblique projection
    const cx = w*0.5, cy = h*0.55, s = Math.min(w,h)*0.16;
    const px = cx + (x - z*0.5)*s;
    const py = cy - (y - z*0.45)*s;
    return [px,py];
  }
  // arbitrary corners (asymmetric) -> canonical corners (-1..1)
  const arb = [[-2.4,-1.1,-1.6],[1.9,-1.1,-1.6],[1.9,1.4,-1.6],[-2.4,1.4,-1.6],
               [-1.6,-0.7,1.7],[2.6,-0.7,1.7],[2.6,1.9,1.7],[-1.6,1.9,1.7]];
  const can = [[-1,-1,-1],[1,-1,-1],[1,1,-1],[-1,1,-1],[-1,-1,1],[1,-1,1],[1,1,1],[-1,1,1]];
  const edges = [[0,1],[1,2],[2,3],[3,0],[4,5],[5,6],[6,7],[7,4],[0,4],[1,5],[2,6],[3,7]];

  function draw(){
    const w = canvas.getBoundingClientRect().width, h = +canvas.getAttribute('height');
    ctx.clearRect(0,0,w,h);
    const tt = ease(t);
    const pts = arb.map((p,i)=>[lerp(p[0],can[i][0],tt),lerp(p[1],can[i][1],tt),lerp(p[2],can[i][2],tt)]);
    const scr = pts.map(p=>isoPt(p[0],p[1],p[2],w,h));

    // axes (origin)
    const o = isoPt(0,0,0,w,h);
    const axis=(dx,dy,dz,c)=>{const e=isoPt(dx,dy,dz,w,h);ctx.strokeStyle=c;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(o[0],o[1]);ctx.lineTo(e[0],e[1]);ctx.stroke();};
    axis(2.2,0,0,COL.orange); axis(0,2.2,0,COL.green); axis(0,0,2.2,COL.cyan);

    // faces fill (back to front-ish): fill the cube faintly
    ctx.fillStyle = `rgba(116,201,63,${0.06+0.10*tt})`;
    const faces=[[0,1,2,3],[4,5,6,7],[0,1,5,4],[3,2,6,7],[1,2,6,5],[0,3,7,4]];
    faces.forEach(f=>{ctx.beginPath();ctx.moveTo(scr[f[0]][0],scr[f[0]][1]);f.slice(1).forEach(i=>ctx.lineTo(scr[i][0],scr[i][1]));ctx.closePath();ctx.fill();});

    // edges
    ctx.strokeStyle = `rgba(233,231,225,${0.55+0.4*tt})`;
    ctx.lineWidth = 1.6;
    edges.forEach(([a,b])=>{ctx.beginPath();ctx.moveTo(scr[a][0],scr[a][1]);ctx.lineTo(scr[b][0],scr[b][1]);ctx.stroke();});

    // corner dots + labels when canonical
    if(tt>0.6){
      ctx.fillStyle=COL.cyan;
      scr.forEach((p,i)=>{ctx.beginPath();ctx.arc(p[0],p[1],3,0,7);ctx.fill();});
      ctx.fillStyle=COL.mute;ctx.font='600 12px JetBrains Mono, monospace';
      ctx.fillText('(-1,-1,-1)', scr[0][0]-30, scr[0][1]+16);
      ctx.fillText('(1,1,1)', scr[6][0]+6, scr[6][1]-6);
    }
    // little 'cheese' marker inside to show contents move with it
    const c = pts.reduce((a,p)=>[a[0]+p[0]/8,a[1]+p[1]/8,a[2]+p[2]/8],[0,0,0]);
    const cm = isoPt(c[0],c[1],c[2],w,h);
    ctx.fillStyle=COL.amber;ctx.beginPath();ctx.arc(cm[0],cm[1],5,0,7);ctx.fill();
  }
  canvas._draw = draw;

  function animate(){
    t += (target - t)*0.08;
    if(Math.abs(target-t)<0.001) t=target;
    draw();
    if(t!==target) requestAnimationFrame(animate);
  }
  $$('.btn',root).forEach(b=>b.addEventListener('click',()=>{
    $$('.btn',root).forEach(x=>x.classList.remove('active'));
    b.classList.add('active');
    target = b.dataset.mode==='canon'?1:0;
    out.innerHTML = target
      ? 'Scaled by 2/(r−l), 2/(t−b), 2/(f−n) and translated so the volume fills the standard <b>−1…1</b> cube. Contents (the amber marker) move <b>with</b> the volume.'
      : 'An <b>arbitrary</b> view volume — any size, possibly oblique. Press <b>Normalise</b>.';
    requestAnimationFrame(animate);
  }));
  draw();
}

/* ============================================================
   2. Z-BUFFER PER-PIXEL DEPTH TEST
   ============================================================ */
function widgetZtest(root){
  const canvas = $('canvas', root);
  const out = $('[data-out]', root);
  const { ctx } = setupCanvas(canvas);
  let zg = 0.4, zc = 0.6, showDepth = false;

  // two triangles in canvas space (defined by 3 pts each, normalised 0..1)
  const triG = [[0.12,0.82],[0.58,0.18],[0.62,0.86]];
  const triC = [[0.40,0.16],[0.88,0.30],[0.52,0.88]];

  function bary(px,py,t){
    const [a,b,c]=t;
    const d=(b[1]-c[1])*(a[0]-c[0])+(c[0]-b[0])*(a[1]-c[1]);
    const l1=((b[1]-c[1])*(px-c[0])+(c[0]-b[0])*(py-c[1]))/d;
    const l2=((c[1]-a[1])*(px-c[0])+(a[0]-c[0])*(py-c[1]))/d;
    const l3=1-l1-l2;
    return (l1>=0&&l2>=0&&l3>=0);
  }

  function draw(){
    const w = canvas.getBoundingClientRect().width, h=+canvas.getAttribute('height');
    ctx.clearRect(0,0,w,h);
    // per-pixel z-test at coarse resolution for speed
    const step = 3;
    for(let y=0;y<h;y+=step){
      for(let x=0;x<w;x+=step){
        const u=x/w, v=y/h;
        const inG=bary(u,v,triG), inC=bary(u,v,triC);
        let col=null, depth=null;
        if(inG && inC){ if(zg<=zc){col=COL.green;depth=zg;}else{col=COL.cyan;depth=zc;} }
        else if(inG){col=COL.green;depth=zg;}
        else if(inC){col=COL.cyan;depth=zc;}
        if(col){
          if(showDepth){ const g=Math.round(255*(1-depth)); ctx.fillStyle=`rgb(${g},${g},${g})`; }
          else ctx.fillStyle=col;
          ctx.fillRect(x,y,step,step);
        }
      }
    }
    // outlines
    const drawTri=(t,c)=>{ctx.strokeStyle=c;ctx.lineWidth=1.4;ctx.beginPath();
      ctx.moveTo(t[0][0]*w,t[0][1]*h);ctx.lineTo(t[1][0]*w,t[1][1]*h);ctx.lineTo(t[2][0]*w,t[2][1]*h);ctx.closePath();ctx.stroke();};
    drawTri(triG, showDepth?'#fff':'#b7eb8f'); drawTri(triC, showDepth?'#fff':'#bfe6fb');
    // labels
    ctx.font='700 12px JetBrains Mono, monospace';
    ctx.fillStyle=showDepth?'#fff':COL.green; ctx.fillText('z='+zg.toFixed(2), triG[1][0]*w-30, triG[1][1]*h+18);
    ctx.fillStyle=showDepth?'#fff':COL.cyan;  ctx.fillText('z='+zc.toFixed(2), triC[1][0]*w-10, triC[1][1]*h-8);
    if(showDepth){ctx.fillStyle=COL.mute;ctx.fillText('depth buffer · darker = farther', 10, 18);}
  }
  canvas._draw = draw;

  $('[data-z="g"]',root).addEventListener('input',e=>{zg=+e.target.value;$('[data-l="zg"]',root).textContent=zg.toFixed(2);update();draw();});
  $('[data-z="c"]',root).addEventListener('input',e=>{zc=+e.target.value;$('[data-l="zc"]',root).textContent=zc.toFixed(2);update();draw();});
  $('[data-toggle="depth"]',root).addEventListener('click',e=>{showDepth=!showDepth;e.target.classList.toggle('active',showDepth);e.target.textContent=showDepth?'Show colours':'Show depth buffer';draw();});

  function update(){
    const winner = zg<=zc ? 'green' : 'cyan';
    out.innerHTML = `In the overlap, depth <b>${Math.min(zg,zc).toFixed(2)}</b> wins → the <b style="color:${winner==='green'?COL.green:COL.cyan}">${winner}</b> triangle is written; the farther fragment is discarded. ${Math.abs(zg-zc)<0.04?'<b style="color:'+COL.amber+'">Depths are nearly equal → this is where Z-fighting appears.</b>':''}`;
  }
  update(); draw();
}

/* ============================================================
   3. ORTHOGRAPHIC vs PERSPECTIVE floor
   ============================================================ */
function widgetOrthoPersp(root){
  const canvas=$('canvas',root); const out=$('[data-out]',root);
  const {ctx}=setupCanvas(canvas);
  let mode='ortho', t=0, target=0;

  function draw(){
    const w=canvas.getBoundingClientRect().width,h=+canvas.getAttribute('height');
    ctx.clearRect(0,0,w,h);
    const tt=ease(t);
    const horizon=h*0.30;
    // sky/ground tint
    const grd=ctx.createLinearGradient(0,0,0,h);
    grd.addColorStop(0,'#10141b');grd.addColorStop(0.3,'#0c0f15');grd.addColorStop(1,'#0a0b0e');
    ctx.fillStyle=grd;ctx.fillRect(0,0,w,h);

    const cols=9, rows=8;
    const vpx=w/2;
    // vertical lines
    ctx.lineWidth=1.4;
    for(let i=0;i<=cols;i++){
      const fx=(i/cols)*w;                       // bottom x (ortho)
      const px=lerp(fx, vpx, 0.62);              // top x converging
      const topx=lerp(fx, px, tt);
      const topy=lerp(0, horizon, tt);
      ctx.strokeStyle = i===Math.floor(cols/2)?'rgba(239,125,58,.5)':'rgba(116,201,63,.35)';
      ctx.beginPath();ctx.moveTo(fx,h);ctx.lineTo(topx,topy);ctx.stroke();
    }
    // horizontal lines (rows) — spacing compresses with perspective
    ctx.strokeStyle='rgba(59,166,221,.40)';
    for(let j=0;j<=rows;j++){
      const lin = j/rows;
      const per = 1-Math.pow(1-lin,2.2);         // compressed near horizon
      const f = lerp(lin, per, tt);
      const y = lerp(h, horizon, f);
      // line width shrinks toward horizon in perspective
      const shrink = lerp(1, lerp(1,0.24,f), tt);
      const half=(w/2)*shrink;
      ctx.beginPath();ctx.moveTo(vpx-half, y);ctx.lineTo(vpx+half, y);ctx.stroke();
    }
    // a couple of "buildings" to show constant vs shrinking size
    function box(cx, row, label){
      const lin=row, per=1-Math.pow(1-lin,2.2), f=lerp(lin,per,tt);
      const y=lerp(h,horizon,f);
      const sz=lerp(46, lerp(46,12,f), tt);
      const x=lerp(cx, vpx+(cx-vpx)*lerp(1,0.24,f), tt);
      ctx.fillStyle='rgba(243,195,74,.18)';ctx.strokeStyle=COL.amber;ctx.lineWidth=1.4;
      ctx.fillRect(x-sz/2,y-sz, sz,sz);ctx.strokeRect(x-sz/2,y-sz,sz,sz);
    }
    box(w*0.24,0.12); box(w*0.24,0.62); box(w*0.78,0.12); box(w*0.78,0.62);
    // horizon line in perspective
    if(tt>0.2){ctx.strokeStyle=`rgba(124,130,143,${0.5*tt})`;ctx.setLineDash([5,5]);ctx.beginPath();ctx.moveTo(0,horizon);ctx.lineTo(w,horizon);ctx.stroke();ctx.setLineDash([]);
      ctx.fillStyle=`rgba(124,130,143,${0.7*tt})`;ctx.font='600 11px JetBrains Mono';ctx.fillText('vanishing point', vpx+8, horizon-6);}
  }
  canvas._draw=draw;
  function animate(){t+=(target-t)*0.09;if(Math.abs(target-t)<0.001)t=target;draw();if(t!==target)requestAnimationFrame(animate);}
  $$('.btn',root).forEach(b=>b.addEventListener('click',()=>{
    $$('.btn',root).forEach(x=>x.classList.remove('active'));b.classList.add('active');
    mode=b.dataset.proj;target=mode==='persp'?1:0;
    out.innerHTML = mode==='persp'
      ? 'Rows compress toward a <b>vanishing point</b>, equal-size boxes shrink with distance, parallel lines converge — depth divides x and y by z.'
      : 'Equal tile spacing, constant box size, parallel lines stay parallel — no depth scaling.';
    requestAnimationFrame(animate);
  }));
  draw();
}

/* ============================================================
   4. PERSPECTIVE DIVISION  (drag P, project onto near plane)
   ============================================================ */
function widgetDivision(root){
  const canvas=$('canvas',root);const out=$('[data-out]',root);
  const {ctx}=setupCanvas(canvas);
  let n=2.0;
  // world point P in (z,y); z to the right, y up. Eye at origin (left).
  let P={z:6, y:2.2};
  let dragging=false;

  function geom(){
    const w=canvas.getBoundingClientRect().width,h=+canvas.getAttribute('height');
    const ox=w*0.10, oy=h*0.62;          // origin (eye) on screen
    const sx=(w*0.82)/9;                  // z scale (0..9)
    const sy=(h*0.42)/4;                  // y scale
    return {w,h,ox,oy,sx,sy};
  }
  function toScreen(z,y){const{ox,oy,sx,sy}=geom();return [ox+z*sx, oy-y*sy];}
  function fromScreen(px,py){const{ox,oy,sx,sy}=geom();return [(px-ox)/sx,(oy-py)/sy];}

  function draw(){
    const {w,h,ox,oy,sx}=geom();
    ctx.clearRect(0,0,w,h);
    // axes
    ctx.strokeStyle=COL.orange;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(ox,oy);ctx.lineTo(ox+9*sx,oy);ctx.stroke();
    ctx.fillStyle=COL.orange;ctx.font='700 13px JetBrains Mono';ctx.fillText('z',ox+9*sx-4,oy+20);
    const [yx,yy]=toScreen(0,3.6);ctx.strokeStyle=COL.green;ctx.beginPath();ctx.moveTo(ox,oy);ctx.lineTo(yx,yy);ctx.stroke();
    ctx.fillStyle=COL.green;ctx.fillText('y',ox-16,oy-3.4*geom().sy);
    // near plane
    const npx=ox+n*sx;
    ctx.strokeStyle=COL.cyan;ctx.setLineDash([6,5]);ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(npx,oy-1.7*geom().sy);ctx.lineTo(npx,oy+1.7*geom().sy*0.4);ctx.stroke();ctx.setLineDash([]);
    ctx.fillStyle=COL.cyan;ctx.fillText('z = n', npx-14, oy+1.7*geom().sy*0.4+18);
    // ray from eye(origin) through P
    const Ps=toScreen(P.z,P.y);
    ctx.strokeStyle='rgba(233,231,225,.85)';ctx.lineWidth=1.6;ctx.beginPath();ctx.moveTo(ox,oy);ctx.lineTo(Ps[0],Ps[1]);ctx.stroke();
    // dotted drop from P to axis
    ctx.strokeStyle='rgba(124,130,143,.6)';ctx.setLineDash([3,4]);ctx.beginPath();ctx.moveTo(Ps[0],Ps[1]);ctx.lineTo(Ps[0],oy);ctx.stroke();ctx.setLineDash([]);
    // projected point P' on near plane:  yp = n*y/z
    const yp = n*P.y/P.z;
    const Pp = toScreen(n, yp);
    ctx.strokeStyle='rgba(124,130,143,.6)';ctx.setLineDash([3,4]);ctx.beginPath();ctx.moveTo(Pp[0],Pp[1]);ctx.lineTo(npx,oy);ctx.stroke();ctx.setLineDash([]);
    // points
    ctx.fillStyle=COL.cyan;ctx.beginPath();ctx.arc(Pp[0],Pp[1],6,0,7);ctx.fill();
    ctx.fillStyle=COL.ink;ctx.font='600 12px JetBrains Mono';ctx.fillText("P'", Pp[0]+8,Pp[1]-6);
    ctx.fillStyle=COL.red;ctx.beginPath();ctx.arc(Ps[0],Ps[1],8,0,7);ctx.fill();
    ctx.strokeStyle='#fff';ctx.lineWidth=2;ctx.stroke();
    ctx.fillStyle=COL.ink;ctx.fillText('P', Ps[0]+10,Ps[1]-8);

    out.innerHTML = `P = ( z=<b>${P.z.toFixed(1)}</b>, y=<b>${P.y.toFixed(1)}</b> ) → projected height y<sub>p</sub> = n·y/z = ${n.toFixed(1)}·${P.y.toFixed(1)}/${P.z.toFixed(1)} = <b style="color:${COL.cyan}">${yp.toFixed(2)}</b>. Drag <b style="color:${COL.red}">P</b> deeper and y<sub>p</sub> shrinks — distance ⇒ smaller.`;
  }
  canvas._draw=draw;

  function pointer(e){
    const r=canvas.getBoundingClientRect();
    const cx=(e.touches?e.touches[0].clientX:e.clientX)-r.left;
    const cy=(e.touches?e.touches[0].clientY:e.clientY)-r.top;
    const [z,y]=fromScreen(cx,cy);
    P.z=clamp(z, n+0.2, 9); P.y=clamp(y,-1.5,3.4); draw();
  }
  const start=e=>{dragging=true;pointer(e);e.preventDefault();};
  const move=e=>{if(dragging)pointer(e),e.preventDefault();};
  const end=()=>dragging=false;
  canvas.addEventListener('mousedown',start);window.addEventListener('mousemove',move);window.addEventListener('mouseup',end);
  canvas.addEventListener('touchstart',start,{passive:false});canvas.addEventListener('touchmove',move,{passive:false});window.addEventListener('touchend',end);

  $('[data-p="n"]',root).addEventListener('input',e=>{n=+e.target.value;$('[data-l="n"]',root).textContent=n.toFixed(1);if(P.z<n+0.2)P.z=n+0.2;draw();});
  draw();
}

/* ============================================================
   5. NON-LINEAR Z (linear vs perspective depth bands)
   ============================================================ */
function widgetNonlinear(root){
  const canvas=$('canvas',root);const out=$('[data-out]',root);
  const {ctx}=setupCanvas(canvas);
  let n=1,f=20,linear=false;

  function draw(){
    const w=canvas.getBoundingClientRect().width,h=+canvas.getAttribute('height');
    ctx.clearRect(0,0,w,h);
    const padL=46,padR=20,padT=22,padB=42;
    const x0=padL,x1=w-padR,y0=padT,y1=h-padB;
    // frame
    ctx.strokeStyle=COL.grid;ctx.lineWidth=1;ctx.strokeRect(x0,y0,x1-x0,y1-y0);
    // map world z (n..f) -> NDC depth (0..1)
    const N=12; // equal world-depth samples
    // perspective ndc: zndc = (f*(z-n))/(z*(f-n))  (0 at near,1 at far), then we map to bar height
    function ndc(z){ return linear ? (z-n)/(f-n) : (f*(z-n))/(z*(f-n)); }
    // draw bands: equal steps in world z, coloured by resulting NDC slice width
    let prevN=0;
    for(let i=1;i<=N;i++){
      const z=n+(f-n)*(i/N);
      const cur=ndc(z);
      const yTop=lerp(y1,y0,prevN), yBot=lerp(y1,y0,cur);
      const width=Math.abs(cur-prevN);
      // colour: wide slice (high precision)=green, thin=red
      const tcol=clamp(width*N*0.9,0,1);
      const r=Math.round(lerp(226,116,tcol)), g=Math.round(lerp(88,201,tcol)), b=Math.round(lerp(75,63,tcol));
      ctx.fillStyle=`rgba(${r},${g},${b},.55)`;
      ctx.fillRect(x0+1,yBot,x1-x0-2,yTop-yBot);
      ctx.strokeStyle='rgba(10,11,14,.8)';ctx.strokeRect(x0+1,yBot,x1-x0-2,yTop-yBot);
      prevN=cur;
    }
    // curve overlay
    ctx.strokeStyle=linear?COL.mute:COL.cyan;ctx.lineWidth=2.2;ctx.beginPath();
    for(let i=0;i<=120;i++){const z=n+(f-n)*(i/120);const yy=lerp(y1,y0,ndc(z));const xx=lerp(x0,x1,i/120);i?ctx.lineTo(xx,yy):ctx.moveTo(xx,yy);}
    ctx.stroke();
    // labels
    ctx.fillStyle=COL.mute;ctx.font='600 11px JetBrains Mono';
    ctx.save();ctx.translate(14,(y0+y1)/2);ctx.rotate(-Math.PI/2);ctx.textAlign='center';ctx.fillText('NDC depth  0 → 1',0,0);ctx.restore();
    ctx.textAlign='left';ctx.fillText('near (n)',x0,y1+18);ctx.textAlign='right';ctx.fillText('far (f) →  equal world-z steps',x1,y1+18);ctx.textAlign='left';
    ctx.fillStyle=COL.green;ctx.fillText('■ wide band = lots of precision', x0+6, y0+16);
    ctx.fillStyle=COL.red;ctx.fillText('■ thin band = little precision', x0+6, y0+32);
  }
  canvas._draw=draw;
  $('[data-q="n"]',root).addEventListener('input',e=>{n=+e.target.value;if(n>=f-1)n=f-1;$('[data-l="n"]',root).textContent=n.toFixed(1);draw();});
  $('[data-q="f"]',root).addEventListener('input',e=>{f=+e.target.value;$('[data-l="f"]',root).textContent=f.toFixed(0);draw();});
  $('[data-toggle="linear"]',root).addEventListener('click',e=>{linear=!linear;e.target.classList.toggle('active',linear);e.target.textContent=linear?'Show perspective':'Compare linear';
    out.innerHTML=linear?'<b>Linear Z</b>: every world-depth step gets the <b>same</b> NDC slice — precision wasted far away, starved near the camera.':'<b>Perspective Z</b>: near steps get fat slices (precision), far steps bunch up — distant surfaces are where Z-fighting still bites.';draw();});
  draw();
}

/* ---------- widget dispatch ---------- */
const WIDGETS={canonical:widgetCanonical,ztest:widgetZtest,orthopersp:widgetOrthoPersp,division:widgetDivision,nonlinear:widgetNonlinear};

/* ============================================================
   QUIZ  (chapter-relevant questions from the unit's quizzes)
   correct index marked; options will be shuffled at render
   ============================================================ */
const QUIZ=[
 {q:"What is the purpose of the Z-buffer?",
  o:["To solve the “hidden surface” problem.","To ensure pixel colours are as bright as possible.","To improve the efficiency of rendering large triangles.","To improve the resolution of rendered images."],c:0,
  fb:"It records depth per pixel so that fragments with a greater Z are hidden by nearer ones."},
 {q:"What is the canonical view volume?",
  o:["A standardised cube with coordinates from −1 to 1 that the clipper and rasteriser always assume.","The real-world volume a camera lens can physically capture.","The bounding box computed around all objects in the scene.","A cube centred on each object used for collision detection."],c:0,
  fb:"It's the standard −1…1 cube in normalised device coordinates, independent of resolution or field of view."},
 {q:"Key visual difference between orthographic and perspective projection?",
  o:["In perspective, objects shrink with distance and parallel lines converge; orthographic preserves size and parallelism.","Orthographic produces fisheye distortion at the edges; perspective does not.","Perspective preserves the z-coordinate; orthographic discards it entirely.","Orthographic projection can only be used for 2D scenes."],c:0,
  fb:"Perspective divides x and y by z, so distant objects appear smaller and parallel lines converge."},
 {q:"Why do we need both a near plane and a far plane in the view frustum?",
  o:["The near plane prevents geometry inside the camera projecting incorrectly; the far plane bounds depth so z-buffer precision isn't wasted.","They define the resolution of the output image.","They are only required for orthographic projection.","The near plane controls ambient light; the far plane controls fog."],c:0,
  fb:"A very wide near–far gap also causes z-fighting even on nearby surfaces."},
 {q:"What is z-fighting and what causes it?",
  o:["Flickering between two surfaces at nearly the same depth, caused by insufficient z-buffer precision.","Transparent surfaces sorting incorrectly when alpha blending is enabled.","A GPU stall when two draw calls write the same pixel simultaneously.","Two meshes at the same world position both disappearing from the render."],c:0,
  fb:"Floating-point depth can't reliably decide which surface wins, so different pixels flicker frame to frame."},
 {q:"In standard alpha blending, how is the final pixel colour computed?",
  o:["C = α·C_foreground + (1−α)·C_background","C = C_foreground + C_background, clamped to 1","C = C_foreground × C_background","Foreground replaces background whenever α > 0.5"],c:0,
  fb:"α=0 is fully transparent, α=1 fully opaque; in between is a proportional blend. This runs after the fragment shader."},
 {q:"What is perspective division and what does it achieve?",
  o:["Dividing x, y, z by w (which encodes depth) so distant objects scale down and appear smaller.","Dividing the depth value by the number of pixels in the viewport.","Multiplying x and y by the aspect ratio for non-square displays.","Discarding z after projection to produce a 2D coordinate."],c:0,
  fb:"The projection matrix loads depth into w; dividing by a larger w shrinks distant objects — that's the perspective effect."},
 {q:"Why is the triangle the preferred primitive in real-time 3D graphics?",
  o:["It is always planar and convex with a well-defined normal, making rasterisation unambiguous.","It uses the least memory of any polygon type.","GPUs can only process exactly three vertices at a time.","It is the only shape that can represent curved surfaces."],c:0,
  fb:"Three points always define a unique plane — guaranteed planar, convex, with a clear normal."}
];

function renderQuiz(){
  const host=$('#quiz'); if(!host)return; let answered=0,correct=0;
  QUIZ.forEach((item,qi)=>{
    const idx=item.o.map((_,i)=>i);
    // shuffle
    for(let i=idx.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[idx[i],idx[j]]=[idx[j],idx[i]];}
    const q=document.createElement('div');q.className='q';
    q.innerHTML=`<div class="qhead"><span class="qnum">Q${qi+1}</span><span class="qtext">${item.q}</span></div>`;
    const opts=document.createElement('div');opts.className='opts';
    const fb=document.createElement('div');fb.className='fb';
    idx.forEach((oi,pos)=>{
      const b=document.createElement('button');b.className='opt';
      b.innerHTML=`<span class="mk">${String.fromCharCode(65+pos)}</span><span>${item.o[oi]}</span>`;
      b.addEventListener('click',()=>{
        if(q.dataset.done)return; q.dataset.done='1'; answered++;
        const right = oi===item.c;
        if(right){b.classList.add('correct');correct++;}
        else{b.classList.add('wrong');
          // reveal the correct one
          [...opts.children].forEach((cb,ci)=>{ if(idx[ci]===item.c) cb.classList.add('correct'); });
        }
        [...opts.children].forEach(cb=>cb.classList.add('lock'));
        fb.classList.add('show');
        fb.innerHTML = (right?'<b>Correct.</b> ':'<b>Not quite.</b> ')+item.fb;
        updateScore(correct,answered);
      });
      opts.appendChild(b);
    });
    q.appendChild(opts);q.appendChild(fb);host.appendChild(q);
  });
  function updateScore(c,a){$('#scoretxt').textContent=`${c} / ${a}`;$('#scorefill').style.width=(a?c/QUIZ.length*100:0)+'%';
    $('#scoretxt').innerHTML = a===QUIZ.length ? `<b>${c} / ${QUIZ.length}</b> · done!` : `${c} / ${a}`;}
}

/* ============================================================
   SCROLL: reveal, progress bar, active nav
   ============================================================ */
function initScroll(){
  // reveal
  const io=new IntersectionObserver((es)=>{es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target);}});},{threshold:0.12});
  $$('[data-reveal]').forEach(el=>io.observe(el));

  // progress
  const bar=$('#progress');
  const onScroll=()=>{const st=window.scrollY||document.documentElement.scrollTop;const dh=document.documentElement.scrollHeight-window.innerHeight;bar.style.width=(dh>0?st/dh*100:0)+'%';};
  window.addEventListener('scroll',onScroll,{passive:true});onScroll();

  // active nav link
  const links=$$('nav.toc a');
  const map=links.map(a=>({a,sec:$(a.getAttribute('href'))})).filter(x=>x.sec);
  const navIO=new IntersectionObserver((es)=>{es.forEach(e=>{if(e.isIntersecting){
    links.forEach(l=>l.classList.remove('active'));
    const m=map.find(x=>x.sec===e.target); if(m)m.a.classList.add('active');
  }});},{rootMargin:'-45% 0px -50% 0px'});
  map.forEach(x=>navIO.observe(x.sec));
}

/* ---------- boot ---------- */
function boot(){
  $$('[data-widget]').forEach(root=>{const fn=WIDGETS[root.dataset.widget];if(fn){try{fn(root);}catch(err){console.warn('widget',root.dataset.widget,err);}}});
  renderQuiz();
  initScroll();
}
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',boot):boot();
