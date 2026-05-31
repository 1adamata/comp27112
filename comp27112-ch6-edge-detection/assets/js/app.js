/* ============================================================
   COMP27112 — Lecture 6 : Edge Detection — interactive notes
   ============================================================ */
'use strict';
const $ = (s,r=document)=>r.querySelector(s);
const $$ = (s,r=document)=>[...r.querySelectorAll(s)];

/* ---------- progress bar + nav active ---------- */
const prog = $('#progress');
const navLinks = $$('nav .links a');
const sections = navLinks.map(a=>$(a.getAttribute('href')));
function onScroll(){
  const st = window.scrollY, h = document.body.scrollHeight - innerHeight;
  prog.style.width = (h>0? st/h*100 : 0)+'%';
  let active = sections.length-1;
  for(let i=0;i<sections.length;i++){
    if(sections[i] && sections[i].offsetTop-140 <= st) active=i;
  }
  navLinks.forEach((a,i)=>a.classList.toggle('active',i===active));
}
addEventListener('scroll',onScroll,{passive:true}); onScroll();

/* ---------- scroll reveal ---------- */
const io = new IntersectionObserver(es=>{
  es.forEach(e=>{ if(e.isIntersecting){ e.target.classList.add('in'); io.unobserve(e.target);} });
},{threshold:.12});
$$('.reveal').forEach(el=>io.observe(el));

/* ============================================================
   GRADIENT CALCULATOR
   ============================================================ */
(function gradientCalc(){
  const i0=$('#g_i0'), i1=$('#g_i1'), i4=$('#g_i4'), out=$('#g_out');
  if(!i0) return;
  function calc(){
    const a=+i0.value, b=+i1.value, c=+i4.value;
    const dx=b-a, dy=c-a;
    const mag=Math.sqrt(dx*dx+dy*dy);
    const th=Math.atan2(dy,dx)*180/Math.PI;
    out.innerHTML =
      `\u03B4<sub>x</sub> = I\u2081 \u2212 I\u2080 = ${b} \u2212 ${a} = <b>${dx}</b><br>`+
      `\u03B4<sub>y</sub> = I\u2084 \u2212 I\u2080 = ${c} \u2212 ${a} = <b>${dy}</b><br>`+
      `M = \u221A(\u03B4<sub>x</sub>\u00B2 + \u03B4<sub>y</sub>\u00B2) = \u221A(${dx*dx}+${dy*dy}) = <b class="pos">${mag.toFixed(2)}</b><br>`+
      `\u03B8 = tan\u207B\u00B9(\u03B4<sub>y</sub>/\u03B4<sub>x</sub>) = <b class="neg">${th.toFixed(1)}\u00B0</b>`;
  }
  [i0,i1,i4].forEach(e=>e.addEventListener('input',calc)); calc();
})();

/* ============================================================
   SHARED IMAGE ENGINE  (synthetic scene + real convolutions)
   ============================================================ */
