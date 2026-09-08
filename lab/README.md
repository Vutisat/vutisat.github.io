# Component Lab

Interactive Canvas 2D showpieces for pobv.dev. Vanilla JS, no libraries, no build step.
Open `lab/showpieces.html` to see all of them live.

Each component is one self-contained file exposing a global `Lab.<name>(canvasEl, opts)`.
Copy a single file into a project and it works standalone. All of them:
- are DPR-aware and handle resize,
- auto-pause when scrolled off-screen (IntersectionObserver, defaults to visible),
- honor `prefers-reduced-motion` (degrade to a static frame),
- return a handle with `{ resize, destroy, ... }`.

| File | Global | Effect | Key opts |
|------|--------|--------|----------|
| `fluid-ink.js` | `Lab.fluidInk` | Real fluid sim (Stam stable-fluids); drag to swirl blue ink | `n, dt, fade, force, ink` + `.splash()` |
| `flow-field.js` | `Lab.flowField` | Value-noise flow field, silk-like trails; cursor parts the stream | `count, scale, speed, color` |
| `magnetic-grid.js` | `Lab.magneticGrid` | Dot mesh warps toward the cursor (gravity well) | `gap, range, pull, restColor, lineColor, lines, glow, restSize, hotSize, eventTarget` |
| `physics-type.js` | `Lab.physicsType` | Letters are rigid bodies with gravity; grab and fling | `text, size, color, accent` + `.reset()` |

## In production

`magnetic-grid.js` is used on the homepage hero (`index.html`). It runs as a
`pointer-events:none` background canvas (`.hero__mesh`), tuned faint, and is driven
by pointer movement over the whole `.hero` via `eventTarget` so it reacts under the
text. Init is at the bottom of `index.html`. Tuning lives there; the module is generic.

Notes:
- `eventTarget` lets the canvas be a background layer while a container captures the pointer.
- When changing `home.css`/`home.js` that the HTML structurally depends on, remember
  browsers may cache the old asset (hard-refresh when testing).
