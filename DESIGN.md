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
| **Selected Work** | `projects.html` · `assets/css/projects.css` | header comment in that file |
| **The Keepsake Drawer** | `concerts.html` · `assets/css/concerts.css` | header comment in that file |
| **The Pantry Shelf** | `recipes.html` · `assets/css/recipes.css` | header comment in that file |
| **The Shadow Board** | `uses.html` · `assets/css/uses.css` | header comment in that file |
| **The Notebook** | `blog.html`, `post.html` · `assets/css/blog.css` | header comment in that file |
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

Hero portrait (**currently commented out of the markup, by request**; uncommenting restores it): the tuxedo cut-out (`pob-tuxedo.webp`) stands **in** the page with no backing
shape. It rises from behind the dark Scale panel, which sits above it (`.scale` z-index 2), so
the panel's top edge crops the body and acts as the ground; `--hero-pb` and `--tuck` set how far
it runs under. Never put it back on a coloured block or arch: a cut-out on a blob reads as a
sticker (the user rejected exactly that). The hero stacks below 1180px because the surname is
too wide to share a row with the figure.

The footer's `life.html` door is **commented out in the markup, intentionally**; leave the
comment in place rather than deleting it.

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
  front door): a Danish wool sample book on a sage limewash wall, with felt clouds and a cover
  hung on yarn.
  Documented in full in §4 below and in the header comment of `assets/css/swatch.css`.
- **Selected Work** (`projects.html`) — the clean case-study portfolio, chosen deliberately
  (canon) with Apple product pages as the quality bar: sticky translucent nav, Geist display at
  up to 92px, centred project heads, media leading in 24px-radius frames, three tabular metrics
  per project, two-column "what I built / why it matters" stories, grey #F5F5F7 alternate bands,
  one blue #0066CC. No costume, no quirk. Every number carries its source line.
  It is the career page's companion: index.html points in (nav, per-job links, the "Three
  projects, in depth" band) and a shared `pob-name` view transition glides the name between the
  two navs. Each side styles its own links in its own world.
- **The Keepsake Drawer** (`concerts.html`) — every show kept as the wristband worn home, in a
  black felt-lined drawer partitioned by year; woven (jacquard raster), Tyvek and silicone (raster)
  bands, woven ones closed with a moulded plastic snap clasp (`clasp.webp`), cut tails dyed like
  the band, ink chosen per band by WCAG contrast;
  each opens (`<details>`) to the night; the wish list is ghosted unworn bands. Dark. Big
  Shoulders Display + Figtree. Data in `assets/js/concerts-data.js` (sample until replaced).
- **The Pantry Shelf** (`recipes.html`) — retro Thai condiment and grocery labels: flat chilli
  red / pandan green / turmeric gold / blue / black grounds, a foil double rule with kanok-style
  curls on all four corners (dark foil on the gold label), Thai name first, English in cream.
  Recipes stand as tins with rendered tinplate rims on a white enamel shelf; each recipe prints
  the same four stages at the same scale on the label's back panel. Light. Chonburi + Sarabun. Data in
  `assets/js/recipes-data.js` (sample).
- **The Shadow Board** (`uses.html`) — a painted pegboard: flat colour zones divided only by
  their edges, grey tool silhouettes hung on J-hooks over larger black painted outlines (tools with
  their own handle, binding, rings or hopper hang from it), flat label-maker tape, a clipped index
  card per zone that opens on a real note; an out tool leaves only its black outline. Light concrete wall. Archivo across widths.
  Data in `assets/js/uses-data.js` (sample).
- **The Notebook** (`blog.html`, `post.html`) — the blog system. Pocket memo books on a slate
  desk, the newest one largest, each standing on its run of the desk's front edge: kraft or dyed
  covers, staples, a rubber-stamped date and place inked through a stamp-ink mask. A post opens to
  ruled paper with margin notes (marked with a red asterisk); on phones the cover stays as a band. Posts are Markdown in `posts/`, listed in `assets/js/blog-posts.js`;
  no build step. Jost + Literata.
- **House Notes** (`423.html`) — the note left on the counter for a house guest: plaster wall,
  brass plaque, forest-green ink, one alarm red for real safety items only. Light and dark.
  `noindex` and intentionally unlinked; never add it to a hub or nav.

Design decisions already argued for in these worlds (the library's wood grain and cream ground,
NYC's line-color edge accents, worldtour's graticule and glow) are recorded as exemptions with
reasons in `.impeccable/config.json`. Read those before "fixing" anything they cover.

---

# 4. The Swatch Book — the hub (candidate landing page)

