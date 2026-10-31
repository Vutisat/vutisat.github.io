# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## The most important rule: every page is its own world

**This site is an anthology, not a design system.** Each page has a completely separate,
self-contained theme — its own palette, typography, layout language, motion and metaphor.
They share only a domain and the fact that they link back to the hub, `home.html`
(the hub's own Career swatch leads to `index.html`).

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
| `home.html` | `assets/css/swatch.css` | `assets/js/swatch.js` (rounded seams, motion) | **Candidate new landing page (preview; `index.html` is still the front door).** "The Swatch Book": the site as a Danish wool sample book on a limewashed sage wall lit by window light. The intro is a plush, rounded periwinkle twill cover (`--cover` in `swatch.css`; alternatives in `docs/home-cover-colours.md`) hung from the ceiling on two lengths of yarn, with a stitched card-stock label ("Hi, I'm Pob." and index tabs) and the cutout portrait; every page is a wool swatch with a satin-embroidered mark (icon) over its name (Thailand: name only), a card-stock `.tag` on hover, standing on a birch log (procedural rasters `birch.webp` + `birch-end-l.webp` / `birch-end-r.webp`: mottled off-white bark with fine grey-brown lenticels, the odd dark band, peel and lichen, sawn square at both ends whose bark fades into the run, so one log fits any length; each collection starts the run at its own `--bx` offset so no two logs match; no decorations), one log per collection (Connect: pegged with wooden clothespins to a three-ply rope with a turned wooden peg at each end of every row; the cover hangs from the same rope, each cord finished with a cream thread whipping and a wooden bead; rope/bead/peg are procedural rasters `rope-v`, `rope-h`, `cord-bead`, `cord-peg`), one weave per collection; most swatches are woven with a pattern under the weave (`--pattern`, data-URI SVGs in `swatch.css`): Career cobalt dot grid, Résumé chalk pinstripe, Projects red tartan, New York taxi yellow + checker band and Statue of Liberty, Thailand the flag, Recipes green gingham, World Tour a night-sky atlas, Backpack (uses.html) trail-map contours, Stacks riso patchwork, Book Club golden hour, Concerts a spotlit stage, Library a cocoa cloth-bound hardcover with gilt tooling; a last "Connect" ledge holds smaller square swatches, one per social link (email, LinkedIn, GitHub, Instagram ×2, Facebook, TikTok, Letterboxd, Goodreads, Steam, Chess.com), in centred rows (6, 4 or 3 a row), each row on its own rope each showing the platform's logo embroidered in satin floss (CSS masks over the floss raster; marks in `assets/img/hub/logos/`, Simple Icons CC0), no ring hole and no text (screen readers get hidden labels; sighted visitors get an instant card-stock `.tag` label above the tile on hover/focus, links open in a new tab); the two Instagrams are told apart by a tiny felt patch sewn on the mark's corner, a heart (personal) and a plane (travel); felt clouds drift in the sky; the page ends in a woolly meadow of felt flowers and felt grass. It's alive: the cover swings gently on its yarn, swatches drop onto their logs, flowers all spring up together when you reach the bottom, then sway, and the window light follows the visitor's time of day (all still under reduced motion). All material is procedural rasters in `assets/img/hub/` tinted by multiply, each with a provenance `.json`. Light only, Bricolage Grotesque. Rejected (don't revive): screenshots/spec tags on swatches, teak ledges, brass rails/rings, knitting needles, yarn loops/punched holes, a tapering branch (every shelf read as a cone pointing right), and identical props (acorns) on every log, rendered or downloaded plants, a fully rounded "Woolly World" restyle. Full record: `DESIGN.md` §4. |
| `thailand.html` | `assets/css/thailand.css` | `assets/js/thailand.js` | "The Orchid Garland" (พวงมาลัย): the guide hangs from one literal strung cord, places are buds tied onto it, regions are marigold bands. Jasmine `#FBF7EF`, one orchid purple `#6B3FA0` as the only line and interactive colour, marigold gold for bands only. English first, Thai beneath. Trirong + Anuphan (Thai + Latin subsets). The full spec is the header comment in `thailand.css`. |
| `bookclub.html` | `assets/css/bookclub.css` | `assets/js/bookclub.js` | East of Eden Reading Club: the Salinas Valley at golden hour. Dry-grass paper `#F4ECDC`, sunlit gold, a dusky western ridge, oak-brown ink; the schedule is a trail walked down the valley. Light only. EB Garamond + Hanken. Calendars, `.ics` downloads and a kickoff countdown in the JS. |
| `423.html` | inline `<style>` | inline | House Notes for guests staying at the house: the note left on the counter. Plaster wall `#EFE9DF`, brass plaque, forest-green ink, one alarm red reserved for real safety items. Light **and** dark (follows the system). Hanken + Garamond italic + JetBrains Mono. `noindex`, and deliberately **not linked from anywhere** (it holds household info); keep it off `home.html` and every nav. |
| `projects.html` | `assets/css/projects.css` | `assets/js/projects.js` | "Selected Work": the category-standard case-study portfolio **on purpose** (the user chose it over themed worlds), at Apple-product-page craft: sticky translucent local nav, huge Geist headlines, one project per screen with media leading, big tabular metrics, one blue #0066CC. Each band is its own environment: white hero under a drifting blue-teal glow (gradient on "did some good."), Sub Sea Sonics as a deep-ocean dark band (light shafts, rising bubbles; tokens re-scoped on `.project--sea`), Outreach in warm amber deal-room light with an SVG network fanning from one banker to buyer nodes in the margins, pulses travelling out (`.project--deal`), Redsky as a literal red dusk sky with request streaks racing across the margins and a dark-restyled diagram (`.project--sky`). Scroll-led motion in `projects.js`: rise-ins, media growing into place, stats counting up to their exact printed text (`data-count`), hero easing away, nav reading-progress line, data pulses through the Redsky diagram; all off under reduced motion. Projects: Sub Sea Sonics / Trap Timer (Currently, Oceana video embed), Datasite Outreach (official Datasite product images in `assets/img/projects/`, credited), Target Redsky (authored flow diagram). **Every figure is sourced** and credited inline (résumé, Oceana, Datasite, Target Tech); platform-wide figures are labelled as such. Light page with two dark bands (sea, sky). Listed on the hub under Engineering, but its own Home links go to `index.html` (the career page), by request. **Paired with `index.html`:** the two link to each other (index nav "Projects", per-job case-study links, a "Three projects, in depth" band before About; projects' nav name and closing link go back) and share one cross-document view transition, `view-transition-name:pob-name` on each nav's name. That shared name is the only thing they share; the looks stay separate. |
| `concerts.html` | `assets/css/concerts.css` | `assets/js/concerts-data.js`, `assets/js/concerts.js` | "The Keepsake Drawer": every show is the wristband worn home (woven jacquard, Tyvek paper, silicone, crimp clasps) in a black felt-lined drawer, a partition per year; each band is a `<details>` that opens to the night; ghosted unworn bands for the wish list. Dark. Big Shoulders Display + Figtree. **Sample data** in `concerts-data.js` (invented artists); set `CONCERTS_ARE_REAL = true` once real. |
| `recipes.html` | `assets/css/recipes.css` | `assets/js/recipes-data.js`, `assets/js/recipes.js` | "The Pantry Shelf": each recipe wears a retro Thai condiment/grocery label (flat saturated ground, gold double border, Thai name first) and stands as a rimmed tin on a white enamel shelf; every recipe prints the same four stages (Gather, Prepare, Cook, Serve). Light. Chonburi + Sarabun (Thai + Latin). Not related to `thailand.html`'s world. **Sample recipes** in `recipes-data.js`; set `RECIPES_ARE_REAL = true` once real. |
| `uses.html` | `assets/css/uses.css` | `assets/js/uses-data.js`, `assets/js/uses.js` | "The Shadow Board": a workshop pegboard painted in flat colour zones (divided only by their edges), every tool a flat silhouette on a steel hook over its painted outline, names on embossed label tape, an index card per zone explaining the picked tool; an empty outline = out in use. Light. Archivo (variable width). **Sample kit** in `uses-data.js`; set `USES_ARE_REAL = true` once real. |
| `blog.html`, `post.html` | `assets/css/blog.css` | `assets/js/blog-posts.js`, `assets/js/blog.js` | "The Notebook", the blog system: each post is a pocket memo book (kraft or dyed cover, staples, red rubber-stamped date and place) on a slate desk; `post.html?p=slug` opens it to ruled pages with margin notes. **No build step**: write `posts/<slug>.md`, add one entry to `blog-posts.js`. The Markdown converter in `blog.js` supports headings, lists, quotes, code, images, links and `{{note: ...}}` margin notes, and escapes raw HTML. Jost + Literata. Three **sample posts**; `how-this-blog-works` doubles as the authoring guide. |
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
- **The live origin is `https://vutisat.github.io/`.** There is no custom domain (pobv.dev does
  not resolve); canonical, `og:url` and `og:image` must use the github.io origin. `index.html`
  carries the `Person` JSON-LD (`@id` `https://vutisat.github.io/#pob`, alternate name Thiti);
  other pages reference that `@id` rather than redefining the person. `robots.txt` and
  `sitemap.xml` live at the root; never list `423.html` in either. Share card: `assets/img/og-card.jpg`.
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
