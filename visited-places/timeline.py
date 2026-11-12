#!/usr/bin/env python3
"""Timeline: every place Pob has been, from a Google Maps Timeline export.

The export (Maps app > Timeline > Export) holds visits as a place ID + lat/long only;
the names and categories the app shows come from Google's place database. So this
works in three steps, all writing into visited-places/private/ (gitignored, never committed):

  aggregate  Read the export and fold its ~15k visits into one row per place:
             visits, first/last visit, hours spent, home/work flags.  -> places.json
             Free, no key. Rerun on every new export; it only adds and updates.

  enrich     Look up each place's name, category, address and Maps link with the
             Places API (New), most-visited first, caching every answer forever in
             details.json so no place is ever paid for twice. The fields used are the
             "Place Details Pro" SKU, which has 5,000 free calls a month, so each run
             stops at a monthly cap (default 4,500, kept in details.json) and the rest
             waits for next month's run. Key from the GOOGLE_PLACES_KEY environment
             variable; never put it in a file in this repo.

  export     Join the two into places.csv, one row per place, for the Google Sheet.

  mymaps     Split places.csv into one CSV per category, minus personal places (homes,
             work, plain addresses, medical), for Google My Maps layers.

  site       Write assets/js/places-data.js for places.html from the same filtered rows:
             totals, layer counts, and each country's first visit and map centre.

  python3 visited-places/timeline.py aggregate ~/Downloads/"google maps Timeline.json"
  GOOGLE_PLACES_KEY=... python3 visited-places/timeline.py enrich [--cap 4500]
  python3 visited-places/timeline.py export

Standard library only.
"""
import argparse
import collections
import csv
import datetime as dt
import json
import math
import os
import sys
import urllib.error
import urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "private")
PLACES = os.path.join(OUT, "places.json")
DETAILS = os.path.join(OUT, "details.json")
TRIPS = os.path.join(OUT, "trips.json")
STATS = os.path.join(OUT, "stats.json")
CSV = os.path.join(OUT, "places.csv")

# One SKU per call is billed at the priciest field asked for; these are all
# Essentials or Pro (no ratings, photos or hours, which are Enterprise).
FIELDS = ("id,displayName,primaryType,primaryTypeDisplayName,types,formattedAddress,"
          "addressComponents,googleMapsUri,businessStatus,location")
PRIVATE_TYPES = {"HOME", "INFERRED_HOME", "WORK", "INFERRED_WORK"}

# The Maps app's Places tab groups, matched on a place's Google types, first hit wins.
GROUPS = [
    ("Hotels", {"lodging", "hotel", "motel", "hostel", "resort_hotel", "bed_and_breakfast",
                "inn", "guest_house", "extended_stay_hotel", "campground"}),
    ("Transit", {"airport", "international_airport", "train_station", "transit_station",
                 "subway_station", "bus_station", "ferry_terminal", "light_rail_station"}),
    ("Food & drink", {"restaurant", "cafe", "bar", "bakery", "meal_takeaway", "food",
                      "coffee_shop", "fast_food_restaurant", "pub", "night_club", "ice_cream_shop",
                      "food_court", "brewery", "winery", "wine_bar", "dessert_shop", "tea_house"}),
    ("Culture", {"museum", "art_gallery", "library", "performing_arts_theater", "church",
                 "place_of_worship", "hindu_temple", "mosque", "synagogue", "book_store",
                 "cultural_center", "historical_landmark", "monument", "concert_hall",
                 "movie_theater", "opera_house"}),
    ("Sports", {"gym", "fitness_center", "stadium", "sports_complex", "swimming_pool",
                "sports_club", "arena", "golf_course", "ski_resort", "bowling_alley",
                "athletic_field", "yoga_studio"}),
    ("Attractions", {"tourist_attraction", "amusement_park", "zoo", "aquarium", "park",
                     "national_park", "beach", "hiking_area", "natural_feature", "observation_deck",
                     "visitor_center", "marina", "botanical_garden", "garden", "plaza"}),
    ("Shopping", {"store", "shopping_mall", "supermarket", "grocery_store", "clothing_store",
                  "department_store", "convenience_store", "market", "electronics_store",
                  "pharmacy", "drugstore", "home_goods_store", "liquor_store"}),
]


