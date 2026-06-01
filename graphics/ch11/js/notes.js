/* COMP27112 Ch11 — page interactions */
document.addEventListener("DOMContentLoaded", () => {

  /* ---- scroll progress ---- */
  const bar = document.getElementById("progress");
  const onScroll = () => {
    const h = document.documentElement;
    const p = h.scrollTop / (h.scrollHeight - h.clientHeight);
    bar.style.width = (p * 100) + "%";
  };
  document.addEventListener("scroll", onScroll, { passive: true }); onScroll();

  /* ---- reveal on scroll ---- */
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
  }, { threshold: 0.12 });
  document.querySelectorAll(".reveal").forEach(el => io.observe(el));

  /* ---- decorative hero spheres (smooth analytic) ---- */
  function drawStaticSphere(cv, rgb) {
    const ctx = cv.getContext("2d"), W = cv.width, H = cv.height;
    const R = Math.min(W, H) * 0.46, cx = W/2, cy = H/2;
    const L = [-0.5, 0.62, 0.6], len = Math.hypot(...L); const l = L.map(v=>v/len);
    const Hh = [(l[0]+0)/1,(l[1]+0)/1,(l[2]+1)/1]; const hl = Math.hypot(...Hh); const h=Hh.map(v=>v/hl);
    const img = ctx.createImageData(W,H), d = img.data;
    for(let y=0;y<H;y++)for(let x=0;x<W;x++){
      const o=(y*W+x)*4, nx=(x+0.5-cx)/R, ny=(cy-(y+0.5))/R, r2=nx*nx+ny*ny;
      if(r2>1){d[o]=22;d[o+1]=22;d[o+2]=26;d[o+3]=0;continue;}
      const nz=Math.sqrt(1-r2);
      const nl=Math.max(0,nx*l[0]+ny*l[1]+nz*l[2]);
      const nh=Math.max(0,nx*h[0]+ny*h[1]+nz*h[2]);
      const sp=0.8*Math.pow(nh,28);
      d[o]=Math.min(255,rgb[0]*(0.14+nl)+sp*255);
      d[o+1]=Math.min(255,rgb[1]*(0.14+nl)+sp*255);
      d[o+2]=Math.min(255,rgb[2]*(0.14+nl)+sp*255);
      d[o+3]=255;
    }
    ctx.putImageData(img,0,0);
  }
  const hf=document.getElementById("h-flat"), hg=document.getElementById("h-gouraud"), hp=document.getElementById("h-phong");
  if(hf) drawStaticSphere(hf,[233,70,107]);
  if(hg) drawStaticSphere(hg,[238,180,74]);
  if(hp) drawStaticSphere(hp,[60,196,172]);

  /* ---- demos ---- */
  const C = window.Ch11;

  // shading sphere
  const sc = document.getElementById("shadingCanvas");
  if (sc) C.createShadingSphere(sc, {
    modeButtons: [...document.querySelectorAll(".seg button[data-mode]")],
    wire: document.getElementById("wireToggle"),
    spin: document.getElementById("spinToggle")
  });

  // blinn-phong
  const bp = document.getElementById("bpCanvas");
  if (bp) C.createBlinnPhong(bp, {
    kd: document.getElementById("kd"), ks: document.getElementById("ks"),
    shin: document.getElementById("shin"), amb: document.getElementById("amb"),
    diffuse: document.getElementById("difChk"), spec: document.getElementById("specChk"),
    out: {
      kd: document.getElementById("kdv"), ks: document.getElementById("ksv"),
      shin: document.getElementById("shinv"), amb: document.getElementById("ambv")
    }
  });

  // barycentric
  const bc = document.getElementById("baryCanvas");
  if (bc) C.createBarycentric(bc, document.getElementById("baryOut"));

  // normal matrix
  const nm = document.getElementById("nmCanvas");
  if (nm) C.createNormalMatrix(nm, document.getElementById("nmScale"),
        document.getElementById("nmScaleV"), [...document.querySelectorAll('input[name="nmmode"]')]);

  /* ---- pipeline ---- */
  const stages = [...document.querySelectorAll(".stage")];
  const info = document.getElementById("pipeInfo");
  const texts = {
    vs: "VERTEX SHADER — runs once per vertex. Transforms the position into view space (modelViewMatrix), transforms the normal (normalMatrix), and emits per-vertex outputs. In Gouraud the *final colour* is computed here.",
    ras: "RASTERISATION — fixed-function stage. Determines which pixels the triangle covers and interpolates every vertex output across them using barycentric weights α, β, γ.",
    fs: "FRAGMENT SHADER — runs once per pixel. Produces the final colour. In Phong the interpolated normal is re-normalised here and the full lighting equation is evaluated per fragment."
  };
  let idx = 0, auto = true;
  function light(i) {
    stages.forEach((s, k) => s.classList.toggle("lit", k === i));
    if (info) info.textContent = texts[stages[i].dataset.stage];
  }
  stages.forEach((s, i) => s.addEventListener("click", () => { auto = false; idx = i; light(i); }));
  if (stages.length) {
    light(0);
    setInterval(() => { if (auto) { idx = (idx + 1) % stages.length; light(idx); } }, 2600);
  }

  /* ---- quizzes ---- */
  let score = 0, answered = 0;
  const totalEl = document.getElementById("quizTotal");
  const total = document.querySelectorAll(".quiz").length;
  document.querySelectorAll(".quiz").forEach(q => {
    const opts = [...q.querySelectorAll(".opt")];
    const exp = q.querySelector(".explain");
    opts.forEach(opt => opt.addEventListener("click", () => {
      const correct = opt.dataset.correct === "1";
      opts.forEach(o => {
        o.classList.add("disabled");
        if (o.dataset.correct === "1") o.classList.add("correct");
      });
      if (!correct) opt.classList.add("wrong");
      if (exp) exp.classList.add("show");
      answered++; if (correct) score++;
      const sEl = document.getElementById("scoreboard");
      if (sEl) sEl.textContent = `Score: ${score} / ${answered} answered  ·  ${total} total`;
    }));
  });
});
