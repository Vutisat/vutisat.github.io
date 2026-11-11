#!/usr/bin/env python3
"""Lately: the last four films and books Pob rated, and the last three games he played,
for the "Lately" strands on home.html.

Reads two feeds, saves each cover into assets/img/lately/ under a fixed slot name
(film-1.jpg ... book-4.jpg, so old covers are overwritten, never piled up), and writes
assets/js/lately-data.js for swatch.js to hang on the rope.

  Films: Letterboxd's public RSS (https://letterboxd.com/thepobv/rss/).
  Books: Goodreads' public bookshelf widget for Pob's "read" shelf. Goodreads hides
         the review list and its RSS from signed-out visitors and no longer shows the
         RSS link at all, but this embed endpoint is public. It always orders by DATE
         READ, so a finished book needs its "date read" set on Goodreads to come first.
         (If a shelf RSS URL with its private key is ever available, set it as the
         GOODREADS_RSS environment variable / Actions secret and it is used instead.)
  Games: the "Recent Activity" list on Pob's public Steam profile (the three games he
         played last), shown as Steam's wide 460x215 header tiles.

If a feed fails or comes back empty, that half keeps its previous data, so an outage
never blanks the section. Standard library only; run once a day by .github/workflows/lately.yml.
"""
import datetime as dt
import email.utils
import hashlib
import html
import json
import os
import re
import sys
import urllib.request
import xml.etree.ElementTree as ET

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
IMG_DIR = os.path.join(ROOT, "assets", "img", "lately")
DATA = os.path.join(ROOT, "assets", "js", "lately-data.js")
LETTERBOXD_RSS = "https://letterboxd.com/thepobv/rss/"
# Goodreads caches each widget by its id for a long time, so every day asks under a
# new id (lately-YYYYMMDD) and gets the shelf as it is now.
GOODREADS_WIDGET = ("https://www.goodreads.com/review/custom_widget/63639907.lately"
                    "?cover_size=large&num_books=4&order=d&shelf=read&show_author=1&show_cover=1"
                    "&show_rating=1&show_review=1&show_title=1&sort=date_read&widget_id=lately-{day}")
UA = "Mozilla/5.0 (compatible; vutisat.github.io lately; +https://vutisat.github.io/)"
NS = {"letterboxd": "https://letterboxd.com", "tmdb": "https://themoviedb.org"}
COUNT = 4
STEAM_PROFILE = "https://steamcommunity.com/id/pobthiti/"
STEAM_HEADER = "https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/{app}/header.jpg"
GAMES = 3


def fetch(url):
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=20) as r:
        return r.read()


def text(el, path, ns=None):
    found = el.find(path, ns or {})
    return (found.text or "").strip() if found is not None and found.text else ""


def strip_tags(s):
    return re.sub(r"\s+", " ", html.unescape(re.sub(r"<[^>]+>", " ", s or ""))).strip()


def films():
    root = ET.fromstring(fetch(LETTERBOXD_RSS))
    out = []
    for item in root.iter("item"):
        rating = text(item, "letterboxd:memberRating", NS)
        title = text(item, "letterboxd:filmTitle", NS)
        if not rating or not title:
            continue  # lists and unrated watches
        desc = text(item, "description")
        poster = re.search(r'<img src="([^"]+)"', desc)
        # anything beyond the poster and the "Watched on ..." line is a written review
        words = strip_tags(re.sub(r"<p>\s*Watched on [^<]*</p>", "", desc))
        out.append({
            "title": title,
            "year": text(item, "letterboxd:filmYear", NS),
            "rating": float(rating),
            "reviewed": bool(words),
            "url": text(item, "link"),
            "src": re.sub(r"-0-\d+-0-\d+-crop", "-0-230-0-345-crop", poster.group(1)) if poster else "",
        })
        if len(out) == COUNT:
            break
    return out


def books(url):
    root = ET.fromstring(fetch(url))
    rows = []
    for item in root.iter("item"):
        rating = text(item, "user_rating")
        if not rating or rating == "0":
            continue  # shelved but not rated
        stamp = text(item, "user_date_created") or text(item, "pubDate")
        try:
            when = email.utils.parsedate_to_datetime(stamp)
        except (TypeError, ValueError):
            when = dt.datetime.min.replace(tzinfo=dt.timezone.utc)
        rows.append((when, {
            "title": text(item, "title"),
            "author": text(item, "author_name"),
            "rating": float(rating),
            "reviewed": bool(strip_tags(text(item, "user_review"))),
            "url": text(item, "link"),
            "src": text(item, "book_large_image_url") or text(item, "book_image_url"),
        }))
    rows.sort(key=lambda r: r[0], reverse=True)
    return [r[1] for r in rows[:COUNT]]


