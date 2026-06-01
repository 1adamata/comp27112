/* ============================================================
   COMP27112 · Chapter 13 — Rendering Techniques
   Interactive visual notes.  Vanilla JS, no dependencies.
   ============================================================ */
(function () {
"use strict";

const A = "assets/slides/";

/* ---- figure helper ---- */
function fig(src, tag, cap) {
  return `<figure class="reveal"><span class="fig-tag">${tag}</span>
    <img loading="lazy" src="${A}${src}" alt="${cap}"><figcaption>${cap}</figcaption></figure>`;
}

/* ============================================================
   SECTION CONTENT
   ============================================================ */
const SECTIONS = [
/* ---------- HERO ---------- */
{ id:"top", nav:null, html:`
<header class="hero wrap">
  <div class="kicker reveal in">COMP27112 · Visual Computing · Lecture 13</div>
  <h1 class="reveal in">Rendering<br><span class="em">Techniques</span></h1>
  <p class="sub reveal in">How we make a flat triangle mesh look like it casts shadows, mirrors its surroundings, and carries fine bumpy surface detail — without paying for the geometry. Plus a short epilogue on what rendering really is.</p>
  <div class="meta reveal in">
    <span><b>5</b>core techniques</span>
    <span><b>89</b>source slides</span>
    <span><b>2 pass</b>shadow maps</span>
    <span><b>RGB→XYZ</b>normal maps</span>
  </div>
  <div class="scrollcue"><div class="dot"></div>SCROLL</div>
</header>`},

/* ---------- PIPELINE ---------- */
{ id:"pipeline", nav:"Pipeline", html:`
<section class="wrap" id="pipeline">
  <div class="sec-tag reveal">Context</div>
  <h2 class="reveal"><span class="n">00 ·</span> The rendering pipeline</h2>
  <p class="lead reveal">Every technique in this chapter is a clever <em>insertion point</em> in the GPU pipeline. Before the tricks, fix the road map: vertices go in one end, lit pixels come out the other. Tap a stage to expand it.</p>
  <div class="grid2">
    ${fig("title.jpg","Slide · title","COMP27112: Rendering Techniques + Epilogue.")}
    ${fig("intro-scene.jpg","Slide · the test scene","The recurring cast — teapot, monkey (Suzanne) and cow — we will light, shadow and texture throughout.")}
  </div>
  <div class="panel reveal">
    <div class="pipe" id="pipe"></div>
    <div class="hint">Each technique below hooks into one of these stages — shadow maps add an extra pass before it, bump/normal maps change what the fragment shader thinks the normal is.</div>
  </div>
</section>`},

/* ---------- SHADOW MAPPING ---------- */
{ id:"shadow", nav:"Shadows", html:`
<section class="wrap" id="shadow">
  <div class="sec-tag reveal">Technique 01</div>
  <h2 class="reveal"><span class="n">01 ·</span> Shadow mapping</h2>
  <p class="lead reveal">A point is in shadow if something else is <em>closer to the light</em> along the same ray. Shadow mapping turns that sentence into two render passes.</p>

  ${fig("shadow-setup.jpg","Slide · setup","The scene with a light and a camera. We will render the scene twice — once from each.")}
  ${fig("shadow-grid.jpg","Slide · sampling","Sampling the depth map: each shaded point asks 'am I as close to the light as the nearest thing the light saw here?'")}

  <h3 class="reveal">The two-pass idea</h3>
  <div class="grid2">
    <div class="panel reveal"><span class="eyebrow-mini">PASS 1 — FROM THE LIGHT</span>
      <p>Render the scene from the <em>light's</em> viewpoint, but keep <strong>only depth</strong>. The result is a <span class="kw">depth map</span> (shadow map): for every direction the light sees, how far is the nearest surface.</p></div>
    <div class="panel reveal"><span class="eyebrow-mini">PASS 2 — FROM THE CAMERA</span>
      <p>Render normally. For each fragment, transform it into the light's space and compare its depth to the stored value. <strong>Farther than the map → occluded → in shadow.</strong></p></div>
  </div>

  <div class="panel reveal">
    <span class="eyebrow-mini" style="color:var(--amber)">INTERACTIVE · DRAG THE LIGHT</span>
    <p style="margin-top:8px">Move the light. The orange ray is the line of sight from the light to a test point on the teapot. If the wall is nearer to the light along that ray, the point is shadowed.</p>
    <div style="text-align:center"><canvas id="shadowDemo" width="640" height="360"></canvas></div>
    <div class="controls" id="shadowCtl"></div>
    <div class="hint">This is exactly Pass&nbsp;2: compare the fragment's distance-to-light against the nearest blocker recorded in Pass&nbsp;1.</div>
  </div>

  ${fig("pipeline-depth.jpg","Slide · pipeline","Pass 1 feeds a depth texture (top-left) that Pass 2 samples while shading. Note the green tick — the same pipeline, run from the light.")}
  ${fig("shadow-depthmaps.jpg","Slide · depth maps","Depth maps of real scenes. Brighter = nearer the light. These greyscale/false-colour images ARE the shadow map.")}

  <div class="takeaway reveal"><b>Exam-ready definition</b>
    Shadow mapping renders the scene from the light's viewpoint into a depth-only texture; during the main render each fragment is transformed into light space and its depth compared against the stored value to decide whether it is occluded.</div>
</section>`},

/* ---------- REFLECTION VECTORS ---------- */
{ id:"reflection", nav:"R·N·V", html:`
<section class="wrap" id="reflection">
  <div class="sec-tag reveal">Foundation for 02</div>
  <h2 class="reveal"><span class="n">02a ·</span> The reflection vector</h2>
  <p class="lead reveal">Mirrors, shiny highlights and environment maps all rely on one move: bounce a vector about the surface normal. Meet <em>N̂</em>, <em>R̂</em> and <em>V̂</em>.</p>

  <div class="grid2">
    <div class="panel reveal">
      <ul class="clean">
        <li><span class="kw">N̂</span> — the surface <strong>normal</strong>, pointing straight out of the surface.</li>
        <li><span class="kw">L̂</span> — direction <strong>to the light</strong>.</li>
        <li><span class="kw">R̂</span> — the <strong>reflection</strong> of the light about the normal: <span class="kw">R = 2(N·L)N − L</span>.</li>
        <li><span class="kw">V̂</span> — direction <strong>to the viewer / eye</strong>.</li>
      </ul>
      <p>Specular highlight intensity ≈ <span class="kw">(R̂·V̂)<sup>n</sup></span>. The shininess exponent <em>n</em> tightens the highlight; bigger <em>n</em> = smaller, sharper spot.</p>
    </div>
    <div class="panel reveal">
      <span class="eyebrow-mini" style="color:var(--amber)">INTERACTIVE · DRAG L AND V</span>
      <div style="text-align:center"><canvas id="reflDemo" width="520" height="360"></canvas></div>
      <div class="controls" id="reflCtl"></div>
    </div>
  </div>

  ${fig("reflection-vectors.jpg","Slide · env reflection","The reflected vector R̂ is what we use to look up the environment — point it outward and read whatever the world has in that direction.")}
  <div class="takeaway reveal"><b>Why it matters</b>
    If instead of a single light we reflect the <em>view</em> direction and look up the whole surrounding scene, we get environment mapping — the next technique.</div>
</section>`},

/* ---------- ENVIRONMENT MAPPING ---------- */
{ id:"environment", nav:"Env Maps", html:`
<section class="wrap" id="environment">
  <div class="sec-tag reveal">Technique 02</div>
  <h2 class="reveal"><span class="n">02b ·</span> Environment mapping</h2>
  <p class="lead reveal">True mirror reflections are expensive. The cheat: pre-capture the surroundings into a texture, then for each pixel reflect the view vector and <em>look up</em> what the world looks like in that direction.</p>

  <p class="reveal">The reflected direction <span class="kw">R̂</span> is a 3D vector. We convert it to a <strong>texture coordinate</strong> and sample. How we store the environment defines the flavour:</p>

  <h3 class="reveal">Spherical / equirectangular</h3>
  <p class="reveal">Map the 3D direction to <em>polar coordinates</em> (longitude, latitude), then to a (u,v) on a single rectangular image — like a world map. Simple, but distorted and wasteful near the poles.</p>
  ${fig("env-equirect.jpg","Slide · equirectangular","direction → polar coordinates → texture coordinate. One rectangular panorama wraps the whole environment.")}

  <h3 class="reveal">Light probes</h3>
  <p class="reveal">Photograph a <strong>mirrored sphere</strong> in a real scene (Paul Debevec's classic technique) to capture real-world lighting and reflections — then unwrap that chrome ball into an environment texture.</p>
  <div class="grid2">
    ${fig("light-probe.jpg","Slide · light probe","A chrome sphere photographed on location captures the full surrounding environment in one shot.")}
    ${fig("reflection-spoon.jpg","Slide · reflection","Curved shiny objects in film reflect their surroundings — exactly what an environment map fakes cheaply.")}
  </div>

  <h3 class="reveal">Cube maps — the real-time favourite</h3>
  <p class="reveal">Store the environment on the <strong>six faces of a cube</strong>. The reflection direction picks a face and a spot on it. No polar distortion, and GPU hardware samples cube maps natively — which is why games prefer them.</p>
  ${fig("cube-maps.jpg","Slide · cube map","Six flat textures fold into a cube around the object. The lookup from a reflection direction is direct and hardware-accelerated.")}

  <div class="takeaway reveal"><b>Exam point</b>
    Cube maps are preferred over equirectangular maps for real-time rendering: six flat textures with <em>no polar distortion</em>, and sampling is supported directly in GPU hardware.</div>
</section>`},

/* ---------- BUMP MAPPING ---------- */
{ id:"bump", nav:"Bump", html:`
<section class="wrap" id="bump">
  <div class="sec-tag reveal">Technique 03</div>
  <h2 class="reveal"><span class="n">03 ·</span> Bump mapping</h2>
  <p class="lead reveal">Lighting depends almost entirely on the <em>normal</em>. So to fake bumps we never touch the geometry — we just <strong>perturb the normals</strong> before shading. The silhouette stays flat; the surface looks rough.</p>

  ${fig("bump-suzanne.jpg","Slide · bump","Same smooth mesh, perturbed normals. The face reads as detailed and rough even though the geometry is untouched.")}

  <h3 class="reveal">Where the bumps come from: a height map</h3>
  <p class="reveal">A greyscale <span class="kw">height map</span> stores a height for each point. We don't move anything to those heights — instead we take the <strong>rate of change</strong> (gradient) of the height field and use it to tilt the normal. Steep slope on the height map → strongly tilted normal → it catches light like a real bump.</p>
  <div class="grid2">
    ${fig("bump-heightmap.jpg","Slide · height map","The greyscale height map (left) and the surface-normal arrows it perturbs.")}
    ${fig("bump-rate.jpg","Slide · gradient","It is the RATE OF CHANGE of height — the slope — that bends the normal, not the height itself.")}
  </div>

  <div class="panel reveal">
    <span class="eyebrow-mini" style="color:var(--amber)">INTERACTIVE · DRAG THE LIGHT, FLIP THE MODE</span>
    <p style="margin-top:8px">The surface below is perfectly flat geometry. Watch how perturbed normals alone create the illusion of bumps. Drag the light around; toggle between flat shading, bump shading, and the raw height map.</p>
    <div style="text-align:center"><canvas id="bumpDemo" width="420" height="420"></canvas></div>
    <div class="controls" id="bumpCtl"></div>
    <div class="hint">Flat mode uses N=(0,0,1) everywhere → uniform & dull. Bump mode tilts N by the height gradient → it springs into 3D, yet the canvas is still a flat quad.</div>
  </div>

  <h3 class="reveal">The exam diagram: N → N′</h3>
  <p class="reveal">A 2022 paper draws the geometric version. The original normal <span class="kw">N</span> is nudged by two offset vectors <span class="kw">b<sub>u</sub>N<sub>u</sub></span> and <span class="kw">b<sub>v</sub>N<sub>v</sub></span> — the partial derivatives of the bump (height) function in the u and v texture directions — giving the perturbed normal <span class="kw">N′</span>. Lighting then uses N′.</p>
  <div class="takeaway reveal"><b>Live vs precomputed</b>
    Perturbed normals can be computed <em>in advance</em> (baked into a texture — fast, fixed) or <em>at run time</em> (flexible, e.g. animated/procedural water ripples, deforming surfaces). Precompute for static detail; compute live when the bumps must change.</div>
</section>`},

/* ---------- NORMAL MAPS ---------- */
{ id:"normal", nav:"Normal Maps", html:`
<section class="wrap" id="normal">
  <div class="sec-tag reveal">Technique 04</div>
  <h2 class="reveal"><span class="n">04 ·</span> Normal maps</h2>
  <p class="lead reveal">Bump mapping <em>derives</em> the normal from a height field. A normal map skips the maths and <strong>stores the normal directly</strong> — as an RGB colour.</p>

  <h3 class="reveal">RGB = XYZ</h3>
  <p class="reveal">Each pixel's colour <em>is</em> a vector. Red→X, Green→Y, Blue→Z (in the surface's local <span class="kw">tangent space</span>). A channel value of 0→255 maps to a component of −1→+1.</p>

  <div class="panel reveal">
    <span class="eyebrow-mini" style="color:var(--amber)">INTERACTIVE · TILT THE NORMAL</span>
    <p style="margin-top:8px">Drag inside the pad to tilt the surface normal in tangent space. Watch the RGB colour it encodes — and notice where the swatch sits when the normal points straight up.</p>
    <div id="normalDemo"></div>
  </div>

  ${fig("normal-rgbcube.jpg","Slide · RGB↔XYZ","The colour cube maps RGB to the normal's XYZ. A texture full of 'up' normals is dominated by blue.")}

  <div class="takeaway reveal"><b>Why normal maps look blue-purple</b>
    Most surface normals point <em>out</em> of the surface — along the local +Z (tangent-space) axis. +Z encodes to <strong>blue</strong>, so blue dominates almost the whole texture, with red/green wobble only where the surface tilts.</div>

  <h3 class="reveal">The payoff: detail without polygons</h3>
  <p class="reveal">Bake the normals of a million-triangle sculpt into a normal map, then apply it to a cheap low-poly mesh. The low-poly model lights as if it had all that detail.</p>
  <div class="grid2">
    ${fig("normal-suzanne.jpg","Slide · bake","Low-poly mesh + normal map = the lighting detail of a high-poly sculpt, at a fraction of the cost.")}
    ${fig("normal-bricks.jpg","Slide · bricks","Flat brick quad + normal map. Mortar grooves catch light convincingly — but the silhouette gives it away (see next section).")}
  </div>
</section>`},

/* ---------- DISPLACEMENT ---------- */
{ id:"displacement", nav:"Displacement", html:`
<section class="wrap" id="displacement">
  <div class="sec-tag reveal">Technique 05</div>
  <h2 class="reveal"><span class="n">05 ·</span> Displacement mapping</h2>
  <p class="lead reveal">Bump and normal maps fool the <em>lighting</em> but the geometry is still flat — the <strong>silhouette stays smooth</strong>. Displacement mapping is the honest, expensive one: it actually <em>moves the vertices</em>.</p>

  <div class="panel reveal">
    <span class="eyebrow-mini" style="color:var(--amber)">INTERACTIVE · TOGGLE THE TRICK</span>
    <p style="margin-top:8px">Same height profile, two interpretations. Flip between <strong>normal mapping</strong> (flat edge, faked shading) and <strong>displacement</strong> (the edge itself deforms). Watch the silhouette.</p>
    <div style="text-align:center"><canvas id="dispDemo" width="560" height="300"></canvas></div>
    <div class="controls" id="dispCtl"></div>
    <div class="hint">The giveaway is the outline: only displacement changes the silhouette, because only displacement changes real geometry.</div>
  </div>

  ${fig("displace-abc.jpg","Slide · displacement","Starting mesh + height map → the vertices are physically pushed to spell ABC. The displaced profile follows the height map.")}

  <h3 class="reveal">The cost — and a classic gotcha</h3>
  <p class="reveal">Because displacement edits real vertex positions, you need <em>enough vertices to push</em>. Apply a crisp displacement map to a coarse, low-poly mesh and almost nothing happens — there simply aren't enough vertices to express the detail. (This is the standard exam trap.) High-detail displacement usually pairs with tessellation to add vertices first.</p>
  ${fig("displace-faces.jpg","Slide · comparison","Bump only vs normal only vs normal + displacement. Only the displaced head changes its actual outline and polygon count.")}

  <div class="panel reveal">
    <h3 style="margin-top:0">Three techniques, one comparison</h3>
    <div id="compareTable"></div>
  </div>
</section>`},

/* ---------- QUIZ ---------- */
{ id:"quiz", nav:"Quiz", html:`
<section class="wrap" id="quiz">
  <div class="sec-tag reveal">Check yourself</div>
  <h2 class="reveal"><span class="n">06 ·</span> Quiz</h2>
  <p class="lead reveal">Straight from the course quiz bank. Tap an answer — you'll get the same feedback the quiz gives.</p>
  <div id="quizMount"></div>
</section>`},

/* ---------- PAST PAPERS ---------- */
{ id:"exams", nav:"Past Papers", html:`
<section class="wrap" id="exams">
  <div class="sec-tag reveal">From the archive</div>
  <h2 class="reveal"><span class="n">07 ·</span> Past exam questions</h2>
  <p class="lead reveal">Real COMP27112 questions touching this chapter. Reveal a model-answer sketch under each.</p>
  <div id="examMount"></div>
</section>`},

/* ---------- EPILOGUE ---------- */
{ id:"epilogue", nav:"Epilogue", html:`
<section class="wrap" id="epilogue">
  <div class="sec-tag reveal">Coda</div>
  <h2 class="reveal"><span class="n">08 ·</span> Epilogue — what is rendering, really?</h2>
  <p class="lead reveal">Every technique here is an <em>approximation</em>. Shadows, reflections, bumps — each trades physical truth for a frame that ships in milliseconds. A synthetic image is always an approximation to reality.</p>
  <div class="grid2">
    ${fig("epilogue-durer.jpg","Slide · perspective","Dürer's perspective machine: projecting 3D onto a 2D plane is a 500-year-old idea. The maths of the view frustum is its descendant.")}
    ${fig("epilogue-raytrace.jpg","Slide · light transport","Trace light through a scene and the approximations fall away — at a steep computational price. The eternal rendering trade-off: speed vs truth.")}
  </div>
  <p class="reveal">Rasterisation (everything in this chapter) is fast and faked. Ray tracing is slow and true-er. Modern engines blend both — and bolt on the tricks above to close the gap.</p>
  ${fig("epilogue-folks.jpg","Slide · fin","That's all, folks.")}
</section>`},
];

/* expose for part 2 */
window.__RT__ = { SECTIONS, fig, A };
})();