const Engine = (()=>{
  const W=280,H=200;
  // build a synthetic "cabin in the woods" grayscale scene -> Float32 [0..255]
  function buildScene(){
    const c=document.createElement('canvas'); c.width=W;c.height=H;
    const x=c.getContext('2d');
    // sky
    let g=x.createLinearGradient(0,0,0,H); g.addColorStop(0,'#cfd6e0');g.addColorStop(1,'#9aa3b2');
    x.fillStyle=g; x.fillRect(0,0,W,H);
    // ground
    x.fillStyle='#5b5750'; x.fillRect(0,H*0.72,W,H);
    // house body
    x.fillStyle='#7d7468'; x.fillRect(96,86,108,72);
    // roof
    x.fillStyle='#403a33'; x.beginPath(); x.moveTo(86,90);x.lineTo(150,52);x.lineTo(214,90);x.closePath();x.fill();
    // windows
    x.fillStyle='#dfe6ee'; x.fillRect(112,100,26,26); x.fillRect(160,100,26,26);
    x.strokeStyle='#2c2822'; x.lineWidth=2;
    x.strokeRect(112,100,26,26); x.strokeRect(160,100,26,26);
    x.beginPath();x.moveTo(125,100);x.lineTo(125,126);x.moveTo(112,113);x.lineTo(138,113);x.stroke();
    // door
    x.fillStyle='#33302a'; x.fillRect(140,128,22,30);
    // trees (trunks + canopy scribble)
    function tree(tx,ty,s){
      x.strokeStyle='#2a2620'; x.lineWidth=4*s;
      x.beginPath();x.moveTo(tx,H*0.72);x.lineTo(tx,ty);x.stroke();
      x.lineWidth=2*s;
      for(let i=0;i<8;i++){const a=-1.6+Math.random()*1.2;const L=18*s*Math.random()+10;
        x.beginPath();x.moveTo(tx,ty+i*4*s);x.lineTo(tx+Math.cos(a)*L,ty+i*4*s+Math.sin(a)*L);x.stroke();}
    }
    tree(40,40,1.2); tree(245,46,1.1); tree(20,70,.8); tree(262,80,.9);
    // foliage noise (high freq) top corners
    for(let i=0;i<1400;i++){const px=Math.random()*W,py=Math.random()*H*0.5;
      const inHouse=px>86&&px<214&&py>52&&py<158;
      if(!inHouse){x.fillStyle=`rgba(${30+Math.random()*60|0},${28+Math.random()*55|0},${22+Math.random()*40|0},.5)`;x.fillRect(px,py,1.4,1.4);}}
    // leaf litter ground texture
    for(let i=0;i<2200;i++){const px=Math.random()*W,py=H*0.72+Math.random()*H*0.28;
      const v=70+Math.random()*70|0; x.fillStyle=`rgb(${v},${v-8},${v-18})`; x.fillRect(px,py,1.6,1.6);}
    const d=x.getImageData(0,0,W,H).data;
    const gray=new Float32Array(W*H);
    for(let i=0;i<W*H;i++) gray[i]=0.299*d[i*4]+0.587*d[i*4+1]+0.114*d[i*4+2];
    return gray;
  }
  const base=buildScene();

  function addNoise(src,sigma){
    if(sigma<=0) return src.slice();
    const o=new Float32Array(src.length);
    for(let i=0;i<src.length;i++){
      // box-muller
      const u=Math.random()||1e-9,v=Math.random();
      const n=Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v)*sigma;
      o[i]=Math.max(0,Math.min(255,src[i]+n));
    }
    return o;
  }
  function gaussianKernel(sigma){
    const r=Math.max(1,Math.ceil(sigma*2)); const k=[];let s=0;
    for(let y=-r;y<=r;y++)for(let x=-r;x<=r;x++){const v=Math.exp(-(x*x+y*y)/(2*sigma*sigma));k.push(v);s+=v;}
    return {k:k.map(v=>v/s),r};
  }
  function convK(src,kernel,r){
    const o=new Float32Array(W*H);
    for(let y=0;y<H;y++)for(let x=0;x<W;x++){
      let acc=0,idx=0;
      for(let j=-r;j<=r;j++)for(let i=-r;i<=r;i++){
        const xx=Math.min(W-1,Math.max(0,x+i)), yy=Math.min(H-1,Math.max(0,y+j));
        acc+=src[yy*W+xx]*kernel[idx++];
      }
      o[y*W+x]=acc;
    }
    return o;
  }
  function blur(src,sigma){const{k,r}=gaussianKernel(sigma);return convK(src,k,r);}
  // generic 3x3 convolution (signed)
  function conv3(src,m){
    const o=new Float32Array(W*H);
    for(let y=0;y<H;y++)for(let x=0;x<W;x++){
      let a=0,idx=0;
      for(let j=-1;j<=1;j++)for(let i=-1;i<=1;i++){
        const xx=Math.min(W-1,Math.max(0,x+i)),yy=Math.min(H-1,Math.max(0,y+j));
        a+=src[yy*W+xx]*m[idx++];
      }
      o[y*W+x]=a;
    }return o;
  }
  function conv2(src,m){ // 2x2 roberts, anchor top-left
    const o=new Float32Array(W*H);
    for(let y=0;y<H;y++)for(let x=0;x<W;x++){
      const x1=Math.min(W-1,x+1),y1=Math.min(H-1,y+1);
      o[y*W+x]=src[y*W+x]*m[0]+src[y*W+x1]*m[1]+src[y1*W+x]*m[2]+src[y1*W+x1]*m[3];
    }return o;
  }
  function mag(a,b){const o=new Float32Array(a.length);for(let i=0;i<a.length;i++)o[i]=Math.hypot(a[i],b[i]);return o;}
  function absF(a){const o=new Float32Array(a.length);for(let i=0;i<a.length;i++)o[i]=Math.abs(a[i]);return o;}

  const K={
    rob1:[-1,0,0,1], rob2:[0,-1,1,0],
    pH:[-1,-1,-1,0,0,0,1,1,1], pV:[-1,0,1,-1,0,1,-1,0,1],
    sH:[-1,-2,-1,0,0,0,1,2,1], sV:[-1,0,1,-2,0,2,-1,0,1],
    lap4:[0,-1,0,-1,4,-1,0,-1,0], lap8:[-1,-1,-1,-1,8,-1,-1,-1,-1]
  };

  function run(op,opts){
    let src=addNoise(base,opts.noise||0);
    if(opts.blur) src=blur(src,opts.blurSigma||1.4);
    let m;
    switch(op){
      case 'original': return {field:src, signed:false, raw:true};
      case 'roberts': m=mag(conv2(src,K.rob1),conv2(src,K.rob2)); break;
      case 'prewitt': m=mag(conv3(src,K.pH),conv3(src,K.pV)); break;
      case 'sobel':   m=mag(conv3(src,K.sH),conv3(src,K.sV)); break;
      case 'lap4':    m=absF(conv3(src,K.lap4)); break;
      case 'lap8':    m=absF(conv3(src,K.lap8)); break;
      case 'log':     m=absF(conv3(blur(src,2),K.lap4)); break;
      case 'dog':     {const a=blur(src,3),b=blur(src,1);m=new Float32Array(a.length);for(let i=0;i<m.length;i++)m[i]=Math.abs(b[i]-a[i])*3;} break;
      case 'canny':   return {field:canny(src,opts.tLow||40,opts.tHigh||80), signed:false, binary:true};
      default: m=src;
    }
    return {field:m, signed:false};
  }

  function canny(src,tL,tH){
    const sm=blur(src,1.4);
    const Gx=conv3(sm,[-1,0,1,-2,0,2,-1,0,1]);
    const Gy=conv3(sm,[-1,-2,-1,0,0,0,1,2,1]);
    const M=new Float32Array(W*H),dir=new Float32Array(W*H);
    for(let i=0;i<W*H;i++){M[i]=Math.hypot(Gx[i],Gy[i]);let a=Math.atan2(Gy[i],Gx[i])*180/Math.PI;if(a<0)a+=180;dir[i]=a;}
    // non-max suppression
    const nm=new Float32Array(W*H);
    for(let y=1;y<H-1;y++)for(let x=1;x<W-1;x++){
      const a=dir[y*W+x],v=M[y*W+x];let p,q;
      if(a<22.5||a>=157.5){p=M[y*W+x-1];q=M[y*W+x+1];}
      else if(a<67.5){p=M[(y-1)*W+x+1];q=M[(y+1)*W+x-1];}
      else if(a<112.5){p=M[(y-1)*W+x];q=M[(y+1)*W+x];}
      else {p=M[(y-1)*W+x-1];q=M[(y+1)*W+x+1];}
      nm[y*W+x]=(v>=p&&v>=q)?v:0;
    }
    // double threshold + hysteresis
    const out=new Uint8Array(W*H); // 0 none,1 weak,2 strong
    for(let i=0;i<W*H;i++) out[i]=nm[i]>=tH?2:(nm[i]>=tL?1:0);
    const res=new Float32Array(W*H);
    const stack=[];
    for(let i=0;i<W*H;i++) if(out[i]===2){res[i]=255;stack.push(i);}
    while(stack.length){const i=stack.pop();const x=i%W,y=(i/W)|0;
      for(let j=-1;j<=1;j++)for(let k=-1;k<=1;k++){const xx=x+k,yy=y+j;if(xx<0||yy<0||xx>=W||yy>=H)continue;const ni=yy*W+xx;if(out[ni]===1){out[ni]=2;res[ni]=255;stack.push(ni);}}}
    return res;
  }

  function draw(canvas,res,thresh){
    canvas.width=W;canvas.height=H;
    const ctx=canvas.getContext('2d');
    const img=ctx.createImageData(W,H);
    let max=1;
    if(!res.raw&&!res.binary){for(let i=0;i<res.field.length;i++)if(res.field[i]>max)max=res.field[i];}
    for(let i=0;i<W*H;i++){
      let v;
      if(res.raw) v=res.field[i];
      else if(res.binary) v=res.field[i];
      else { v=res.field[i]/max*255; if(thresh!=null) v=v>=thresh?255:0; }
      v=Math.max(0,Math.min(255,v));
      img.data[i*4]=img.data[i*4+1]=img.data[i*4+2]=v; img.data[i*4+3]=255;
    }
    ctx.putImageData(img,0,0);
  }
  return {W,H,run,draw};
})();

