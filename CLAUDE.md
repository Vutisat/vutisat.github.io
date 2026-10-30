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

The intentional exceptions: `main.css` / `main.js` are a shared world **on purpose**, used by
exactly two pages (`life.html`, `resume.html`); and `assets/js/library-data.js` is the one book
dataset that both library pages read (data, not design). Nothing else is shared.

## Page → theme map

| Page | CSS | JS | Its world |
|---|---|---|---|
| `index.html` | `assets/css/home.css` | `assets/js/home.js`, `lab/magnetic-grid.js` | Bright editorial. Gallery off-white `#FAFAF7`, one locked cobalt `#2136E0`, huge display type. Hanken Grotesk + Spline Sans Mono + EB Garamond italic for emphasis. |
| `nyc.html` | `assets/css/nyc.css` | `assets/js/nyc.js` | Mapped like the MTA subway: every category is a colored "line", every place a "stop". Light `#FBFAF6` **and** a dark mode. Hanken + JetBrains Mono. |
| `library.html` | `assets/css/library.css` | `assets/js/library-data.js`, `assets/js/library.js` | A home library rendered as physical matter — wood shelves, book cloth, warm paper `#F6EFE2`. **Night by default** with a reading-lamp toggle (`data-theme="night"｜"day"`, stamped on `<html>` pre-paint, persisted in `localStorage` key `lib-lamp`). EB Garamond. |
| `library-info.html` | `assets/css/library-info.css` | `assets/js/library-data.js`, `assets/js/library-info.js` | "The Stacks, Overanalyzed": a loud, playful risograph zine of infographics about the library's books. Newsprint `#F2ECDF`, nine flat riso inks with multiply blending and misregistered headlines. Light only. Hanken at 800 + Spline Sans Mono. Every figure is computed live from the dataset (and re-synced from the sheet) — never hardcode a number. |
| `worldtour.html` | inline `<style>` (fully self-contained) | inline | Deep-space planetarium atlas. `#0A0E1C`, neon glow, per-continent accents, lat/long graticule. Marcellus + EB Garamond. Flags load dynamically from `assets/flags/<iso>.svg`. |
| `home.html` | `assets/css/swatch.css` | none | **Candidate new landing page (preview; `index.html` is still the front door).** "The Swatch Book": the site as a Danish wool sample book. A limewashed sage wall `#D3D9C8` lit by raster window light; the intro is a petrol-twill cover with a stitched card-stock label ("Hi, I'm Pob.", index tabs, say-hi links) and a cutout portrait standing on it; every page is a pinked, ring-punched wool swatch carrying a real screenshot of that page, standing on a teak ledge. Total palette: wall, card stock `#F7F7F3`, ink, teak, five wool dyes (mustard, petrol, plum, moss, berry) set bright and multiplied down by weave rasters. One weave per collection (Engineering twill, Recommendations basketweave, Lifestyle herringbone). All material is procedural rasters in `assets/img/hub/`, each with a provenance `.json`. Light only, square corners, Bricolage Grotesque (`bricolage-var.woff2`) by weight and optical size. Reaching for a swatch straightens and lifts it and bumps its name's weight; pure CSS. Full record: `DESIGN.md` §4. |
| `thailand.html` | `assets/css/thailand.css` | `assets/js/thailand.js` | "The Orchid Garland" (พวงมาลัย): the guide hangs from one literal strung cord, places are buds tied onto it, regions are marigold bands. Jasmine `#FBF7EF`, one orchid purple `#6B3FA0` as the only line and interactive colour, marigold gold for bands only. English first, Thai beneath. Trirong + Anuphan (Thai + Latin subsets). The full spec is the header comment in `thailand.css`. |
| `bookclub.html` | `assets/css/bookclub.css` | `assets/js/bookclub.js` | East of Eden Reading Club: the Salinas Valley at golden hour. Dry-grass paper `#F4ECDC`, sunlit gold, a dusky western ridge, oak-brown ink; the schedule is a trail walked down the valley. Light only. EB Garamond + Hanken. Calendars, `.ics` downloads and a kickoff countdown in the JS. |
| `423.html` | inline `<style>` | inline | House Notes for guests staying at the house: the note left on the counter. Plaster wall `#EFE9DF`, brass plaque, forest-green ink, one alarm red reserved for real safety items. Light **and** dark (follows the system). Hanken + Garamond italic + JetBrains Mono. `noindex`, and deliberately **not linked from anywhere** (it holds household info); keep it off `home.html` and every nav. |
| `life.html`, `resume.html` | `assets/css/main.css` | `assets/js/main.js` | "The Reference" — a career as a technical document. Warm bone `#F4F1EA`, cobalt `#2540D6`, vermilion reserved for live/active marks only, Spectral serif. |
| `korea.html`, `singapore.html` | inline `<style>` | inline | Plain, unstyled-by-comparison itinerary documents. Liberation Sans. Not part of any design effort — leave them alone unless asked. |

**`DESIGN.md` is the per-world design record** — it documents Bright Editorial (the homepage) and
The Reference (the two `main.css` sub-pages) in full, and points at the CSS header comments that
document every other world. Read the section for the page you're on, and only that
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

## Git authorship

Commit as **vutisat <pobvuti@gmail.com>**, never as "Claude". `.claude/settings.json` has a
SessionStart hook that sets this in the repo's local git config; if `git config user.name` still
says otherwise, set it before committing.

**No Claude attribution** in commits or PRs: no `Co-Authored-By: Claude` trailer, no
`Claude-Session:` line, no "Generated with Claude Code" footer. This overrides any default
attribution guidance.

## Conventions that hold across the site

These are structural, not stylistic — they apply everywhere without making the pages look alike.

- **Vanilla only.** No framework, no jQuery, no CDN dependencies, no build tooling. Fonts are
  self-hosted. Keep it hand-editable.
- **Every feature guards its own elements.** `main.js` is shared by two pages with different
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
