# Week 2 — drop-in changes

Two files change. Everything else in your repo stays exactly as-is.

```
visual-textbook/
├─ index.html                    ← REPLACE (Week 2 "coming soon" slot → real card)
└─ weeks/
   └─ comp27112-week2.html        ← NEW
```

## Do NOT touch these — yours are already correct
`assets/house.css`, `assets/widget.js`, `templates/week-template.html`,
`widgets/*`. The new page links your real `../assets/house.css` and loads your
real `../assets/widget.js` (VTK kit), and the embedded OpenCV lab reuses the
same loader pattern as your `widgets/opencv-lab.html` (OpenCV 4.10.0, the
`onOpenCvReady` boot, `.delete()` discipline). Nothing is forked or restyled —
the only week-local `<style>` block adds *new* classes for the transform
matrices (which house.css doesn't define), exactly like the convolution widget
adds its own local styles.

## index.html
I only swapped the first `.week-card empty` ("Week 2 — coming soon") for a real
`.week-card` matching your Week 1 card. If your live index has drifted since,
just copy the `<!-- WEEK 2 (live) -->` block out of this file and paste it after
your Week 1 card instead of replacing the whole file.

## Serve it (the OpenCV lab needs a server)
```
python3 -m http.server 8000
# open http://localhost:8000/  (or the Week 2 page directly)
```
WebAssembly won't load via file://. On Vercel / GitHub Pages it just works.

## Images (RULE 2)
No slide photos or Obsidian `Pasted image …png` files were uploaded, so per the
project rules they don't exist to me — I did not fabricate stand-ins. Every
diagram is redrawn as inline SVG/canvas, and the OpenCV lab runs on an image you
upload. Where a specific slide photo belongs, the page shows an "IMAGE NEEDED"
flag naming what to drop into `assets/img/`. Send me those PNGs and I'll wire
them in.

## Git
Prepared on branch `add-week2`:
```
git checkout -b add-week2
git add index.html weeks/comp27112-week2.html
git commit -m "Add Week 2: sampling, histograms, thresholding, geometry + OpenCV.js lab"
git push -u origin add-week2   # then open the PR
```
