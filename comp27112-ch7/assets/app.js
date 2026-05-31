/* ============ COMP27112 L7 — Visual Notes interactions ============ */
(function(){
  "use strict";

  /* ---------- progress bar + nav active ---------- */
  var prog = document.getElementById('progress');
  var navLinks = Array.prototype.slice.call(document.querySelectorAll('nav .links a'));
  var sections = navLinks.map(function(a){ return document.querySelector(a.getAttribute('href')); });
  function onScroll(){
    var h = document.documentElement;
    var sc = h.scrollTop || document.body.scrollTop;
    var max = h.scrollHeight - h.clientHeight;
    prog.style.width = (max>0 ? (sc/max*100) : 0) + '%';
    var idx = 0;
    for (var i=0;i<sections.length;i++){
      if (sections[i] && sections[i].getBoundingClientRect().top < 140) idx = i;
    }
    navLinks.forEach(function(a,i){ a.classList.toggle('active', i===idx); });
  }
  window.addEventListener('scroll', onScroll, {passive:true});
  onScroll();

  /* close mobile menu on link click */
  navLinks.forEach(function(a){ a.addEventListener('click', function(){
    document.getElementById('navlinks').classList.remove('open');
  });});

  /* ---------- scroll reveal ---------- */
  var io = new IntersectionObserver(function(es){
    es.forEach(function(e){ if(e.isIntersecting){ e.target.classList.add('in'); io.unobserve(e.target); } });
  }, {threshold:0.12});
  document.querySelectorAll('.reveal').forEach(function(el){ io.observe(el); });

  var SVGNS = "http://www.w3.org/2000/svg";
  function el(tag, attrs){
    var n = document.createElementNS(SVGNS, tag);
    for (var k in attrs) n.setAttribute(k, attrs[k]);
    return n;
  }

  /* ================= CONNECTIVITY EXPLORER ================= */
  (function(){
    var svg = document.getElementById('connSvg');
    var narr = document.getElementById('connNarr');
    var mode = 4;
    var cell = 70, ox = 45, oy = 45;
    function draw(){
      svg.innerHTML='';
      var four = [[1,0],[0,1],[2,1],[1,2]];
      var diag = [[0,0],[2,0],[0,2],[2,2]];
      var on = mode===4 ? four : four.concat(diag);
      function isOn(r,c){ return on.some(function(p){return p[0]===r&&p[1]===c;}); }
      for(var r=0;r<3;r++)for(var c=0;c<3;c++){
        var fill = (r===1&&c===1) ? '#5b8cff' : (isOn(r,c) ? '#ef5d5d' : 'transparent');
        var rect = el('rect',{x:ox+c*cell,y:oy+r*cell,width:cell-2,height:cell-2,rx:6,fill:fill,stroke:'#27313d','stroke-width':1.5});
        rect.style.transition='fill .25s';
        svg.appendChild(rect);
      }
      var t = el('text',{x:ox+cell+cell/2-1,y:oy+cell+cell/2+5,'text-anchor':'middle',fill:'#fff','font-size':14,'font-family':'JetBrains Mono'});
      t.textContent='P'; svg.appendChild(t);
      narr.innerHTML = mode===4
        ? 'The <b style="color:#ef5d5d">4</b> edge-sharing neighbours connect to centre <b style="color:#5b8cff">P</b>. Diagonal touches do NOT count.'
        : 'All <b style="color:#ef5d5d">8</b> neighbours connect to <b style="color:#5b8cff">P</b> — including the four diagonal corners.';
    }
    document.querySelectorAll('#connToggle button').forEach(function(b){
      b.addEventListener('click', function(){
        document.querySelectorAll('#connToggle button').forEach(function(x){x.classList.remove('on');});
        b.classList.add('on'); mode = +b.dataset.c; draw();
      });
    });
    draw();
  })();

  /* ================= CCA WALKTHROUGH ================= */
  (function(){
    var svg = document.getElementById('ccaSvg');
    var narr = document.getElementById('ccaNarr');
    var equivEl = document.getElementById('ccaEquiv');
    var cell=44, ox=54, oy=18;
    // foreground cells with first-pass label, final label, narration
    var steps = [
      {r:0,c:2,p:1,f:1,n:'(0,2): no labelled neighbours → assign new label <b>1</b>.'},
      {r:0,c:7,p:2,f:2,n:'(0,7): no labelled neighbours → assign new label <b>2</b>.'},
      {r:1,c:0,p:3,f:1,n:'(1,0): no labelled neighbour above/left → assign new label <b>3</b>.'},
      {r:1,c:1,p:1,f:1,n:'(1,1): up-right neighbour = 1, left = 3 → take <b>1</b>, record equivalence <b>3 ≡ 1</b>.',eq:'3 ≡ 1'},
      {r:1,c:2,p:1,f:1,n:'(1,2): neighbours labelled 1 → label <b>1</b>.'},
      {r:1,c:3,p:1,f:1,n:'(1,3): neighbours labelled 1 → label <b>1</b>.'},
      {r:1,c:5,p:4,f:2,n:'(1,5): no labelled neighbours → assign new label <b>4</b>.'},
      {r:1,c:6,p:2,f:2,n:'(1,6): up-right = 2, left = 4 → take <b>2</b>, record equivalence <b>4 ≡ 2</b>.',eq:'4 ≡ 2'},
      {r:2,c:6,p:2,f:2,n:'(2,6): neighbours include 2 (and 4) → label <b>2</b>; equivalence already known.'},
      {r:-1,c:-1,relabel:true,n:'Pass 2 — resolve equivalences: every <b>3 → 1</b> and every <b>4 → 2</b>. Two clean blobs remain.'}
    ];
    var fgList = steps.filter(function(s){return s.r>=0;});
    var ptr=0, equivs=[];
    var rects={}, texts={};
    function key(r,c){return r+'_'+c;}
    function build(){
      svg.innerHTML=''; rects={}; texts={};
      for(var r=0;r<3;r++)for(var c=0;c<8;c++){
        var isFg = fgList.some(function(s){return s.r===r&&s.c===c;});
        var rect = el('rect',{x:ox+c*cell,y:oy+r*cell,width:cell-2,height:cell-2,rx:4,fill:isFg?'#56606c':'transparent',stroke:'#27313d','stroke-width':1.2});
        rect.style.transition='fill .3s';
        svg.appendChild(rect); rects[key(r,c)]=rect;
        if(isFg){
          var t=el('text',{x:ox+c*cell+(cell-2)/2,y:oy+r*cell+(cell-2)/2+5,'text-anchor':'middle',fill:'#fff','font-size':16,'font-family':'JetBrains Mono','font-weight':700});
          t.textContent=''; svg.appendChild(t); texts[key(r,c)]=t;
        }
      }
    }
    function render(){
      // reset highlights
      for(var k in rects){ if(rects[k].getAttribute('fill')!=='transparent') rects[k].setAttribute('fill','#56606c'); }
      var applied = steps.slice(0,ptr);
      var didRelabel = applied.some(function(s){return s.relabel;});
      applied.forEach(function(s){
        if(s.relabel) return;
        var t=texts[key(s.r,s.c)];
        if(t) t.textContent = didRelabel ? s.f : s.p;
      });
      // highlight last non-relabel step
      var last = applied.length?applied[applied.length-1]:null;
      if(last && !last.relabel){
        var rk=rects[key(last.r,last.c)];
        if(rk) rk.setAttribute('fill','#ff9442');
      }
      equivEl.innerHTML = 'Equivalences recorded: <b>' + (equivs.length?equivs.join('  ,  '):'—') + '</b>';
    }
    function step(){
      if(ptr>=steps.length){ document.getElementById('ccaStep').disabled=true; return; }
      var s=steps[ptr]; ptr++;
      if(s.eq && equivs.indexOf(s.eq)<0) equivs.push(s.eq);
      narr.innerHTML=s.n;
      render();
      if(ptr>=steps.length) document.getElementById('ccaStep').disabled=true;
    }
    function reset(){ ptr=0; equivs=[]; document.getElementById('ccaStep').disabled=false; build(); render(); narr.innerHTML='Press “Next step” to label the first foreground pixel.'; }
    document.getElementById('ccaStep').addEventListener('click',step);
    document.getElementById('ccaReset').addEventListener('click',reset);
    reset();
  })();

  /* ================= BOUNDARY TRACE ================= */
  (function(){
    var svg=document.getElementById('bndSvg');
    var narr=document.getElementById('bndNarr');
    var cell=40, ox=10, oy=10;
    var fg=[[1,2],[1,3],[2,1],[2,2],[2,3],[2,4],[2,5],[3,2],[3,3],[3,4],[3,5],[3,6],
            [4,1],[4,2],[4,3],[4,4],[4,5],[4,6],[5,2],[5,3],[5,5],[5,6]];
    var O=[[1,2],[1,3],[2,4],[2,5],[3,6],[4,6],[5,6],[5,5],[4,4],[5,3],[5,2],[4,1],[3,2],[2,1]];
    var B=[[1,1],[0,3],[1,4],[1,5],[2,6],[4,7],[5,7],[6,5],[5,4],[5,4],[6,2],[5,1],[3,1],[3,1]];
    var rects={}; var ptr=0; var timer=null;
    function key(r,c){return r+'_'+c;}
    function isFg(r,c){return fg.some(function(p){return p[0]===r&&p[1]===c;});}
    function build(){
      svg.innerHTML=''; rects={};
      for(var r=0;r<8;r++)for(var c=0;c<8;c++){
        var rect=el('rect',{x:ox+c*cell,y:oy+r*cell,width:cell-2,height:cell-2,rx:3,fill:isFg(r,c)?'#56606c':'transparent',stroke:'#27313d','stroke-width':1.1});
        rect.style.transition='fill .2s';
        svg.appendChild(rect); rects[key(r,c)]=rect;
      }
    }
    function render(){
      build();
      for(var i=0;i<ptr && i<O.length;i++){
        var o=O[i]; rects[key(o[0],o[1])].setAttribute('fill','#46d6c4');
      }
      if(ptr>0 && ptr<=O.length){
        var cur=O[ptr-1]; rects[key(cur[0],cur[1])].setAttribute('fill','#ff9442');
        var b=B[ptr-1]; var bk=rects[key(b[0],b[1])]; if(bk) bk.setAttribute('fill','#5b8cff');
        var lab = ptr===1 ? 'O₀ (start)' : 'O'+sub(ptr-1);
        narr.innerHTML='Step '+ptr+'/'+O.length+': boundary pixel <b style="color:#ff9442">'+lab+'</b> at ('+cur[0]+','+cur[1]+'). Backtrack cell <b style="color:#5b8cff">B'+sub(ptr-1)+'</b> shown in blue — the clockwise sweep starts from there.';
      }
      if(ptr>=O.length){
        narr.innerHTML='Complete — all <b style="color:#46d6c4">14</b> boundary pixels traced. We stop because we returned to O₀ and the next pixel found is O₁ again.';
      }
    }
    function sub(n){ var m={0:'₀',1:'₁',2:'₂',3:'₃',4:'₄',5:'₅',6:'₆',7:'₇',8:'₈',9:'₉'}; return (''+n).split('').map(function(d){return m[d];}).join(''); }
    function step(){ if(ptr<O.length){ ptr++; render(); } }
    function reset(){ if(timer){clearInterval(timer);timer=null;} ptr=0; build(); narr.innerHTML='O₀ is the first object pixel found by the raster scan. Press play.'; }
    function play(){
      if(timer){ clearInterval(timer); timer=null; document.getElementById('bndPlay').textContent='▶ Play trace'; return; }
      if(ptr>=O.length) reset();
      document.getElementById('bndPlay').textContent='⏸ Pause';
      timer=setInterval(function(){ if(ptr>=O.length){ clearInterval(timer); timer=null; document.getElementById('bndPlay').textContent='▶ Play trace'; return; } step(); }, 650);
    }
    document.getElementById('bndPlay').addEventListener('click',play);
    document.getElementById('bndStep').addEventListener('click',function(){ if(timer){clearInterval(timer);timer=null;document.getElementById('bndPlay').textContent='▶ Play trace';} step(); });
    document.getElementById('bndReset').addEventListener('click',reset);
    reset();
  })();

  /* ================= CHAIN CODE COMPASS ================= */
  (function(){
    var svg=document.getElementById('compassSvg');
    var narr=document.getElementById('compassNarr');
    var cx=120, cy=120, R=82;
    // direction 0 = up, clockwise. angle for dir d: 0 at top, +45deg clockwise
    var dirs=[];
    for(var d=0;d<8;d++){
      var ang=(d*45-90)*Math.PI/180; // 0 -> -90deg = up
      dirs.push({d:d, x:cx+R*Math.cos(ang), y:cy+R*Math.sin(ang), odd:d%2===1});
    }
    var active=0;
    function draw(){
      svg.innerHTML='';
      svg.appendChild(el('circle',{cx:cx,cy:cy,r:R+18,fill:'none',stroke:'#27313d','stroke-width':1}));
      // arrows
      dirs.forEach(function(p){
        var line=el('line',{x1:cx,y1:cy,x2:p.x,y2:p.y,stroke:p.d===active?'#ff9442':(p.odd?'#46d6c4':'#5b8cff'),'stroke-width':p.d===active?4:2});
        line.style.transition='stroke .2s,stroke-width .2s';
        svg.appendChild(line);
        var lx=cx+(R+15)*Math.cos((p.d*45-90)*Math.PI/180);
        var ly=cy+(R+15)*Math.sin((p.d*45-90)*Math.PI/180);
        var t=el('text',{x:lx,y:ly+5,'text-anchor':'middle','font-size':16,'font-family':'JetBrains Mono','font-weight':700,fill:p.d===active?'#ff9442':'#93a1b0'});
        t.textContent=p.d; t.style.cursor='pointer';
        t.addEventListener('click',function(){ active=p.d; update(); });
        line.style.cursor='pointer';
        line.addEventListener('click',function(){ active=p.d; update(); });
        svg.appendChild(t);
      });
      svg.appendChild(el('circle',{cx:cx,cy:cy,r:5,fill:'#ff9442'}));
    }
    function update(){
      draw();
      var p=dirs[active];
      var len = p.odd ? 'a diagonal step of length <b>√2</b>' : 'a horizontal/vertical step of length <b>1</b>';
      var names=['up','up-right','right','down-right','down','down-left','left','up-left'];
      narr.innerHTML='Direction <b style="color:#ff9442">'+active+'</b> points <b>'+names[active]+'</b> — '+len+'. '+(p.odd?'Odd codes are diagonals.':'Even codes are axis-aligned.');
    }
    update();
  })();

  /* ================= DIFFERENTIAL CONVERTER ================= */
  function parseCode(str){
    return (str.match(/[0-7]/g)||[]).map(Number);
  }
  (function(){
    var inp=document.getElementById('diffIn');
    var out=document.getElementById('diffOut');
    function run(){
      var c=parseCode(inp.value);
      if(!c.length){ out.innerHTML='Enter codes 0–7.'; return; }
      var prev=0, d=[];
      for(var i=0;i<c.length;i++){ d.push(((c[i]-prev)%8+8)%8); prev=c[i]; }
      out.innerHTML='Ordinary  c = <b style="color:#ff9442">'+c.join(' ')+'</b><br>Differential  d = <b>'+d.join(' ')+'</b>';
    }
    inp.addEventListener('input',run); run();
  })();

  /* ================= PERIMETER CALC ================= */
  (function(){
    var inp=document.getElementById('perimIn');
    var out=document.getElementById('perimOut');
    function run(){
      var c=parseCode(inp.value);
      if(!c.length){ out.innerHTML='Enter codes 0–7.'; return; }
      var E=c.filter(function(v){return v%2===0;}).length;
      var D=c.length-E;
      var per=E+Math.SQRT2*D;
      out.innerHTML='Even codes E = <b>'+E+'</b>  ·  Odd codes D = <b>'+D+'</b><br>Perimeter = '+E+' + √2·'+D+' = <b>'+per.toFixed(3)+'</b>';
    }
    inp.addEventListener('input',run); run();
  })();

  /* ================= AREA (SHOELACE) CALC ================= */
  (function(){
    var inp=document.getElementById('areaIn');
    var out=document.getElementById('areaOut');
    var inc={0:[0,1],1:[1,1],2:[1,0],3:[1,-1],4:[0,-1],5:[-1,-1],6:[-1,0],7:[-1,1]};
    function run(){
      var c=parseCode(inp.value);
      if(!c.length){ out.innerHTML='Enter codes 0–7.'; return; }
      var x=0,y=0, pts=[[0,0]];
      c.forEach(function(code){ var dxy=inc[code]; x+=dxy[0]; y+=dxy[1]; pts.push([x,y]); });
      var s=0;
      for(var i=0;i<pts.length-1;i++){ s+=pts[i][0]*pts[i+1][1]-pts[i+1][0]*pts[i][1]; }
      var area=Math.abs(s)/2;
      var closed = (pts[pts.length-1][0]===0 && pts[pts.length-1][1]===0);
      out.innerHTML='Vertices walked: <b>'+(pts.length)+'</b>  ·  Shoelace sum Σ = <b>'+s+'</b><br>Area = ½·|'+s+'| = <b>'+area+'</b>'+(closed?'  <span style="color:#46d6c4">(boundary closes ✓)</span>':'  <span style="color:#ef5d5d">(open boundary — area approximate)</span>');
    }
    inp.addEventListener('input',run); run();
  })();

  /* ================= QUIZ ================= */
  var quiz=[
    {q:'A blob is defined as…',o:['A set of pixels forming a convex shape','A set of similar pixels','A set of pixels with the same colour','A set of contiguous pixels sharing some property'],a:3},
    {q:'A useful property to use in blob detection is…',o:['The texture of a small region of pixels','The colour or grey value of a pixel','The shape of the blob after adding this pixel','The Euclidean distance between pixels'],a:1},
    {q:'A path is defined as…',o:['A sequence of steps between 4-neighbouring pixels','A sequence of steps between adjacent pixels','A sequence of steps along adjacent and similar pixels','A sequence of steps between two pixels that are similar'],a:2,fb:'Both "adjacent" and "similar" matter — a path stays within the blob.'},
    {q:'Connected Component Analysis will…',o:['Give a unique label to regions','Give a unique label to objects','Give a unique label to the foreground and background','Give a unique label to blobs'],a:3},
    {q:'The 0,0 moment of area of a blob gives…',o:['The circularity of the blob','The width of the blob','The sum of pixel values of the blob','The area of the blob'],a:2,fb:'"Area" is only correct if the image is binary; in general M₀₀ is the sum of pixel values.'},
    {q:'The 1,0 and 0,1 moments of a blob give…',o:['The centre of gravity of the blob','The middle of the blob','The median of the blob','The centroid of the blob'],a:0,fb:'"Centroid" is correct only iff the image is binary.'},
    {q:'A chain code is defined as…',o:['The sequence of steps needed to label a blob','The length of the perimeter of a blob','The sequence of steps needed to circumnavigate a blob','The sequence of steps needed to compute the area of a blob'],a:2},
    {q:'The perimeter of a blob is…',o:["The number of steps in the blob's chain code",'The number of non-blob pixels adjacent to a blob pixel','The distance around its periphery','The number of blob pixels adjacent to non-blob pixels'],a:2,fb:'The others are related quantities but not the definition.'},
    {q:'The colour distribution of a blob is normally…',o:['The frequency histogram of the intensity values','The frequency histogram of the L a*b* values','The frequency histogram of the red and green values','The frequency histogram of the chromaticity values'],a:3},
    {q:'With object = 1 and background = 0, dilation makes…',o:['The blob smaller and holes larger','The blob larger and holes larger','The blob smaller and holes filled in','The blob larger and holes may be filled in'],a:3,fb:'Dilation = expanding/enlarging; it grows blobs and can fill holes.'},
    {q:'Which describes the morphological operation Opening?',o:['Erosion followed by Closing','open(I) = erode(dilate(I))','Dilation followed by Erosion','open(I) = dilate(erode(I))'],a:3},
    {q:'Two slightly separated blobs should be joined without changing sizes. Use…',o:['Opening','Closing','Dilation','Skeletonisation'],a:1,fb:'Closing fills small gaps/holes while keeping overall size.'}
  ];
  (function(){
    var host=document.getElementById('quizHost');
    quiz.forEach(function(item,qi){
      var box=document.createElement('div'); box.className='quiz-q';
      var marks=['A','B','C','D'];
      var html='<div class="qnum">Q'+(qi+1)+'</div><div class="qtext">'+item.q+'</div>';
      item.o.forEach(function(opt,oi){
        html+='<button class="opt" data-q="'+qi+'" data-o="'+oi+'"><span class="mk">'+marks[oi]+'</span>'+opt+'</button>';
      });
      html+='<div class="qfb"></div>';
      box.innerHTML=html; host.appendChild(box);
    });
    host.addEventListener('click',function(e){
      var b=e.target.closest('.opt'); if(!b) return;
      var qi=+b.dataset.q, oi=+b.dataset.o, item=quiz[qi];
      var box=b.closest('.quiz-q');
      if(box.dataset.done) return;
      box.dataset.done='1';
      box.querySelectorAll('.opt').forEach(function(o,idx){
        o.disabled=true;
        if(idx===item.a) o.classList.add('correct');
      });
      var fb=box.querySelector('.qfb');
      if(oi===item.a){ fb.className='qfb show ok'; fb.innerHTML='✓ Correct.'+(item.fb?' '+item.fb:''); }
      else { b.classList.add('wrong'); fb.className='qfb show no'; fb.innerHTML='✗ Not quite — the correct answer is highlighted.'+(item.fb?' '+item.fb:''); }
    });
  })();

  /* ================= EXAM ACCORDIONS ================= */
  var exams=[
    {yr:'2022 · Q28 · 3 marks',
     q:'Describe the Connected Component Analysis algorithm (image labelling).',
     a:'<h5>Model approach</h5>It is a two-pass region-labelling algorithm on a binary (thresholded) image.<br><br><b>Pass 1</b> — scan left→right, top→bottom. For each foreground pixel, inspect already-labelled neighbours (above / left, using 4- or 8-connectivity): with <b>no</b> labelled neighbour, assign the next free label; with <b>one</b> label present, copy it; with <b>two or more different</b> labels, take one and <b>record the equivalence</b>. <br><br><b>Pass 2</b> — scan again and re-label every pixel using the equivalence table so each connected region carries a single label. The background is label 0; the number of distinct labels counts the blobs.'},
    {yr:'2022 · Q33 · 2 marks',
     q:'Using the chain-code compass, describe or draw the shape defined by the ordinary chain code: 1 1 2 3 3 5 5 6 7 7',
     a:'<h5>Model approach</h5>Start at (0,0) and step per code (0=up, clockwise). Walking the codes:<br><span class="mono">1→(1,1) 1→(2,2) 2→(3,2) 3→(4,1) 3→(5,0) 5→(4,-1) 5→(3,-2) 6→(2,-2) 7→(1,-1) 7→(0,0)</span><br><br>The path <b>returns to the start</b>, so it is a closed outline: it climbs up-right along the diagonal, turns right, comes down-right, then returns down-left and up-left — tracing a tilted, diamond/leaf-like quadrilateral.'},
    {yr:'2017 · Q16 · 2 marks',
     q:'Describe a method to compute the area of a blob from a description of its outline.',
     a:'<h5>Model approach</h5>Take the blob outline as a <b>chain code</b>. Walk the code from any start point (e.g. (0,0)), applying each direction\'s (Δx, Δy) to recover the boundary <b>vertices</b>. Then apply the <b>Shoelace formula</b>: Area = ½·|Σ(xᵢ·yᵢ₊₁ − xᵢ₊₁·yᵢ)|. This gives the polygon area enclosed by the vertices (close to, but not identical to, the raw pixel count — the gap shrinks for larger blobs).'},
    {yr:'2017 · Q18 · 2 marks',
     q:'A central moment is Mₐᵦ = Σ(x−x̄)ᵃ(y−ȳ)ᵇ·f(x,y). What does the 00 moment of a blob define? How would you compute a blob\'s centroid?',
     a:'<h5>Model approach</h5>The <b>M₀₀</b> moment is the sum of the pixel values over the blob — for a binary blob this is simply its <b>area</b> (pixel count).<br><br>The centroid (centre of gravity) is the first moments normalised by the zeroth: <b>(x̄, ȳ) = (M₁₀/M₀₀ , M₀₁/M₀₀)</b> — i.e. the average x and average y position of the blob\'s pixels.'},
    {yr:'2017 · Q17 · 2 marks',
     q:'How do you decide if two distant pixels are connected?',
     a:'<h5>Model approach</h5>They are connected if a <b>path</b> exists between them — a sequence of steps between <b>adjacent</b> pixels (4- or 8-connectivity) where every pixel on the path is <b>similar</b> (shares the blob property, e.g. same side of a threshold). Connected Component Analysis effectively tests this by propagating a common label along such paths.'},
    {yr:'2018 · Q13 · 5 marks (biscuits)',
     q:'Identify broken biscuits from an overhead image (circular, non-overlapping, on a contrasting belt). (a) which pixels are biscuit? (b) group pixels per biscuit? (c) suitable shape description? (d) compute the shape? (e) output for a circular biscuit?',
     a:'<h5>Model approach</h5><b>(a)</b> Threshold against the contrasting belt colour to get a binary biscuit/background image.<br><b>(b)</b> Run <b>Connected Component Analysis</b> to label each separate biscuit blob (clean up first with opening/closing).<br><b>(c)</b> Describe each blob\'s outline with a <b>chain code</b>, or use moments/perimeter + area.<br><b>(d)</b> Trace the boundary; compute perimeter (E + √2·D) and area (shoelace), or a circularity measure 4π·Area / Perimeter².<br><b>(e)</b> A whole circular biscuit gives a circularity close to <b>1</b>; broken ones deviate (lower circularity / irregular chain code), flagging them as rejects.'},
    {yr:'2019 · Q29 · 6 marks (bottle fill)',
     q:'Given an image of a bottle, describe operations to find the outline of the bottle, find the liquid top, and decide if there is enough liquid.',
     a:'<h5>Model approach</h5><b>Outline:</b> threshold bottle vs background, clean with morphology, then run <b>boundary detection</b> (raster-scan to the first object pixel, then clockwise edge-walk) to extract the bottle\'s outline / chain code.<br><br><b>Liquid top:</b> within the bottle region, the liquid is a sub-blob of different brightness — threshold/segment it and find the y-coordinate of its top edge (a strong horizontal intensity change).<br><br><b>Decision:</b> compare the liquid-top height (or liquid blob area) against a calibrated minimum; below it → under-filled. State assumptions: fixed camera/scale, consistent lighting, upright bottle.'}
  ];
  (function(){
    var host=document.getElementById('examHost');
    exams.forEach(function(e){
      var d=document.createElement('details'); d.className='exam';
      d.innerHTML='<summary><span class="yr">'+e.yr+'</span><span>'+e.q+'</span></summary><div class="ans">'+e.a+'</div>';
      host.appendChild(d);
    });
  })();

  /* ================= FULL DECK GALLERY ================= */
  (function(){
    var grid=document.getElementById('deckGrid');
    if(!grid) return;
    var labels={1:'Title 7.1',2:'Blobs',3:'Objectives',4:'Blob definition',5:'Blob properties',6:'Properties · thresholding',7:'Connectivity',8:'Connectivity issues',9:'CCA aims',10:'Tadpoles · red channel',11:'Tadpoles · labelled',12:'Labelling notes',13:'CCA problems',14:'CCA algorithm',15:'Labelling rows 1–2',16:'Labelling row 3 · relabel',17:'Boundary · blob',18:'Boundary · O0,B0',19:'Boundary · O1,B1',20:'Boundary · continue',21:'Boundary · stop rule',22:'Title 7.2',23:'Blob description',24:'Moments · see-saw',25:'Moments · sum',26:'Moments · balance',27:'Moments · general',28:'Moments · origin shift',29:'Moments · blob CoG',30:'Moments of area',31:'Central moments',32:'Moments · invariance',33:'Chain codes · compass',34:'Chain codes · example',35:'Chain codes · cyclic',36:'Chain codes · rotation',37:'Chain codes · compact',38:'Differential · compass',39:'Differential · example',40:'Differential · headache',41:'Differential · subtraction',42:'Differential · invariance',43:'Title 7.3',44:'Perimeter from code',45:'Area · shoelace',46:'Area · polygon note',47:'Area · coordinates',48:'Area · estimate',49:'Colour distribution',50:'Tracking · bees',51:'Tracking · matching',52:'Combinatorial problem',53:'Predictive tracking',54:'Verification',55:'What if?',56:'Summary'};
    for(var i=1;i<=56;i++){
      var num=(''+i).padStart(2,'0');
      var src='assets/img/slide-'+num+'.png';
      var a=document.createElement('a');
      a.href=src; a.target='_blank'; a.rel='noopener';
      a.style.cssText='display:block;background:#fff;border:1px solid #27313d;border-radius:8px;overflow:hidden;text-decoration:none';
      var img=document.createElement('img');
      img.loading='lazy'; img.src=src; img.alt='Slide '+i;
      img.style.cssText='display:block;width:100%';
      var cap=document.createElement('div');
      cap.style.cssText='font-family:JetBrains Mono,monospace;font-size:10.5px;color:#93a1b0;padding:6px 8px;background:#141a22';
      cap.textContent=i+' · '+(labels[i]||'');
      a.appendChild(img); a.appendChild(cap); grid.appendChild(a);
    }
  })();

})();