> `home.html` + `assets/css/swatch.css` + `assets/js/swatch.js` (sews the rounded seams and runs
> the living-room motion) . Rasters in `assets/img/hub/`, each with a
> provenance `.json` sidecar. A **candidate** front door: `index.html` is still the live one.
> Self-contained: loads only `swatch.css`. The values below belong to this world alone; nothing
> here is a site-wide token, and no other world's values apply to it.

## Overview

The site as a Danish wool sample book on a winter afternoon, on a limewashed sage wall lit by
window light.
- The intro is the book's **cover**: petrol twill with a raster-stitched hem, Pob's cutout
  portrait standing on it, and a card-stock label sewn on carrying "Hi, I'm Pob.", the intro,
  index tabs and say-hi links. The cover **hangs from the ceiling on two lengths of yarn**.
- Four collections, two per row: Engineering (Career, Résumé, Projects) with Recommendations (New York,
  Thailand, Recipes), then Travel (World Tour, Uses, the latter to become a packing list) with
  Lifestyle (Library, Stacks, Book Club, Concerts). Every swatch is the same width, a sixth of a
  row (`.pair` is a size container; shelves use `repeat(var(--n), (100cqi - 4·gap - colgap)/6)`),
  so shorter rows simply end sooner; notes never widen a column. Life List and the Notebook
  (blog) are not on the hub. Every page is a **plush wool swatch** like the cover: soft
  rounded corners, a top sheen and underside shade, a real thread stitch sewn around the
  curve (`.seam--card`, finer stitch via `data-period`/`data-length`), a punched ring hole just
  inside the seam, tilted, carrying only its name embroidered in satin stitch. Ledges have
  rounded ends. No pinked or other hard-cut edges. Weaves: Engineering and Travel
  twill, Recommendations basketweave, Lifestyle herringbone; each stands on a teak ledge.
- Five **felt clouds** drift in the sky: one between the hanging yarns above the cover and four
  in the side margins (wide screens). Below 1460px only two small ones stay, in the strip of
  sky above the cover. All bob gently at different paces.
- The room ends in a **woolly meadow**: felt flowers (daisies with pom-pom centres, berry
  tulips, mustard flowers with sewn-button centres) standing in a fringe of felt grass along the
  very bottom of the page; nothing below it (the name tag and knitted ground were removed).
  Twenty flowers in seven felt species (daisy, tulip, button flower, lavender,
  sunflower, poppy, forget-me-not; `felt-*.webp`), laid out so no two blooms overlap: positions
  and heights were solved against each species' measured bloom box (with breathing room) at 1440
  wide, and heights scale with the viewport below that (`min(h px, h * 100vw / 1440)`), so the
  spacing holds at every width. Phones show eight (`.flower--phone`, one of every kind) with their
  own solved placements (`--mx`, `--mh`) and shorter grass. Flowers sway ±2° at staggered paces
  when motion is allowed. Above them fly felt **butterflies** (three colourways; wings
  `wings-*.webp` flap via scaleX over a separate body) and **bees** (striped felt body, buzzing
  wings) on slow 11 to 23s loops just over the blooms; bees turn round mid-loop. Phones show one
  of each. All still under reduced motion. Any new flower must be re-solved, not dropped in by eye.

Tried and rejected, so don't bring them back: screenshots or spec hang tags on swatches (too
much text), code-rendered plants, stylised SVG and downloaded pressed botanicals, and a fully
rounded "Woolly World" restyle (only its clouds and hanging yarn were kept).

## Colors

Light only. Wall `#D3D9C8` (limewash raster multiplied at .85), card stock `#F7F7F3`, ink
`#1E2421` / `#47504A`, teak `#A8622C`. Wool dyes set bright because the weave multiplies them
down: mustard `#F2B63C`, petrol `#3F8F9C`, plum `#A8588A`, moss `#82A062`, berry `#D2566A`, rust
`#D9773A`, cornflower `#6F92D2`, coral `#EE957F`, cocoa `#A06E4E`, navy `#4A5F9C`, lilac `#A48DD2`, slate `#7D8C9B`.
Every hub swatch has its own dye (no repeats), warm and cool alternating along each row.
Embroidery thread `#FFFDF7`; on mustard (`.swatch--light`) dark petrol `#1F4A52`. Yarn strings
`#E9DCC0` to `#D8C59F`. Focus `#2A6E7A`; selection mustard.

## Typography