/* ============================================================
   EDGE-DETECTOR LAB
   ============================================================ */
(function edgeLab(){
  const origC=$('#lab_orig'), outC=$('#lab_out');
  if(!origC) return;
  const opBtns=$$('#lab_ops .btn');
  const blurBtn=$('#lab_blur'), noiseR=$('#lab_noise'), noiseV=$('#lab_noiseV');
  const threshR=$('#lab_thresh'), threshV=$('#lab_threshV'), capOut=$('#lab_outcap');
  let op='sobel', blur=false;
  function render(){
    const noise=+noiseR.value;
    noiseV.textContent=noise;
    const useThresh = !(op==='original'||op==='canny');
    threshR.disabled = !useThresh;
    const t=useThresh? +threshR.value : null;
    threshV.textContent = useThresh? threshR.value : '\u2014';
    Engine.draw(origC, Engine.run('original',{noise}));
    const res=Engine.run(op,{noise,blur,blurSigma:1.6,tLow:40,tHigh:90});
    Engine.draw(outC,res, useThresh? t : null);
    const names={original:'Original',roberts:'Roberts magnitude',prewitt:'Prewitt magnitude',sobel:'Sobel magnitude',lap4:'Laplacian (4)',lap8:'Laplacian (8)',log:'Laplacian of Gaussian',dog:'Difference of Gaussians (\u03C3=3,1)',canny:'Canny (low 40 / high 90)'};
    capOut.textContent = names[op] + (blur&&op!=='canny'?' \u00B7 pre-blurred':'') + (useThresh?` \u00B7 thr ${threshR.value}`:'');
  }
  opBtns.forEach(b=>b.addEventListener('click',()=>{op=b.dataset.op;opBtns.forEach(x=>x.classList.toggle('on',x===b));render();}));
  blurBtn.addEventListener('click',()=>{blur=!blur;blurBtn.classList.toggle('on',blur);render();});
  noiseR.addEventListener('input',render); threshR.addEventListener('input',render);
  render();
})();

