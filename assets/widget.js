/* ============================================================
   VTK — Visual Textbook Kit
   Tiny vanilla helpers so a new interactive widget is ~15 lines,
   not ~200. No dependencies. Emits DOM that house.css already styles.

   Load with:  <script src="../assets/widget.js"></script>
   Then use:   VTK.slider(...), VTK.synthImage(...), etc.
   ============================================================ */
window.VTK = (function () {

  const clamp = (v, lo, hi) => (v < lo ? lo : v > hi ? hi : v);

  /* ---- synthetic greyscale test images -> Float32Array (len W*H, 0..255) ---- */
  function synthImage(kind, W, H) {
    const c = document.createElement('canvas'); c.width = W; c.height = H;
    const t = c.getContext('2d');
    t.fillStyle = '#404040'; t.fillRect(0, 0, W, H);

    if (kind === 'shapes') {
      t.fillStyle = '#e8e8e8'; t.beginPath(); t.arc(52, 58, 30, 0, 7); t.fill();
      t.fillStyle = '#101010'; t.fillRect(86, 30, 46, 46);
      t.strokeStyle = '#d0d0d0'; t.lineWidth = 7; t.beginPath(); t.moveTo(20, 140); t.lineTo(140, 96); t.stroke();
      t.fillStyle = '#b0b0b0'; t.beginPath(); t.arc(118, 124, 18, 0, 7); t.fill();

    } else if (kind === 'edges') {
      for (let i = 0; i < W; i += 16) { t.fillStyle = (i / 16) % 2 ? '#dcdcdc' : '#2a2a2a'; t.fillRect(i, 0, 8, H); }
      t.fillStyle = '#808080'; t.fillRect(40, 40, 80, 80);
      t.fillStyle = '#f0f0f0'; t.fillRect(60, 60, 40, 40);

    } else if (kind === 'gradient') {
      for (let x = 0; x < W; x++) { const v = Math.round(x / (W - 1) * 255); t.fillStyle = `rgb(${v},${v},${v})`; t.fillRect(x, 0, 1, H); }
      t.fillStyle = '#000'; t.beginPath(); t.arc(80, 80, 26, 0, 7); t.fill();

    } else if (kind === 'cells') {
      // bimodal: light background + dark blobs -> clean two-hump histogram
      t.fillStyle = '#cccccc'; t.fillRect(0, 0, W, H);
      t.fillStyle = '#2b2b2b';
      [[50, 55, 26], [108, 58, 20], [78, 116, 30], [128, 122, 15], [38, 122, 14]]
        .forEach(([x, y, r]) => { t.beginPath(); t.arc(x, y, r, 0, 7); t.fill(); });

    } else if (kind === 'lowcontrast') {
      // shapes but squished into a narrow mid band -> motivates contrast stretch
      t.fillStyle = '#8c8c8c'; t.fillRect(0, 0, W, H);
      t.fillStyle = '#a4a4a4'; t.beginPath(); t.arc(60, 64, 34, 0, 7); t.fill();
      t.fillStyle = '#777777'; t.fillRect(86, 80, 52, 52);
      t.fillStyle = '#969696'; t.beginPath(); t.arc(116, 56, 18, 0, 7); t.fill();
    }

    const d = t.getImageData(0, 0, W, H).data;
    const g = new Float32Array(W * H);
    for (let i = 0; i < W * H; i++) g[i] = 0.299 * d[i * 4] + 0.587 * d[i * 4 + 1] + 0.114 * d[i * 4 + 2];
    return g;
  }

  /* ---- paint a greyscale array to a canvas ---- */
  function paintGray(canvas, gray) {
    const W = canvas.width, H = canvas.height, ctx = canvas.getContext('2d');
    const im = ctx.createImageData(W, H);
    for (let i = 0; i < W * H; i++) { const v = clamp(gray[i], 0, 255) | 0; im.data[i*4]=im.data[i*4+1]=im.data[i*4+2]=v; im.data[i*4+3]=255; }
    ctx.putImageData(im, 0, 0);
  }

  /* ---- paint a binary (thresholded) version ---- */
  function paintBinary(canvas, gray, T, invert) {
    const W = canvas.width, H = canvas.height, ctx = canvas.getContext('2d');
    const im = ctx.createImageData(W, H);
    for (let i = 0; i < W * H; i++) {
      let on = gray[i] >= T; if (invert) on = !on;
      const v = on ? 255 : 0;
      im.data[i*4]=im.data[i*4+1]=im.data[i*4+2]=v; im.data[i*4+3]=255;
    }
    ctx.putImageData(im, 0, 0);
  }

  /* ---- 256-bin histogram ---- */
  function histogram(gray) {
    const h = new Uint32Array(256);
    for (let i = 0; i < gray.length; i++) h[clamp(Math.round(gray[i]), 0, 255)]++;
    return h;
  }

  /* ---- iterative ("isodata") threshold: T = (meanLow + meanHigh) / 2 ----
     This is exactly the Week-1 equation θ = (μ_L + μ_H)/2, iterated. ---- */
  function isodataThreshold(hist) {
    let T = 127;
    for (let iter = 0; iter < 60; iter++) {
      let sL = 0, nL = 0, sH = 0, nH = 0;
      for (let i = 0; i < 256; i++) {
        if (i < T) { sL += i * hist[i]; nL += hist[i]; }
        else       { sH += i * hist[i]; nH += hist[i]; }
      }
      const muL = nL ? sL / nL : 0, muH = nH ? sH / nH : 0;
      const nT = Math.round((muL + muH) / 2);
      if (nT === T) break;
      T = nT;
    }
    return T;
  }

  /* ---- control factories (return DOM nodes house.css already styles) ---- */
  function slider({ label, min, max, value, step = 1, fmt = (v) => v, onInput }) {
    const wrap = document.createElement('div'); wrap.className = 'control';
    const lab = document.createElement('label'); lab.textContent = label;
    const out = document.createElement('span'); out.className = 'readout';
    const inp = document.createElement('input'); inp.type = 'range';
    inp.min = min; inp.max = max; inp.value = value; inp.step = step;
    out.textContent = fmt(+value);
    inp.addEventListener('input', () => { out.textContent = fmt(+inp.value); onInput && onInput(+inp.value); });
    wrap.append(lab, out, inp);
    return {
      wrap, input: inp,
      get value() { return +inp.value; },
      set value(v) { inp.value = v; out.textContent = fmt(+v); }
    };
  }

  function toggleRow({ label, options, active, onChange }) {
    const wrap = document.createElement('div'); wrap.className = 'control';
    if (label) { const l = document.createElement('label'); l.textContent = label; l.style.minWidth = '120px'; wrap.appendChild(l); }
    const btns = {};
    options.forEach(o => {
      const b = document.createElement('button');
      b.className = 'toggle' + (o.id === active ? ' on' : ''); b.textContent = o.label;
      b.onclick = () => { setActive(o.id); onChange && onChange(o.id); };
      wrap.appendChild(b); btns[o.id] = b;
    });
    function setActive(id) { Object.keys(btns).forEach(k => btns[k].classList.toggle('on', k === id)); }
    return { wrap, setActive };
  }

  /* ---- map a mouse event on a canvas to its internal pixel coords ---- */
  function canvasXY(canvas, e) {
    const r = canvas.getBoundingClientRect();
    return {
      x: Math.floor((e.clientX - r.left) * (canvas.width / r.width)),
      y: Math.floor((e.clientY - r.top) * (canvas.height / r.height))
    };
  }

  return { clamp, synthImage, paintGray, paintBinary, histogram, isodataThreshold, slider, toggleRow, canvasXY };
})();
