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

Its `first_publish_year` used to be shown when it *disagreed* with the sheet,
which meant it only ever appeared when it was wrong: Open Library dates
*Macbeth* to 1508, *Slaughterhouse-Five* to 1956 and *The Little Prince* to
2003. The row is gone. The sheet's year is authoritative and already sits
beside the genre chip.

The description is a second request, against the work rather than the search
index, so it is only made when something actually needs prose. The card view
asks for covers by the hundred and skips it; the drawer asks for both, and if a
card already fetched the cover it pays only for the description.

The author in the drawer is the same run link the shelf uses, and it needs its
own click delegation: the drawer sits outside `#results`, so the shelf's
delegation never saw it. Following it closes the drawer, because the filter it
applies is a fresh view of the shelf behind and the scrim would otherwise dim
the very result you asked for. Focus lands on *show every author again*.

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

## The address bar

Every view of the page is a place, and all of it lives in the query string:
`q`, `genre` (comma-separated families), `author`, `five`, `sort`, `view` and
`book` (a slug of the title). Defaults are omitted, so the plain shelf is a
bare URL. Anything unrecognised is dropped on the next render, and the three
maps a reader's URL can reach — `FAMILY_NAME`, `authorCount`, `bySlug` — are
`Object.create(null)`, so `?book=constructor` finds nothing rather than
crashing the page.

**Only two moves push a history entry: opening a book, and jumping to an
author.** Typing in the search box or toggling a genre replaces instead, so
Back means "close this drawer" or "go back to everything", never "undo one
keystroke". Back out of an open drawer and it closes; the filter behind it
survives. `popstate` re-reads the URL and re-applies the whole state, and a
lock stops the renders that causes from writing the URL back.

Slugs are the title, and only collide if two books ever share one; a second
book with the same title takes the author's surname, a third takes a number.

---

## The card view

Cards carry cover art. Each one is fetched from Open Library when the card gets
within half a screen of the viewport, never up front and never for cards nobody
scrolls to, with at most five requests in the air. The queue is a **stack, not
a line** — scrolling a long way fast leaves a hundred cards waiting, and a
reader who has reached row 30 does not want row 4 fetched first.

Answers land in the same in-memory cache the drawer uses, so opening a book
whose cover you have already seen costs nothing. When there is no cover on
file, no network, or `saveData` is set, the card draws the book's own spine
instead — the same `.noart` the drawer falls back to. A row is never a grid of
empty frames.

Each render starts a new cover "generation". Requests still in the air belong
to the previous one: they finish and fill the cache, but no longer touch the
in-flight counter, which is what stops a burst of view switching from pinning
it at the limit forever.

---

## The lamp

A night palette, opt-in, remembered in `localStorage` under `lib-lamp` and
stamped on `<html data-theme>` by a short script in the `<head>` so a returning
reader never sees the day palette flash past.

It is not an inversion. The wall goes to unlit walnut, the boards keep their
grain, a warm pool falls from the top right, and every spine is its own
daylight cloth lifted about 11% in lightness — far enough to read by lamplight,
never far enough to lose the cream stamped on it. Each night cloth still clears
4.6:1 against the stamping and 2.2:1 against the wall behind it.

Two things made this possible without rewriting the sheet:

- **`--on-cloth`** was split out of `--paper`. Everywhere `--paper` meant "the
  cream printed on a spine, a chip or a genre pill" it now says `--on-cloth`,
  which does not change with the room. The wall changes; the stamping does not.
- **`--sh`** holds the shadow colour as an RGB triplet (`44,32,21` by day,
  `0,0,0` at night). Black shadows are invisible after dark, so a spine earns
  its edge from a thin rim of lamplight instead.

**System dark is deliberately not followed.** The rest of pobv.dev is a light
site; a reader who never touches the lamp gets the same room on every page.

---

## Two things that are not books

- **The 342nd book.** One extra spine stands at the end of the last shelf, in
  dark leather stamped in gold: `pobv.dev`, by Pob, 2026. Its drawer is written
  by hand rather than fetched. It is kept out of `books` entirely, so it never
  moves the count, reaches the search index, survives a filter, or gets looked
  up on Open Library — and it only appears on the shelf view with nothing
  filtered.
