# COMP27112 — Visual Computing Study Lab 📐

A personal **visual textbook**: every week of the unit taught so you *understand* it,
then drilled so you can *answer* it. Warm-paper design, live interactive widgets,
memory hooks, and exam-framing built in.

Half Image Processing, half Computer Graphics — one growing site.

---

## 📁 What's in here

```
visual-textbook/
├── index.html                     ← the shelf (textbook home; lists every week)
├── assets/
│   └── house.css                  ← the shared "house kit": all colours, fonts,
│                                     and components (cards, hooks, exam-boxes,
│                                     drill cards, equations, pipelines…)
├── weeks/
│   └── comp27112-week1.html        ← Week 1 — "The Image, Decoded"
├── templates/
│   └── week-template.html          ← copy this to start a new week
└── README.md
```

**One design, many weeks.** Every page links the same `assets/house.css`, so the look
can never drift. Change a colour there and the whole textbook updates.

---

## 👀 View it locally

It's plain static HTML — **no build step, no install.**

- **Quickest:** double-click `index.html` (opens in your browser).
- **Nicer (recommended):** run a tiny local server so paths behave exactly like
  they will online:
  ```bash
  # Python (already on most machines)
  python3 -m http.server 8000
  # then open http://localhost:8000

  # …or with Node
  npx serve
  ```

---

## 🚀 Deploy to Vercel (share with coursemates)

1. Push this repo to GitHub.
2. On [vercel.com](https://vercel.com) → **Add New → Project → import the repo.**
3. Framework preset: **Other**. Build command: **none**. Output dir: **leave blank / `./`**.
4. Deploy. You get a public URL like `comp27112.vercel.app` to send to classmates.

(It's a static site, so Vercel serves the files as-is — nothing to configure.)

Prefer GitHub Pages? Settings → Pages → deploy from `main` / root. Same result.

---

## ➕ Add a new week

1. Copy the template:
   ```bash
   cp templates/week-template.html weeks/comp27112-week2.html
   ```
2. Fill in the content (the template shows every available component).
3. Add a card to `index.html` — duplicate the Week 1 `<a class="week-card">` block,
   bump the number, point `href` at your new file, and swap one of the
   `week-card empty` slots for it.

That's it. The shared `house.css` styles it automatically.

---

## 🤖 Updating with Claude Code

This repo is structured to be edited by [Claude Code](https://claude.com/claude-code)
without you opening files. Some prompts that work well:

- *"Add Week 2 of COMP27112 to this repo. Copy `templates/week-template.html` into
  `weeks/`, fill it from these notes \[paste/attach], match the style of
  `weeks/comp27112-week1.html`, and add a card to `index.html`."*
- *"In `assets/house.css`, nudge the paper background a touch warmer and bump base
  font size to 19px — keep everything else."*
- *"Build an interactive canvas for \[concept] in Week 2, in the same style as the
  point-processing playground in Week 1."*

Because design lives in `house.css` and each week is its own file, edits stay
isolated and easy to review as diffs.

---

## 🎨 The house kit, at a glance

Defined as CSS variables at the top of `assets/house.css`:

| Token | Meaning |
|---|---|
| `--paper` / `--paper-2` | warm background tones |
| `--ink` / `--ink-soft` | text |
| `--purple` | Manchester accent / Computer Graphics |
| `--amber` | Image Processing accent |
| `--teal` | secondary Computer Graphics accent |
| `--rose` | exam callouts |
| `--gold` | memory hooks |

Components available in every page: `.card`, `.hook`, `.exam-box`, `.flag`,
`.eq` (formula), `.drill` (flashcard), `.pipe` (pipeline), `.timeline` (SVG),
`.grid2` / `.grid3`, `.tag`, `.chip`, plus styled `<table>`, `<pre>` code, and
range-slider / button controls for interactive widgets.

---

*Built as a study tool. Clone it, study it, fork it, improve it.*
