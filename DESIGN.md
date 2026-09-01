# Design — pobv.dev

> "The Reference": a career documented as a system you can watch run.
> Direction seed `d1dd32ba` (direction/persuade). Code-led build (no image generation available).

## World

A personal site for a staff engineer, treated as a **technical reference document** whose
opening spread is a **live system diagram** he built. Warm, calm, editorial — the deliberate
opposite of the dark-neon dev-portfolio default and of the sterile résumé. Personality
(travel, recs, life) lives in a discoverable secondary layer, never on the front page.

Mode: **Persuade** (the visitor decides and reaches out; the craft is the argument).

## Color

Light. Strategy: restrained-plus — paper + ink neutrals with **cobalt** owning whole
structural regions (the diagram) and **vermilion** reserved strictly for the live/active mark.

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

Rules: cobalt commits at region scale (diagram, margin-note keys, addresses), never scattered.
Vermilion is scarce — the "hot path", the "systems online" pulse, the "open to" dot. Nothing else.

## Type

Self-hosted (woff2 in `/fonts`), no CDN.

- **Spectral** (serif, 400/500/600) — display: hero name, section titles, entry roles, sign-off.
  Chosen because it was engineered for on-screen document reading — the reference-document world.
- **Hanken Grotesk** (variable 400–700) — body, UI, buttons.
- **JetBrains Mono** (variable) — real data only: metrics, addresses (`§1`, `/overview`), version
  tags, clocks, chips. Never decorative "tech" costume.

Display uses `text-wrap:balance`, tracking `-.022em`. Body measure ~66ch.

## Signature elements

- **Living system diagram** (`.sys`) — SVG nodes (Ingest → Event Capture → Petabyte Warehouse;
  Billing Engine; hot target.com Edge) with cobalt data-flow packets animated along real edge
  paths via `getPointAtLength`, a session clock, and a metric count-up. All real systems / real
  numbers. Freezes to a static readable state under `prefers-reduced-motion`.
- **⌘K command palette** (`.cmdk`) — direct page addressing; open with ⌘K/Ctrl-K or `/`, keyboard
  navigable, keyword-filtered; groups Sections / Pages / Off the clock / Find me.
- **Changelog** (`.log`, `.entry`) — experience as a dated version history (v4.0…v0.1) that
  visibly matures, signed "— Pob" at the foot.
- **Drafting-grid substrate** — faint two-axis grid on `body::before`, masked to the hero corner;
  a deliberate blueprint/measurement surface, core to the world (not decorative default).

## Components

Buttons `.btn` / `.btn--ghost` (ink fill / hairline ghost, lift on hover). Chips `.chip` (mono,
hairline, cobalt on hover). Diamond list markers (rotated square, cobalt outline). Margin notes
`.mnote` (top-rule + cobalt mono key). Callouts `.guide-note[--danger|--success]` (full 1px
border + tinted ground, no side-tab). Section header `.s-head` with functional `§n · /addr`.

## Sub-pages

`thailand.html`, `nyc.html`, `life.html`, `resume.html` share the world via `.subnav` +
`.guide-*` classes in `main.css`. No per-page styles, no jQuery, no Font Awesome.

## Motion

One authored moment (the diagram) plus a single scroll-reveal entrance (`.reveal`, exponential
ease-out from a visible-by-default fallback). Everything honors `prefers-reduced-motion`.
Browser surfaces themed: cobalt selection, custom scrollbar, cobalt focus ring.

## Constraints

Static, hand-editable, no build step, deploys as-is on GitHub Pages. `Styles/main.js` has no
dependencies and guards every feature so sub-pages that lack an element simply skip it.