def load(path, default):
    if os.path.exists(path):
        with open(path, encoding="utf-8") as f:
            return json.load(f)
    return default


def save(path, data):
    os.makedirs(OUT, exist_ok=True)
    tmp = path + ".tmp"
    with open(tmp, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=1)
    os.replace(tmp, path)


def latlng(s):
    lat, lng = s.replace("°", "").split(",")
    return round(float(lat), 6), round(float(lng), 6)


def local_time(stamp, offset_min):
    """Export stamps carry the phone's zone; the visit's own UTC offset gives local time."""
    t = dt.datetime.fromisoformat(stamp)
    if offset_min is not None:
        t = t.astimezone(dt.timezone(dt.timedelta(minutes=offset_min)))
    return t


def aggregate(export_path):
    with open(export_path, encoding="utf-8") as f:
        segments = json.load(f)["semanticSegments"]
    # Google's own "trips" (timelineMemory): a time window, distance from home, destinations.
    trips = []
    for seg in segments:
        trip = seg.get("timelineMemory", {}).get("trip")
        if trip:
            trips.append({
                "start": seg["startTime"], "end": seg["endTime"],
                "km": trip.get("distanceFromOriginKms"),
                "destinations": [d["identifier"]["placeId"] for d in trip.get("destinations", [])
                                 if d.get("identifier", {}).get("placeId")]})
    trips.sort(key=lambda t: t["start"])
    windows = [(dt.datetime.fromisoformat(t["start"]), dt.datetime.fromisoformat(t["end"]))
               for t in trips]
    places = {}
    for seg in segments:
        visit = seg.get("visit")
        if not visit:
            continue
        top = visit["topCandidate"]
        pid = top.get("placeId")
        if not pid or "placeLocation" not in top:
            continue
        start = local_time(seg["startTime"], seg.get("startTimeTimezoneUtcOffsetMinutes"))
        end = local_time(seg["endTime"], seg.get("endTimeTimezoneUtcOffsetMinutes"))
        p = places.get(pid)
        if p is None:
            lat, lng = latlng(top["placeLocation"]["latLng"])
            p = places[pid] = {"placeId": pid, "lat": lat, "lng": lng, "visits": 0,
                               "minutes": 0, "longest": 0, "first": None, "last": None,
                               "days": [], "weekdays": [0] * 7, "hours": [0] * 24,
                               "confidence": 0.0, "trips": [],
                               "semantic": [], "parentOnly": True}
        mins = max(0, round((end - start).total_seconds() / 60))
        p["visits"] += 1
        p["minutes"] += mins
        p["longest"] = max(p["longest"], mins)
        p["confidence"] += visit.get("probability", 0)
        stamp = start.strftime("%Y-%m-%d %H:%M")
        p["first"] = min(p["first"] or stamp, stamp)
        p["last"] = max(p["last"] or stamp, stamp)
        day = start.date().isoformat()
        if day not in p["days"]:
            p["days"].append(day)
        p["weekdays"][start.weekday()] += 1
        p["hours"][start.hour] += 1
        for i, (a, b) in enumerate(windows):
            if a <= start <= b and i not in p["trips"]:
                p["trips"].append(i)
        if top["semanticType"] not in p["semantic"]:
            p["semantic"].append(top["semanticType"])
        # hierarchyLevel 1 is the place around another (the mall around the shop).
        if visit.get("hierarchyLevel", 0) == 0:
            p["parentOnly"] = False
    rows = sorted(places.values(), key=lambda p: (-p["visits"], p["placeId"]))
    for p in rows:
        p["private"] = bool(PRIVATE_TYPES & set(p["semantic"]))
        p["confidence"] = round(p["confidence"] / p["visits"], 3)
        p["days"].sort()
    save(PLACES, rows)
    save(TRIPS, trips)
    # How Pob got between places: distance, count and longest leg per travel mode.
    modes = {}
    for seg in segments:
        act = seg.get("activity")
        if not act:
            continue
        kind = act.get("topCandidate", {}).get("type", "UNKNOWN_ACTIVITY_TYPE")
        km = act.get("distanceMeters", 0) / 1000
        m = modes.setdefault(kind, {"count": 0, "km": 0.0, "longest": 0.0})
        m["count"] += 1
        m["km"] += km
        m["longest"] = max(m["longest"], km)
    save(STATS, {"modes": {k: {"count": v["count"], "km": round(v["km"]), "longest": round(v["longest"])}
                           for k, v in modes.items()}})
    print(f"{len(segments)} segments -> {len(rows)} places "
          f"({sum(p['private'] for p in rows)} home/work, "
          f"{sum(p['parentOnly'] for p in rows)} parent-only), "
          f"{rows[-1:] and min(p['first'] for p in rows)} to {max(p['last'] for p in rows)}")


