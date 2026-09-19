# Design — pobv.dev

**This site is an anthology of separate worlds, not one design system.** Each page commits to its
own palette, type, layout language and metaphor, and they are not meant to converge. This file
records each world so it can be worked on faithfully — see `CLAUDE.md` for the working rule.

| World | Scope | Documented |
|---|---|---|
| **Bright Editorial** | `index.html` · `assets/css/home.css` | in full below |
| **The Reference** | `thailand.html`, `life.html`, `resume.html` · `assets/css/main.css` | in full below |
| **Subway Guide** | `nyc.html` · `assets/css/nyc.css` | header comment in that file |
| **The Library** | `library.html` · `assets/css/library.css` | header comment in that file |
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

> `thailand.html`, `life.html`, `resume.html` + `assets/css/main.css` + `assets/js/main.js`.
> Direction seed `d1dd32ba` (direction/persuade). Code-led build (no image generation available).
>
> **Scope note:** this world was originally the homepage too. It no longer is — `index.html`
> moved to Bright Editorial in the 2026 rebuild. Everything below applies to the three sub-pages
> and nothing else. Do not apply it to the homepage, the library, NYC, or worldtour.

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

# 3. The other three worlds

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

Design decisions already argued for in these worlds (the library's wood grain and cream ground,
NYC's line-color edge accents, worldtour's graticule and glow) are recorded as exemptions with
reasons in `.impeccable/config.json`. Read those before "fixing" anything they cover.
