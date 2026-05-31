# Displays & Images — Interactive Visual Notes (COMP27112, Chapter 2)

Open **`index.html`** in any modern browser (double-click it). No server or internet
required for the content — fonts load from Google Fonts if you're online, otherwise a
clean system fallback is used.

## What's inside
- `index.html` — the full interactive notes (HTML + CSS + JavaScript, single file)
- `assets/` — 41 images rendered directly from the *Displays and Images* lecture deck

## The notes cover
1. **Vision** — light, the eye, refraction, retina, rods vs cones (RGB/SML),
   species & the mantis shrimp, eye sensitivity (green), colour blindness &
   the opponent-process puzzle, fovea / eccentricity / peripheral vision.
2. **Capture** — camera sensor, Bayer filter (2× green), prism dispersion,
   RGB additive colour, the RGB cube, black = (0,0,0).
3. **Pixels** — rasterisation, pixel = picture element, RGB in [0,1], 8 bits / 256
   levels, point samples vs the box filter, resolution = h×w, PPI.
4. **Memory** — scanline order (CRT origin), interleaved vs planar, swizzling /
   Z-order curves, spatial coherency.
5. **Dynamic range** — brightening, clipping, LDR vs HDR, bits per channel.
6. **Formats** — PPM, PNG (lossless, palettes, HDR 2025), JPEG (lossy, edges,
   quality), GIF, HDR10 / OpenEXR, SVG (vector vs raster).
7. **Gamma** — non-linear perception, γ = 2.2, Vout = A·Vin^γ, gamma correction,
   and why HDR still needs perceptual quantisation.

## Interactive bits (try them)
- Toggleable **additive RGB lights** (red+green = yellow, etc.)
- **Pixel colour mixer** — R/G/B sliders → hex + normalised [0,1] values
- **Rasterise the teapot** — a resolution/PPI slider that pixelates a real render
- **Raw image memory calculator** — megapixels × bits × channels (the 12 MP = 36 MB case)
- **Scanline vs Z-order** read-order animation
- **Brightness & clipping** slider showing LDR values pinned to white
- **Gamma transfer-curve** explorer with live ramp re-mapping
- A **scored quiz** (chapter-relevant questions from the module quiz banks)
- **Past-paper questions** (2016–2023) with expandable study pointers

Built for revision. Slide imagery is from the module's *Displays and Images* deck.
