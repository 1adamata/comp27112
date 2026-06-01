COMP27112 — Chapter 11: Shading Transformations
Interactive Visual Notes
================================================

HOW TO OPEN
-----------
Open  index.html  in any modern browser (Chrome / Firefox / Safari / Edge).
Everything runs locally — no server or internet needed except the Google
Fonts link (the page still works offline, just with fallback fonts).

WHAT'S INSIDE
-------------
index.html              The notes page (12 sections + quiz + exam practice)
css/notes.css           Dark "graphics-studio" theme + all styling
js/sphere.js            Live software renderers:
                          • Flat / Gouraud / Phong sphere rasteriser
                          • analytic Blinn–Phong sphere (draggable light)
                          • barycentric interpolation playground
                          • normal-matrix (MV vs (MV)^-T) demo
js/notes.js             Scroll progress, reveal-on-scroll, interactive
                        pipeline, quiz scoring, demo wiring
assets/                 Vector recreations of the lecture slides:
                          reflection-model.svg   (slide 7  — N,L,V,H)
                          normal-edges.svg        (slide 13 — cross product)
                          normal-tangent.svg      (slides 67-69 — N ⟂ T)
                          spaces.svg              (slides 51-64 — M→W→V)
                          svd-cow.svg             (slides 85-87 — R1·S·R2)

INTERACTIVE BITS
----------------
• Hero: three live-shaded spheres (drag-friendly canvases).
• §02 Reflection model: drag the light over the sphere; sliders for
  kd, ks, shininess n, ambient; toggle diffuse/specular.
• §05 Gouraud: click the pipeline stages (auto-cycles too); drag the
  white dot in the barycentric triangle to read α, β, γ.
• §07 Side by side: switch Flat/Gouraud/Phong on ONE real mesh, drag to
  rotate, toggle wireframe.
• §09 Normal matrix: stretch sx and flip between MV (wrong) and (MV)^-T
  (correct) to watch the normals tilt / stay perpendicular.
• §11 Quiz: 7 clickable questions with instant feedback + running score.
• §12 Exam practice: 3 long-answer questions with reveal-on-click answers.

A NOTE ON SOURCES
-----------------
The original PDF, quizzes.docx and any past-paper files were not present
on disk in the session that built this — only the rendered slides were
available. So:
  • every diagram is a faithful VECTOR RECREATION of its slide (cleaner
    and theme-able than a screenshot), and all 3D is live-rendered;
  • the quiz and exam questions are written from the slide content and the
    usual COMP27112 long-answer style.
Provide the real quizzes.docx + past papers and the exact wording can be
dropped straight in.
