# Design — pobv.dev

**This site is an anthology of separate worlds, not one design system.** Each page commits to its
own palette, type, layout language and metaphor, and they are not meant to converge. This file
records each world so it can be worked on faithfully — see `CLAUDE.md` for the working rule.

| World | Scope | Documented |
|---|---|---|
| **Bright Editorial** | `index.html` · `assets/css/home.css` | in full below |
| **The Reference** | `life.html`, `resume.html` · `assets/css/main.css` | in full below |
| **Subway Guide** | `nyc.html` · `assets/css/nyc.css` | header comment in that file |
| **The Library** | `library.html` · `assets/css/library.css` | header comment in that file |
| **The Stacks, Overanalyzed** | `library-info.html` · `assets/css/library-info.css` | header comment in that file |
| **The Orchid Garland** | `thailand.html` · `assets/css/thailand.css` | header comment in that file |
| **Salinas Valley** | `bookclub.html` · `assets/css/bookclub.css` | header comment in that file |
| **The Swatch Book** | `home.html` · `assets/css/swatch.css` | in full below (§4) |
| **House Notes** | `423.html` (inline) | inline, self-contained |
| **Planetarium Atlas** | `worldtour.html` (inline) | inline, self-contained |

---

# 1. Bright Editorial — the homepage

> `index.html` + `assets/css/home.css` + `assets/js/home.js`. 2026 rebuild.
> Explicitly self-contained: it does **not** load or touch `main.css`.

## World

A gallery wall, not a dev portfolio. Enormous confident display type on warm off-white, one
locked cobalt, and two inverted near-black blocks that land like plates in a printed magazine.
The argument is made by scale and restraint: real numbers, set huge, with nothing decorating them.

Calm and bright by deliberate contrast with the dark-neon engineer-portfolio default. Personality
(travel, recs, library) stays behind an easter egg rather than on the front page.

## Color

Light ground, inverted plates. One accent, locked — no second hue is introduced on paper.

| Token | Value | Role |
|---|---|---|
| `--paper` | `#FAFAF7` | gallery off-white ground |
| `--paper-2` | `#F1F0EA` | About band, job-row hover fill |
| `--ink` | `#131316` | display type, buttons, **and the dark plates** |
| `--ink-2` | `#3B3B41` | body |
| `--ink-3` | `#6A6A72` | muted — meets 4.5:1 on paper |
| `--line` / `--line-2` | `rgba(19,19,22,.12)` / `.20` | hairline rules / stronger borders |
| `--accent` | `#2136E0` | the single saturated accent, locked |
| `--accent-ink` | `#182BC4` | accent as *text* on paper (AA) |
| `--accent-wash` | `rgba(33,54,224,.08)` | underlines, soft fills |
| `--on-accent` | `#FAFAF7` | text on an accent fill |

**Cobalt has two forms and they are not interchangeable:** `--accent` for fills, marks and
borders; `--accent-ink` whenever cobalt becomes readable text. Don't collapse them.

On the dark plates the accent shifts to cool periwinkles so it stays legible on near-black —
`#B9C0FF` (italic emphasis in headlines), `#AEB6FF` (metric suffixes, company names), `#8E9BFF`
(list icons, the footer arrow). These exist **only** on `--ink` grounds.

## Type

Self-hosted woff2 from `assets/fonts/`, no CDN. Three faces, each with one job.

- **Hanken Grotesk** (variable 300–800), aliased `"Hanken"` — everything structural: display,
  body, UI. Body sits at weight **420** and display at **800**; that spread is the voice.