def fetch(pid, key):
    req = urllib.request.Request(
        f"https://places.googleapis.com/v1/places/{pid}",
        headers={"X-Goog-Api-Key": key, "X-Goog-FieldMask": FIELDS})
    try:
        with urllib.request.urlopen(req, timeout=20) as r:
            return json.load(r)
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8", "replace")
        if e.code in (400, 404):  # retired or unknown place ID: remember it, don't retry
            return {"error": e.code, "message": body[:300]}
        if e.code == 429:  # Google's daily allowance is used up; tomorrow's run carries on
            raise SystemExit("Places API daily quota reached; run again tomorrow.")
        raise SystemExit(f"Places API {e.code} on {pid}: {body[:500]}")


def enrich(cap):
    key = os.environ.get("GOOGLE_PLACES_KEY")
    if not key:
        sys.exit("Set GOOGLE_PLACES_KEY in the environment first.")
    places = load(PLACES, None)
    if places is None:
        sys.exit("Run aggregate first.")
    cache = load(DETAILS, {"usage": {}, "places": {}})
    month = dt.date.today().strftime("%Y-%m")
    used = cache["usage"].get(month, 0)
    todo = [p["placeId"] for p in places if p["placeId"] not in cache["places"]]
    print(f"{len(todo)} places to look up; {used}/{cap} used in {month}")
    done = 0
    try:
        for pid in todo:
            if used >= cap:
                break
            cache["places"][pid] = fetch(pid, key)
            used += 1
            done += 1
            cache["usage"][month] = used
            if done % 100 == 0:
                save(DETAILS, cache)
                print(f"  {done} looked up")
    finally:  # a refused call (quota, no billing) still keeps everything fetched so far
        save(DETAILS, cache)
    left = len(todo) - done
    print(f"Looked up {done}; {used}/{cap} used in {month}; {left} left"
          + (" for next month" if left else ""))


def component(d, kind):
    for c in d.get("addressComponents", []):
        if kind in c.get("types", []):
            return c.get("longText", "")
    return ""


def group(d):
    types = set(d.get("types", [])) | {d.get("primaryType", "")}
    for name, members in GROUPS:
        if types & members:
            return name
    return "Other" if d.get("displayName") else ""


CONTINENTS = {
    "Africa": "DZ AO BJ BW BF BI CV CM CF TD KM CG CD CI DJ EG GQ ER SZ ET GA GM GH GN GW KE LS LR "
              "LY MG MW ML MR MU YT MA MZ NA NE NG RE RW SH ST SN SC SL SO ZA SS SD TZ TG TN UG EH ZM ZW",
    "Asia": "AF AM AZ BH BD BT BN KH CN CY GE HK IN ID IR IQ IL JP JO KZ KW KG LA LB MO MY MV MN MM "
            "NP KP OM PK PS PH QA SA SG KR LK SY TW TJ TH TL TR TM AE UZ VN YE",
    "Europe": "AL AD AT BY BE BA BG HR CZ DK EE FO FI FR DE GI GR GG HU IS IE IM IT JE XK LV LI LT LU "
              "MT MD MC ME NL MK NO PL PT RO RU SM RS SK SI ES SJ SE CH UA GB VA AX",
    "North America": "AI AG AW BS BB BZ BM BQ VG CA KY CR CU CW DM DO SV GL GD GP GT HT HN JM MQ MX MS "
                     "NI PA PR BL KN LC MF PM VC SX TT TC US VI",
    "South America": "AR BO BR CL CO EC FK GF GY PY PE SR UY VE",
    "Oceania": "AS AU CK FJ PF GU KI MH FM NR NC NZ NU NF MP PW PG PN WS SB TK TO TV VU WF",
    "Antarctica": "AQ",
}
CONTINENT = {code: name for name, codes in CONTINENTS.items() for code in codes.split()}
WEEKDAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]


