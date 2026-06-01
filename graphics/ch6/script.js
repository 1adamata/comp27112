/* ============================================================
   COMP27112 · Ch.6 — interactivity
   ============================================================ */
(function(){
'use strict';
const $ = (s,r=document)=>r.querySelector(s);
const $$ = (s,r=document)=>[...r.querySelectorAll(s)];
const C = { ink:'#ece4d4', soft:'#b6ad99', faint:'#6f6a5b', amber:'#f0944a',
            amber2:'#ffb877', cyan:'#5ec8d8', green:'#9ccb6f', red:'#e06a5a',
            grid:'rgba(236,228,212,.08)', panel:'#100e09' };
const TAU = Math.PI*2;

/* ---------- canvas helper (hi-dpi, responsive) ---------- */
function fit(cv){
  const dpr = Math.min(window.devicePixelRatio||1, 2);
  const w = cv.clientWidth || cv.parentNode.clientWidth;
  const h = parseInt(cv.getAttribute('height'),10);
  cv.width = w*dpr; cv.height = h*dpr;
  const ctx = cv.getContext('2d');
  ctx.setTransform(dpr,0,0,dpr,0,0);
  cv._w = w; cv._h = h;
  return ctx;
}
function arrow(ctx,x1,y1,x2,y2,col,wid=2.4,head=9){
  ctx.strokeStyle=col; ctx.fillStyle=col; ctx.lineWidth=wid;
  ctx.lineCap='round';
  ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.stroke();
  const a=Math.atan2(y2-y1,x2-x1);
  ctx.beginPath();
  ctx.moveTo(x2,y2);
  ctx.lineTo(x2-head*Math.cos(a-.4), y2-head*Math.sin(a-.4));
  ctx.lineTo(x2-head*Math.cos(a+.4), y2-head*Math.sin(a+.4));
  ctx.closePath(); ctx.fill();
}
function label(ctx,t,x,y,col,size=13,font='"IBM Plex Mono", monospace'){
  ctx.fillStyle=col; ctx.font=size+'px '+font;
  ctx.textBaseline='middle'; ctx.fillText(t,x,y);
}

/* ============================================================
   PROGRESS BAR + DOT NAV + REVEALS
   ============================================================ */
const bar = $('#progress');
const sections = $$('section[data-nav], header[data-nav]');
const dotsHost = $('#dots');
sections.forEach((s,i)=>{
  const a=document.createElement('a');
  a.href='#'+s.id;
  a.innerHTML='<span>'+s.dataset.nav+'</span>';
  a.dataset.i=i;
  dotsHost.appendChild(a);
});
const dots = $$('#dots a');

function onScroll(){
  const h = document.documentElement;
  const max = h.scrollHeight - h.clientHeight;
  bar.style.width = (max>0 ? (h.scrollTop/max*100) : 0)+'%';
}
window.addEventListener('scroll', onScroll, {passive:true});
onScroll();

const navObs = new IntersectionObserver((es)=>{
  es.forEach(e=>{
    if(e.isIntersecting){
      const id=e.target.id;
      dots.forEach(d=>d.classList.toggle('active', d.getAttribute('href')==='#'+id));
    }
  });
},{rootMargin:'-45% 0px -45% 0px'});
sections.forEach(s=>navObs.observe(s));

const revObs = new IntersectionObserver((es)=>{
  es.forEach(e=>{ if(e.isIntersecting){ e.target.classList.add('in'); revObs.unobserve(e.target); } });
},{threshold:.12});
$$('.reveal').forEach(el=>revObs.observe(el));

/* ============================================================
   1 · PLANE TILT
   ============================================================ */
(function(){
  const cv=$('#cv-plane'); if(!cv) return;
  let ctx=fit(cv);
  const slider=$('#plane-tilt');
  function draw(){
    const w=cv._w,h=cv._h, cx=w*0.5, cy=h*0.60;
    ctx.clearRect(0,0,w,h);
    // faint grid
    ctx.strokeStyle=C.grid; ctx.lineWidth=1;
    for(let x=0;x<w;x+=34){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,h);ctx.stroke();}
    for(let y=0;y<h;y+=34){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(w,y);ctx.stroke();}
    const deg=+slider.value, t=deg*Math.PI/180;
    const half=Math.min(w*0.34,150);
    // plane as a line tilted by t (side view), thickness via small ellipse band
    const dx=Math.cos(t), dy=Math.sin(t);
    const ax=cx-half*dx, ay=cy-half*dy, bx=cx+half*dx, by=cy+half*dy;
    // plane band
    ctx.strokeStyle='rgba(200,140,80,.85)'; ctx.lineWidth=6; ctx.lineCap='round';
    ctx.beginPath(); ctx.moveTo(ax,ay); ctx.lineTo(bx,by); ctx.stroke();
    ctx.strokeStyle='rgba(255,255,255,.10)'; ctx.lineWidth=10;
    ctx.beginPath(); ctx.moveTo(ax,ay); ctx.lineTo(bx,by); ctx.stroke();
    // z axis (fixed, vertical)
    arrow(ctx,cx,cy,cx,cy-110,C.amber,2.6); label(ctx,'z',cx+8,cy-108,C.amber,15,'"Fraunces", serif');
    // normal = perpendicular to plane (rotate plane dir by -90)
    const nx=Math.sin(t), ny=-Math.cos(t);
    arrow(ctx,cx,cy,cx+nx*110,cy+ny*110,C.ink,2.6);
    label(ctx,'n̂',cx+nx*120,cy+ny*120,C.ink,16,'"Fraunces", serif');
    // right-angle marker between plane & normal
    ctx.strokeStyle=C.faint; ctx.lineWidth=1.4;
    const s=14;
    ctx.beginPath();
    ctx.moveTo(cx+dx*s, cy+dy*s);
    ctx.lineTo(cx+dx*s+nx*s, cy+dy*s+ny*s);
    ctx.lineTo(cx+nx*s, cy+ny*s);
    ctx.stroke();
    // an in-plane vector v
    arrow(ctx,cx,cy,cx+dx*70,cy+dy*70,C.cyan,2,8);
    label(ctx,'v',cx+dx*80,cy+dy*80+4,C.cyan,14,'"Fraunces", serif');
    // readouts
    $('#plane-deg').textContent=deg+'°';
    $('#plane-ang').textContent=deg+'°';
    $('#plane-dot').textContent='0';  // perpendicular ⇒ always 0
  }
  slider.addEventListener('input',draw);
  window.addEventListener('resize',()=>{ctx=fit(cv);draw();});
  draw();
})();

/* ============================================================
   2 · SPHERE INSIDE / OUTSIDE
   ============================================================ */
(function(){
  const cv=$('#cv-sphere'); if(!cv) return;
  let ctx=fit(cv);
  let R, cx, cy, px, py, dragging=false;
  function setup(){
    cx=cv._w*0.5; cy=cv._h*0.5; R=Math.min(cv._w,cv._h)*0.30;
    if(px===undefined){ px=cx+R*0.55; py=cy-R*0.35; }
  }
  function draw(){
    const w=cv._w,h=cv._h; ctx.clearRect(0,0,w,h);
    // halo
    const g=ctx.createRadialGradient(cx,cy,R*0.2,cx,cy,R*1.6);
    g.addColorStop(0,'rgba(240,148,74,.10)'); g.addColorStop(1,'transparent');
    ctx.fillStyle=g; ctx.fillRect(0,0,w,h);
    // sphere cross-section
    ctx.beginPath(); ctx.arc(cx,cy,R,0,TAU);
    ctx.strokeStyle='rgba(236,228,212,.55)'; ctx.lineWidth=2; ctx.stroke();
    ctx.fillStyle='rgba(94,200,216,.05)'; ctx.fill();
    // centre + radius
    ctx.fillStyle=C.faint; ctx.beginPath(); ctx.arc(cx,cy,3,0,TAU); ctx.fill();
    const dx=px-cx, dy=py-cy, dist=Math.hypot(dx,dy);
    // vector v
    arrow(ctx,cx,cy,px,py,C.amber2,2,9);
    label(ctx,'v',(cx+px)/2+6,(cy+py)/2-6,C.amber2,14,'"Fraunces", serif');
    // the test point
    const f=(dist*dist - R*R)/(R*R); // normalised
    let col = Math.abs(dist-R)<3 ? C.amber : (dist<R? C.green : C.red);
    ctx.beginPath(); ctx.arc(px,py,8,0,TAU);
    ctx.fillStyle=col; ctx.shadowColor=col; ctx.shadowBlur=14; ctx.fill(); ctx.shadowBlur=0;
    ctx.strokeStyle='#0d0c08'; ctx.lineWidth=2; ctx.stroke();
    // readout
    const vEl=$('#sph-val'), sEl=$('#sph-state');
    vEl.textContent=(f).toFixed(2);
    if(Math.abs(dist-R)<3){ sEl.textContent='on the surface (= 0)'; sEl.style.color=C.amber; vEl.style.color=C.amber; }
    else if(dist<R){ sEl.textContent='INSIDE  (f < 0)'; sEl.style.color=C.green; vEl.style.color=C.green; }
    else { sEl.textContent='OUTSIDE  (f > 0)'; sEl.style.color=C.red; vEl.style.color=C.red; }
  }
  function pos(e){
    const r=cv.getBoundingClientRect();
    const t=e.touches?e.touches[0]:e;
    return {x:(t.clientX-r.left), y:(t.clientY-r.top)};
  }
  function down(e){ dragging=true; move(e); }
  function move(e){ if(!dragging)return; const p=pos(e); px=Math.max(6,Math.min(cv._w-6,p.x)); py=Math.max(6,Math.min(cv._h-6,p.y)); draw(); e.preventDefault?.(); }
  function up(){ dragging=false; }
  cv.addEventListener('mousedown',down); window.addEventListener('mousemove',move); window.addEventListener('mouseup',up);
  cv.addEventListener('touchstart',down,{passive:false}); cv.addEventListener('touchmove',move,{passive:false}); window.addEventListener('touchend',up);
  window.addEventListener('resize',()=>{ctx=fit(cv);setup();draw();});
  setup(); draw();
})();

/* ============================================================
   3 · TRIANGLE NORMAL + WINDING
   ============================================================ */
(function(){
  const cv=$('#cv-normal'); if(!cv) return;
  let ctx=fit(cv);
  let ccw=true, shown=false, t=0, raf=null;
  function tri(){
    const cx=cv._w*0.40, cy=cv._h*0.66, s=Math.min(cv._w,cv._h)*0.34;
    return { A:{x:cx-s*0.9,y:cy}, B:{x:cx+s*0.9,y:cy}, C:{x:cx,y:cy-s*1.25} };
  }
  function draw(){
    const w=cv._w,h=cv._h; ctx.clearRect(0,0,w,h);
    // faint background grid
    ctx.strokeStyle=C.grid; ctx.lineWidth=1;
    for(let x=0;x<w;x+=34){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,h);ctx.stroke();}
    const T=tri();
    // triangle face
    ctx.beginPath(); ctx.moveTo(T.A.x,T.A.y); ctx.lineTo(T.B.x,T.B.y); ctx.lineTo(T.C.x,T.C.y); ctx.closePath();
    ctx.fillStyle='rgba(94,200,216,.10)'; ctx.fill();
    ctx.strokeStyle='rgba(236,228,212,.5)'; ctx.lineWidth=2; ctx.stroke();
    // edge vectors: E1 = A->B (cyan), E2 = A->C (green)
    arrow(ctx,T.A.x,T.A.y,T.B.x,T.B.y,C.cyan,2.4,9);
    arrow(ctx,T.A.x,T.A.y,T.C.x,T.C.y,C.green,2.4,9);
    label(ctx,'E₁',(T.A.x+T.B.x)/2,(T.A.y+T.B.y)/2+16,C.cyan,13);
    label(ctx,'E₂',(T.A.x+T.C.x)/2-24,(T.A.y+T.C.y)/2,C.green,13);
    // vertices
    [['A',T.A],['B',T.B],['C',T.C]].forEach(([nm,p])=>{
      ctx.beginPath(); ctx.arc(p.x,p.y,5,0,TAU); ctx.fillStyle=C.amber; ctx.fill();
      label(ctx,nm,p.x+8,p.y-8,C.ink,13,'"Fraunces", serif');
    });
    // centroid
    const gx=(T.A.x+T.B.x+T.C.x)/3, gy=(T.A.y+T.B.y+T.C.y)/3;
    ctx.beginPath(); ctx.arc(gx,gy,3,0,TAU); ctx.fillStyle=C.soft; ctx.fill();
    // winding arc around centroid: CCW arrow vs CW arrow
    ctx.strokeStyle=C.amber2; ctx.lineWidth=2;
    ctx.beginPath(); ctx.arc(gx,gy,18,0,TAU*0.78,!ccw); ctx.stroke();
    // little arrowhead on the winding arc
    (function(){
      const a = ccw ? TAU*0.78 : -TAU*0.78;
      const hx = gx+18*Math.cos(a), hy = gy+18*Math.sin(a);
      const tang = a + (ccw?Math.PI/2:-Math.PI/2);
      ctx.fillStyle=C.amber2;
      ctx.beginPath();
      ctx.moveTo(hx,hy);
      ctx.lineTo(hx-6*Math.cos(tang-0.4),hy-6*Math.sin(tang-0.4));
      ctx.lineTo(hx-6*Math.cos(tang+0.4),hy-6*Math.sin(tang+0.4));
      ctx.closePath(); ctx.fill();
    })();
    // normal pops straight out of the centroid (animated by t).
    // CCW winding => N points toward camera => draw UP, bright amber, "visible".
    // CW winding  => N points away from camera => draw DOWN, faint, "back-face culled".
    if(shown){
      const dir = ccw ? -1 : 1;          // up (-y) when CCW, down (+y) when CW
      const len = 70*t;
      const col = ccw ? C.amber : C.faint;
      ctx.save();
      ctx.globalAlpha = ccw ? 1 : 0.55;
      arrow(ctx, gx, gy, gx, gy + dir*len, col, 3.2, 11);
      label(ctx,'N', gx+12, gy + dir*len + (ccw?4:14), ccw?C.amber2:C.soft, 16, '"Fraunces", serif');
      ctx.restore();
    }
    // readouts
    const wEl=$('#nm-wind'); if(wEl) wEl.textContent = ccw?'CCW':'CW';
    const dirEl=$('#nm-dir');
    if(dirEl){
      if(shown){
        dirEl.textContent = ccw ? 'toward camera (visible)' : 'away (back-face → culled)';
        dirEl.style.color = ccw ? C.green : C.red;
      } else {
        dirEl.textContent = '— press compute —';
        dirEl.style.color = C.soft;
      }
    }
  }
  function animateIn(){
    shown=true; t=0; cancelAnimationFrame(raf);
    (function loop(){ t=Math.min(1,t+0.06); draw(); if(t<1) raf=requestAnimationFrame(loop); })();
  }
  $('#nm-compute').addEventListener('click',animateIn);
  $('#nm-flip').addEventListener('click',()=>{ ccw=!ccw; if(shown) animateIn(); else draw(); });
  window.addEventListener('resize',()=>{ctx=fit(cv);draw();});
  draw();
})();