/* ============================================================
   CANNY PIPELINE STEPPER
   ============================================================ */
(function cannyStepper(){
  const wrap=$('#canny_steps'); if(!wrap) return;
  const cv=$('#canny_canvas');
  const steps=[
    {t:'1\u20132. Gaussian smoothing',d:'Build a Gaussian kernel G(x,y) and convolve the image to get a smoothed image I<sub>s</sub> = G \u2297 I. This removes high-frequency noise <span class="hlp">before</span> any gradients are taken, so spurious pixels are not mistaken for edges.',op:'blur'},
    {t:'3. Gradient magnitude & direction',d:'Apply an edge detector (e.g. Sobel) to I<sub>s</sub> and store two images: gradient magnitude M(x,y) and direction \u03B8(x,y). Remember these are <span class="hl">edge normals</span> \u2014 perpendicular to the edge.',op:'sobel'},
    {t:'4. Classify directions',d:'Quantise every \u03B8 into one of <span class="hlp">four</span> categories: horizontal (0/180\u00B0), vertical (90/-90\u00B0), +45\u00B0 and -45\u00B0. Opposite normals describe the same edge.',op:'dir'},
    {t:'5\u20136. Non-maxima suppression',d:'Thin the edges: for each pixel, look at its 8 neighbours in the same direction. If two or more have a higher magnitude, set M<sub>thin</sub>=0, otherwise keep M. This leaves edges one pixel wide.',op:'nms'},
    {t:'7\u20139. Double thresholding',d:'Two thresholds T<sub>L</sub>, T<sub>H</sub>. Below T<sub>L</sub> = not an edge; between = <span class="hl">weak</span>; above T<sub>H</sub> = <span class="hlp">strong</span>. Build binary M<sub>S</sub> and M<sub>W</sub>, then remove the strong pixels from the weak image.',op:'strong'},
    {t:'10\u201311. Hysteresis linking',d:'Assume strong pixels are real edges. For each strong pixel, if any of its 8 neighbours is a weak pixel, promote it. This <span class="hlp">links</span> edges and fills gaps. Canny suggested T<sub>H</sub> \u2248 2\u20133\u00D7 T<sub>L</sub>.',op:'canny'}
  ];
  const dots=$('#canny_dots'), body=$('#canny_body');
  let i=0;
  function show(){
    $$('.step-dot',dots).forEach((d,k)=>d.classList.toggle('on',k===i));
    body.innerHTML=`<h4>${steps[i].t}</h4><p>${steps[i].d}</p>`;
    const op=steps[i].op;
    if(op==='blur') Engine.draw(cv,Engine.run('original',{blur:true,blurSigma:1.6}));
    else if(op==='dir'||op==='sobel'||op==='nms'||op==='strong') Engine.draw(cv,Engine.run('sobel',{blur:true,blurSigma:1.6}), op==='strong'?70:(op==='nms'?40:null));
    else Engine.draw(cv,Engine.run('canny',{tLow:40,tHigh:90}));
  }
  steps.forEach((s,k)=>{const d=document.createElement('div');d.className='step-dot';d.textContent=k+1;d.onclick=()=>{i=k;show();};dots.appendChild(d);});
  $('#canny_prev').onclick=()=>{i=(i+steps.length-1)%steps.length;show();};
  $('#canny_next').onclick=()=>{i=(i+1)%steps.length;show();};
  show();
})();