Bricolage Grotesque only (self-hosted variable, weight + optical size). Display 780, opsz 96,
`clamp(46px, 6.2vw, 84px)`, -.035em. Collection names 740, `clamp(32px, 4.2vw, 52px)`. Swatch
names 800, `clamp(25px, 2.5vw, 34px)`, satin embroidery via `background-clip:text` with
`satin.webp`. Body 400 17px / 1.55; tabs and links 600.

## Materials

Procedural rasters tinted by multiply: `wool-twill|herring|basket.webp` (240px), `stitch.webp` /
`stitch-v.webp` (running stitch on straight edges), `satin.webp`, `teak.webp` (ledges),
`wall.webp`, `light.webp`, `cloud.webp`, and for the meadow `felt-grass.webp`,
`felt-daisy|tulip|buttonflower.webp`.

## Shapes

The **cover is plush**: a stuffed cushion with `clamp(36px, 4vw, 56px)` corners, a top sheen and
underside shading (layered radial gradients plus inset shadows), and a seam 14px inside that
follows the curve. Its sewn label is rounded to 22px with its own darker seam. Rounded seams are
sewn by `assets/js/swatch.js`: the original curved, shaded stitch (an SVG `<symbol>`, same drawing
as `stitch.webp`) placed every 22px along an SVG rounded-rect path, rotated to its tangent, and
re-sewn on resize. Without JS a layered dashed path (shadow, thread, highlight) shows instead.
Never replace a stitch with a plain CSS dashed border.
Swatches, tabs and ledges stay square-cut; the ring hole is the only small circle. Clouds are
the other soft, organic shape. Shadows are soft and offset.

## Components

- **Swatch (signature):** 4:5 wool, pinked foot (mask), ring hole, `--tilt`. Reach (hover /
  focus-visible): straightens, lifts 12px, shadow deepens, the light runs along the floss (satin
  layer slides 30px). Focus: 3px ring around the swatch.
- **Ledge:** a 30px teak run with a lit top face; below 1080px each row gets its own, and an
  odd last swatch stands centred on a full shelf.
- **Index tabs:** card-stock tabs with a wool snip of the collection's dye.
- **Hanging yarn:** two 5px yarn strands from the top of the page to the cover (`.intro::after`).
- **Clouds:** cream felt (`cloud.webp`), five on wide screens, two small ones above the cover
  below 1460px. Two independent motions composed into one transform via registered custom
  properties: a slow sideways drift on the wind (`--wx`, ±26 to 48px over 44 to 68s, each cloud
  its own direction and lag) and a gentle bob (`--wy`/`--wr`, 7 to 10s), plus scroll depth.
  Still under reduced motion. `body` is `display:flow-root` so the cover's top margin
  can't collapse through it and shift every absolutely placed decoration down.

## A living room (motion and changing content)

All driven by `assets/js/swatch.js` and CSS; each uses an individual transform property
(`rotate` / `translate` / `scale`) so it layers over the tilt, hover lift and bob. Under reduced
motion every one of them is skipped and the page stands still; without JS it is simply static.
- **Cover swings on its yarn:** a gentle 2.6s pendulum settle on load (max ±1.1°, pivot at the
  top of the page), then a small damped spring rocks it when you scroll past near the top. The
  yarn strands run 600px past the top of the page so their cut ends never show mid-swing. Keep
  the swing subtle: a stronger wobble was rejected.
- **Swatches settle:** the first time each shelf enters view, its swatches drop onto the ledge
  in turn (90ms apart, soft overshoot).
- **Cloud depth:** clouds drift upward at different depths (`--depth`) on a CSS scroll timeline,
  on top of their bob. Browsers without scroll timelines keep only the bob.
- **Meadow:** flowers grow up out of the grass when it enters view, then sway. There is no
  hover interaction (a cursor-nod was tried and removed as janky).
- **Time of day:** `data-time` on `<html>` (morning / day / evening / night, from the visitor's
  local clock, stamped inline in `<head>` so the first paint is right) retints the window
  light: soft in the morning, golden in the evening, blue moonlight at night with a dusk wash
  over the wall only (notes go to full ink to keep contrast).
- A random "Off the shelf today" book tag was tried and removed.

## Responsive & motion

5 columns, 3 below 1080px, 2 below 560px; the pair stacks below 900px; the cover stacks (label
above portrait) below 820px. Reduced motion: no lift, bob or floss slide.

## Do's and Don'ts

- **Do** give new pages a swatch with only an embroidered name, a dye, and a `--tilt`.
- **Do** ship a provenance `.json` with every new raster.
- **Don't** put text, figures or screenshots on swatches.
- **Don't** round the cloth or add characters; the clouds and hanging yarn are the only playful notes.