/* ============================================================
   4 · TRIANGLE STRIP BUILDER
   ============================================================ */
(function(){
  const cv=$('#cv-strip'); if(!cv) return;
  let ctx=fit(cv);
  let n=3; // vertices
  function draw(){
    const w=cv._w,h=cv._h; ctx.clearRect(0,0,w,h);
    const top=h*0.30, bot=h*0.74, x0=40, step=Math.min(70,(w-90)/Math.max(1,n-1));
    // vertices alternate top/bottom
    const pts=[];
    for(let i=0;i<n;i++){ pts.push({x:x0+i*step, y:(i%2===0?bot:top), i}); }
    // triangles: i,i+1,i+2
    for(let i=0;i+2<n;i++){
      ctx.beginPath();
      ctx.moveTo(pts[i].x,pts[i].y); ctx.lineTo(pts[i+1].x,pts[i+1].y); ctx.lineTo(pts[i+2].x,pts[i+2].y); ctx.closePath();
      const hue = i%2===0 ? 'rgba(94,200,216,.16)' : 'rgba(156,203,111,.16)';
      ctx.fillStyle=hue; ctx.fill();
      ctx.strokeStyle='rgba(236,228,212,.45)'; ctx.lineWidth=1.6; ctx.stroke();
    }
    // outline strip
    pts.forEach((p,i)=>{
      ctx.beginPath(); ctx.arc(p.x,p.y,6,0,TAU);
      ctx.fillStyle=C.amber; ctx.shadowColor=C.amber; ctx.shadowBlur=8; ctx.fill(); ctx.shadowBlur=0;
      label(ctx,String(i),p.x-3,p.y+(p.y===bot?20:-18),C.soft,12);
    });
    const tris=Math.max(0,n-2);
    $('#st-v').textContent=n;
    $('#st-t').textContent=tris;
    $('#st-soup').textContent=tris*3;
  }
  $('#st-add').addEventListener('click',()=>{ if(n<14){n++;draw();} });
  $('#st-reset').addEventListener('click',()=>{ n=3; draw(); });
  window.addEventListener('resize',()=>{ctx=fit(cv);draw();});
  draw();
})();