/* ============================================================
   DIRECTION WHEEL (interactive)
   ============================================================ */
(function wheel(){
  const r=$('#wheel_angle'); if(!r) return;
  const needle=$('#wheel_needle'), info=$('#wheel_cat'), sub=$('#wheel_sub'), av=$('#wheel_av');
  function cat(a){ // a in [0,360)
    let m=((a%180)+180)%180;
    if(m<22.5||m>=157.5) return ['Horizontal edge','0 / 180\u00B0'];
    if(m<67.5) return ['\u201345\u00B0 edge','45 / \u2013135\u00B0'];
    if(m<112.5) return ['Vertical edge','90 / \u201390\u00B0'];
    return ['+45\u00B0 edge','135 / \u201345\u00B0'];
  }
  function upd(){
    const a=+r.value; av.textContent=a+'\u00B0';
    needle.style.transform=`translate(-50%,-100%) rotate(${a}deg)`;
    const [c,s]=cat(a); info.textContent=c; sub.textContent='normal \u2192 '+s;
  }
  r.addEventListener('input',upd); upd();
})();

/* ============================================================
   CONVOLUTION PLAYGROUND (Prewitt-H sliding window)
   ============================================================ */
(function convPlay(){
  const stage=$('#conv_stage'); if(!stage) return;
  const GW=8,GH=6;
  // synthetic intensity grid: left dark, right light vertical edge + a bit of noise
  const img=[]; for(let y=0;y<GH;y++){const row=[];for(let x=0;x<GW;x++){let v=x<4?40:200; v+=(Math.random()*20-10)|0; row.push(Math.max(0,Math.min(255,v|0)));}img.push(row);}
  const kernel=[[-1,0,1],[-1,0,1],[-1,0,1]]; // prewitt vertical (finds vertical edge)
  const out=Array.from({length:GH},()=>Array(GW).fill(null));
  const ig=$('#conv_img'), og=$('#conv_out'), kg=$('#conv_kernel'), calc=$('#conv_calc');
  let cx=1,cy=1; // window centre
  function buildGrid(el,data,cls){
    el.innerHTML='';
    el.style.display='grid'; el.style.gridTemplateColumns=`repeat(${GW},1fr)`; el.style.gap='3px';
    for(let y=0;y<GH;y++)for(let x=0;x<GW;x++){
      const d=document.createElement('div'); d.className='cv-cell '+cls;
      const v=data[y][x];
      d.textContent = v==null?'':v;
      if(cls==='img'){const g=v;d.style.background=`rgb(${g},${g},${g})`;d.style.color=g>120?'#111':'#ddd';}
      d.dataset.x=x;d.dataset.y=y; el.appendChild(d);
    }
  }
  function buildKernel(){kg.innerHTML='';kg.style.display='grid';kg.style.gridTemplateColumns='repeat(3,1fr)';kg.style.gap='3px';
    for(let j=0;j<3;j++)for(let i=0;i<3;i++){const d=document.createElement('div');const v=kernel[j][i];d.className='cv-cell k';d.textContent=v;d.style.color=v<0?'#ff8278':(v>0?'#5cd1e6':'#5b6072');kg.appendChild(d);}}
  function highlight(){
    $$('.cv-cell.img',ig).forEach(c=>{c.classList.remove('win','ctr');});
    for(let j=-1;j<=1;j++)for(let i=-1;i<=1;i++){
      const x=cx+i,y=cy+j; const c=ig.querySelector(`.cv-cell.img[data-x="${x}"][data-y="${y}"]`);
      if(c){c.classList.add('win'); if(i===0&&j===0)c.classList.add('ctr');}
    }
    $$('.cv-cell',og).forEach(c=>c.classList.remove('ctr'));
    const oc=og.querySelector(`.cv-cell[data-x="${cx}"][data-y="${cy}"]`); if(oc)oc.classList.add('ctr');
  }
  function compute(){
    let sum=0,terms=[];
    for(let j=-1;j<=1;j++)for(let i=-1;i<=1;i++){
      const v=img[cy+j][cx+i],k=kernel[j+1][i+1];
      sum+=v*k; if(k!==0)terms.push(`${v}\u00D7${k}`);
    }
    calc.innerHTML=`output(${cx},${cy}) = ${terms.join(' + ').replace(/\+ -/g,'\u2212 ')} = <b>${sum}</b>`;
    return sum;
  }
  function step(){
    out[cy][cx]=compute(); buildGrid(og,out,'out'); highlight();
    if(cx>=GW-2 && cy>=GH-2) return; // finished
    cx++; if(cx>GW-2){cx=1;cy++;}
  }
  let timer=null;
  function reset(){cx=1;cy=1;for(let y=0;y<GH;y++)for(let x=0;x<GW;x++)out[y][x]=null;buildGrid(og,out,'out');highlight();compute();}
  buildGrid(ig,img,'img'); buildKernel(); reset();
  $('#conv_step').onclick=()=>{ if(out[GH-2][GW-2]!=null){reset();return;} step(); };
  $('#conv_play').onclick=function(){
    if(timer){clearInterval(timer);timer=null;this.textContent='\u25B6 Play';this.classList.remove('on');return;}
    this.textContent='\u275A\u275A Pause';this.classList.add('on');
    if(out[GH-2][GW-2]!=null)reset();
    timer=setInterval(()=>{ if(out[GH-2][GW-2]!=null){clearInterval(timer);timer=null;$('#conv_play').textContent='\u25B6 Play';$('#conv_play').classList.remove('on');return;} step(); },420);
  };
  $('#conv_reset').onclick=reset;
})();