/* ============================================================
   PART 2 — build the page + interactive widgets
   ============================================================ */
(function () {
"use strict";
const { SECTIONS } = window.__RT__;
const $ = (s, r=document) => r.querySelector(s);
const main = document.getElementById('main');
const menu = document.getElementById('menu');

/* ---- inject sections + build nav ---- */
SECTIONS.forEach(s => { main.insertAdjacentHTML('beforeend', s.html); });
SECTIONS.forEach(s => {
  if (!s.nav) return;
  const a = document.createElement('a');
  a.href = '#' + s.id; a.textContent = s.nav; a.dataset.id = s.id;
  menu.appendChild(a);
});
main.insertAdjacentHTML('beforeend', `<footer class="wrap">
  <div class="big">Rendering is the art of a convincing lie.</div>
  <p>COMP27112 · Chapter 13 — Rendering Techniques + Epilogue · Interactive notes built from lecture slides, the course quiz bank & past papers (2016–2025).</p>
</footer>`);

/* ---- scroll progress + nav hide ---- */
const prog = document.getElementById('progress');
const nav = document.getElementById('nav');
let lastY = 0;
function onScroll(){
  const h = document.documentElement.scrollHeight - innerHeight;
  prog.style.width = (scrollY / h * 100) + '%';
  if (scrollY > lastY && scrollY > 400) nav.classList.add('hide'); else nav.classList.remove('hide');
  lastY = scrollY;
}
addEventListener('scroll', onScroll, {passive:true});

/* ---- reveal on scroll ---- */
const io = new IntersectionObserver(es => {
  es.forEach(e => { if (e.isIntersecting){ e.target.classList.add('in'); io.unobserve(e.target);} });
}, {threshold:.12, rootMargin:'0px 0px -8% 0px'});
document.querySelectorAll('.reveal:not(.in)').forEach(el => io.observe(el));

/* ---- active nav highlight ---- */
const navIO = new IntersectionObserver(es => {
  es.forEach(e => {
    if (e.isIntersecting){
      menu.querySelectorAll('a').forEach(a => a.classList.toggle('active', a.dataset.id === e.target.id));
    }
  });
}, {rootMargin:'-45% 0px -50% 0px'});
SECTIONS.forEach(s => { const el = document.getElementById(s.id); if (el && s.nav) navIO.observe(el); });

/* ============================================================
   1) PIPELINE accordion
   ============================================================ */
const STAGES = [
  ["01","3D Vertices","Raw geometry: lists of vertex positions (and normals, UVs) describing the mesh."],
  ["02","Vertex Shader","Transforms each vertex into clip space (model → view → projection). Per-vertex lighting set-up lives here."],
  ["03","Tessellation","Optionally splits polygons into more, smaller convex polygons — adding the vertices displacement mapping needs."],
  ["04","Rasterisation","Converts vector triangles into pixels (fragments). Uses barycentric coordinates to interpolate vertex data."],
  ["05","Fragment Shader","Runs per pixel. This is where texturing, bump/normal lookups and most lighting happen."],
  ["06","Render Output (ROP) · Z-buffer","Depth test resolves the hidden-surface problem: keep the nearest fragment, discard the rest. Visible fragments hit the framebuffer."],
];
const pipe = document.getElementById('pipe');
STAGES.forEach((st,i) => {
  pipe.insertAdjacentHTML('beforeend', `
    <div class="stage" data-i="${i}">
      <span class="ix">${st[0]}</span><span class="nm">${st[1]}</span><span class="arrow">›</span>
    </div>
    <div class="stage-body" data-i="${i}"><div>${st[2]}</div></div>
    ${i<STAGES.length-1?'<div class="connector"></div>':''}`);
});
pipe.querySelectorAll('.stage').forEach(s => {
  s.addEventListener('click', () => {
    const body = pipe.querySelector(`.stage-body[data-i="${s.dataset.i}"]`);
    const open = body.classList.toggle('open'); s.classList.toggle('open', open);
  });
});

/* small vector helpers */
const V = {
  sub:(a,b)=>[a[0]-b[0],a[1]-b[1],a[2]-b[2]],
  dot:(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2],
  len:a=>Math.hypot(a[0],a[1],a[2]),
  norm:a=>{const l=V.len(a)||1;return[a[0]/l,a[1]/l,a[2]/l];},
};

/* ============================================================
   2) SHADOW MAPPING demo  (2D side view, drag the light)
   ============================================================ */
(function shadowDemo(){
  const cv = document.getElementById('shadowDemo'); if(!cv) return;
  const ctx = cv.getContext('2d'); const W=cv.width,H=cv.height;
  let light = {x:120,y:70};
  // scene: ground, a wall (blocker), and a test point on a 'teapot'
  const ground = H-70;
  const wall = {x:330, y0:ground, y1:ground-150, w:26};
  const test = {x:470, y:ground-14};  // the point we shade
  let drag=false;

  function lineHitsWall(L, P){
    // does segment L->P cross the wall rectangle (left face)?
    const wx = wall.x;
    if ((L.x-wx)*(P.x-wx) > 0) return false; // both same side, no crossing of plane
    const t = (wx - L.x)/((P.x - L.x)||1e-6);
    if (t<0||t>1) return false;
    const yAt = L.y + t*(P.y-L.y);
    return yAt > wall.y1 && yAt < wall.y0;
  }
  function draw(){
    ctx.clearRect(0,0,W,H);
    // floor
    ctx.fillStyle='#15151f'; ctx.fillRect(0,ground,W,H-ground);
    ctx.strokeStyle='rgba(255,255,255,.06)';
    for(let x=0;x<W;x+=34){ctx.beginPath();ctx.moveTo(x,ground);ctx.lineTo(x,H);ctx.stroke();}
    // wall (blocker)
    const wg=ctx.createLinearGradient(wall.x,0,wall.x+wall.w,0);
    wg.addColorStop(0,'#3a3550');wg.addColorStop(1,'#26232f');
    ctx.fillStyle=wg; ctx.fillRect(wall.x,wall.y1,wall.w,wall.y0-wall.y1);
    ctx.fillStyle='rgba(255,255,255,.06)';ctx.fillRect(wall.x,wall.y1,wall.w,4);
    // teapot blob
    ctx.fillStyle='#c96b86';ctx.beginPath();ctx.ellipse(test.x,ground-12,40,22,0,0,7);ctx.fill();
    ctx.fillStyle='#e07f9a';ctx.beginPath();ctx.ellipse(test.x-8,ground-22,16,12,0,0,7);ctx.fill();
    // ray light -> test
    const shadowed = lineHitsWall(light,test);
    ctx.setLineDash([6,6]);
    ctx.strokeStyle = shadowed ? 'rgba(255,111,181,.85)' : 'rgba(255,138,61,.95)';
    ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(light.x,light.y);ctx.lineTo(test.x,test.y);ctx.stroke();
    ctx.setLineDash([]);
    // shadow cast on ground from wall
    if(true){
      const t=(ground - light.y)/((wall.y0 - light.y)||1);
      // shadow region: project wall top edge through light to ground
      const projTop = light.x + (wall.y0 - light.y)/((wall.y1-light.y)||-1)*(wall.x-light.x);
    }
    // test point marker
    ctx.fillStyle = shadowed ? '#FF6FB5' : '#FFD08A';
    ctx.beginPath();ctx.arc(test.x,test.y,6,0,7);ctx.fill();
    ctx.strokeStyle='#fff';ctx.lineWidth=1.5;ctx.stroke();
    // light glyph
    ctx.fillStyle='#FFE08A';ctx.beginPath();ctx.arc(light.x,light.y,11,0,7);ctx.fill();
    ctx.fillStyle='rgba(255,224,138,.25)';ctx.beginPath();ctx.arc(light.x,light.y,22,0,7);ctx.fill();
    ctx.fillStyle='#15151c';ctx.font='10px JetBrains Mono';ctx.textAlign='center';ctx.fillText('L',light.x,light.y+3);
    // labels
    ctx.fillStyle='#9a9ab0';ctx.font='12px JetBrains Mono';ctx.textAlign='left';
    ctx.fillText('blocker',wall.x-6,wall.y1-10);
    ctx.textAlign='center';
    ctx.fillStyle = shadowed?'#FF6FB5':'#7BD88F';
    ctx.font='13px JetBrains Mono';
    ctx.fillText(shadowed?'TEST POINT · IN SHADOW (blocked along ray)':'TEST POINT · LIT (clear line to light)', W/2, 28);
  }
  function pos(e){const r=cv.getBoundingClientRect();const t=e.touches?e.touches[0]:e;
    return{x:(t.clientX-r.left)*W/r.width,y:(t.clientY-r.top)*H/r.height};}
  function down(e){const p=pos(e);if(Math.hypot(p.x-light.x,p.y-light.y)<28){drag=true;e.preventDefault();}}
  function move(e){if(!drag)return;const p=pos(e);light.x=Math.max(20,Math.min(W-20,p.x));light.y=Math.max(20,Math.min(ground-30,p.y));draw();e.preventDefault();}
  function up(){drag=false;}
  cv.addEventListener('mousedown',down);addEventListener('mousemove',move);addEventListener('mouseup',up);
  cv.addEventListener('touchstart',down,{passive:false});cv.addEventListener('touchmove',move,{passive:false});cv.addEventListener('touchend',up);
  // controls
  const ctl=document.getElementById('shadowCtl');
  const b1=document.createElement('button');b1.className='btn';b1.textContent='↻ Reset light';
  b1.onclick=()=>{light={x:120,y:70};draw();};
  const b2=document.createElement('button');b2.className='btn';b2.textContent='→ Move behind wall';
  b2.onclick=()=>{light={x:200,y:120};draw();};
  ctl.append(b1,b2);
  draw();
})();

/* ============================================================
   3) REFLECTION vectors demo (drag L and V)
   ============================================================ */
(function reflDemo(){
  const cv=document.getElementById('reflDemo');if(!cv)return;
  const ctx=cv.getContext('2d');const W=cv.width,H=cv.height;
  const O={x:W/2,y:H-70};        // surface point
  const N=[0,-1];                 // normal (up in screen = -y)
  let L=[-0.7,-0.7], Vv=[0.7,-0.6]; // directions (to light, to viewer)
  let shininess=24, dragging=null;
  function n2(a){const l=Math.hypot(a[0],a[1])||1;return[a[0]/l,a[1]/l];}
  function reflect(l,n){const d=2*(l[0]*n[0]+l[1]*n[1]);return n2([d*n[0]-l[0], d*n[1]-l[1]]);}
  function endpt(dir,len){return{x:O.x+dir[0]*len,y:O.y+dir[1]*len};}
  function arrow(dir,len,col,label){
    const e=endpt(dir,len);ctx.strokeStyle=col;ctx.fillStyle=col;ctx.lineWidth=3;
    ctx.beginPath();ctx.moveTo(O.x,O.y);ctx.lineTo(e.x,e.y);ctx.stroke();
    const a=Math.atan2(e.y-O.y,e.x-O.x);
    ctx.beginPath();ctx.moveTo(e.x,e.y);
    ctx.lineTo(e.x-12*Math.cos(a-0.4),e.y-12*Math.sin(a-0.4));
    ctx.lineTo(e.x-12*Math.cos(a+0.4),e.y-12*Math.sin(a+0.4));ctx.closePath();ctx.fill();
    ctx.font='bold 16px Bricolage Grotesque';ctx.fillText(label,e.x+8,e.y);
    return e;
  }
  function draw(){
    ctx.clearRect(0,0,W,H);
    // surface
    ctx.strokeStyle='#555';ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(40,O.y);ctx.lineTo(W-40,O.y);ctx.stroke();
    ctx.fillStyle='rgba(255,255,255,.04)';ctx.fillRect(40,O.y,W-80,40);
    const R=reflect(L,N);
    const spec=Math.pow(Math.max(0,R[0]*Vv[0]+R[1]*Vv[1]),shininess);
    arrow(N,120,'#ECECF2','N̂');
    arrow(L,130,'#5BA9FF','L̂');
    arrow(R,130,'#FF6FB5','R̂');
    arrow(Vv,120,'#7BD88F','V̂');
    // origin
    ctx.fillStyle='#FF8A3D';ctx.beginPath();ctx.arc(O.x,O.y,5,0,7);ctx.fill();
    // light bulb at L
    const le=endpt(L,130);ctx.fillStyle='#FFE08A';ctx.beginPath();ctx.arc(le.x,le.y,7,0,7);ctx.fill();
    // specular meter
    ctx.fillStyle='#16161f';ctx.fillRect(40,20,W-80,16);
    ctx.fillStyle='#FF8A3D';ctx.fillRect(40,20,(W-80)*spec,16);
    ctx.strokeStyle='#333';ctx.strokeRect(40,20,W-80,16);
    ctx.fillStyle='#9a9ab0';ctx.font='11px JetBrains Mono';ctx.textAlign='left';
    ctx.fillText('specular (R̂·V̂)^n = '+spec.toFixed(3),40,52);
    ctx.textAlign='center';
  }
  function pos(e){const r=cv.getBoundingClientRect();const t=e.touches?e.touches[0]:e;
    return{x:(t.clientX-r.left)*W/r.width,y:(t.clientY-r.top)*H/r.height};}
  function near(p,dir,len){const e=endpt(dir,len);return Math.hypot(p.x-e.x,p.y-e.y)<26;}
  function down(e){const p=pos(e);
    if(near(p,L,130))dragging='L';else if(near(p,Vv,120))dragging='V';
    if(dragging)e.preventDefault();}
  function move(e){if(!dragging)return;const p=pos(e);let d=n2([p.x-O.x,p.y-O.y]);
    if(d[1]>0)d[1]=-0.05; d=n2(d); // keep above surface
    if(dragging==='L')L=d;else Vv=d;draw();e.preventDefault();}
  function up(){dragging=null;}
  cv.addEventListener('mousedown',down);addEventListener('mousemove',move);addEventListener('mouseup',up);
  cv.addEventListener('touchstart',down,{passive:false});cv.addEventListener('touchmove',move,{passive:false});cv.addEventListener('touchend',up);
  const ctl=document.getElementById('reflCtl');
  const lab=document.createElement('label');lab.className='slider';
  lab.innerHTML='shininess n <span class="readout" id="shiny">24</span>';
  const sl=document.createElement('input');sl.type='range';sl.min=2;sl.max=120;sl.value=24;
  sl.oninput=()=>{shininess=+sl.value;document.getElementById('shiny').textContent=sl.value;draw();};
  lab.appendChild(sl);
  const note=document.createElement('div');note.className='hint';note.style.flexBasis='100%';
  note.textContent='Drag the blue L̂ (light) and green V̂ (eye). The meter peaks when R̂ aligns with V̂ — that is the highlight.';
  ctl.append(lab,note);
  draw();
})();


/* ============================================================
   4) BUMP MAPPING — per-pixel lighting on a flat quad
   ============================================================ */
(function bumpDemo(){
  const cv=document.getElementById('bumpDemo');if(!cv)return;
  const ctx=cv.getContext('2d');
  const N=140;                              // compute resolution
  const buf=ctx.createImageData(N,N);
  let mode='bump';                          // flat | bump | height
  let light={x:0.35,y:0.35,z:0.9};          // light position (unit-ish, z above)
  let amp=1.0;
  // procedural height field: a few gaussian bumps + ripples
  const bumps=[[.3,.35,.13,1],[.66,.28,.1,1],[.5,.66,.16,1],[.78,.7,.09,.8],[.2,.72,.1,.8]];
  function height(u,v){
    let h=0;
    for(const b of bumps){const d=Math.hypot(u-b[0],v-b[1]);h+=b[3]*Math.exp(-(d*d)/(2*b[2]*b[2]));}
    h+=0.12*Math.sin(u*22)*Math.sin(v*20); // fine grain
    return h;
  }
  function render(){
    const d=buf.data;const eps=1/N;
    for(let j=0;j<N;j++)for(let i=0;i<N;i++){
      const u=i/N,v=j/N;
      // surface point in [-.5,.5] plane, z up
      const px=u-0.5, py=v-0.5;
      let nx=0,ny=0,nz=1;
      if(mode!=='flat'){
        const hL=height(u-eps,v),hR=height(u+eps,v),hD=height(u,v-eps),hU=height(u,v+eps);
        // gradient -> tilt normal (rate of change perturbs N)
        nx=-(hR-hL)/(2*eps)*0.06*amp;
        ny=-(hU-hD)/(2*eps)*0.06*amp;
        nz=1;
      }
      const nl=Math.hypot(nx,ny,nz);nx/=nl;ny/=nl;nz/=nl;
      // light direction from this point
      let lx=light.x-0.5-px, ly=light.y-0.5-py, lz=light.z;
      const ll=Math.hypot(lx,ly,lz);lx/=ll;ly/=ll;lz/=ll;
      let diff=Math.max(0,nx*lx+ny*ly+nz*lz);
      // specular (Blinn-ish): half vector with view (0,0,1)
      let hx=lx,hy=ly,hz=lz+1;const hl=Math.hypot(hx,hy,hz);hx/=hl;hy/=hl;hz/=hl;
      let spec=Math.pow(Math.max(0,nx*hx+ny*hy+nz*hz),40)*0.7;
      const idx=(j*N+i)*4;
      if(mode==='height'){
        const g=Math.min(255,height(u,v)*150+20);
        d[idx]=d[idx+1]=d[idx+2]=g;d[idx+3]=255;
      }else{
        // base teapot-ish purple-grey
        const amb=0.18;
        const base=[150,130,170];
        let shade=amb+diff*0.95;
        d[idx]  =Math.min(255,base[0]*shade+spec*255);
        d[idx+1]=Math.min(255,base[1]*shade+spec*255);
        d[idx+2]=Math.min(255,base[2]*shade+spec*255);
        d[idx+3]=255;
      }
    }
    // scale up to canvas
    const tmp=document.createElement('canvas');tmp.width=N;tmp.height=N;
    tmp.getContext('2d').putImageData(buf,0,0);
    ctx.imageSmoothingEnabled=true;
    ctx.clearRect(0,0,cv.width,cv.height);
    ctx.drawImage(tmp,0,0,cv.width,cv.height);
    // light marker
    if(mode!=='height'){
      ctx.fillStyle='#FFE08A';ctx.beginPath();
      ctx.arc(light.x*cv.width,light.y*cv.height,9,0,7);ctx.fill();
      ctx.fillStyle='rgba(255,224,138,.2)';ctx.beginPath();
      ctx.arc(light.x*cv.width,light.y*cv.height,20,0,7);ctx.fill();
    }
  }
  // interaction: drag light
  let drag=false;
  function pos(e){const r=cv.getBoundingClientRect();const t=e.touches?e.touches[0]:e;
    return{x:(t.clientX-r.left)/r.width,y:(t.clientY-r.top)/r.height};}
  function down(e){drag=true;const p=pos(e);light.x=p.x;light.y=p.y;render();e.preventDefault();}
  function move(e){if(!drag)return;const p=pos(e);light.x=Math.max(0,Math.min(1,p.x));light.y=Math.max(0,Math.min(1,p.y));render();e.preventDefault();}
  function up(){drag=false;}
  cv.addEventListener('mousedown',down);addEventListener('mousemove',move);addEventListener('mouseup',up);
  cv.addEventListener('touchstart',down,{passive:false});cv.addEventListener('touchmove',move,{passive:false});cv.addEventListener('touchend',up);
  // controls
  const ctl=document.getElementById('bumpCtl');
  const tg=document.createElement('div');tg.className='toggle';
  [['flat','Flat'],['bump','Bumpy'],['height','Height map']].forEach(([m,l])=>{
    const b=document.createElement('button');b.textContent=l;if(m===mode)b.classList.add('on');
    b.onclick=()=>{mode=m;tg.querySelectorAll('button').forEach(x=>x.classList.remove('on'));b.classList.add('on');render();};
    tg.appendChild(b);
  });
  const lab=document.createElement('label');lab.className='slider';
  lab.innerHTML='bump strength <span class="readout" id="ampr">1.0</span>';
  const sl=document.createElement('input');sl.type='range';sl.min=0;sl.max=2;sl.step=.05;sl.value=1;
  sl.oninput=()=>{amp=+sl.value;document.getElementById('ampr').textContent=amp.toFixed(1);render();};
  lab.appendChild(sl);
  ctl.append(tg,lab);
  render();
})();

/* ============================================================
   5) NORMAL MAP encoder — tilt normal, read RGB
   ============================================================ */
(function normalDemo(){
  const mount=document.getElementById('normalDemo');if(!mount)return;
  mount.innerHTML=`
   <div class="grid2" style="align-items:center;margin-top:8px">
     <div style="text-align:center">
       <canvas id="nmPad" width="260" height="260"></canvas>
       <div class="hint" style="justify-content:center">Drag inside the pad to tilt the normal</div>
     </div>
     <div>
       <div style="display:flex;gap:18px;align-items:center;margin-bottom:14px">
         <div class="swatch" id="nmSwatch"></div>
         <div style="font-family:var(--mono);font-size:13px;line-height:2">
           <div>N = (<span id="nmx" style="color:#FF6B6B">0.00</span>, <span id="nmy" style="color:#7BD88F">0.00</span>, <span id="nmz" style="color:#5BA9FF">1.00</span>)</div>
           <div>RGB = (<span id="nmr">128</span>, <span id="nmg">128</span>, <span id="nmb">255</span>)</div>
         </div>
       </div>
       <p style="font-size:.92rem;color:var(--muted)">Encoding: <span class="kw">channel = component·0.5 + 0.5</span>. When the normal points straight out (Z=1), blue = 255 → the texture is blue. That is the whole reason normal maps look blue-purple.</p>
     </div>
   </div>`;
  const cv=document.getElementById('nmPad');const ctx=cv.getContext('2d');const W=cv.width;
  let nx=0,ny=0;
  function draw(){
    const nz=Math.sqrt(Math.max(0,1-nx*nx-ny*ny));
    ctx.clearRect(0,0,W,W);
    // pad circle
    ctx.fillStyle='#0a0a0e';ctx.beginPath();ctx.arc(W/2,W/2,W/2-6,0,7);ctx.fill();
    ctx.strokeStyle='rgba(255,255,255,.12)';ctx.beginPath();ctx.arc(W/2,W/2,W/2-6,0,7);ctx.stroke();
    // crosshair
    ctx.strokeStyle='rgba(255,255,255,.06)';ctx.beginPath();
    ctx.moveTo(W/2,12);ctx.lineTo(W/2,W-12);ctx.moveTo(12,W/2);ctx.lineTo(W-12,W/2);ctx.stroke();
    // current color fill
    const r=Math.round(nx*127.5+127.5),g=Math.round(-ny*127.5+127.5),b=Math.round(nz*127.5+127.5);
    ctx.fillStyle=`rgba(${r},${g},${b},.5)`;ctx.beginPath();ctx.arc(W/2,W/2,W/2-6,0,7);ctx.fill();
    // normal dot
    const px=W/2+nx*(W/2-20), py=W/2-ny*(W/2-20);
    ctx.strokeStyle='#FF8A3D';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(W/2,W/2);ctx.lineTo(px,py);ctx.stroke();
    ctx.fillStyle='#FF8A3D';ctx.beginPath();ctx.arc(px,py,7,0,7);ctx.fill();
    ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(px,py,3,0,7);ctx.fill();
    // readouts
    document.getElementById('nmx').textContent=nx.toFixed(2);
    document.getElementById('nmy').textContent=ny.toFixed(2);
    document.getElementById('nmz').textContent=nz.toFixed(2);
    document.getElementById('nmr').textContent=r;
    document.getElementById('nmg').textContent=g;
    document.getElementById('nmb').textContent=b;
    document.getElementById('nmSwatch').style.background=`rgb(${r},${g},${b})`;
  }
  let drag=false;
  function pos(e){const rc=cv.getBoundingClientRect();const t=e.touches?e.touches[0]:e;
    return{x:(t.clientX-rc.left)*W/rc.width,y:(t.clientY-rc.top)*W/rc.height};}
  function set(e){const p=pos(e);let dx=(p.x-W/2)/(W/2-20),dy=-(p.y-W/2)/(W/2-20);
    const l=Math.hypot(dx,dy);if(l>0.98){dx*=0.98/l;dy*=0.98/l;}nx=dx;ny=dy;draw();}
  cv.addEventListener('mousedown',e=>{drag=true;set(e);e.preventDefault();});
  addEventListener('mousemove',e=>{if(drag)set(e);});
  addEventListener('mouseup',()=>drag=false);
  cv.addEventListener('touchstart',e=>{drag=true;set(e);e.preventDefault();},{passive:false});
  cv.addEventListener('touchmove',e=>{if(drag){set(e);e.preventDefault();}},{passive:false});
  cv.addEventListener('touchend',()=>drag=false);
  draw();
})();

/* ============================================================
   6) DISPLACEMENT vs NORMAL silhouette toggle
   ============================================================ */
(function dispDemo(){
  const cv=document.getElementById('dispDemo');if(!cv)return;
  const ctx=cv.getContext('2d');const W=cv.width,H=cv.height;
  let mode='normal'; // normal | displace
  let t=0, anim=true;
  function profile(x){ // height map across the surface
    return 0.5+0.5*Math.sin(x*Math.PI*3-0.6)*Math.exp(-Math.pow((x-0.5)*2.2,2))+0.18*Math.sin(x*Math.PI*7);
  }
  function draw(){
    ctx.clearRect(0,0,W,H);
    const baseY=H-90, left=60, right=W-60, span=right-left, h=70;
    // light
    const lx=left+span*(0.5+0.42*Math.sin(t)), ly=40;
    ctx.fillStyle='#FFE08A';ctx.beginPath();ctx.arc(lx,ly,8,0,7);ctx.fill();
    ctx.fillStyle='rgba(255,224,138,.15)';ctx.beginPath();ctx.arc(lx,ly,18,0,7);ctx.fill();
    // surface
    ctx.beginPath();ctx.moveTo(left,baseY);
    const steps=180;const top=[];
    for(let i=0;i<=steps;i++){
      const u=i/steps;const x=left+u*span;
      const disp=(mode==='displace')? (profile(u)-0.5)*h : 0;
      const y=baseY-disp;
      top.push([x,y,u]);
      ctx.lineTo(x,y);
    }
    ctx.lineTo(right,baseY+50);ctx.lineTo(left,baseY+50);ctx.closePath();
    // shade by faked (normal) or true geometry
    const grad=ctx.createLinearGradient(0,baseY-h,0,baseY+50);
    grad.addColorStop(0,'#6a6a82');grad.addColorStop(1,'#2a2a38');
    ctx.fillStyle=grad;ctx.fill();
    // per-segment lighting line on top (this is what BOTH techniques light correctly)
    for(let i=0;i<top.length-1;i++){
      const [x,y,u]=top[i];const [x2,y2]=top[i+1];
      // normal from profile gradient (always available, both modes)
      const g=(profile((i+1)/steps)-profile(i/steps))*steps;
      let nx=-g*0.04, ny=-1;const nl=Math.hypot(nx,ny);nx/=nl;ny/=nl;
      let ldx=lx-x,ldy=ly-y;const ll=Math.hypot(ldx,ldy);ldx/=ll;ldy/=ll;
      const diff=Math.max(0,nx*ldx+ny*ldy);
      ctx.strokeStyle=`rgba(255,210,150,${0.15+diff*0.85})`;ctx.lineWidth=4;
      ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x2,y2);ctx.stroke();
    }
    // silhouette outline emphasised
    ctx.strokeStyle = mode==='displace' ? '#FF8A3D' : '#46D6E0';
    ctx.lineWidth=2.4;ctx.beginPath();
    top.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.stroke();
    // labels
    ctx.fillStyle='#9a9ab0';ctx.font='12px JetBrains Mono';ctx.textAlign='left';
    ctx.fillText('SILHOUETTE →',left,baseY-h-18);
    ctx.fillStyle = mode==='displace'?'#FF8A3D':'#46D6E0';
    ctx.font='13px JetBrains Mono';ctx.textAlign='center';
    ctx.fillText(mode==='displace'
      ? 'DISPLACEMENT · real vertices move · silhouette bends'
      : 'NORMAL MAP · flat geometry · shading faked · silhouette FLAT', W/2, H-22);
  }
  function loop(){t+=0.012;if(anim)draw();requestAnimationFrame(loop);}
  const ctl=document.getElementById('dispCtl');
  const tg=document.createElement('div');tg.className='toggle';
  [['normal','Normal map'],['displace','Displacement']].forEach(([m,l])=>{
    const b=document.createElement('button');b.textContent=l;if(m===mode)b.classList.add('on');
    b.onclick=()=>{mode=m;tg.querySelectorAll('button').forEach(x=>x.classList.remove('on'));b.classList.add('on');};
    tg.appendChild(b);
  });
  const b2=document.createElement('button');b2.className='btn';b2.textContent='⏯ Pause light';
  b2.onclick=()=>{anim=!anim;b2.textContent=anim?'⏯ Pause light':'⏯ Play light';};
  ctl.append(tg,b2);
  loop();
})();

/* ============================================================
   7) COMPARISON TABLE (rendered, not bullets)
   ============================================================ */
(function compare(){
  const m=document.getElementById('compareTable');if(!m)return;
  const rows=[
    ['','Bump','Normal','Displacement'],
    ['Changes geometry?','No','No','Yes — moves vertices'],
    ['Changes silhouette?','No','No','Yes'],
    ['Stores','Height (greyscale)','Normal as RGB','Height → offset'],
    ['Cost','Cheap','Cheap','Expensive (+tessellation)'],
    ['Fails when','—','grazing silhouette','mesh too low-poly'],
  ];
  let html='<div style="overflow-x:auto"><table style="width:100%;border-collapse:collapse;font-size:.92rem">';
  rows.forEach((r,i)=>{
    html+='<tr>';
    r.forEach((c,j)=>{
      const head=i===0||j===0;
      const style=`padding:11px 12px;border:1px solid var(--line);${i===0?'background:var(--panel2);font-family:var(--mono);font-size:11px;letter-spacing:.08em;color:var(--amber);text-transform:uppercase;':''}${j===0&&i!==0?'font-family:var(--mono);font-size:11px;color:var(--muted);':''}${j===3&&i!==0?'color:#fff;':''}`;
      html+=`<${head?'th':'td'} style="${style}">${c}</${head?'th':'td'}>`;
    });
    html+='</tr>';
  });
  html+='</table></div>';
  m.innerHTML=html;
})();


/* ============================================================
   8) QUIZ  (from the course quiz bank — rendering-relevant)
   ============================================================ */
const QUIZ=[
 {q:"What is the core idea behind shadow mapping?",
  opts:[
   "Each light emits virtual rays intersected with geometry to compute shadow boundaries",
   "The scene is rendered from the light's view into a depth map, against which fragments are later tested",
   "Shadow values are pre-baked into each object's albedo texture when the model is loaded",
   "The fragment shader computes ambient occlusion from neighbouring normals as the shadow term"],
  a:1,
  fb:"Shadow mapping renders the scene from the light's viewpoint into a depth-only texture; each fragment is later transformed into light space and depth-compared to decide if it is occluded."},
 {q:"Why are cube maps usually preferred over spherical (equirectangular) environment maps for real-time rendering?",
  opts:[
   "Cube maps natively support a higher dynamic range by design",
   "Cube maps store reflection info in a compact 1D texture, faster to fetch",
   "Cube maps sample six flat textures with no polar distortion and are supported in GPU hardware",
   "Cube maps let shadows be computed in the same pass as the reflection"],
  a:2,
  fb:"Six flat textures, a direct lookup from the reflection direction, no polar distortion, and hardware-accelerated sampling — all make cube maps faster and cleaner for real-time use."},
 {q:"Why do normal maps typically appear blue-purple in colour?",
  opts:[
   "Most surface normals point along the local z-axis (out of the surface), which maps to blue in RGB",
   "The blue channel compresses more efficiently than red or green",
   "Normal maps store height in blue and gradients in red & green",
   "GPUs sample the blue channel first, so artists use it for debugging"],
  a:0,
  fb:"Normals are stored in tangent space as RGB. The z component points outward and maps to blue; since most normals point mostly outward, blue dominates the texture."},
 {q:"A high-resolution displacement map applied to a coarse, low-poly mesh produces almost no change in shape. Most likely cause?",
  opts:[
   "Displacement maps must be encoded in the blue channel to work at runtime",
   "Displacement requires anisotropic filtering in addition to bilinear",
   "The fragment shader sampled the displacement map before the vertex stage ran",
   "Displacement moves actual vertex positions, so a coarse mesh has too few vertices to displace"],
  a:3,
  fb:"Displacement edits real vertex positions, so the result depends on vertex count. A coarse mesh cannot express fine detail — too few vertices. This is the key difference from normal maps."},
 {q:"What is the purpose of the Z-buffer?",
  opts:["To make pixel colours as bright as possible","To improve efficiency of rendering large triangles",
        "To solve the \"hidden surface\" problem","To improve the resolution of rendered images"],
  a:2,
  fb:"The Z-buffer keeps the nearest fragment per pixel and discards farther ones — solving which surfaces are visible (the hidden-surface problem)."},
 {q:"Why does Blinn-Phong use a halfway vector H rather than the reflection vector R?",
  opts:[
   "H incorporates surface roughness, removing the need for a shininess exponent",
   "H lets specular be evaluated once per triangle rather than per fragment",
   "H is cheaper to compute and avoids the grazing-angle artefact Phong produces at extreme viewing directions",
   "H is physically correct for all materials; R only works for perfect mirrors"],
  a:2,
  fb:"H = normalise(L + V) is a cheap add-and-normalise, and it avoids the breakdown Phong shows at grazing angles."},
];
(function renderQuiz(){
  const mount=document.getElementById('quizMount');if(!mount)return;
  let score=0, answered=0;
  QUIZ.forEach((item,qi)=>{
    const box=document.createElement('div');box.className='quiz reveal';
    box.innerHTML=`<div class="qnum">QUESTION ${qi+1} / ${QUIZ.length}</div>
      <div class="qtext">${item.q}</div><div class="opts"></div>
      <div class="feedback"></div>`;
    const optsEl=box.querySelector('.opts');const fb=box.querySelector('.feedback');
    let locked=false;
    item.opts.forEach((o,oi)=>{
      const b=document.createElement('button');b.className='opt';b.textContent=o;
      b.onclick=()=>{
        if(locked)return;locked=true;answered++;
        optsEl.querySelectorAll('.opt').forEach((el,k)=>{el.classList.add('disabled');
          if(k===item.a)el.classList.add('correct');});
        if(oi===item.a){score++;fb.className='feedback show ok';fb.innerHTML='<strong style="color:var(--green)">Correct.</strong> '+item.fb;}
        else{b.classList.add('wrong');fb.className='feedback show no';fb.innerHTML='<strong style="color:var(--pink)">Not quite.</strong> '+item.fb;}
        updateScore();
      };
      optsEl.appendChild(b);
    });
    mount.appendChild(box);io_observe(box);
  });
  const foot=document.createElement('div');foot.className='quiz-foot reveal';
  foot.innerHTML=`<span>Course quiz bank · rendering-relevant questions</span><span class="score" id="quizScore">Score 0 / ${QUIZ.length}</span>`;
  mount.appendChild(foot);io_observe(foot);
  window.updateScore=()=>{const s=document.getElementById('quizScore');if(s)s.textContent=`Score ${score} / ${QUIZ.length}`;};
})();

/* ============================================================
   9) PAST PAPER questions
   ============================================================ */
const EXAMS=[
 {yr:"2025 · Q23",marks:"6 marks",q:"Describe the Z-buffer algorithm in detail.",
  ans:"Maintain a depth buffer the size of the framebuffer, initialised to the far value. For each rasterised fragment, compare its interpolated depth to the stored value at that pixel; if nearer, overwrite both the colour and the stored depth, otherwise discard it. This resolves the hidden-surface problem in arbitrary draw order. Note the z-fighting caveat: insufficient depth precision makes near-coplanar surfaces flicker."},
 {yr:"2025 · Q24",marks:"2 marks",q:"How can a surface be made to appear bumpy without changing its geometry?",
  ans:"Bump / normal mapping: perturb the surface normals used in the lighting calculation (derived from a height map's gradient, or read directly from a normal-map texture). Lighting then responds as if the surface were bumpy, while the actual geometry — and the silhouette — stay flat."},
 {yr:"2025 · Q25",marks:"4 marks",q:"Why are synthetic images an approximation to reality?",
  ans:"Real light transport (global illumination, true reflection/refraction, soft shadows, spectral effects) is far too costly to simulate fully in real time. Rasterisation pipelines approximate it: local lighting models (Phong/Blinn-Phong), faked shadows (shadow maps), faked reflections (environment maps), faked detail (bump/normal maps). Each is a deliberate trade of physical accuracy for speed."},
 {yr:"2022 · Q26",marks:"essay",q:"The process of bump mapping is explained by a diagram showing b\u1d65N\u1d65 and b\u1d64N\u1d64. What do these terms mean? How do they contribute to a bumpy-looking surface? Is it better to compute these at run time or in advance? Give examples of live vs precomputed bump maps.",
  ans:"b\u1d64N\u1d64 and b\u1d65N\u1d65 are offset vectors built from the partial derivatives of the bump (height) function in the u and v texture directions, scaled by the bump amount. Added to the original normal N they give a perturbed normal N′, which tilts toward slopes in the height field so lighting reads as bumpy. Precompute (bake) for static surfaces — fast and fixed (e.g. a brick wall). Compute live when bumps must change — animated ripples on water, deforming/procedural surfaces."},
 {yr:"2019 · Q25",marks:"6 marks",q:"Explain what the normalised vectors N̂, R̂ and V̂ represent. Explain how R̂ and V̂ are used to estimate specular reflection, and what other factors (with ranges) are needed.",
  ans:"N̂ = surface normal; R̂ = the light direction reflected about N̂ (R = 2(N·L)N − L); V̂ = direction to the viewer. Specular ≈ kₛ·(R̂·V̂)ⁿ, evaluated only where R̂·V̂ > 0. Other factors: specular coefficient kₛ (0–1), shininess exponent n (small = broad highlight, large = tight), light intensity, and optional 1/d² distance attenuation."},
 {yr:"2017 · Q",marks:"2 marks",q:"Describe a method for making a surface look bumpy that does not involve changing the actual geometry of the surface.",
  ans:"Bump mapping (or normal mapping): perturb the per-fragment normal using a height map's gradient (or a stored normal texture) before lighting. The lighting equation produces highlights and shading consistent with bumps; the geometry is untouched, so the silhouette stays smooth."},
 {yr:"2016 · Q2d",marks:"4 marks",q:"You would like a mesh M to appear to have an irregular, bumpy surface. Describe an image-based technique applied during rendering to achieve this.",
  ans:"Use a bump/normal map — an image whose texels encode either height (whose gradient perturbs the normal) or the normal vector directly as RGB in tangent space. During fragment shading, sample it to obtain a perturbed normal N′ and feed N′ into the diffuse/specular lighting. The irregular surface appears under lighting without adding any polygons."},
];
(function renderExams(){
  const mount=document.getElementById('examMount');if(!mount)return;
  EXAMS.forEach(e=>{
    const d=document.createElement('div');d.className='exam reveal';
    d.innerHTML=`<span class="marks">${e.marks}</span><div class="yr">${e.yr}</div>
      <div class="q">${e.q}</div>
      <details class="model"><summary>Show model-answer sketch</summary><div class="ans">${e.ans}</div></details>`;
    mount.appendChild(d);io_observe(d);
  });
})();

/* helper used by late-built nodes */
function io_observe(el){
  const o=new IntersectionObserver(es=>es.forEach(x=>{if(x.isIntersecting){x.target.classList.add('in');o.unobserve(x.target);}}),{threshold:.1});
  o.observe(el);
}

/* run progress once */
onScroll();
})();