/* ============================================================
   5 · SUBDIVISION (square -> circle)
   ============================================================ */
(function(){
  const cv=$('#cv-subdiv'); if(!cv) return;
  let ctx=fit(cv);
  let pts, level=0;
  function reset(){
    const cx=cv._w*0.5, cy=cv._h*0.5, r=Math.min(cv._w,cv._h)*0.32;
    pts=[{x:cx-r,y:cy-r},{x:cx+r,y:cy-r},{x:cx+r,y:cy+r},{x:cx-r,y:cy+r}];
    level=0; draw();
  }
  function subdivide(){
    // Chaikin-style corner cutting -> converges to smooth curve/circle
    const out=[];
    const N=pts.length;
    for(let i=0;i<N;i++){
      const a=pts[i], b=pts[(i+1)%N];
      out.push({x:a.x*0.75+b.x*0.25, y:a.y*0.75+b.y*0.25});
      out.push({x:a.x*0.25+b.x*0.75, y:a.y*0.25+b.y*0.75});
    }
    pts=out; level++; draw();
  }
  function draw(){
    const w=cv._w,h=cv._h; ctx.clearRect(0,0,w,h);
    // target circle (faint)
    const cx=w*0.5, cy=h*0.5, r=Math.min(w,h)*0.32;
    ctx.beginPath(); ctx.arc(cx,cy,r*1.0,0,TAU);
    ctx.strokeStyle='rgba(94,200,216,.18)'; ctx.lineWidth=1; ctx.setLineDash([4,5]); ctx.stroke(); ctx.setLineDash([]);
    // filled polygon
    ctx.beginPath(); pts.forEach((p,i)=> i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y)); ctx.closePath();
    ctx.fillStyle='rgba(240,148,74,.10)'; ctx.fill();
    ctx.strokeStyle=C.amber; ctx.lineWidth=2; ctx.stroke();
    // vertices
    pts.forEach(p=>{ ctx.beginPath(); ctx.arc(p.x,p.y, level>3?2:4 ,0,TAU); ctx.fillStyle=C.green; ctx.fill(); });
    $('#sd-lvl').textContent=level;
    $('#sd-pts').textContent=pts.length;
  }
  $('#sd-step').addEventListener('click',()=>{ if(level<7) subdivide(); });
  $('#sd-reset').addEventListener('click',reset);
  window.addEventListener('resize',()=>{ctx=fit(cv);reset();});
  reset();
})();

