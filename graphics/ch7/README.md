# Chapter 7 — Triangles on the GPU & Blending
### COMP27112 · Introduction to Visual Computing — interactive visual notes

Open **`index.html`** in any modern browser (double-click it). No internet needed for the
content — only the web fonts load from Google Fonts (it still works fine offline, just with
fallback fonts).

## What's inside
- **Full chapter walkthrough** built from the lecture presentation + transcript:
  pipeline recap → rasterisation → Bresenham → sweep-line → barycentric coordinates →
  interpolation/varyings → alpha blending/compositing → additive & subtractive modes →
  the Z-buffer cliff-hanger.
- **All key slide images** from the presentation, embedded where they fit (`assets/img/`).
- **6 hand-built interactive widgets** (pure canvas, no libraries):
  - Bresenham line stepper (drag endpoints, step/auto-run)
  - Sweep-line scanline filler (drag / auto-sweep)
  - Barycentric explorer (drag point p, see α/β/γ + inside-outside test + rasterise mode)
  - Colour interpolation sampler
  - Alpha compositing — semi-transparent cow on grass with an opacity slider
  - Additive vs subtractive channel demo (watch channels clamp/saturate)
- **Quiz** — 8 questions drawn from the course Computer-Graphics question bank, scored.
- **Past-paper questions** (2017–2019, Section B) relevant to this chapter, each with a
  model answer you can reveal.

## Files
```
index.html          the whole site (HTML + CSS + JS in one file)
assets/img/*.jpg     curated slide images from the presentation
README.md            this file
```

Slide imagery is from the course presentation *"Triangles on the GPU & Blending"* by David Petrescu.
Compiled for self-study.
