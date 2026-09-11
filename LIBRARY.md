# The Library — how `library.html` works

A browsable shelf of every physical book Pob owns. Its own self-contained world
(own fonts, tokens and reset), the same standalone posture as `nyc.html` — it
borrows nothing from `Styles/home.css` or `Styles/main.css`, and `DESIGN.md`
(the shared site system) does not apply to it.

| File | Role |
|---|---|
| `library.html` | Markup and copy. No inline `<style>`, no inline JS. |
| `Styles/library.css` | Self-contained: own `@font-face`, `:root`, reset. |
| `Styles/library.js` | Render, search, sort, filter, drawer, live sync. Plain IIFE, no dependencies. |
| `Styles/library-data.js` | Baked snapshot of the sheet: `window.LIBRARY_SEED`. |

Linked from the homepage's secret menu (click the brand 5×).

---

## Where the data comes from

The Google Sheet is the source of truth. The page reads it **two ways**:

1. `library-data.js` loads synchronously, so 341 books paint immediately — no
   spinner, works offline and on `file://`.
2. After first paint, the sheet's CSV endpoint is fetched and, if it differs,
   swapped in while preserving the current search, sort, filter and view.

Every failure path (offline, sheet made private, endpoint changed, malformed
CSV) is caught and swallowed; the baked copy stays on screen. **The page can
never render empty.**

Adding a book is therefore: edit the sheet, done. Re-baking `library-data.js`
is optional housekeeping that keeps the offline copy current.

### Columns are found by name, not position

`rowsFromCSV()` reads the header row and locates `Title`, `Author`, `Genre`,
`Release Year` and `Rating` by their header text. Columns can be added, removed
or reordered in the sheet without touching the code. `Copies Seen` and `Image #`
are simply never looked up.

The header row is detected by recognising *any* known column name — not by
sniffing the first cell — so a sheet whose first column is `Rating` doesn't leak
its own header in as a book.

### To re-bake the snapshot

```
curl -sSL "https://docs.google.com/spreadsheets/d/1LSyUoNO50mpBUlmAEt9lHR9n7XVE7jGSeH29lT9m1Ik/gviz/tq?tqx=out:csv" -o books.csv
```

then regenerate `Styles/library-data.js` from it (rows are
`[Title, Author, Genre, Year, Rating]`).

---

## Pob's rating

**The sheet has no `Rating` column yet.** Add a column headed `Rating` holding a
number 0–5 (`4.5` works; blank means unrated) and it is picked up on the next
page load. Literal stars (`★★★★`) are also accepted.

Until at least one book is rated, the whole rating UI stays dormant — no filter
pill, no sort option, no stars in the drawer. Nothing ships in a dead state.

Once ratings exist, three things appear automatically:

- a **My rating, highest first** sort (unrated always sinks to the bottom),
- a **Pob's 5s** filter pill,
- a small **gold star** on the spine of every five-star book, and the stars in
  the detail drawer.

> This is refreshed after a live sync, not just at boot — ratings normally
> arrive from the sheet rather than the baked seed.

---

## The detail drawer

Clicking a spine lifts it off the shelf and slides a drawer in from the right
(a bottom sheet under 620px). It closes on Esc, the scrim, or the close button,
and hands focus back to the book.

**Title, author, genre, year and Pob's rating all come from the sheet.** Open
Library supplies only the cover, blurb and page count.

### Why Open Library, and not Goodreads

- **Goodreads is not possible.** The API was retired — no new keys since
  December 2020, the service is gone, there is no CORS, and scraping it from a
  visitor's browser would be blocked and against their terms.
- **Google Books was rejected after testing.** Unauthenticated requests return
  `429 quota exceeded`, so it would fail unpredictably for visitors unless a
  referrer-restricted API key were registered and exposed in client-side JS.
- **Open Library works:** no key, `access-control-allow-origin: *`, no quota.

Nothing fetched is stored. The cache is an in-memory object that dies with the
page, per the "don't store this locally" requirement.

### Match quality (measured over a 20-book sample)

| | rate |
|---|---|
| found a record | 19/20 |
| cover art | 18/20 |
| page count / blurb | 13/20 |

A strict `title + author` query runs first, falling back to a loose free-text
query. The fallback finds the right *work* but sometimes its original-language
edition — *Kafka on the Shore* comes back as 海辺のカフカ, *A Girl's Story* as
*Mémoire de fille*. **This is exactly why the drawer never displays the API's
title.** When there is no cover, the book's own spine is drawn instead of
showing a broken frame; when there is no blurb, the drawer says so plainly.

Blurbs arrive as Markdown with a trailing source credit and are stripped to
plain prose before display.

---

## Notable decisions

- **No community rating is shown.** Open Library's rating counts are thin (500
  for *The Hobbit* against Goodreads' millions; 1–5 for recent books), so a
  star figure would imply more authority than it has. The only rating on the
  page is Pob's.
- **Clicking an author resets the genre pills and the search box** rather than
  stacking on top of them. "Everything by this person" is a fresh view, not
  another facet; narrowing to *their poetry books* would surprise.
- **Genre filters are OR, not AND.** Selecting Poetry and Horror shows both.
- **A selected genre pill wears its own cloth colour.** With several active at
  once, a row of identical dark pills would say nothing.
- **Author names are only links when the author has more than one book** (53
  authors, 146 books). A link returning a single result is a tease.
- **Spine size comes from a hash of title+author, never `Math.random()`**, so a
  book is the same size on every load and never resizes while you type.
- **Horizontal spine titles require the longest word to fit** the spine width,
  not just a short title — otherwise text breaks mid-word ("Impossib / le").
- **The drawer opens via a forced reflow, not `requestAnimationFrame`.** rAF
  does not fire in a hidden or throttled tab, which left the drawer stuck off
  screen.
- **The panel slide is driven by one `--slide` variable** rather than competing
  `transform` declarations across breakpoints.

## Deliberate detector exceptions

Recorded with reasons in `.impeccable/config.json`:

- **cream palette** — paper, cloth, wood and warm ink is the committed world;
  the cream ground *is* the paper the books sit against.
- **repeating-gradient stripes** — wood grain, masked to the shelf boards only.

## Known limitations

- Roughly 1 in 20 books has no Open Library record, and about a third have no
  blurb. Both degrade gracefully.
- Open Library occasionally matches a different edition; only the cover, blurb
  and page count are taken from it, so the damage is limited.
- The baked snapshot drifts from the sheet until re-baked. Only affects the
  no-JS/offline copy — live visitors always see current data.