/* ============================================================
   TEMPLATE MATCHING (scan + normalised correlation)
   ============================================================ */
(function templateMatch(){
  const stage=$('#tm_img'); if(!stage) return;
  const GW=12,GH=9, TW=3,TH=3;
  // image: mostly light background (~230), hide a 3x3 "face" pattern at (target)
  const tgtX=7,tgtY=5;
  const tmpl=[[60,40,60],[40,90,40],[70,50,70]];
  const img=[];for(let y=0;y<GH;y++){const r=[];for(let x=0;x<GW;x++){r.push(225+(Math.random()*20-10|0));}img.push(r);}
  for(let j=0;j<3;j++)for(let i=0;i<3;i++) img[tgtY+j][tgtX+i]=tmpl[j][i];
  const ig=$('#tm_img'), tg=$('#tm_tmpl'), bar=$('#tm_bar'), info=$('#tm_info');
  function grid(el,data,w,h,cls){el.innerHTML='';el.style.display='grid';el.style.gridTemplateColumns=`repeat(${w},1fr)`;el.style.gap='2px';
    for(let y=0;y<h;y++)for(let x=0;x<w;x++){const d=document.createElement('div');d.className='cv-cell tm '+cls;const g=data[y][x];d.style.background=`rgb(${g},${g},${g})`;d.dataset.x=x;d.dataset.y=y;el.appendChild(d);}}
  grid(ig,img,GW,GH,'img'); grid(tg,tmpl,TW,TH,'t');
  let sx=0,sy=0,best=-1,bestX=0,bestY=0,done=false;
  function corr(px,py){let cc=0,reg=0;for(let j=0;j<3;j++)for(let i=0;i<3;i++){cc+=tmpl[j][i]*img[py+j][px+i];reg+=img[py+j][px+i];}return cc/reg;}
  function hi(px,py,best){$$('.cv-cell.img',ig).forEach(c=>c.classList.remove('win','match'));
    for(let j=0;j<3;j++)for(let i=0;i<3;i++){const c=ig.querySelector(`.cv-cell.img[data-x="${px+i}"][data-y="${py+j}"]`);if(c)c.classList.add(best?'match':'win');}}
  function scanStep(){
    if(done)return;
    const v=corr(sx,sy); if(v>best){best=v;bestX=sx;bestY=sy;}
    hi(sx,sy,false);
    bar.style.width=Math.min(100,(v/ (corr(tgtX,tgtY)) *100))+'%';
    info.innerHTML=`scanning (${sx},${sy}) \u00B7 normalised score <b>${v.toFixed(2)}</b> \u00B7 best so far <b class="pos">${best.toFixed(2)}</b>`;
    sx++; if(sx>GW-TW){sx=0;sy++;}
    if(sy>GH-TH){done=true; hi(bestX,bestY,true); info.innerHTML=`<b class="pos">Match found</b> at (${bestX},${bestY}) \u2014 highest correlation = ${best.toFixed(2)}. The template was cut from the image, so it matches exactly.`;}
  }
  let timer=null;
  $('#tm_play').onclick=function(){
    if(timer){clearInterval(timer);timer=null;this.textContent='\u25B6 Scan';this.classList.remove('on');return;}
    if(done){sx=sy=0;best=-1;done=false;}
    this.textContent='\u275A\u275A Pause';this.classList.add('on');
    timer=setInterval(()=>{scanStep(); if(done){clearInterval(timer);timer=null;$('#tm_play').textContent='\u25B6 Scan';$('#tm_play').classList.remove('on');}},90);
  };
  $('#tm_step').onclick=()=>{if(done){sx=sy=0;best=-1;done=false;}scanStep();};
})();