def books_widget():
    """Parse the widget's document.write() payload: one container per book."""
    raw = fetch(GOODREADS_WIDGET.format(day=dt.date.today().strftime("%Y%m%d"))).decode("utf-8", "replace")
    s = raw.replace("\\n", "\n").replace('\\"', '"').replace("\\/", "/").replace("\\'", "'")
    out = []
    for chunk in re.split(r'<div class="gr_custom_each_container[^"]*">', s)[1:]:
        title = re.search(r'gr_custom_title[^"]*">\s*<a[^>]*href="([^"]+)"[^>]*>([^<]+)</a>', chunk)
        if not title:
            continue
        author = re.search(r'gr_custom_author[^"]*">.*?<a[^>]*>([^<]+)</a>', chunk, re.S)
        # whole stars are *_active.png; a half star is *_50pct.png (Goodreads allows halves now)
        rating = len(re.findall(r"gr_flat_red_star_active", chunk)) + \
            sum(int(p) / 100 for p in re.findall(r"gr_flat_red_star_(\d+)pct", chunk))
        if not rating:
            continue  # shelved but not rated
        img = re.search(r'gr_custom_book_container[^"]*">.*?<img[^>]+src="([^"]+)"', chunk, re.S)
        review = re.search(r'gr_custom_review[^"]*">(.*?)</div>', chunk, re.S)
        out.append({
            "title": html.unescape(title.group(2)).strip(),
            "author": html.unescape(author.group(1)).strip() if author else "",
            "rating": float(rating),
            "reviewed": bool(review and strip_tags(review.group(1))),
            "url": html.unescape(title.group(1)).split("?")[0],
            # the widget serves a 98px thumbnail; ask Goodreads' CDN for 400px tall instead
            "src": re.sub(r"\._S[XY]\d+_", "._SY400_", html.unescape(img.group(1))) if img else "",
        })
    return out[:COUNT]


def games():
    """The Recent Activity blocks on the profile page: name, store link, hours, last played."""
    req = urllib.request.Request(STEAM_PROFILE, headers={"User-Agent": UA, "Accept-Language": "en-US"})
    with urllib.request.urlopen(req, timeout=20) as r:
        s = r.read().decode("utf-8", "replace")
    out = []
    for block in re.findall(r'<div class="recent_game">(.*?)<div class="game_info_achievements', s, re.S):
        name = re.search(r'class="game_name"><a[^>]*href="([^"]+)"[^>]*>([^<]+)</a>', block)
        if not name:
            continue
        app = re.search(r"/app/(\d+)", name.group(1))
        capsule = re.search(r'class="game_capsule" src="([^"]+)"', block)
        details = re.search(r'game_info_details">(.*?)</div>', block, re.S)
        info = strip_tags(details.group(1)) if details else ""
        hours = re.search(r"([\d.,]+) hrs on record", info)
        last = re.search(r"last played on (.+)$", info)
        out.append({
            "title": html.unescape(name.group(2)).strip(),
            "hours": hours.group(1) if hours else "",
            "last": last.group(1).strip() if last else ("Playing now" if "Currently In-Game" in info else ""),
            "url": f"https://store.steampowered.com/app/{app.group(1)}/" if app else html.unescape(name.group(1)),
            "src": STEAM_HEADER.format(app=app.group(1)) if app else "",
            "fallback": html.unescape(capsule.group(1)) if capsule else "",
        })
        if len(out) == GAMES:
            break
    return out


def hang(kind, items):
    """Save each cover into its slot and swap the remote URL for the local one."""
    os.makedirs(IMG_DIR, exist_ok=True)
    for i, it in enumerate(items, 1):
        src, fallback = it.pop("src", ""), it.pop("fallback", "")
        it["cover"], it["v"] = "", ""
        data = None
        for url in (src, fallback):
            if not url:
                continue
            try:
                data = fetch(url)
                break
            except Exception as e:  # a missing cover shouldn't sink the rest
                print(f"  cover failed for {it['title']} ({url}): {e}", file=sys.stderr)
        if data is None:
            continue
        name = f"{kind}-{i}.jpg"
        path = os.path.join(IMG_DIR, name)
        old = open(path, "rb").read() if os.path.exists(path) else None
        if old != data:
            with open(path, "wb") as f:
                f.write(data)
        it["cover"] = f"assets/img/lately/{name}"
        it["v"] = hashlib.sha1(data).hexdigest()[:8]
    return items


def previous():
    try:
        raw = open(DATA, encoding="utf-8").read()
        return json.loads(raw[raw.index("{"): raw.rindex("}") + 1])
    except (OSError, ValueError):
        return {"films": [], "books": []}


def main():
    prev = previous()
    data = {k: prev.get(k, []) for k in ("films", "books", "games")}

    try:
        got = films()
        if got:
            data["films"] = hang("film", got)
        print(f"films: {len(got)}")
    except Exception as e:
        print(f"films: kept previous ({e})", file=sys.stderr)

    feed = os.environ.get("GOODREADS_RSS", "").strip()
    try:
        got = books(feed) if feed else books_widget()
        if got:
            data["books"] = hang("book", got)
        print(f"books: {len(got)} ({'rss' if feed else 'widget'})")
    except Exception as e:
        print(f"books: kept previous ({e})", file=sys.stderr)

    try:
        got = games()
        if got:
            data["games"] = hang("game", got)
        print(f"games: {len(got)}")
    except Exception as e:
        print(f"games: kept previous ({e})", file=sys.stderr)

    if all(data[k] == prev.get(k) for k in data):
        print("no change")
        return
    data = {"updated": dt.date.today().isoformat(), **data}
    with open(DATA, "w", encoding="utf-8") as f:
        f.write("/* Written by scripts/lately.py (run once a day by .github/workflows/lately.yml).\n"
                "   The last four films (Letterboxd) and books (Goodreads) Pob rated, and the last three\n"
                "   games he played (Steam). Don't edit by hand. */\n")
        f.write("window.LATELY = " + json.dumps(data, ensure_ascii=False, indent=1) + ";\n")
    print("wrote", os.path.relpath(DATA, ROOT))


if __name__ == "__main__":
    main()