/* ============================================================
   QUIZ
   ============================================================ */
(function(){
  const host=$('#quiz-host'); if(!host) return;
  const QS=[
    { q:'What is tessellation?',
      o:['Combining an odd number of triangles to form a single triangle.',
         'Combining a set of simple polygons to make a complex polygon.',
         'Splitting a polygon into a set of separate convex polygons.',
         'Splitting a polygon into a set of separate concave polygons.'],
      a:2, fb:'You are trying to simplify the original polygon into convex pieces — in practice, triangles.' },
    { q:'Why is the triangle the preferred geometric primitive in real-time 3D graphics?',
      o:['It uses the least memory of any polygon type.',
         'It is the only shape that can accurately represent curved surfaces.',
         'GPUs can only process exactly three vertices at a time.',
         'It is always planar and convex with a well-defined normal, making rasterisation unambiguous.'],
      a:3, fb:'Three points always define a unique plane, so a triangle is guaranteed planar, convex and has a well-defined normal.' },
    { q:'How is the surface normal of a triangle calculated from its vertices?',
      o:['By taking the cross product of two edge vectors and normalising the result.',
         'By taking the dot product of the two longest edges.',
         'By averaging the three vertex positions and pointing outward from the centroid.',
         'By dividing the triangle area by the length of its longest edge.'],
      a:0, fb:'The cross product of two edge vectors is perpendicular to the plane; normalising gives the unit normal.' },
    { q:'What does the cross product of two 3D vectors produce?',
      o:['A vector perpendicular to both input vectors.',
         'A scalar equal to the product of their magnitudes.',
         'A vector parallel to both input vectors.',
         'A 3×3 matrix.'],
      a:0, fb:'The cross product yields a new vector perpendicular to both inputs — exactly what we need for a normal.' },
    { q:'What is the effect of normalising a vector V?',
      o:['Scaling V to magnitude 1 and reversing its direction.',
         'Scaling V to magnitude 1 without affecting its direction.',
         'Making V make equal angles with the x, y and z axes.',
         'Making V always point along the positive z-axis.'],
      a:1, fb:'Normalising keeps direction but fixes the magnitude at 1 — ideal for representing an orientation.' },
    { q:'What does backface culling do, and why is it useful?',
      o:['Removes vertices behind the far clip plane to reduce vertex work.',
         'Prevents the z-buffer writing depth for unseen surfaces.',
         'Discards triangles whose normal faces away from the camera, saving rasterisation & fragment work.',
         'Merges back-facing triangles into larger polygons to cut draw calls.'],
      a:2, fb:'For a closed mesh, away-facing triangles are invisible, so skipping them roughly halves the work.' },
  ];
  let score=0, total=0;
  $('#quiz-total').textContent=QS.length;
  QS.forEach((item,qi)=>{
    const card=document.createElement('div'); card.className='quiz-q';
    const marks='ABCD';
    card.innerHTML='<div class="qn">Question '+(qi+1)+'</div><div class="qtext">'+item.q+'</div>';
    const opts=document.createElement('div');
    item.o.forEach((txt,oi)=>{
      const el=document.createElement('div'); el.className='opt';
      el.innerHTML='<span class="mk">'+marks[oi]+'</span><span>'+txt+'</span>';
      el.addEventListener('click',()=>{
        if(card.dataset.done) return;
        card.dataset.done='1'; total++;
        $$('.opt',opts).forEach(o=>o.classList.add('locked'));
        const correct=$$('.opt',opts)[item.a];
        correct.classList.add('correct');
        if(oi===item.a){ score++; }
        else { el.classList.add('wrong'); }
        const fb=card.querySelector('.qfb'); fb.classList.add('show');
        $('#quiz-score').textContent=score;
      });
      opts.appendChild(el);
    });
    card.appendChild(opts);
    const fb=document.createElement('div'); fb.className='qfb';
    fb.innerHTML='<b>Answer:</b> '+item.o[item.a]+'<br>'+item.fb;
    card.appendChild(fb);
    host.appendChild(card);
  });
})();

})();