def component_short(d, kind):
    for c in d.get("addressComponents", []):
        if kind in c.get("types", []):
            return c.get("shortText", "")
    return ""


def city(d):
    return (component(d, "locality") or component(d, "postal_town")
            or component(d, "administrative_area_level_2")
            or component(d, "administrative_area_level_1"))


def km(lat1, lng1, lat2, lng2):
    lat1, lng1, lat2, lng2 = map(math.radians, (lat1, lng1, lat2, lng2))
    a = (math.sin((lat2 - lat1) / 2) ** 2
         + math.cos(lat1) * math.cos(lat2) * math.sin((lng2 - lng1) / 2) ** 2)
    return round(6371 * 2 * math.asin(math.sqrt(a)))


def trip_label(t, visited, details):
    """Like "Oct 2017: Los Angeles, Santa Monica (2471 km)": Google's trip destinations,
    else the cities most visited during the trip."""
    cities = []
    for pid in t["destinations"]:
        c = city(details.get(pid, {})) or (details.get(pid, {}).get("displayName") or {}).get("text")
        if c and c not in cities:
            cities.append(c)
    for c, _ in visited.most_common():
        if c not in cities:
            cities.append(c)
    when = dt.datetime.fromisoformat(t["start"]).strftime("%b %Y")
    where = ", ".join(cities[:4]) + ("…" if len(cities) > 4 else "")
    return f"{when}: {where or 'trip'}" + (f" ({t['km']} km)" if t.get("km") else "")