/* ============================================================
   QUIZ
   ============================================================ */
(function quiz(){
  const root=$('#quiz_root'); if(!root) return;
  const Q=[
    {q:'The purpose of the convolution operator is\u2026',o:['To detect edges','To assess the similarity between an image patch and a template','To smooth an image','To find objects'],a:1,e:'Detecting edges, smoothing and finding objects are all things you can achieve with convolution \u2014 but the operator itself measures the similarity between an image patch and a template.'},
    {q:'Noise in an image is\u2026',o:['any factor in the imaging system that gives rise to perturbations in the image','random blockiness in the image','random fluctuations of the data','speckle in the image'],a:0,e:'Blockiness, fluctuations and speckle are all examples of noise; noise itself is any factor in the imaging system that perturbs the image.'},
    {q:'Noise is generally assumed to be\u2026',o:['Zero mean, triangular distributed','Zero mean, Gaussian distributed','Zero mean, uniformly distributed','Non-zero mean, Gaussian distributed'],a:1,e:'Noise is modelled as zero-mean and Gaussian distributed \u2014 which is exactly why averaging over a locality cancels it.'},
    {q:'The effect of noise can be reduced by\u2026',o:['Averaging pixel values over a small locality','Choosing a random pixel value in a locality','Choosing the modal pixel value in a locality','Choosing the smallest pixel value in a locality'],a:0,e:'Because noise is zero-mean, averaging neighbouring pixels makes it cancel out.'},
    {q:'One problem with smoothing an image to reduce noise effects is\u2026',o:['It can give incorrect answers','It can be expensive to execute','It can blur image detail','It fails to process pixels at the image edges'],a:2,e:'Smoothing is a low-pass operation, so it suppresses noise but also blurs genuine detail and the edges you are trying to find.'},
    {q:'Median smoothing is better than averaging because\u2026',o:['It is more efficient','It retains significant image structures','It reduces the effects of noise more','It blurs the image less'],a:1,e:'The median is robust to outliers, so it removes noise while preserving edges and significant structures instead of smearing them.'},
    {q:'Gaussian smoothing is a good choice for noise reduction because\u2026',o:['It is conceptually simpler','It is more efficient to implement','It introduces fewer artefacts at the edges of objects','It gives improved smoothing results'],a:2,e:'Its smooth, rotationally-symmetric weighting avoids the ringing/box artefacts that a flat averaging kernel produces at object edges.'},
    {q:'A square convolution template can be separated into two 1-D templates if\u2026',o:['The convolution of the 1-D templates equals the original square template','The sum of the 1-D templates equals the original square template','The cross product of the 1-D templates equals the original square template','The product of the 1-D templates equals the original square template'],a:0,e:'Separability means the 2-D kernel is the convolution (outer product) of two 1-D kernels \u2014 e.g. Sobel = [1 2 1]\u1d40 \u2297 [-1 0 1] \u2014 letting one O(xy) pass become two cheap 1-D passes.'},
    {q:'Convolution of an image with r rows and c columns and an x by y template is\u2026',o:['O(rcxy)','O(1)','O(rc)','O(xy)'],a:0,e:'Each of the r\u00D7c pixels needs x\u00D7y multiply-adds \u2192 O(rcxy). This cost is the motivation for separable kernels.'},
    {q:'The elements of a template are normalised such that they sum to 1 because\u2026',o:['This is computationally more efficient','This helps to keep the answers small','This is computationally the correct thing to do','This helps to ensure that the answer does not overflow'],a:3,e:'If the weights summed to more than 1 the filtered value could exceed the byte range and overflow; normalising keeps the output in range.'},
    {q:'An edge in image processing is defined as\u2026',o:['The line joining two vertices of a polygon','The boundary of the image','A significant, local, extended change in image intensity','A spatially organised change in image intensity'],a:2,e:'\u201CEdge\u201D means something different in graphics vs image processing. Here it is a significant, local, extended change in intensity \u2014 not a polygon edge.'},
    {q:'If an edge is a local change in image intensity, a sensible starting point for locating edges is\u2026',o:['To find the direction of the largest increase in grey value at each pixel','To subtract values of adjacent pixels along the x and y directions','To locate pixels that are local maxima','To find the largest difference between a pixel and its eight nearest neighbours'],a:1,e:'A change in intensity is a derivative, and the simplest discrete derivative is to subtract adjacent pixels along x and y.'},
    {q:'Edges can be enhanced by convolution with\u2026',o:['A Mexican hat template','A pair of templates that achieve the subtraction along the x and y directions','A template that enhances local maxima','A smoothing template followed by a differentiation template'],a:1,e:'First-derivative edge enhancement uses a pair of templates that difference along x and y (e.g. Sobel Gx and Gy). The Mexican-hat/LoG instead double-differentiates, flagging edges by zero-crossings.'},
    {q:'The Sobel templates are 3\u00D73 arrays. What is the benefit over smaller templates?',o:['It is more efficient than smaller templates','It computes the differential more accurately','It incorporates a small amount of local averaging that suppresses noise effects','It blurs the result less than a smaller template'],a:2,e:'The [1 2 1] weighting averages along the edge direction, so Sobel smooths a little while it differentiates \u2014 making it less noise-sensitive than the 2\u00D72 Roberts.'},
    {q:'An edge is a vector with magnitude and direction. How is the magnitude found?',o:['By taking the maximum of the absolute values of the x and y derivatives','By adding the absolute values of the x and y derivatives','By adding the x and y derivatives in quadrature','By taking the sum of the x and y derivatives'],a:2,e:'Magnitude M = \u221A(\u03B4x\u00B2 + \u03B4y\u00B2) \u2014 the two derivatives added in quadrature.'},
    {q:'An edge is a vector with magnitude and direction. How is the direction found?',o:['By taking the ratio of the x and y derivatives','By taking the maximum of the x and y derivatives','By taking the inverse tan of the x and y derivatives','By taking the inverse tan of the ratio of the y and x derivatives'],a:3,e:'Direction \u03B8 = tan\u207B\u00B9(\u03B4y / \u03B4x).'},
    {q:'Canny derived his edge detector using which three requirements?',o:['Edges must be located; the orientation must be accurate; the magnitude must be accurate','Edges must be located; the edges must enclose a region','Edges must be located; the extent of the edge must be identified','Edges must be detected; the localisation must be accurate; there must be a single response to an edge'],a:3,e:'Canny\u2019s three criteria: good detection (find real edges, few false), good localisation (on the true centre), and a single response per edge.'},
    {q:'Template matching can find known objects. How do you build a template?',o:['The template is a model of the object to be found','The template is a binary version of the object','The template abstracts the shape of the object','The template matches the size of the object'],a:0,e:'A template is a model (a small image) of the object you want to locate; it is slid over the image and compared at each position.'},
    {q:'Template matching is a bad choice for object recognition if\u2026',o:['The object to be found varies in orientation','The object to be found varies in colour','The object to be found is quite big','There is any variability in the object to be found'],a:3,e:'Matching is rigid \u2014 any variability (orientation, scale, shape or colour) breaks the correspondence, so it only suits fixed, known objects.'},
    {q:'Cross correlation is the operation that\u2026',o:['computes the similarity between an image patch and a template','would be performed to correct any colour bias in the image','would be performed to make rows and columns independent','measures the resemblance between a template and the image'],a:0,e:'Cross-correlation slides the template over the image and, at each position, computes a similarity score between the patch and the template (no kernel flip, unlike convolution).'}
  ];
  let answered=0,correct=0;
  Q.forEach((item,qi)=>{
    const card=document.createElement('div'); card.className='q reveal';
    card.innerHTML=`<div class="qn">Q${qi+1} / ${Q.length}</div><div class="qt">${item.q}</div>`;
    const opts=document.createElement('div');
    item.o.forEach((txt,oi)=>{
      const o=document.createElement('div'); o.className='opt'; o.textContent=txt;
      o.onclick=()=>{
        if(card.dataset.done)return; card.dataset.done='1'; answered++;
        $$('.opt',opts).forEach((e,k)=>{e.classList.add(k===item.a?'correct':(k===oi?'wrong':''));});
        if(oi===item.a)correct++;
        $('.exp',card).classList.add('show');
        updateScore();
      };
      opts.appendChild(o);
    });
    card.appendChild(opts);
    const exp=document.createElement('div'); exp.className='exp'; exp.innerHTML='<b>'+(item.e)+'</b>';
    card.appendChild(exp);
    root.appendChild(card); io.observe(card);
  });
  const sc=$('#quiz_score');
  function updateScore(){sc.innerHTML=`${correct} / ${answered} <span style="font-size:14px;color:var(--mut)">(of ${Q.length})</span>`;}
  updateScore();
  $('#quiz_reset').onclick=()=>location.reload();
})();
