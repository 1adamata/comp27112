# Chapter 10 — Lights & Shading · Interactive Visual Notes
COMP27112 · Introduction to Visual Computing

## How to use
Open **index.html** in any modern web browser (Chrome, Firefox, Safari, Edge).
Everything runs locally — no internet needed except for the web fonts and the
MathJax equation renderer (which load from a CDN; the page still works offline,
equations just appear as plain text).

Keep the `assets/` folder next to `index.html`.

## What's inside
A scroll-driven single page covering the whole chapter, in the order the
lecture builds it:

1. The problem — why an unshaded teapot looks flat
2. How surfaces reflect light — diffuse, specular, mirrors, imperfect specular
3. Ambient light & the flat-teapot trap   ·INTERACTIVE
4. Lambert's cosine law (derivation)       ·INTERACTIVE (drag the light, tilt the surface)
5. The diffuse term (colour × N·L)
6. The specular term & shininess exponent  ·INTERACTIVE (drag the viewer, slide n)
7. Finding the reflection vector R          ·INTERACTIVE (drag L, watch the projection)
8. The Phong light model
9. Blinn–Phong & the halfway vector         ·INTERACTIVE (Phong vs Blinn at grazing angles)
10. Ambient + multiple lights — the complete equation
11. Light types, distance attenuation & where this leads
12. Test yourself — 6 quiz questions + 5 past-paper questions with answer pointers

## Interactions
- **Drag** inside the lab canvases to move the light or the viewer.
- **Sliders** control surface tilt, shininess (n), and light angle.
- **Toggle** between Phong and Blinn–Phong to see the grazing-angle fix.
- **Click** a quiz answer to check it and reveal the explanation.
- **Expand** the past-paper questions (▸) for model-answer pointers.
- Side dots navigate between sections; the top bar tracks scroll progress.

## Sources
- Figures: extracted from the course lecture slides (COMP27112_Shading).
- Narrative: the Lights & Shading lecture transcript.
- Quiz items: the course quiz bank.
- Exam prompts: COMP27112 past papers, 2016–2025.

assets/  — 33 figures from the lecture slides (JPEG).