def export():
    places = load(PLACES, [])
    trips = load(TRIPS, [])
    details = load(DETAILS, {"places": {}})["places"]
    homes = [p for p in places if "HOME" in p["semantic"]]
    home = max(homes, key=lambda p: p["last"]) if homes else None  # where Pob lives now
    visited = [collections.Counter() for _ in trips]
    for p in places:
        c = city(details.get(p["placeId"], {}))
        for i in p["trips"]:
            if c:
                visited[i][c] += p["visits"]
    labels = [trip_label(t, visited[i], details) for i, t in enumerate(trips)]
    cols = ["Name", "Category", "Type", "Google types", "Neighborhood", "City", "State / region",
            "Country", "Country code", "Continent", "Postal code", "Address",
            "Visits", "Days visited", "Years visited", "Total hours", "Avg visit (min)",
            "Longest visit (h)", "First visit", "Last visit", "Usual day", "Usual arrival",
            "Trips", "Km from home", "Home/work", "Timeline label", "Only as a bigger place",
            "Avg confidence", "Business status", "Lat", "Lng", "Google Maps", "Place ID"]
    with open(CSV, "w", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow(cols)
        for p in places:
            d = details.get(p["placeId"], {})
            code = component_short(d, "country")
            years = sorted({day[:4] for day in p["days"]})
            w.writerow([
                (d.get("displayName") or {}).get("text", ""),
                group(d),
                (d.get("primaryTypeDisplayName") or {}).get("text", ""),
                ", ".join(t for t in d.get("types", [])
                          if t not in ("point_of_interest", "establishment")),
                component(d, "neighborhood") or component(d, "sublocality_level_1")
                or component(d, "sublocality"),
                city(d),
                component(d, "administrative_area_level_1"),
                component(d, "country"),
                code,
                CONTINENT.get(code, ""),
                component(d, "postal_code"),
                d.get("formattedAddress", ""),
                p["visits"],
                len(p["days"]),
                ", ".join(years),
                round(p["minutes"] / 60, 1),
                round(p["minutes"] / p["visits"]),
                round(p["longest"] / 60, 1),
                p["first"], p["last"],
                WEEKDAYS[p["weekdays"].index(max(p["weekdays"]))],
                f"{p['hours'].index(max(p['hours'])):02d}:00",
                " | ".join(labels[i] for i in p["trips"]),
                km(home["lat"], home["lng"], p["lat"], p["lng"]) if home else "",
                "yes" if p["private"] else "",
                ", ".join(s.replace("_", " ").title() for s in p["semantic"] if s != "UNKNOWN"),
                "yes" if p["parentOnly"] else "",
                p["confidence"],
                "not found" if "error" in d else d.get("businessStatus", ""),
                p["lat"], p["lng"],
                d.get("googleMapsUri")
                or f"https://www.google.com/maps/place/?q=place_id:{p['placeId']}",
                p["placeId"],
            ])
    named = sum(1 for p in places if details.get(p["placeId"], {}).get("displayName"))
    print(f"Wrote {CSV}: {len(places)} places, {named} named, {len(cols)} columns")


# Left off anything shared (My Maps layers, a future public page): where people live,
# plain addresses, and health visits.
RESIDENTIAL = {"street_address", "premise", "subpremise", "route", "intersection", "plus_code",
               "apartment_building", "apartment_complex", "condominium_complex",
               "housing_complex", "residential_building"}
MEDICAL = {"doctor", "dentist", "dental_clinic", "hospital", "medical_clinic", "medical_lab",
           "physiotherapist", "chiropractor", "psychologist", "psychiatrist", "health",
           "skin_care_clinic", "wellness_center"}


def personal(row):
    """Why a place counts as personal, or "" if it's fine to show."""
    types = set(row["Google types"].split(", "))
    if not row["Name"]:
        return "no name (retired place ID)"
    if row["Home/work"]:
        return "home or work"
    if row["Timeline label"]:  # searched addresses and custom-labelled places
        return "timeline label: " + row["Timeline label"]
    if types & RESIDENTIAL or row["Type"] in ("Building", "Apartment Building", "Apartment Complex",
                                              "Condominium Complex", "Housing Complex"):
        return "residence or plain address"
    if types & MEDICAL:
        return "medical"
    return ""


def mymaps():
    """One CSV per category in private/mymaps/, for Google My Maps layers (2,000 rows max each)."""
    with open(CSV, encoding="utf-8") as f:
        rows = list(csv.DictReader(f))
    cols = ["Name", "Category", "Type", "City", "Country", "Visits", "First visit", "Last visit",
            "Years visited", "Google Maps", "Lat", "Lng"]
    out = os.path.join(OUT, "mymaps")
    os.makedirs(out, exist_ok=True)
    layers, dropped = collections.defaultdict(list), collections.Counter()
    for r in rows:
        why = personal(r)
        if why:
            dropped[why] += 1
        else:
            layers[r["Category"]].append([r[c] for c in cols])
    for cat, items in layers.items():
        with open(os.path.join(out, f"{cat.replace(' & ', ' and ')}.csv"), "w",
                  newline="", encoding="utf-8") as f:
            w = csv.writer(f)
            w.writerow(cols)
            w.writerows(items)
        print(f"  {cat}: {len(items)}" + ("  (over 2,000: split it)" if len(items) > 2000 else ""))
    print(f"Kept {sum(map(len, layers.values()))}; left out "
          + ", ".join(f"{n} {why}" for why, n in dropped.most_common()))


# The My Maps map places.html embeds (on Pob's second Google account), and its layer colours.
MYMAP_ID = "1qNKbzlGN0JvqP2t0xUbmEoV3pOKFli4"
LAYER_COLOURS = {"Food & drink": "#E5484D", "Transit": "#1C1C1E", "Culture": "#7B3FA0",
                 "Other": "#7A7A7A", "Shopping": "#F2A51A", "Attractions": "#4E8A2B",
                 "Hotels": "#1F2A78", "Sports": "#1C88C7"}
# Chains counted for the "same brand, different door" fact (name prefix match).
BRANDS = ["McDonald's", "Starbucks", "Target", "Popeyes", "Wendy's", "Dunkin'", "Taco Bell",
          "Chipotle", "Burger King", "7-Eleven", "Shake Shack", "Five Guys", "Raising Cane's",
          "Barnes & Noble", "Chick-fil-A", "Domino's", "Panera", "Nordstrom", "Carrefour",
          "Woolworths", "Kroger", "Buffalo Wild Wings"]
# Google's admin names, shown the way people say them.
CITY_NAMES = {"Krung Thep Maha Nakhon": "Bangkok", "Kings County": "Brooklyn",
              "Queens County": "Queens", "Bronx County": "The Bronx"}
# UN member states plus the two observers (Vatican, Palestine), by continent, for the
# "how many left" count. Taiwan, Hong Kong, Kosovo and the like count as extras.
SOVEREIGN = {
    "Africa": "DZ AO BJ BW BF BI CV CM CF TD KM CG CD CI DJ EG GQ ER SZ ET GA GM GH GN GW KE LS LR LY "
              "MG MW ML MR MU MA MZ NA NE NG RW ST SN SC SL SO ZA SS SD TZ TG TN UG ZM ZW",
    "Asia": "AF AM AZ BH BD BT BN KH CN CY GE IN ID IR IQ IL JP JO KZ KW KG LA LB MY MV MN MM NP KP "
            "OM PK PH QA SA SG KR LK SY TJ TH TL TR TM AE UZ VN YE PS",
    "Europe": "AL AD AT BY BE BA BG HR CZ DK EE FI FR DE GR HU IS IE IT LV LI LT LU MT MD MC ME NL MK "
              "NO PL PT RO RU SM RS SK SI ES SE CH UA GB VA",
    "North America": "AG BS BB BZ CA CR CU DM DO SV GD GT HT HN JM MX NI PA KN LC VC TT US",
    "South America": "AR BO BR CL CO EC GY PY PE SR UY VE",
    "Oceania": "AU FJ KI MH FM NR NZ PW PG WS SB TO TV VU",
    "Antarctica": "",
}
PINS = os.path.join(os.path.dirname(HERE), "assets", "js", "places-pins.json")
SITE_DATA = os.path.join(os.path.dirname(HERE), "assets", "js", "places-data.js")


def site():
    """Aggregates for places.html, from the same rows as the My Maps layers: totals, layer
    counts, and per country its first/last visit and a centre to fly the map to. No addresses."""
    with open(CSV, encoding="utf-8") as f:
        rows = [r for r in csv.DictReader(f) if not personal(r)]
    layers = collections.Counter(r["Category"] for r in rows)
    by_country = collections.defaultdict(list)
    for r in rows:
        if r["Country"]:
            by_country[(r["Country"], r["Country code"], r["Continent"])].append(r)

    def centre(items):
        lats = sorted(float(r["Lat"]) for r in items)
        lngs = sorted(float(r["Lng"]) for r in items)
        pick = lambda xs, q: xs[min(len(xs) - 1, int(q * len(xs)))]
        span = max(pick(lats, .9) - pick(lats, .1), pick(lngs, .9) - pick(lngs, .1), .05)
        zoom = max(3, min(7, round(math.log2(360 / span)) - 2))
        return round(pick(lats, .5), 4), round(pick(lngs, .5), 4), zoom

    countries = []
    for (name, code, continent), items in by_country.items():
        lat, lng, zoom = centre(items)
        countries.append({"name": name, "code": code, "continent": continent,
                          "first": min(r["First visit"] for r in items)[:10],
                          "last": max(r["Last visit"] for r in items)[:10],
                          "places": len(items), "lat": lat, "lng": lng, "zoom": zoom})
    countries.sort(key=lambda c: c["first"])

    # Fun facts, all counted from the same rows.
    def where(r):
        c = CITY_NAMES.get(r["City"], r["City"])
        return {"name": r["Name"], "city": c, "country": r["Country"]}
    places_by_id = {p["placeId"]: p for p in load(PLACES, [])}
    days = set()
    for r in rows:
        days.update(places_by_id.get(r["Place ID"], {}).get("days", []))
    airports = [r for r in rows if "airport" in r["Google types"].split(", ")
                or r["Type"].endswith("Airport")]
    busiest = max(airports, key=lambda r: int(r["Visits"]), default=None)
    brands = []
    for b in BRANDS:
        n = sum(1 for r in rows if r["Category"] in ("Food & drink", "Shopping")
                and r["Name"].replace("’", "'").startswith(b))
        if n >= 3:
            brands.append({"name": b, "count": n})
    brands.sort(key=lambda b: -b["count"])
    cities = collections.Counter(CITY_NAMES.get(r["City"], r["City"]) for r in rows if r["City"])
    types = collections.Counter(r["Type"] for r in rows if r["Type"])
    far = max(rows, key=lambda r: float(r["Km from home"] or 0))
    years = sorted({r["First visit"][:4] for r in rows})
    facts = {
        "hours": round(sum(float(r["Total hours"]) for r in rows)),
        "days": len(days),
        "airports": len(airports),
        "busiestAirport": {"name": busiest["Name"], "visits": int(busiest["Visits"])} if busiest else None,
        "brands": brands[:8],
        "north": where(max(rows, key=lambda r: float(r["Lat"]))),
        "south": where(min(rows, key=lambda r: float(r["Lat"]))),
        "east": where(max(rows, key=lambda r: float(r["Lng"]))),
        "west": where(min(rows, key=lambda r: float(r["Lng"]))),
        "farthest": dict(where(far), km=int(float(far["Km from home"]))),
        "cities": [{"name": n, "count": k} for n, k in cities.most_common(6)],
        "types": [{"name": n, "count": k} for n, k in types.most_common(40)
                  if n in ("Hotel", "Museum", "Subway Station", "Bar", "Park", "Beach",
                           "Bakery", "Cafe", "Coffee Shop", "Art Gallery", "Zoo", "Aquarium")],
        "perYear": [{"year": y, "places": sum(1 for r in rows if r["First visit"][:4] == y),
                     "countries": sum(1 for c in countries if c["first"][:4] == y)} for y in years],
    }
    # --- more facts: getting around, when, records, continents ---
    stats = load(STATS, {"modes": {}})
    MODE_NAMES = [("FLYING", "Flying"), ("IN_PASSENGER_VEHICLE", "By car"), ("IN_BUS", "By bus"),
                  ("IN_TRAIN", "By train"), ("WALKING", "Walking"), ("IN_SUBWAY", "By subway"),
                  ("IN_FERRY", "By ferry"), ("IN_TRAM", "By tram"), ("MOTORCYCLING", "By motorbike"),
                  ("CYCLING", "Cycling"), ("RUNNING", "Running"), ("SKIING", "Skiing"),
                  ("IN_GONDOLA_LIFT", "Gondola"), ("SAILING", "Sailing")]
    facts["modes"] = [dict(stats["modes"][k], key=k, name=n) for k, n in MODE_NAMES if k in stats["modes"]]

    kept = [places_by_id[r["Place ID"]] for r in rows if r["Place ID"] in places_by_id]
    hours = [0] * 24
    weekdays = [0] * 7
    for p in kept:
        hours = [a + b for a, b in zip(hours, p["hours"])]
        weekdays = [a + b for a, b in zip(weekdays, p["weekdays"])]
    facts["hours24"] = hours
    facts["weekdays"] = weekdays

    country_of = {r["Place ID"]: (r["Country"], r["Country code"]) for r in rows if r["Country"]}
    by_day_c, by_day_n = collections.defaultdict(set), collections.Counter()
    for p in kept:
        for d in p["days"]:
            by_day_n[d] += 1
            if p["placeId"] in country_of:
                by_day_c[d].add(country_of[p["placeId"]][0])
    if by_day_c:
        dmax = max(by_day_c, key=lambda d: (len(by_day_c[d]), d))
        facts["mostCountriesDay"] = {"date": dmax, "countries": sorted(by_day_c[dmax])}
    if by_day_n:
        busy = max(by_day_n, key=lambda d: (by_day_n[d], d))
        facts["busiestDay"] = {"date": busy, "places": by_day_n[busy]}
    longest = max((p for p in kept if p["placeId"] in country_of), key=lambda p: p["longest"])
    lrow = next(r for r in rows if r["Place ID"] == longest["placeId"])
    facts["longestStop"] = dict(where(lrow), hours=round(longest["longest"] / 60))
    trips_all = load(TRIPS, [])
    trip_c = collections.defaultdict(set)
    for p in kept:
        for i in p.get("trips", []):
            if p["placeId"] in country_of:
                trip_c[i].add(country_of[p["placeId"]][0])
    if trip_c:
        ti = max(trip_c, key=lambda i: len(trip_c[i]))
        facts["biggestTrip"] = {"start": trips_all[ti]["start"][:10], "end": trips_all[ti]["end"][:10],
                                "countries": len(trip_c[ti]), "km": trips_all[ti].get("km")}
    facts["hemispheres"] = {
        "north": sum(1 for r in rows if float(r["Lat"]) >= 0), "south": sum(1 for r in rows if float(r["Lat"]) < 0),
        "east": sum(1 for r in rows if float(r["Lng"]) >= 0), "west": sum(1 for r in rows if float(r["Lng"]) < 0)}

    visited_codes = {c["code"] for c in countries if c["code"]}
    sov_all = {code for codes in SOVEREIGN.values() for code in codes.split()}
    facts["continents"] = [{"name": k, "codes": v.split(), "visited": sorted(visited_codes & set(v.split()))}
                           for k, v in SOVEREIGN.items()]
    facts["extras"] = sorted(c["name"] for c in countries if c["code"] and c["code"] not in sov_all)

    # Pins for the page's "surprise me" and "on this day": named places at least 50 km from
    # any home, so the everyday neighbourhood and its dates never ship.
    homes = [(p["lat"], p["lng"]) for p in load(PLACES, []) if {"HOME", "INFERRED_HOME"} & set(p["semantic"])]
    cats = list(LAYER_COLOURS)
    pins = []
    for r in rows:
        lat, lng = float(r["Lat"]), float(r["Lng"])
        if homes and min(km(lat, lng, h[0], h[1]) for h in homes) < 50:
            continue
        pins.append([r["Name"], round(lat, 4), round(lng, 4), cats.index(r["Category"]) if r["Category"] in cats else 3,
                     int(r["First visit"][:10].replace("-", "")), r["Type"], r["City"] and CITY_NAMES.get(r["City"], r["City"]), r["Country"]])
    with open(PINS, "w", encoding="utf-8") as f:
        json.dump(pins, f, ensure_ascii=False, separators=(",", ":"))

    data = {
        "mapId": MYMAP_ID,
        "generated": dt.date.today().isoformat(),
        "places": len(rows),
        "countries": len(countries),
        "continents": len({c["continent"] for c in countries if c["continent"]}),
        "first": min(r["First visit"] for r in rows)[:10],
        "last": max(r["Last visit"] for r in rows)[:10],
        "layers": [{"name": n, "count": layers[n], "colour": c} for n, c in LAYER_COLOURS.items()],
        "countryList": countries,
        "facts": facts,
    }
    with open(SITE_DATA, "w", encoding="utf-8") as f:
        f.write("/* Generated by visited-places/timeline.py site; don't hand-edit. */\n"
                "window.PLACES = " + json.dumps(data, ensure_ascii=False, indent=1) + ";\n")
    print(f"Wrote {SITE_DATA}: {data['places']} places, {data['countries']} countries")


def main():
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    sub = ap.add_subparsers(dest="cmd", required=True)
    a = sub.add_parser("aggregate")
    a.add_argument("export")
    e = sub.add_parser("enrich")
    e.add_argument("--cap", type=int, default=4500)
    sub.add_parser("export")
    sub.add_parser("mymaps")
    sub.add_parser("site")
    args = ap.parse_args()
    if args.cmd == "aggregate":
        aggregate(os.path.expanduser(args.export))
    elif args.cmd == "enrich":
        enrich(args.cap)
    elif args.cmd == "mymaps":
        mymaps()
    elif args.cmd == "site":
        site()
    else:
        export()


if __name__ == "__main__":
    main()
