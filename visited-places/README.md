# Pob's Visited Places

Every place Pob has been since May 2015, taken from a Google Maps Timeline export,
named with the Google Places API, kept in a private Google Sheet, mapped on Google My
Maps, and shown on the site at `places.html`.

**This folder is public on GitHub, but its data isn't.** `private/` is gitignored because it
holds home, work and daily routine. Never commit it, never paste its contents into a page,
and never write the API key into any file.

## Where everything lives

| What | Where | Visible to |
|---|---|---|
| Raw export (~65 MB) | `~/Downloads/google maps Timeline.json` (Maps app → Timeline → ⋮ → Export) | Pob's Mac only |
| Script | `visited-places/timeline.py` (this folder, committed) | public, has no data |
| Working data | `visited-places/private/` (gitignored) | Pob's Mac only |
| Spreadsheet | Google Sheet **"Pob's Places"**, tab "Places" ([open](https://docs.google.com/spreadsheets/d/1cV4lh2qO1lukmESkMIcv9vEzlzfRjZvB6IRtnVvuQpo/edit)) | Pob only, unless shared |

What's in `private/`:

- `places.json`: one row per place, built from the export: location, visits, days, hours,
  first and last visit, usual weekday and hour, trips, home/work flags.
- `trips.json`: Google's own trip records (time window, km from home, destination place IDs).
- `details.json`: every Places API answer, keyed by place ID, plus a monthly lookup counter.
  This cache is why no place is ever paid for twice.
- `places.csv`: the two joined into one table, 33 columns. This is what goes into the Sheet.
- `mymaps/<Category>.csv`: one file per My Maps layer, personal places removed.

Outside `private/`, `site` writes **`assets/js/places-data.js`** for `places.html`. It's committed,
and it holds aggregates only: totals, layer counts, each country's first and last visit and
map centre, and the fun facts. It never contains addresses, and personal places are
filtered out first.

## How it flows

```
export JSON ─ aggregate ─▶ places.json + trips.json
                                │
                         enrich (Places API, cached) ─▶ details.json
                                │
                             export ─▶ places.csv ─▶ Google Sheet
```

```bash
python3 visited-places/timeline.py aggregate ~/Downloads/"google maps Timeline.json"
GOOGLE_PLACES_KEY=... python3 visited-places/timeline.py enrich     # only uncached places
python3 visited-places/timeline.py export
python3 visited-places/timeline.py mymaps   # per-layer CSVs for My Maps
python3 visited-places/timeline.py site     # assets/js/places-data.js for places.html
```

**For a new export later:** re-export from the app, then run all three steps. `aggregate`
rebuilds from the whole export, `enrich` looks up only places it has never seen, and
`export` rewrites the CSV.

**Getting the CSV into the Sheet:** the file is ~2.7 MB, too big for the Sheets connector to
write cell by cell. Copy it to the clipboard as tab-separated text and paste it at A1 in
the browser:

```bash
python3 -c "import csv,sys; w=csv.writer(sys.stdout,delimiter='\t',lineterminator='\n'); [w.writerow(r) for r in csv.reader(open('visited-places/private/places.csv'))]" | pbcopy
```

Pasting over A1 replaces the old rows. Afterwards, check the last row, because a shorter
paste leaves stale rows below it. Postal codes that start with 0 lose the zero, since
Sheets reads them as numbers.

## Google My Maps: the private map (Nov 2026)

The map **"Pob's Places"** in Google My Maps, owned by **Pob's second Google account** (the one with Pob World
Tour), shows in the Google Maps app under Saved → Maps on that account. `places.html` embeds it
(its id is `MYMAP_ID` in the script). Sharing is "anyone with the link can view" with search discovery off, because an
embed of a private map won't load inside a page: Chrome blocks Google's sign-in cookies
in iframes. It has 8 layers, one per category, coloured: Food & drink red, Transit black,
Culture purple, Other grey, Shopping orange, Attractions green, Hotels navy, Sports blue.
In total, 4,746 pins.

**Personal places are left out:** homes, work, searched or custom-labelled addresses,
residences or plain street addresses, and medical places (`personal()` in the script). In
Nov 2026 that removed 570 places, including the 168 retired place IDs that have no name.

To rebuild or refresh it:

1. `python3 visited-places/timeline.py mymaps` writes `private/mymaps/<Category>.csv`.
   My Maps allows at most 2,000 rows per layer.
2. Make one Google Sheet per CSV **in that second account's Drive**, named "Map layer - <Category>":
   open sheets.new, paste the CSV as tab-separated text, and rename it. The My Maps import
   picker only shows the signed-in account's files. Sheets created by the Drive connector
   belong to pobvuti, so the picker can't see them.
3. In the map, for each layer: Add layer → Import → pick the sheet. Position by **Lat**
   (latitude) and **Lng** (longitude), title by **Name**. Then rename the layer and set its
   colour.

A refresh means deleting the old layers and importing again. My Maps doesn't sync with a
sheet.

## What the data contains (Nov 2026 run)

- 47,604 timeline segments, 15,200 visits, **5,316 unique places**, from 2015-05-19 to 2026-11-06.
  The app says "4,895 places visited". The difference is home and work places, searched
  addresses, and "bigger places" (the mall around a shop).
- 5,148 named; 168 place IDs that Google has retired come back as "not found".
- 77 countries. Groups: Food & drink 1,982 · Transit 561 · Culture 513 · Shopping 432 ·
  Attractions 418 · Hotels 377 · Sports 67 · Other 798.
- The export itself has **no names or categories**, only place IDs and coordinates. All
  names come from the Places API.

The Category column mimics the app's groups by matching Google's place types (`GROUPS` in
the script). It's an approximation of how the app groups places, not the app's own
data.

## Google Cloud

- Project **"Pob's website"** holds the key. The key is restricted to **Places API (New) only**.
  The key is kept in an environment variable and nowhere else. If it ever appears in a
  chat or a file, rotate it (Credentials → Rotate key).
- Billing is linked to "My Billing Account", a **free trial** ($300 credit, 90 days from
  Nov 2026). A free trial never charges the card unless someone clicks **Upgrade**.
- Cost guards, strongest first:
  1. The script's own counter: `enrich` stops at `--cap` lookups per calendar month (default 4,500).
  2. The free trial (see above).
  3. A $1/month budget email alert. It's alert-only; it doesn't stop anything.
- Two things that **don't** work for Places on this account: hard spend caps (only Cloud Run,
  Cloud Run Functions, Gemini and Vertex are eligible), and lowering the Places quotas
  (they show "Adjustable: No").
