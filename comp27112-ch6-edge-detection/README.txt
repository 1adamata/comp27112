COMP27112 — Lecture 6: Edge Detection
Interactive Visual Notes
======================================

HOW TO OPEN
-----------
Unzip, then open  index.html  in any modern browser
(Chrome, Firefox, Edge, Safari). No server needed — just double-click.
An internet connection lets the Google Fonts load; offline it falls
back to clean system fonts. Everything else (diagrams, demos, quiz)
works fully offline.

WHAT'S INSIDE
-------------
index.html                  the whole site (one page, scrollable)
assets/css/style.css        styling (darkroom / image-processing-lab theme)
assets/js/app.js            all interactivity (no libraries, vanilla JS)
assets/diagrams/*.svg       every conceptual diagram, recreated as SVG
gen_diagrams.py             the script that generated the SVG diagrams

INTERACTIVE PARTS
-----------------
- Live gradient calculator (δx, δy, magnitude, direction)
- Convolution playground: step / play a 3×3 kernel across an image
- Edge-Detector LAB: real Roberts / Prewitt / Sobel / Laplacian /
  LoG / DoG / Canny convolutions running on a synthetic scene,
  with adjustable noise, pre-blur and threshold
- Canny pipeline stepper (6 stages, live preview)
- Direction-quantisation dial (drag to see the 4 edge categories)
- Template-matching scanner (normalised cross-correlation)
- 20-question scored quiz (the edge-detection / convolution / smoothing /
  template-matching set taken straight from the course quiz bank,
  Visual_quizes.docx) with explanations
- Expandable exam-style questions with model answers
- Scroll-reveal animations, progress bar, sticky section nav

NOTES ON SOURCE MATERIAL
------------------------
This was built from the Lecture 6 slide PDF and the three lecture
transcripts.

One thing you mentioned was NOT attached to the request:
  * past-paper questions — so the "Exam practice" section is written
    in the style typically asked on this material, not from a real paper.
    If you upload a past paper, it can be folded in directly.

The quiz questions ARE the real ones: they were taken from your course
quiz bank (Visual_quizes.docx), using the 20 questions in it that cover
this lecture (convolution, noise/smoothing, separability, edges, Sobel,
Canny, template matching and cross-correlation).

Also, the original slide PHOTOGRAPHS (the house, retina, Jackie Chan,
family photo) were only present as rendered pages in the PDF, not as
extractable image files, and some are copyrighted. So instead of
copying them, the site recreates every *diagram* faithfully as SVG and
replaces the photographic results with a live edge-detection demo that
runs the real algorithms on a synthetic scene — which is more useful
for revision anyway. If you have the original PNGs, drop them into
assets/diagrams/ and swap the relevant <img>/<canvas> tags.