- **EB Garamond italic** (400–600, *italic only*), aliased `"Garamond"` — loaded solely for
  `.serif-em`, the italic phrase that carries the emotional beat of a sentence ("calm systems at
  scale", "verify", "good"). Never used for body copy, never upright.
- **Spline Sans Mono** (300–600), aliased `"Spline"` — real data only: metrics, years, chips,
  eyebrow labels, captions. `.mono` is `.72rem` / `.16em` tracking / uppercase.

Display is `-.03em` tracked, `line-height:.94`, `text-wrap:balance`. Hero headline scales to
`7.4rem`. Metrics are `font-variant-numeric:tabular-nums` so counting digits don't jitter.

## Signature elements

- **Magnetic dot mesh** behind the hero — `lab/magnetic-grid.js` on a full-bleed
  `pointer-events:none` canvas that escapes the centered wrap to span the viewport. Tuned faint
  (`restColor` at 9% ink) and driven by the whole `.hero` via `eventTarget`, so the mesh reacts
  under the text. Tuning lives at the bottom of `index.html`; the module stays generic.
- **Staggered headline rise** — each name line sits in an `overflow:hidden` `.l` wrapper and
  rises from `translateY(105%)`, `.09s` apart, transform only. Set from `home.js`, skipped
  entirely under reduced-motion.
- **The Scale plate** — the centerpiece. An `--ink` block, `34px` radius, inset from the page
  edge, with a cobalt radial glow in the top-right corner. Four metrics in giant Spline mono
  (up to `7.4rem`) that count up once on scroll. Every number is real and verifiable.
- **Editorial work list** — hairline-separated rows, `.34fr/1fr` aside-and-body grid, whole row
  tints `--paper-2` on hover. Bullets are rotated squares in cobalt (diamonds), not discs.
- **The Contact plate** — mirrors the Scale plate (`--ink`, `34px 34px 0 0`, glow anchored
  bottom-left instead) so the page opens and closes on the same gesture.
- **Secret menu** — click the brand name **5×** within 700ms to reveal an "off the clock"
  popover linking Thailand / NYC / World Tour / Library. Dismisses on outside click or Escape.
  This is the *only* route to the personal layer from the homepage; keep it undiscoverable.

## Components

Pill buttons `.btn` (`--bg`/`--fg` custom props, lift 2px on hover) with `.btn--accent` and
`.btn--ghost` variants. Mono `.chip` pills, hairline, cobalt on hover. Diamond list markers.
`.s-head` section heads capped at `18ch`. Section rhythm is one token: `--step`,
`clamp(6.5rem, 13vh, 11rem)`.

## Motion

One entrance language: `.reveal` (fade + 26px rise, `.8s`, `--ease` = `cubic-bezier(.16,1,.3,1)`),
staggered via `data-d="1|2|3"`. Plus the headline rise and the metric count-up.

All of it is `IntersectionObserver`-driven — **no scroll listeners anywhere**, including the
sticky nav's `.stuck` border, which observes the hero. Under `prefers-reduced-motion` reveals
start visible, the count-up jumps to its final value, and the headline doesn't move.

## Constraints

Vanilla CSS/JS, no build step, no CDN, deploys as-is on GitHub Pages. `home.js` guards every
feature, so removing a section from the HTML degrades silently.

Note: the hero portrait (`.hero__art`) and the footer's `life.html` door are **commented out in
the markup, intentionally**. `home.css` keys its single-column hero off
`:has(.hero__art)` — uncommenting the figure restores the two-column hero with no CSS change.
Leave those comments in place rather than deleting them.

---

# 2. The Reference — the shared sub-page world

> `life.html`, `resume.html` + `assets/css/main.css` + `assets/js/main.js`.
> Direction seed `d1dd32ba` (direction/persuade). Code-led build (no image generation available).
>
> **Scope note:** this world was originally the homepage too. It no longer is — `index.html`
> moved to Bright Editorial in the 2026 rebuild. Everything below applies to these two sub-pages
> and nothing else. Do not apply it to the homepage or any other world. (`thailand.html` also
> used to live here; it now has its own world, The Orchid Garland.)

## World

A career documented as a **technical reference document**. Warm, calm, editorial — the deliberate
opposite of the dark-neon dev-portfolio default and of the sterile résumé.

Mode: **Persuade** (the visitor decides and reaches out; the craft is the argument).

## Color

Light. Strategy: restrained-plus — paper + ink neutrals with **cobalt** owning whole structural
regions and **vermilion** reserved strictly for the live/active mark.

| Token | Value | Role |
|---|---|---|
| `--paper` | `#F4F1EA` | warm bone ground |
| `--paper-2` | `#ECE7DB` | panel / alternating sections |
| `--paper-3` | `#E3DDCD` | scrollbar thumb, deeper fills |
| `--ink` | `#18181B` | primary text, dark buttons |
| `--ink-2` | `#3C3C41` | body / secondary |
| `--ink-3` | `#5E5C5A` | muted (meets 4.5:1 on paper) |
| `--line` | `rgba(24,24,27,.16)` | hairline rules, borders |
| `--cobalt` | `#2540D6` | structural accent, links, active states |
| `--cobalt-2` | `#1B2E9E` | cobalt text on light |
| `--cobalt-wash` | `rgba(37,64,214,.08)` | active/hover fills |
| `--vermilion` | `#C63D28` | live/active mark ONLY (hot node, live dots) |

Rules: cobalt commits at region scale, never scattered. Vermilion is scarce — the "hot path",
the "systems online" pulse, the "open to" dot. Nothing else.

Note this is a *different* warm bone (`#F4F1EA`) and a *different* cobalt (`#2540D6`) than the
homepage's. That is not drift to be reconciled; they are two worlds.

## Type

Self-hosted woff2 in `assets/fonts/`, no CDN.

- **Spectral** (serif, 400/500/600) — display: hero name, section titles, entry roles, sign-off.
  Chosen because it was engineered for on-screen document reading — the reference-document world.
- **Hanken Grotesk** (variable 400–700) — body, UI, buttons.
- **JetBrains Mono** (variable) — real data only: metrics, addresses (`§1`, `/overview`), version
  tags, clocks, chips. Never decorative "tech" costume.

Display uses `text-wrap:balance`, tracking `-.022em`. Body measure ~66ch.

## Signature elements

- **⌘K command palette** (`.cmdk`) — direct page addressing; open with ⌘K/Ctrl-K or `/`, keyboard
  navigable, keyword-filtered; groups Sections / Pages / Off the clock / Find me.
- **Changelog** (`.log`, `.entry`) — experience as a dated version history (v4.0…v0.1) that
  visibly matures, signed "— Pob" at the foot.
- **Drafting-grid substrate** — faint two-axis grid on `body::before`, masked to the hero corner;
  a deliberate blueprint/measurement surface, core to the world (not decorative default).
- **Living system diagram** (`.sys`) — SVG nodes with cobalt data-flow packets animated along
  real edge paths via `getPointAtLength`, a session clock, and a metric count-up. Freezes to a
  static readable state under `prefers-reduced-motion`. *(Authored for the former homepage; the
  CSS remains in `main.css` for any sub-page that wants it.)*

## Components

Buttons `.btn` / `.btn--ghost` (ink fill / hairline ghost, lift on hover). Chips `.chip` (mono,
hairline, cobalt on hover). Diamond list markers (rotated square, cobalt outline). Margin notes
`.mnote` (top-rule + cobalt mono key). Callouts `.guide-note[--danger|--success]` (full 1px
border + tinted ground, no side-tab). Section header `.s-head` with functional `§n · /addr`.
Sub-pages share the world via `.subnav` + `.guide-*` classes. No per-page styles, no jQuery.

## Motion

One authored moment (the diagram) plus a single scroll-reveal entrance (`.reveal`, exponential
ease-out from a visible-by-default fallback). Everything honors `prefers-reduced-motion`.
Browser surfaces themed: cobalt selection, custom scrollbar, cobalt focus ring.

## Constraints

Static, hand-editable, no build step, deploys as-is on GitHub Pages. `assets/js/main.js` has no
dependencies and guards every feature, so sub-pages that lack an element simply skip it.

---

# 3. The other worlds

Not restated here — each is documented where it lives, and the CSS header comments are the
source of truth.

- **Subway Guide** (`nyc.html`) — the city mapped like the MTA: each category owns a line color,
  each place is a stop. Light `#FBFAF6` plus a dark mode. Hanken + JetBrains Mono.
- **The Library** (`library.html`) — a home library as physical matter: wood grain, book cloth,
  warm paper `#F6EFE2`. **Night by default** with a reading-lamp toggle
  (`data-theme="night"｜"day"` stamped on `<html>` pre-paint, persisted as `lib-lamp`).
  EB Garamond. Spine cloth colors are assigned per genre family, all ≥6.4:1 on paper.
- **Planetarium Atlas** (`worldtour.html`) — deep space `#0A0E1C`, neon glow, per-continent
  accents, a lat/long graticule as the literal map surface. Marcellus + EB Garamond.
  Fully self-contained in one inline `<style>`; flags load from `assets/flags/<iso>.svg`.
- **The Stacks, Overanalyzed** (`library-info.html`) — a loud risograph zine of infographics
  about the library's books. Newsprint `#F2ECDF`, nine flat riso inks with multiply blending,
  misregistered headlines, stickers. Light only. Hanken at 800 + Spline Sans Mono. Every figure
  is computed live from `library-data.js` and re-synced from the sheet; never hardcode a number.
- **The Orchid Garland** (`thailand.html`) — the guide hangs from one strung cord: places are
  jasmine buds tied onto it, regions are marigold bands knotted across it. Jasmine `#FBF7EF`,
  one orchid purple as the only line and interactive colour. English first, Thai beneath.
  Trirong + Anuphan. No cards, no shadows, no photographs.
- **Salinas Valley** (`bookclub.html`) — East of Eden Reading Club at golden hour: dry-grass
  paper, gold hills, a dusky ridge, oak-brown ink; the schedule is a trail down the valley.
  Light only. EB Garamond + Hanken.
- **The Swatch Book** (`home.html`) — candidate new landing page (`index.html` is still the
  front door): a Danish wool sample book on a sage limewash wall. Documented in full in §4 below
  and in the header comment of `assets/css/swatch.css`.
- **House Notes** (`423.html`) — the note left on the counter for a house guest: plaster wall,
  brass plaque, forest-green ink, one alarm red for real safety items only. Light and dark.
  `noindex` and intentionally unlinked; never add it to a hub or nav.

Design decisions already argued for in these worlds (the library's wood grain and cream ground,
NYC's line-color edge accents, worldtour's graticule and glow) are recorded as exemptions with
reasons in `.impeccable/config.json`. Read those before "fixing" anything they cover.

---

# 4. The Swatch Book — the hub (candidate landing page)

> `home.html` + `assets/css/swatch.css`. No JS. Rasters in `assets/img/hub/`, each with a
> provenance `.json` sidecar. A **candidate** front door: `index.html` is still the live one.
> Self-contained: loads only `swatch.css`. The values below belong to this world alone; nothing
> here is a site-wide token, and no other world's values apply to it.

## Overview

**Creative North Star: "The Danish Wool Sample Book"**

The site as a wool sample book on a winter afternoon. The intro is the book's cover: a length of
petrol twill with a card-stock label sewn onto it, Pob's cutout portrait standing in front. Every
page is a swatch: a piece of woven wool, pinked at the foot, punched with a ring hole, with a
label stitched onto it carrying a real screenshot of that page. Each collection is cut from its
own weave and stands on its own teak ledge; the room ends at a teak sideboard.

Material is real, not drawn. Weave, thread, teak, limewash and window light are rendered texture
rasters multiplied into flat colour; CSS contributes only cut geometry (pinked edge, ring hole)
and light on edges (the bevel on teak). Three collections of equal weight; no collection
outranks another. Light only: it is daytime.

**Key Characteristics:**
- A total palette: sage wall, card stock, ink, teak, five wool dyes. Nothing outside it.
- One typeface, Bricolage Grotesque, carried entirely by weight and optical size.
- Square corners everywhere except the punched ring hole.
- Soft, cast, light-from-above shadows: swatches stand on ledges and lift when reached for.
- Every preview is a screenshot of the real page; every raster carries its provenance.

## Colors

A total palette: one cool plaster ground, one paper, one ink family, one wood, five dyes.

### Primary
- **Petrol Wool** (`--petrol` `#3F8F9C`): the cover cloth, the footer label, the Engineering
  tab, and swatches in rotation. The house dye of the book.
- **Focus Petrol** (`#2A6E7A`): the 3px focus outline everywhere, and (at 55% alpha) the
  underline on the say-hi links. A darkened petrol so the ring holds contrast on wall and stock.

### Secondary — the wool dyes
All five are set bright on purpose (`--mustard #F2B63C`, `--plum #A8588A`, `--moss #82A062`,
`--berry #D2566A`, plus petrol): the weave raster multiplies them down to their finished shade.
Dyes appear only as woven cloth (cover, swatch, tab snip, footer label), never as flat fills,
text, or borders. Mustard doubles as `::selection`.

### Neutral
- **Limewashed Sage** (`--wall` `#D3D9C8`): the page ground and `theme-color`. Mottled by
  `wall.webp` (multiply, .85) and brightened top-left by a pale radial wash.
- **Sage Shade** (`--wall-shade` `#B9C0AC`): the ring hole's fill; the scrollbar track.
- **Card Stock** (`--stock` `#F7F7F3`): every label (cover label, swatch label) and the
  footer label's text.
- **Ink** (`--ink` `#1E2421`): headings, swatch names, link text.
- **Ink 2** (`--ink-2` `#47504A`): intro prose, collection notes, captions.
- **Teak** (`--teak` `#A8622C`): base under `teak.webp` for ledges and the sideboard.

### Named Rules
**The Dye-Is-Cloth Rule.** A dye only ever appears multiplied under a weave raster. A flat
mustard rectangle is not this world. (The one sanctioned flat use is mustard as `::selection`.)

**The Total Palette Rule.** New surfaces pick from wall, stock, ink, teak and the five dyes.
Adding a sixth dye or a second ground breaks the book.

## Typography

**Display / Body / Label:** Bricolage Grotesque, self-hosted variable (`bricolage-var.woff2`,
weight 200–800, `opsz` axis), fallback Helvetica Neue, Arial, system-ui.

**Character:** a single grotesque with ink-trap warmth, scaled by optical size: tight and heavy
at display, open at body. No second family, no mono, no italic face (the one `<i>` is synthetic).

### Hierarchy
- **Display** (780, `clamp(46px, 6.2vw, 84px)`, lh .94, -.035em, `opsz` 96, balanced): "Hi, I'm
  Pob." on the cover label only.
- **Headline** (740, `clamp(32px, 4.2vw, 52px)`, lh 1, -.03em, `opsz` 96): collection names.
- **Title** (620 → 780 on reach, 20px, lh 1.1, -.01em, `opsz` 32): swatch names; 16.5px ≤560px.
- **Body** (400, 17px base / intro `clamp(16px, 1.4vw, 18.5px)`, lh 1.55, max 36–38em, pretty
  wrap): intro and collection notes, in `--ink-2`. The intro's last line steps up to 620 in ink.
- **Label** (600, 15.5px, lh 1): index tabs and say-hi links. Captions 13.5px (12.5px mobile).
  Footer label 600, 14px, +.04em, mixed case.

### Named Rules
**The Weight Answers Rule.** Interactive type responds by weight, not colour: swatch names go
620 → 780, index tabs 600 → 720, eased on `--ease`. This survives reduced motion.

## Layout

- **Container:** `--max` 1240px, `--gutter` `clamp(16px, 4vw, 56px)`.
- **Cover:** a two-column grid `minmax(220px, 4fr) / minmax(0, 7fr)`, bottom-aligned; the
  portrait (max 380px) breaks out of the cloth's top edge by -22% and stands on its hem.
- **Collections:** Engineering and Recommendations share a row (`.pair`, two equal columns,
  gap `clamp(40px, 5vw, 80px)`), each with a two-wide shelf pushed to the bottom so both ledges
  align. Lifestyle runs full width on a five-wide shelf. Each collection is its own weave:
  Engineering twill, Recommendations basketweave, Lifestyle herringbone.
- **Rhythm:** collections `clamp(64px, 8vw, 104px)` apart; footer `clamp(96px, 11vw, 150px)`
  below; swatch row gap 56px, column gap `clamp(18px, 2.2vw, 30px)`; ledge 30px tall,
  overhanging the shelf by 24px each side.
- **Swatch tilt:** each swatch carries its own `--tilt` (±0.8–1.6°, alternating), rotating
  from its foot.
- **Responsive:** ≤1080px shelves go three-wide and each *row* of swatches gets its own run of
  teak (per-swatch ledge segments) instead of one shelf-long ledge. ≤900px the pair stacks.
  ≤820px the cover goes single-column, label first, portrait (max 280px) below; the second
  window of light drops. ≤560px shelves go two-wide, ledges bleed to the gutter, and an odd
  last swatch stands centred on its own run of teak rather than beside a gap.

## Elevation & Depth

Depth is physical and lit from above: things are sewn on, stood up, or laid down, and their
shadows are soft, short-offset key plus long-blur ambient. No hard offset shadows.

### Shadow Vocabulary
- **Cover cloth** (`0 2px 2px rgba(30,36,33,.14), 0 30px 50px -24px rgba(30,36,33,.55)`).
- **Sewn label** (cover: `0 1px 1px rgba(20,40,44,.25), 0 14px 26px -14px rgba(20,40,44,.6)`;
  swatch: `0 1px 1px rgba(30,36,33,.22), 0 4px 8px -4px rgba(30,36,33,.35)`).
- **Standing swatch** (`filter: drop-shadow(0 10px 12px rgba(30,36,33,.32))` →
  `drop-shadow(0 24px 22px rgba(30,36,33,.38))` on reach). A filter on the parent, because the
  pinked mask would clip a box-shadow.
- **Teak ledge** (`0 18px 22px -12px rgba(40,30,20,.55)`), plus a gradient bevel: lit top face
  (warm 35%→12% over 8px), a shadow line, a dark 3px bottom lip.
- **Portrait** (`drop-shadow(0 16px 16px rgba(18,32,36,.4))`).
- **Window light:** `light.webp` (1050×825, pale sage-white so it brightens without warming)
  laid on the wall behind the cover at .85, a second smaller copy further down at .6.

### Named Rules
**The Stands-On-Teak Rule.** Every swatch stands on a ledge. A row of swatches without wood
beneath it is floating, and floating is wrong here.

## Shapes

Square corners throughout: cloth, labels, tabs, screenshots, ledges. The only round form is the
9px punched ring hole at each swatch's top centre (sage-shade fill, inset shadow), because a
punch is round. Swatch feet are pinked: a 12×7px zigzag mask along the bottom edge. Running
stitches sit just inside edges (`--seam` 12px cover, 8px cover label, 5px swatch and footer
labels) from `stitch.webp` / `stitch-v.webp`; on swatch labels they are smaller (18×6) and
darkened (.55 opacity, brightness .55) so the thread reads on white stock.

## Components

### Swatch (signature)
Woven cloth (dye × weave, 240px tile, multiply) with padding `22px 11px 44px`, pinked foot,
ring hole, tilted by `--tilt`. Inside, a stitched card-stock label: 16:10 screenshot (top-
anchored, hairline ring), name, caption.
- **Reach (hover / focus-visible):** straightens to 0°, lifts -12px, shadow deepens, the
  screenshot scales 1.06 and drifts up 4% as if you'd started reading, the name goes to 780.
  `.55s` (image `.9s`) on `--ease` `cubic-bezier(.16, 1, .3, 1)`. Active: -7px.
- **Focus:** the outline moves onto the label (3px Focus Petrol, offset 3px).

### Index tabs (navigation)
Thumb-index tabs on pale stock (`#ECEEE6`), each led by a 22px snip of its collection's woven
dye (120px weave tile). 600 → 720 weight, -3px lift and a longer shadow on hover.

### Say-hi links
Inline text links in ink, 600, a 2px Focus Petrol underline at 55% offset 5px, going full ink
on hover.

### Cover label / Footer label
The cover label is card stock sewn onto the twill (stitch at 8px). The footer label is a woven
petrol strip with stock-coloured text, rotated -1.5° and laid on the teak sideboard.

### Motion
Reduced motion: transitions collapse to .01ms, swatches keep their tilt and do not lift, the
screenshot does not drift, smooth scroll is off. The swatch still answers by weight and shadow.

## Do's and Don'ts

### Do:
- **Do** render new material (cloth, thread, wood, plaster, light) as a raster multiplied into a
  palette colour, and ship its provenance `.json` beside it.
- **Do** give every new page a swatch with a real screenshot of that page, a dye from the five,
  and its own `--tilt`; put it on its collection's ledge.
- **Do** keep the three collections at equal weight, each on its own weave.
- **Do** keep interactive response in weight, lift and shadow, with reduced-motion keeping
  the weight and shadow.

### Don't:
- **Don't** round corners on cloth, labels, tabs or screenshots; the ring hole is the only circle.
- **Don't** use a dye as flat colour, text, or border (text selection excepted).
- **Don't** add a dark mode; this world is daytime.
- **Don't** add a second typeface, a mono, or uppercase tracked labels above headings.
- **Don't** import tokens from `home.css`, `main.css` or any other world, and don't export
  these to them.