- Without billing, the API still works but allows only about 120 lookups a day.
- **Never touch the `traptimer` project.** It's separate.

## Places API: what a lookup can return

Each lookup is billed at the most expensive tier among the fields requested. Free
allowances are per calendar month. Prices and allowances below are as of Nov 2026; check
Google's pricing page before relying on them.

| Tier (free / month) | Fields | Fetched? |
|---|---|---|
| Essentials (10,000) | `addressComponents`, `formattedAddress`, `location`, `types` | ✅ |
| | `shortFormattedAddress`, `plusCode`, `viewport`, `postalAddress`, `adrFormatAddress` | ❌ |
| Pro (5,000) | `displayName`, `primaryType`, `primaryTypeDisplayName`, `businessStatus`, `googleMapsUri` | ✅ |
| | `timeZone`, `utcOffsetMinutes`, `photos`, `containingPlaces`, `accessibilityOptions`, `googleMapsLinks`, `iconMaskBaseUri` | ❌ (same tier, so they'd have been free in the same call) |
| Enterprise (1,000) | `rating`, `userRatingCount`, `priceLevel`, `priceRange`, `websiteUri`, phone numbers, opening hours | ❌ |
| Enterprise + Atmosphere (1,000) | `reviews`, `editorialSummary`, `generativeSummary`, dine-in / takeout / delivery / reservable, outdoor seating, live music, dogs, kids, parking, payment options | ❌ |

Fields are chosen by `FIELDS` in the script. To add some later:

1. Add them to `FIELDS`.
2. Clear the cache for the places you want refreshed. As written, `enrich` skips every place
   already in `details.json`, so this needs a small "refresh" mode in the script.
3. Run within the allowance for the most expensive tier you added.

Options when last considered (not done):
- **Rating, website, hours and price for the top 1,000 places:** free in one month.
- **The same for all 5,316:** ~$85, or ~6 months of free allowance.
- **Photos, time zone and surrounding place for all:** one Pro pass.
- Photo **images** are a separate Place Photos call with its own price.

**Terms note:** Google Maps Platform terms allow storing place IDs indefinitely, but
expect other Places content (names, addresses) to be refreshed rather than kept forever.
For a private personal list this is low-stakes. The Place ID column is what lets anything
be looked up again.

## Still to do

- `places.html` is `noindex` and not linked from the hub yet. Add it to `home.html` when
  it's ready to be found.
- My Maps doesn't sync with the Sheet, so after a new export the layers need re-importing
  (see the My Maps section).