- **The library cat.** One slot on one shelf holds a sleeping cat instead of a
  book. She takes an ordinary slot, so flex-wrap settles her between two spines
  wherever the row happens to break and she sits on the ledge exactly as the
  books do. Click her and she stretches. Where she settled is picked once per
  visit and held as a *fraction* of the shelf, so re-sorting moves her with the
  books rather than teleporting her. Both appear only on a full, unfiltered
  shelf: a cat asleep in the middle of four search results is a bug, not a joke.

---

## The carousel

A third view alongside Shelf and Cards: one endless horizontal shelf.

The list is painted as **three identical segments** and the scroll position is
kept inside the middle one — whenever it drifts into an outer segment the rail
shifts back by exactly one segment width. Because the content repeats with that
period the jump is invisible, so it scrolls forever in either direction.

- A narrow filter would not fill the rail, so the list repeats within each
  segment until one segment overflows the viewport (3 poetry books become 48 per
  segment). Verified down to a single matching book.
- Only the middle segment is in the tab order and the accessibility tree; the
  flanking copies are `aria-hidden` decoration that happens to be made of books.
- Spines in the carousel omit the hover peek card. A thousand absolutely
  positioned cards is the expensive part, and the drawer already covers detail.
  It costs 89ms and 5118 nodes, against 16ms and 3395 for the shelf.
- Drag-to-scroll suppresses the click that would otherwise open a book.
- **No vertical-wheel hijack.** The rail scrolls forever, so capturing the wheel
  would trap the reader: hovering the books, they could never scroll past to the
  footer. Sideways trackpad gestures and shift+wheel work natively; drag and the
  arrow buttons cover the rest.

## Typesetting the spines

Nobody should have to tilt their head at a shelf, so every title is printed
across its spine rather than down it. That only works if a spine is wide enough
for its own longest word, so `typeset()` in `library.js` measures the title
first and cuts the spine to fit it, the way a real book is bound around its
pages.

- `ADV` holds EB Garamond's advance widths, measured once from the shipped
  woff2 and stored in hundredths of an em. Measuring in a canvas at run time
  would be exact, but it cannot answer until the font has loaded, and these
  numbers set the width of every book on the wall: the whole shelf would reflow
  under the reader a moment after it painted.
- A spine is the wider of its hash jitter (44 to 61px, so the shelf does not
  march in lockstep) and what its longest word needs, capped at 78px.
- Type opens at 11px and steps down only if the title still will not fit the
  height. **332 of the 341 books sit at the full 11px**; the nine that step down
  land between 8.4 and 10.9px, close enough that the shelf still reads as one
  size.
- Height is measured against the *shortest* shelf band, the 186px one phones
  get, so a spine keeps its size when the layout crosses the 760px breakpoint.
- Line breaks are allowed after a hyphen, matching the browser's own line
  breaker, which is what lets *Slaughterhouse-Five* and *The E-Myth Revisited*
  fit spines their unbroken words never would.
- Verified across all 341: no title overflows its column, and none is clipped
  by its spine, at both 1440px and the narrowest layout.

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
- **Every title prints across its spine, never down it.** See below.
- **The drawer opens via a forced reflow, not `requestAnimationFrame`.** rAF
  does not fire in a hidden or throttled tab, which left the drawer stuck off
  screen.
- **The panel slide is driven by one `--slide` variable** rather than competing
  `transform` declarations across breakpoints.
- **The lamp does not follow `prefers-color-scheme`.** See *The lamp* above.
- **Covers are loaded newest-request-first**, and only for cards a reader has
  actually scrolled towards.

## Deliberate detector exceptions

Recorded with reasons in `.impeccable/config.json`:

- **cream palette** — paper, cloth, wood and warm ink is the committed world;
  the cream ground *is* the paper the books sit against.
- **repeating-gradient stripes** — wood grain, masked to the shelf boards only.

## Known limitations

- Roughly 1 in 20 books has no Open Library record, and about a third have no
  blurb. Both degrade gracefully.
- Open Library occasionally matches a different edition; only the cover, blurb
  and page count are taken from it, so the damage is limited. Now that the card
  view shows covers, a bad match is visible rather than hidden: *813* comes
  back as a Japanese edition, and *The Little Prince* still reports 10 pages
  from a picture-book adaptation.
- A trailing cataloguing credit ("- Container.", "- Back cover") is stripped
  from blurbs against a **closed list**. An unlisted credit will still show: a
  short tail after a dash is far more often a real clause than a credit, and
  eating real prose is the worse failure.
- The baked snapshot drifts from the sheet until re-baked. Only affects the
  no-JS/offline copy — live visitors always see current data.
