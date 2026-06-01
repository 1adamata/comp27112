/* COMP27112 Ch11 — software shading demos
   Two demos:
   (1) createShadingSphere(canvas, ui)  -> coarse UV-sphere rasterised Flat/Gouraud/Phong
   (2) createBlinnPhong(canvas, ui)     -> smooth analytic sphere, draggable light + kd/ks/n sliders
*/
(function () {
  "use strict";

  /* ---------- tiny vec3 helpers ---------- */
  const sub = (a, b) => [a[0]-b[0], a[1]-b[1], a[2]-b[2]];
  const add = (a, b) => [a[0]+b[0], a[1]+b[1], a[2]+b[2]];
  const dot = (a, b) => a[0]*b[0] + a[1]*b[1] + a[2]*b[2];
  const cross = (a, b) => [a[1]*b[2]-a[2]*b[1], a[2]*b[0]-a[0]*b[2], a[0]*b[1]-a[1]*b[0]];
  const scale = (a, s) => [a[0]*s, a[1]*s, a[2]*s];
  const norm = a => { const l = Math.hypot(a[0],a[1],a[2]) || 1; return [a[0]/l,a[1]/l,a[2]/l]; };
  const clamp01 = x => x < 0 ? 0 : x > 1 ? 1 : x;

  /* ---------- build a coarse UV sphere ---------- */
  function buildSphere(stacks, slices) {
    const verts = [], normals = [];
    for (let i = 0; i <= stacks; i++) {
      const phi = Math.PI * i / stacks;          // 0..PI
      const y = Math.cos(phi), r = Math.sin(phi);
      for (let j = 0; j <= slices; j++) {
        const th = 2 * Math.PI * j / slices;
        const p = [r * Math.cos(th), y, r * Math.sin(th)];
        verts.push(p); normals.push(p);          // unit sphere: normal == position
      }
    }
    const tris = [];
    const idx = (i, j) => i * (slices + 1) + j;
    for (let i = 0; i < stacks; i++)
      for (let j = 0; j < slices; j++) {
        const a = idx(i, j), b = idx(i + 1, j), c = idx(i + 1, j + 1), d = idx(i, j + 1);
        tris.push([a, b, c], [a, c, d]);
      }
    return { verts, normals, tris };
  }

  /* ---------- rotation about Y then tilt about X ---------- */
  function rot(p, ay, ax) {
    let [x, y, z] = p;
    let c = Math.cos(ay), s = Math.sin(ay);
    let x1 = c * x + s * z, z1 = -s * x + c * z;
    c = Math.cos(ax); s = Math.sin(ax);
    let y1 = c * y - s * z1, z2 = s * y + c * z1;
    return [x1, y1, z2];
  }

  /* ---------- Blinn–Phong evaluate (view-space) ---------- */
  function shade(N, base, mat) {
    const L = mat.L, V = [0, 0, 1];
    const nl = Math.max(0, dot(N, L));
    const H = norm(add(L, V));
    const nh = Math.max(0, dot(N, H));
    const spec = mat.ks * Math.pow(nh, mat.shin);
    const dif = mat.kd * nl;
    const amb = mat.amb;
    return [
      clamp01(base[0] * (amb + dif) + spec),
      clamp01(base[1] * (amb + dif) + spec),
      clamp01(base[2] * (amb + dif) + spec)
    ];
  }

  /* ============================================================
     DEMO 1 — Flat / Gouraud / Phong rasteriser
  ============================================================ */
  function createShadingSphere(canvas, ui) {
    const W = canvas.width, H = canvas.height;
    const ctx = canvas.getContext("2d");
    const mesh = buildSphere(10, 16);
    const R = Math.min(W, H) * 0.40, cx = W / 2, cy = H / 2;

    const palettes = {
      flat:    [0.92, 0.27, 0.42],   // crimson
      gouraud: [0.95, 0.66, 0.13],   // amber
      phong:   [0.24, 0.78, 0.70]    // teal
    };

    const mat = {
      kd: 0.95, ks: 0.7, shin: 24, amb: 0.18,
      L: norm([0.45, 0.6, 0.8])
    };

    let mode = "flat", wire = false, spin = true;
    let ay = 0.6, ax = -0.35, dragging = false, lx = 0, ly = 0;

    function project() {
      const sv = new Array(mesh.verts.length);
      const sn = new Array(mesh.verts.length);
      for (let i = 0; i < mesh.verts.length; i++) {
        const p = rot(mesh.verts[i], ay, ax);
        const n = rot(mesh.normals[i], ay, ax);
        sv[i] = [cx + p[0] * R, cy - p[1] * R, p[2]];   // screen x,y + depth
        sn[i] = n;
      }
      return { sv, sn };
    }

    function rasterTri(img, zb, A, B, C, shadeFn) {
      const minX = Math.max(0, Math.floor(Math.min(A[0], B[0], C[0])));
      const maxX = Math.min(W - 1, Math.ceil(Math.max(A[0], B[0], C[0])));
      const minY = Math.max(0, Math.floor(Math.min(A[1], B[1], C[1])));
      const maxY = Math.min(H - 1, Math.ceil(Math.max(A[1], B[1], C[1])));
      const area = (B[0]-A[0])*(C[1]-A[1]) - (B[1]-A[1])*(C[0]-A[0]);
      if (area === 0) return;
      const inv = 1 / area;
      for (let y = minY; y <= maxY; y++) {
        for (let x = minX; x <= maxX; x++) {
          const px = x + 0.5, py = y + 0.5;
          let w0 = ((B[0]-px)*(C[1]-py) - (B[1]-py)*(C[0]-px)) * inv;
          let w1 = ((C[0]-px)*(A[1]-py) - (C[1]-py)*(A[0]-px)) * inv;
          let w2 = 1 - w0 - w1;
          if (w0 < 0 || w1 < 0 || w2 < 0) continue;
          const z = w0*A[2] + w1*B[2] + w2*C[2];
          const o = y * W + x;
          if (z <= zb[o]) continue;
          zb[o] = z;
          const c = shadeFn(w0, w1, w2);
          const p4 = o * 4;
          img[p4] = c[0]*255; img[p4+1] = c[1]*255; img[p4+2] = c[2]*255; img[p4+3] = 255;
        }
      }
    }

    function render() {
      const { sv, sn } = project();
      const base = palettes[mode];
      const img = ctx.createImageData(W, H);
      const data = img.data;
      // background charcoal
      for (let i = 0; i < W * H; i++) {
        data[i*4] = 26; data[i*4+1] = 26; data[i*4+2] = 30; data[i*4+3] = 255;
      }
      const zb = new Float32Array(W * H).fill(-Infinity);

      for (const t of mesh.tris) {
        const A = sv[t[0]], B = sv[t[1]], C = sv[t[2]];
        const NA = sn[t[0]], NB = sn[t[1]], NC = sn[t[2]];
        // face normal (geometric) for cull + flat
        const fn = norm(cross(sub(mesh3(A), mesh3(B)) , sub(mesh3(C), mesh3(B))));
        // use averaged vertex normal for orientation/cull (robust):
        const favg = norm([NA[0]+NB[0]+NC[0], NA[1]+NB[1]+NC[1], NA[2]+NB[2]+NC[2]]);
        if (favg[2] <= 0) continue;                  // backface cull

        let shadeFn;
        if (mode === "flat") {
          const c = shade(favg, base, mat);
          shadeFn = () => c;
        } else if (mode === "gouraud") {
          const cA = shade(NA, base, mat), cB = shade(NB, base, mat), cC = shade(NC, base, mat);
          shadeFn = (w0, w1, w2) => [
            w0*cA[0] + w1*cB[0] + w2*cC[0],
            w0*cA[1] + w1*cB[1] + w2*cC[1],
            w0*cA[2] + w1*cB[2] + w2*cC[2]
          ];
        } else { // phong
          shadeFn = (w0, w1, w2) => {
            const N = norm([
              w0*NA[0] + w1*NB[0] + w2*NC[0],
              w0*NA[1] + w1*NB[1] + w2*NC[1],
              w0*NA[2] + w1*NB[2] + w2*NC[2]
            ]);
            return shade(N, base, mat);
          };
        }
        rasterTri(data, zb, A, B, C, shadeFn);
      }
      ctx.putImageData(img, 0, 0);

      if (wire) {
        ctx.lineWidth = 1;
        ctx.strokeStyle = "rgba(255,255,255,0.28)";
        ctx.beginPath();
        for (const t of mesh.tris) {
          const A = sv[t[0]], B = sv[t[1]], C = sv[t[2]];
          const favg = norm([sn[t[0]][0]+sn[t[1]][0]+sn[t[2]][0],
                             sn[t[0]][1]+sn[t[1]][1]+sn[t[2]][1],
                             sn[t[0]][2]+sn[t[1]][2]+sn[t[2]][2]]);
          if (favg[2] <= 0) continue;
          ctx.moveTo(A[0], A[1]); ctx.lineTo(B[0], B[1]); ctx.lineTo(C[0], C[1]); ctx.closePath();
        }
        ctx.stroke();
      }
    }
    // helper: rebuild a faux 3D point from screen for face-normal (unused fallback)
    function mesh3(s){ return [(s[0]-cx)/R, -(s[1]-cy)/R, s[2]]; }

    /* interaction */
    canvas.addEventListener("pointerdown", e => { dragging = true; spin = false; lx = e.offsetX; ly = e.offsetY; canvas.setPointerCapture(e.pointerId); });
    canvas.addEventListener("pointermove", e => {
      if (!dragging) return;
      ay += (e.offsetX - lx) * 0.01; ax += (e.offsetY - ly) * 0.01;
      ax = Math.max(-1.4, Math.min(1.4, ax));
      lx = e.offsetX; ly = e.offsetY; render();
    });
    canvas.addEventListener("pointerup", () => dragging = false);

    function loop() { if (spin && !dragging) { ay += 0.006; render(); } requestAnimationFrame(loop); }

    /* UI wiring */
    if (ui) {
      ui.modeButtons.forEach(btn => btn.addEventListener("click", () => {
        mode = btn.dataset.mode;
        ui.modeButtons.forEach(b => b.classList.toggle("active", b === btn));
        render();
      }));
      if (ui.wire) ui.wire.addEventListener("change", () => { wire = ui.wire.checked; render(); });
      if (ui.spin) ui.spin.addEventListener("change", () => { spin = ui.spin.checked; });
    }

    render();
    requestAnimationFrame(loop);
    return { render };
  }

  /* ============================================================
     DEMO 2 — analytic Blinn–Phong sphere, draggable light
  ============================================================ */
  function createBlinnPhong(canvas, ui) {
    const W = canvas.width, H = canvas.height;
    const ctx = canvas.getContext("2d");
    const R = Math.min(W, H) * 0.42, cx = W / 2, cy = H / 2;
    const base = [0.24, 0.78, 0.70];
    const state = { kd: 1.0, ks: 0.8, shin: 32, amb: 0.12, diffuse: true, spec: true,
                    lightAngle: -0.7, lightElev: 0.6 };

    function lightDir() {
      const e = state.lightElev;
      const ce = Math.cos(e);
      return norm([Math.cos(state.lightAngle) * ce, Math.sin(e), Math.sin(state.lightAngle) * ce + 0.3]);
    }

    function render() {
      const img = ctx.createImageData(W, H);
      const d = img.data;
      const L = lightDir(), V = [0, 0, 1], Hh = norm(add(L, V));
      for (let y = 0; y < H; y++) {
        for (let x = 0; x < W; x++) {
          const o = (y * W + x) * 4;
          const nx = (x + 0.5 - cx) / R, ny = (cy - (y + 0.5)) / R;
          const r2 = nx*nx + ny*ny;
          if (r2 > 1) { d[o]=26; d[o+1]=26; d[o+2]=30; d[o+3]=255; continue; }
          const nz = Math.sqrt(1 - r2);
          const N = [nx, ny, nz];
          const nl = Math.max(0, dot(N, L));
          const nh = Math.max(0, dot(N, Hh));
          const dif = state.diffuse ? state.kd * nl : 0;
          const sp = state.spec ? state.ks * Math.pow(nh, state.shin) : 0;
          d[o]   = clamp01(base[0]*(state.amb+dif) + sp) * 255;
          d[o+1] = clamp01(base[1]*(state.amb+dif) + sp) * 255;
          d[o+2] = clamp01(base[2]*(state.amb+dif) + sp) * 255;
          d[o+3] = 255;
        }
      }
      ctx.putImageData(img, 0, 0);
      // light marker
      const L2 = lightDir();
      const mx = cx + L2[0] * R * 1.18, my = cy - L2[1] * R * 1.18;
      ctx.beginPath(); ctx.arc(mx, my, 9, 0, 7); ctx.fillStyle = "#ffe27a"; ctx.fill();
      ctx.strokeStyle = "rgba(255,226,122,0.5)"; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(mx, my); ctx.stroke();
    }

    let dragging = false;
    function setFromPointer(e) {
      const dx = e.offsetX - cx, dy = cy - e.offsetY;
      state.lightAngle = Math.atan2(dy, dx) * 0; // placeholder
      const ang = Math.atan2(dx, 1); // not used
      // map pointer angle/elevation
      const a = Math.atan2(dx, R);
      state.lightAngle = Math.atan2(dx, R);
      state.lightElev = Math.atan2(dy, R);
      state.lightElev = Math.max(-1.3, Math.min(1.3, state.lightElev));
      render();
    }
    canvas.addEventListener("pointerdown", e => { dragging = true; canvas.setPointerCapture(e.pointerId); setFromPointer(e); });
    canvas.addEventListener("pointermove", e => { if (dragging) setFromPointer(e); });
    canvas.addEventListener("pointerup", () => dragging = false);

    if (ui) {
      const bind = (el, key, fn) => el && el.addEventListener("input", () => { state[key] = fn(el.value); if (ui.out && ui.out[key]) ui.out[key].textContent = fn(el.value).toFixed ? fn(el.value).toFixed(2) : fn(el.value); render(); });
      bind(ui.kd, "kd", v => +v);
      bind(ui.ks, "ks", v => +v);
      bind(ui.shin, "shin", v => +v);
      bind(ui.amb, "amb", v => +v);
      if (ui.diffuse) ui.diffuse.addEventListener("change", () => { state.diffuse = ui.diffuse.checked; render(); });
      if (ui.spec) ui.spec.addEventListener("change", () => { state.spec = ui.spec.checked; render(); });
    }
    render();
    return { render, state };
  }

  /* ============================================================
     DEMO 3 — barycentric interpolation playground
  ============================================================ */
  function createBarycentric(canvas, readout) {
    const W = canvas.width, H = canvas.height, ctx = canvas.getContext("2d");
    const A = [W*0.5, H*0.12], B = [W*0.12, H*0.86], C = [W*0.88, H*0.86];
    const cols = [[233,70,107], [233,196,107], [60,196,172]]; // crimson, amber, teal
    let P = [W*0.5, H*0.55];

    function bary(p) {
      const v0 = sub2(B, A), v1 = sub2(C, A), v2 = sub2(p, A);
      const d00 = v0[0]*v0[0]+v0[1]*v0[1], d01 = v0[0]*v1[0]+v0[1]*v1[1], d11 = v1[0]*v1[0]+v1[1]*v1[1];
      const d20 = v2[0]*v0[0]+v2[1]*v0[1], d21 = v2[0]*v1[0]+v2[1]*v1[1];
      const den = d00*d11 - d01*d01;
      const beta = (d11*d20 - d01*d21)/den;
      const gamma = (d00*d21 - d01*d20)/den;
      const alpha = 1 - beta - gamma;
      return [alpha, beta, gamma];
    }
    function sub2(a,b){return [a[0]-b[0],a[1]-b[1]];}

    function render() {
      ctx.clearRect(0,0,W,H);
      ctx.fillStyle = "#1a1a1e"; ctx.fillRect(0,0,W,H);
      // fill triangle with interpolated color per pixel (bounding box)
      const img = ctx.getImageData(0,0,W,H), d = img.data;
      const minX = Math.min(A[0],B[0],C[0])|0, maxX = Math.max(A[0],B[0],C[0])|0;
      const minY = Math.min(A[1],B[1],C[1])|0, maxY = Math.max(A[1],B[1],C[1])|0;
      const area = (B[0]-A[0])*(C[1]-A[1])-(B[1]-A[1])*(C[0]-A[0]);
      for (let y=minY;y<=maxY;y++) for (let x=minX;x<=maxX;x++){
        const w0=((B[0]-x)*(C[1]-y)-(B[1]-y)*(C[0]-x))/area;
        const w1=((C[0]-x)*(A[1]-y)-(C[1]-y)*(A[0]-x))/area;
        const w2=1-w0-w1;
        if(w0<0||w1<0||w2<0) continue;
        const o=(y*W+x)*4;
        d[o]=w0*cols[0][0]+w1*cols[1][0]+w2*cols[2][0];
        d[o+1]=w0*cols[0][1]+w1*cols[1][1]+w2*cols[2][1];
        d[o+2]=w0*cols[0][2]+w1*cols[1][2]+w2*cols[2][2];
        d[o+3]=255;
      }
      ctx.putImageData(img,0,0);
      // vertices
      const corners=[A,B,C];
      corners.forEach((v,i)=>{ ctx.beginPath(); ctx.arc(v[0],v[1],7,0,7); ctx.fillStyle=`rgb(${cols[i].join(",")})`; ctx.fill(); ctx.lineWidth=2; ctx.strokeStyle="#fff"; ctx.stroke(); });
      // point
      ctx.beginPath(); ctx.arc(P[0],P[1],8,0,7); ctx.fillStyle="#fff"; ctx.fill(); ctx.strokeStyle="#111"; ctx.lineWidth=2; ctx.stroke();
      const [a,b,g]=bary(P);
      if (readout) readout.innerHTML = `&#945; = <b>${a.toFixed(2)}</b> &nbsp; &#946; = <b>${b.toFixed(2)}</b> &nbsp; &#947; = <b>${g.toFixed(2)}</b>`;
    }
    let drag=false;
    const clampIn = p => { let [a,b,g]=bary(p); if(a<0||b<0||g<0){return P;} return p; };
    canvas.addEventListener("pointerdown",e=>{drag=true;P=clampIn([e.offsetX,e.offsetY]);render();});
    canvas.addEventListener("pointermove",e=>{if(drag)P=clampIn([e.offsetX,e.offsetY]);if(drag)render();});
    canvas.addEventListener("pointerup",()=>drag=false);
    render();
    return {render};
  }

  /* ============================================================
     DEMO 4 — normal-matrix: wrong (MV) vs correct ((MV)^-T) under non-uniform scale
  ============================================================ */
  function createNormalMatrix(canvas, slider, valOut, modeRadios) {
    const W = canvas.width, H = canvas.height, ctx = canvas.getContext("2d");
    let sx = 2.4, useCorrect = false;
    const cx = W/2, cy = H*0.62, baseR = Math.min(W,H)*0.30;

    function render() {
      ctx.clearRect(0,0,W,H);
      ctx.fillStyle="#15151a"; ctx.fillRect(0,0,W,H);
      // outline of scaled ellipse surface
      ctx.beginPath(); ctx.ellipse(cx,cy,baseR*sx,baseR,0,Math.PI,2*Math.PI); ctx.strokeStyle="#7c5bff"; ctx.lineWidth=3; ctx.stroke();
      ctx.beginPath(); ctx.ellipse(cx,cy,baseR*sx,baseR,0,Math.PI,2*Math.PI); ctx.fillStyle="rgba(124,91,255,0.12)"; ctx.lineTo(cx,cy); ctx.fill();

      const N=14;
      for(let i=1;i<N;i++){
        const t=Math.PI + Math.PI*i/N;            // along top arc
        const px=cx+baseR*sx*Math.cos(t), py=cy+baseR*Math.sin(t);
        // unit-circle normal direction (geometry of original sphere)
        const ux=Math.cos(t), uy=Math.sin(t);
        let dx,dy;
        if(useCorrect){ dx=ux/sx; dy=uy; }       // (MV)^-T : divide x by sx
        else { dx=ux*sx; dy=uy; }                 // wrong: scale x by sx (uses MV)
        const l=Math.hypot(dx,dy)||1; dx/=l; dy/=l;
        const len=42;
        ctx.beginPath(); ctx.moveTo(px,py); ctx.lineTo(px+dx*len,py+dy*len);
        ctx.strokeStyle=useCorrect?"#39c4ac":"#ff5d73"; ctx.lineWidth=3; ctx.stroke();
        // arrowhead
        ctx.beginPath(); ctx.arc(px+dx*len,py+dy*len,3,0,7); ctx.fillStyle=ctx.strokeStyle; ctx.fill();
      }
      ctx.fillStyle="#cdd3df"; ctx.font="16px 'JetBrains Mono', monospace";
      ctx.fillText(useCorrect? "correct: N\u2032 = (MV)\u207b\u1d40 N" : "wrong: N\u2032 = MV \u00b7 N", 18, 30);
    }
    if(slider) slider.addEventListener("input",()=>{sx=+slider.value; if(valOut)valOut.textContent=sx.toFixed(1); render();});
    if(modeRadios) modeRadios.forEach(r=>r.addEventListener("change",()=>{useCorrect=(r.value==="correct"&&r.checked)|| (document.querySelector('input[name="nmmode"]:checked')||{}).value==="correct"; render();}));
    render();
    return {render};
  }

  window.Ch11 = { createShadingSphere, createBlinnPhong, createBarycentric, createNormalMatrix };
})();
