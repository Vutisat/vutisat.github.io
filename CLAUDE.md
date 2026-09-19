# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## The most important rule: every page is its own world

**This site is an anthology, not a design system.** Each page has a completely separate,
self-contained theme — its own palette, typography, layout language, motion and metaphor.
They share only a domain and the fact that they link back to `index.html`.

That is deliberate and it is the point of the site. When you work on one page:

- **Do not** "harmonize", unify, or propagate tokens, fonts, spacing scales, or components
  between pages. The homepage's cobalt is not the library's amber. The NYC guide's subway
  colors are not a global palette.
- **Do not** treat a difference between two pages as an inconsistency to fix. It is intent.
- **Do not** refactor per-page CSS into a shared stylesheet, or extract "common" components.
- **Do not** read another page's CSS for "the project's design language." There isn't one.
- Work **only** inside the page you were asked about, and judge it against *its own* world.

If you genuinely think a cross-page change is warranted, ask first — never do it as cleanup.

The one intentional exception: `main.css` / `main.js` are a shared world **on purpose**, and
are shared by exactly four pages (see the map below). Nothing else is shared.

## Page → theme map

| Page | CSS | JS | Its world |
|---|---|---|---|
| `index.html` | `assets/css/home.css` | `assets/js/home.js`, `lab/magnetic-grid.js` | Bright editorial. Gallery off-white `#FAFAF7`, one locked cobalt `#2136E0`, huge display type. Hanken Grotesk + Spline Sans Mono + EB Garamond italic for emphasis. |
| `nyc.html` | `assets/css/nyc.css` | `assets/js/nyc.js` | Mapped like the MTA subway: every category is a colored "line", every place a "stop". Light `#FBFAF6` **and** a dark mode. Hanken + JetBrains Mono. |
| `library.html` | `assets/css/library.css` | `assets/js/library-data.js`, `assets/js/library.js` | A home library rendered as physical matter — wood shelves, book cloth, warm paper `#F6EFE2`. **Night by default** with a reading-lamp toggle (`data-theme="night"｜"day"`, stamped on `<html>` pre-paint, persisted in `localStorage` key `lib-lamp`). EB Garamond. |
| `worldtour.html` | inline `<style>` (fully self-contained) | inline | Deep-space planetarium atlas. `#0A0E1C`, neon glow, per-continent accents, lat/long graticule. Marcellus + EB Garamond. Flags load dynamically from `assets/flags/<iso>.svg`. |
| `thailand.html`, `life.html`, `resume.html` | `assets/css/main.css` | `assets/js/main.js` | "The Reference" — a career as a technical document. Warm bone `#F4F1EA`, cobalt `#2540D6`, vermilion reserved for live/active marks only, Spectral serif. |
| `korea.html`, `singapore.html` | inline `<style>` | inline | Plain, unstyled-by-comparison itinerary documents. Liberation Sans. Not part of any design effort — leave them alone unless asked. |

**`DESIGN.md` is the per-world design record** — it documents Bright Editorial (the homepage) and
The Reference (the three `main.css` sub-pages) in full, and points at the CSS header comments that
document NYC, the library, and worldtour. Read the section for the page you're on, and only that
section. The homepage's cobalt `#2136E0` and The Reference's cobalt `#2540D6` are *different
colors in different worlds*, not drift to reconcile.

## Commands

There is no build step, no bundler, no package manager, and no tests. Files are edited by hand
and deploy as-is to GitHub Pages.

```bash
# Preview locally (needed — fonts and some fetches don't work over file://)
python3 -m http.server 8000     # then open http://localhost:8000/

# Verify nothing 404s after moving or renaming assets
curl -s -o /dev/null -w '%{http_code}' http://localhost:8000/index.html
```

When testing CSS/JS changes, **hard-refresh** — browsers aggressively cache these assets and a
stale file will look like a broken change.

## Layout

```
*.html            every public page, at the repo root — these are the live URLs
assets/css/       one stylesheet per world
assets/js/        page scripts (library-data.js is the book dataset, ~340 books)
assets/fonts/     self-hosted woff2, no CDN
assets/icons/     favicon / touch-icon set
assets/flags/     country SVGs, used only by worldtour.html
assets/img/       photos and portraits
lab/              standalone Canvas 2D components (see lab/README.md)
docs/             long-form notes and raw source content
archive/          not live: dead legacy files, plus retired pages and design previews
```

`archive/` holds `Technical Knowledge.html` (an old page, unlinked and already broken before it
was retired — it references a `js/bootstrap.min.js` that has never existed in this repo) and the
`preview-*.html` design fixtures. Their relative paths were rewritten for the deeper directory, so
they still open correctly. Nothing links to them; don't wire them back in without being asked.

**Keep every public page at the repo root.** Paths like `/nyc.html` and `/resume.pdf` are live
URLs people have linked to; moving a page into a subfolder silently breaks them.

CSS reaches fonts via `../fonts/` — this resolves correctly only because stylesheets live in
`assets/css/` and fonts in `assets/fonts/`. Keep that pairing if you move either.

## Conventions that hold across the site

These are structural, not stylistic — they apply everywhere without making the pages look alike.

- **Vanilla only.** No framework, no jQuery, no CDN dependencies, no build tooling. Fonts are
  self-hosted. Keep it hand-editable.
- **Every feature guards its own elements.** `main.js` is shared by four pages with different
  markup, so each behavior checks its element exists and no-ops otherwise. Preserve that.
- **`prefers-reduced-motion` is honored** by every animation, including the Canvas components.
- Metrics and career facts in the copy are **real and verified**. Never invent, round, or
  embellish a number, employer, or date. See `PRODUCT.md`.

## Component lab (`lab/`)

Self-contained Canvas 2D effects, each exposing a global `Lab.<name>(canvasEl, opts)` and
returning `{ resize, destroy, ... }`. DPR-aware, auto-pause offscreen, reduced-motion safe.
**Check `lab/README.md` before building any new canvas effect** — one may already exist.

`magnetic-grid.js` is the only one in production: it draws the faint dot mesh behind the
homepage hero, as a `pointer-events:none` background canvas driven by the whole `.hero` via
the `eventTarget` option. Tuning lives at the bottom of `index.html`; the module stays generic.

## `.impeccable/config.json`

Records per-file design-intent exemptions for the Impeccable design detector — e.g. the
library's wood-grain gradient and cream ground, NYC's subway-line edge accents, worldtour's
graticule and glow. These are **deliberate design decisions already argued for**, not
oversights. Read the `reason` field before "fixing" anything it covers, and update the `files`
paths if you move a stylesheet.
