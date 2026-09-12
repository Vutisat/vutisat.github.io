/* ---------------------------------------------------------------------------
   The Library — render, search, sort, and live sheet sync.
   No dependencies. Every feature guards itself; nothing here can empty the page.
--------------------------------------------------------------------------- */
(function () {
  "use strict";

  var SHEET_CSV =
    "https://docs.google.com/spreadsheets/d/1LSyUoNO50mpBUlmAEt9lHR9n7XVE7jGSeH29lT9m1Ik/gviz/tq?tqx=out:csv";

  /* ---- genre families -----------------------------------------------------
     The sheet carries 62 distinct genre strings, many of them compound
     ("Nonfiction / History", "Gothic / Science Fiction"). Those are too many to
     filter by and too many to color, so each maps to one of 17 families. The
     family drives the filter pills and the cloth color; the book itself always
     displays the original string from the sheet.
  ------------------------------------------------------------------------- */
  var FAMILIES = [
    ["scifi",      "Science Fiction"],
    ["fantasy",    "Fantasy"],
    ["litfic",     "Literary Fiction"],
    ["fiction",    "Fiction"],
    ["classics",   "Classics"],
    ["mystery",    "Mystery & Crime"],
    ["horror",     "Horror & Gothic"],
    ["romance",    "Romance"],
    ["graphic",    "Graphic Novels"],
    ["nonfiction", "Nonfiction"],
    ["science",    "Science & Mind"],
    ["business",   "Business"],
    ["selfhelp",   "Self-Help"],
    ["memoir",     "Memoir"],
    ["poetry",     "Poetry"],
    ["ya",         "Young Adult"],
    ["language",   "Language"]
  ];
  /* Null-prototype: the query string reaches this map, and on a plain object
     "?genre=constructor" would look up an inherited property and read as a
     real family. Same reasoning for authorCount and bySlug below. */
  var FAMILY_NAME = Object.create(null);
  FAMILIES.forEach(function (f) { FAMILY_NAME[f[0]] = f[1]; });

  var GENRE_FAMILY = {
    "science fiction": "scifi", "science fiction (stories)": "scifi",
    "gothic / science fiction": "scifi",
    "fantasy": "fantasy", "fantasy / western": "fantasy", "litrpg / fantasy": "fantasy",
    "literary fiction": "litfic",
    "fiction": "fiction", "historical fiction": "fiction", "short stories": "fiction",
    "classic": "classics", "classic / satire": "classics", "classic / fable": "classics",
    "folklore / classic": "classics", "drama": "classics", "satire": "classics",
    "political philosophy": "classics",
    "mystery": "mystery", "classic mystery": "mystery", "thriller": "mystery",
    "crime thriller": "mystery",
    "horror": "horror", "gothic": "horror",
    "romance": "romance",
    "graphic novel": "graphic", "comics": "graphic", "picture book": "graphic",
    "nonfiction": "nonfiction", "nonfiction / history": "nonfiction", "history": "nonfiction",
    "nonfiction / travel": "nonfiction", "nonfiction / language": "nonfiction",
    "nonfiction / religion": "nonfiction", "essays": "nonfiction", "politics": "nonfiction",
    "economics": "nonfiction", "humor / reference": "nonfiction", "reference": "nonfiction",
    "sports": "nonfiction", "art": "nonfiction", "photography": "nonfiction",
    "music": "nonfiction", "games": "nonfiction",
    "popular science": "science", "nonfiction / science": "science",
    "psychology": "science", "nonfiction / psychology": "science",
    "business": "business", "business / marketing": "business",
    "personal finance": "business", "career / nonfiction": "business", "technology": "business",
    "self-help": "selfhelp",
    "memoir": "memoir", "memoir / humor": "memoir", "memoir / science": "memoir",
    "sports / memoir": "memoir",
    "poetry": "poetry",
    "ya": "ya", "ya dystopian": "ya", "ya science fiction": "ya",
    "language learning": "language"
  };

  /* Fallback for genres added to the sheet later that aren't in the table. */
  var FAMILY_HINTS = [
    ["science fiction", "scifi"], ["sci-fi", "scifi"], ["fantasy", "fantasy"],
    ["literary", "litfic"], ["mystery", "mystery"], ["thriller", "mystery"],
    ["crime", "mystery"], ["horror", "horror"], ["gothic", "horror"],
    ["romance", "romance"], ["graphic", "graphic"], ["comic", "graphic"],
    ["memoir", "memoir"], ["poetry", "poetry"], ["ya", "ya"],
    ["self-help", "selfhelp"], ["business", "business"], ["finance", "business"],
    ["technology", "business"], ["psychology", "science"], ["science", "science"],
    ["language", "language"], ["classic", "classics"], ["nonfiction", "nonfiction"],
    ["fiction", "fiction"]
  ];

  function familyOf(genre) {
    var g = String(genre || "").trim().toLowerCase();
    if (GENRE_FAMILY[g]) return GENRE_FAMILY[g];
    for (var i = 0; i < FAMILY_HINTS.length; i++) {
      if (g.indexOf(FAMILY_HINTS[i][0]) !== -1) return FAMILY_HINTS[i][1];
    }
    return "fiction";
  }

  /* ---- author surnames, for shelving order ------------------------------
     Last word of the first author, with overrides for the cases this
     collection actually contains. Not a general name parser.
  ----------------------------------------------------------------------- */
  var SURNAME = {
    "Ursula K. Le Guin": "Le Guin",
    "Gabriel Garcia Marquez": "Garcia Marquez",
    "Walter M. Miller Jr.": "Miller",
    "Antoine de Saint-Exupery": "Saint-Exupery",
    "Harvard Business Review": "Harvard Business Review",
    "Time-Life": "Time-Life",
    "Marvel": "Marvel",
    "DK": "DK",
    "Brothers Grimm": "Grimm",
    "Oprisko and Wood": "Oprisko"
  };

  function surnameOf(author) {
    var a = String(author || "").trim();
    if (SURNAME[a]) return SURNAME[a];
    /* Drop any trailing parenthetical -- "(ed.)", but also "Bobby Hall (Logic)",
       whose "(Logic)" would otherwise collate ahead of every real surname. */
    var first = a.split(/\s+(?:and|with)\s+/i)[0].replace(/\s*\([^)]*\)\s*$/, "").trim();
    var parts = first.split(/\s+/);
    return parts[parts.length - 1] || first;
  }

  /* The stable half of a shareable link. Titles alone are unique across the
     341 currently on the shelf; assignSlugs() settles any future collision by
     adding the surname, so an existing link can only ever break if the book
     that owns it leaves the shelf. */
  function slugify(str) {
    return fold(str).replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "book";
  }

  function assignSlugs(list) {
    var seen = {}, i, b;
    for (i = 0; i < list.length; i++) {
      b = list[i];
      b.slug = slugify(b.title);
      if (seen[b.slug]) b.slug = b.slug + "-" + slugify(b.surname);
      seen[b.slug] = true;
    }
    /* a surname could still tie; the later duplicate gives up and takes a number */
    seen = {};
    for (i = 0; i < list.length; i++) {
      b = list[i];
      if (seen[b.slug]) b.slug = b.slug + "-" + (seen[b.slug] + 1);
      seen[b.slug] = (seen[b.slug] || 0) + 1;
    }
    return list;
  }

  var ARTICLE = /^(the|a|an)\s+/i;
  function sortTitle(t) { return String(t || "").replace(ARTICLE, ""); }

  function fold(s) {
    return String(s || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  }

  /* Deterministic, so a book is the same size on every load and every sort. */
  function hash(str) {
    var h = 2166136261, i;
    for (i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = (h + (h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24)) >>> 0;
    }
    return h >>> 0;
  }

  /* Accepts 0-5 as a number ("4", "4.5") or as literal stars, and treats
     anything else -- including blank -- as unrated. */
  function parseRating(raw) {
    var v = String(raw == null ? "" : raw).trim();
    if (!v) return null;
    var stars = (v.match(/★/g) || []).length;
    if (stars) return stars + (/[½⯨]/.test(v) ? 0.5 : 0);
    if (!/^[0-5]([.,]\d+)?$/.test(v)) return null;
    var n = parseFloat(v.replace(",", "."));
    return n >= 0 && n <= 5 ? n : null;
  }

  /* ---- fitting a title to its spine ---------------------------------------
     Every title is printed across its spine rather than down it, so nobody has
     to tilt their head at the shelf. That only works if each spine is wide
     enough for its own longest word, so a book is typeset first and bound
     second: measure the title, then cut the spine to fit it.

     ADV holds EB Garamond's advance widths, measured from the shipped woff2 at
     100px and kept in hundredths of an em. Measuring in a canvas at run time
     would be exact, but it cannot answer until the font has loaded, and these
     numbers decide the width of every book on the wall -- the whole shelf would
     reflow under the reader a moment after it painted. The table is close
     enough; the fitter leaves slack for its error.
  ------------------------------------------------------------------------- */
  var ADV = {};
  (function () {
    function set(chars, widths) {
      for (var i = 0; i < chars.length; i++) ADV[chars[i]] = widths[i];
    }
    set("abcdefghijklmnopqrstuvwxyz",
        [50, 56, 45, 57, 48, 33, 51, 58, 29, 29, 54, 29, 88,
         59, 54, 57, 56, 41, 43, 35, 58, 50, 74, 51, 49, 44]);
    set("ABCDEFGHIJKLMNOPQRSTUVWXYZ",
        [69, 65, 64, 75, 65, 60, 73, 82, 39, 52, 69, 60, 93,
         77, 74, 61, 74, 70, 56, 62, 76, 67, 98, 71, 62, 60]);
    set("0123456789", [61, 43, 56, 55, 57, 53, 57, 50, 60, 57]);
    set("'\u2019-.,:;!?()&\u2013\u2014/", [22, 23, 37, 27, 27, 31, 31, 33, 48, 38, 38, 71, 64, 100, 28]);
  })();
  var ADV_OTHER = 55;   /* accented letters and anything else unlisted */
  var ADV_SPACE = 25;   /* a word space, same units */

  var SPINE_MIN = 44;   /* the narrowest a spine may be cut, in px */
  var SPINE_VAR = 18;   /* hash jitter above that, so the shelf isn't uniform */
  var SPINE_MAX = 78;   /* ...and the widest a book plausibly binds to */
  var FS_MAX = 11;    /* spine type, in px */
  var FS_MIN = 7.4;
  var LEADING = 1.26;
  var SIDE = 12;        /* the title's own padding and margin, both sides */
  var ENDS = 34;        /* the book's padding, its two rules, the title margin */
  var ROOF = 171;       /* the shortest shelf band (phones) less its ledge */

  function advance(word) {
    var w = 0, i, a;
    for (i = 0; i < word.length; i++) {
      a = ADV[word[i]];
      w += a === undefined ? ADV_OTHER : a;
    }
    return w;
  }

  /* The pieces a line may break between: words, and the tail of a hyphenated
     word, since the line breaker is allowed to break after the hyphen too. */
  function chunksOf(title) {
    var out = [], buf = "", s = String(title), i, c;
    for (i = 0; i < s.length; i++) {
      c = s[i];
      if (c === " " || c === "\t" || c === "\n") {
        if (buf) { out.push(buf); buf = ""; }
        continue;
      }
      buf += c;
      if (c === "-" || c === "\u2013" || c === "\u2014") { out.push(buf); buf = ""; }
    }
    if (buf) out.push(buf);
    return out.length ? out : [" "];
  }

  function lineCount(chunks, column, fs) {
    var lines = 1, cur = 0, i, w, glue;
    for (i = 0; i < chunks.length; i++) {
      w = advance(chunks[i]) * fs / 100;
      if (cur === 0) { cur = w; continue; }
      /* nothing is set after a hyphen: that break falls inside a word */
      glue = /[-\u2013\u2014]$/.test(chunks[i - 1]) ? 0 : ADV_SPACE * fs / 100;
      if (cur + glue + w <= column) { cur += glue + w; } else { lines++; cur = w; }
    }
    return lines;
  }

  function typeset(b) {
    var chunks = chunksOf(b.title), longest = 1, i, w;
    for (i = 0; i < chunks.length; i++) {
      w = advance(chunks[i]);
      if (w > longest) longest = w;
    }

    b.bh = 152 + (b.h % 56);                 /* 152-207px */
    b.bw = Math.max(SPINE_MIN + ((b.h >>> 8) % SPINE_VAR),
                    Math.min(SPINE_MAX, Math.ceil(longest * FS_MAX / 100) + SIDE));

    /* Height is measured against the shortest shelf band rather than the one
       on screen, so a spine keeps its size when the layout crosses 760px. */
    var column = b.bw - SIDE;
    var room = Math.min(b.bh, ROOF) - ENDS;
    /* Open at the largest size the longest word allows, then step down until
       the whole title fits the height as well. */
    var fs = Math.min(FS_MAX, column * 100 / longest);
    while (fs > FS_MIN && lineCount(chunks, column, fs) * fs * LEADING > room) fs -= 0.2;
    b.fs = Math.round(Math.max(FS_MIN, fs) * 10) / 10;
    return b;
  }

  function toBooks(rows) {
    return assignSlugs(rows.map(function (r) {
      var title = r[0], author = r[1], genre = r[2];
      var yearRaw = String(r[3] || "").trim();
      var rating = parseRating(r[4]);
      var year = /^\d{3,4}$/.test(yearRaw) ? parseInt(yearRaw, 10) : null;
      var h = hash(title + "|" + author);
      return {
        title: title,
        author: author,
        genre: genre,
        family: familyOf(genre),
        year: year,
        yearText: year === null ? "Year unknown" : String(year),
        rating: rating,
        surname: surnameOf(author),
        sortTitle: sortTitle(title),
        h: h,
        search: fold(title + " " + author + " " + genre)
      };
    }).map(typeset));
  }

  /* ---- RFC 4180 CSV ------------------------------------------------------
     Needed for real: titles like `Surely You're Joking, Mr. Feynman!` carry
     commas inside quoted fields.
  ----------------------------------------------------------------------- */
  function parseCSV(text) {
    var rows = [], row = [], field = "", i = 0, inQ = false, c;
    text = String(text).replace(/\r\n/g, "\n").replace(/\r/g, "\n");
    for (; i < text.length; i++) {
      c = text[i];
      if (inQ) {
        if (c === '"') {
          if (text[i + 1] === '"') { field += '"'; i++; }
          else inQ = false;
        } else field += c;
      } else if (c === '"') inQ = true;
      else if (c === ",") { row.push(field); field = ""; }
      else if (c === "\n") { row.push(field); rows.push(row); row = []; field = ""; }
      else field += c;
    }
    if (field !== "" || row.length) { row.push(field); rows.push(row); }
    return rows;
  }

  /* Columns are located by their header text, not their position, so the sheet
     can gain, lose or reorder columns without breaking the page. "Copies Seen"
     and "Image #" are simply never looked up. Rows missing a title or author --
     including the sheet's trailing summary block -- are dropped. */
  var HEAD = {
    title:  ["title"],
    author: ["author", "authors"],
    genre:  ["genre", "genres"],
    year:   ["release year", "year", "published", "first published"],
    rating: ["rating", "pob's rating", "pobs rating", "my rating", "stars"]
  };

  function rowsFromCSV(text) {
    var all = parseCSV(text);
    if (!all.length) return [];

    var head = (all[0] || []).map(function (h) {
      return String(h == null ? "" : h).trim().toLowerCase();
    });
    function col(key, fallback) {
      var names = HEAD[key];
      for (var i = 0; i < names.length; i++) {
        var k = head.indexOf(names[i]);
        if (k !== -1) return k;
      }
      return fallback;
    }
    var iT = col("title", 0), iA = col("author", 1), iG = col("genre", 2),
        iY = col("year", 3),  iR = col("rating", -1);

    /* If any column was located by name, row 0 is definitely the header. Only
       fall back to sniffing the first cell when no header was recognised at
       all -- otherwise a reordered sheet emits its own header as a book. */
    var named = ["title", "author", "genre", "year", "rating"].some(function (k) {
      return HEAD[k].some(function (n) { return head.indexOf(n) !== -1; });
    });
    var start = (named || /title/i.test(all[0][0] || "")) ? 1 : 0, out = [];
    for (var i = start; i < all.length; i++) {
      var r = all[i];
      if (!r) continue;
      var cell = function (k) { return k > -1 && r[k] != null ? String(r[k]).trim() : ""; };
      var t = cell(iT), a = cell(iA);
      if (!t || !a) continue;
      out.push([t, a, cell(iG), cell(iY), cell(iR)]);
    }
    return out;
  }

  /* ---- state -------------------------------------------------------------- */
  var raw = (window.LIBRARY_SEED || []).slice();
  var books = toBooks(raw);

  /* 53 authors here have more than one book, covering 146 of them. Only those
     names become clickable — a link that returns one result is just a tease. */
  var authorCount = Object.create(null);
  function indexAuthors() {
    authorCount = Object.create(null);
    books.forEach(function (b) { authorCount[b.author] = (authorCount[b.author] || 0) + 1; });
  }
  indexAuthors();

  /* ---- the book that isn't in the spreadsheet --------------------------
     341 books came off the sheet. This one is the site itself, bound in dark
     leather and stamped in gold, standing at the end of the last shelf. It is
     deliberately kept out of `books`: it must never move the count, reach the
     search index, survive a filter, or be looked up on Open Library.
  --------------------------------------------------------------------- */
  var EGG = typeset({
    title: "pobv.dev",
    author: "Pob Vutisalchavakul",
    genre: "Bound at home",
    family: "egg",
    year: 2026,
    yearText: "2026",
    rating: null,
    surname: "Vutisalchavakul",
    sortTitle: "pobv.dev",
    slug: "pobv-dev",
    isEgg: true,
    h: hash("pobv.dev|Pob Vutisalchavakul"),
    search: ""
  });
  EGG.bh = 208;   /* the tallest volume on the wall, by one pixel */

  /* ---- the library cat -------------------------------------------------
     She takes an ordinary slot, so flex-wrap settles her between two spines
     wherever the row happens to break and she sits on the ledge exactly as the
     books do. Where she settled is picked once per visit and held as a
     fraction of the shelf, so re-sorting moves her with the books rather than
     teleporting her to a different wall.
  --------------------------------------------------------------------- */
  var CAT_AT = 0.3 + Math.random() * 0.45;
  /* Drawn so the whole animal reads at 74px wide, which is about the width of
     three paperbacks. Three things carry it at that size and everything else
     was cut: the back crests well above the head so a neck dip shows; the ears
     are set far enough apart that the crown of the head appears between them;
     and the tail comes out from behind the haunch and lifts clear of the body
     rather than curling back and closing into a handle. The baseline is the
     foot of the viewBox, so nothing is clipped and she sits on the ledge
     exactly as the books do. */
  var CAT_SVG =
    '<svg viewBox="0 0 132 54" aria-hidden="true">' +
      /* tail: out from behind the haunch, round, and lifted */
      '<path fill="none" stroke="currentColor" stroke-width="8" stroke-linecap="round"' +
        ' d="M34 49.5C20 51.5 6 47.5 5.5 38.5 5 31.5 8 26.5 11.5 24.5"/>' +
      /* the loaf, carried on under the head so no chest pokes out below the jaw */
      '<path fill="currentColor" d="M26 54C21 30 32 12 56 12 80 12 96 28 104 54Z"/>' +
      /* ears, with the crown of the head showing between them */
      '<path fill="currentColor" d="M92 30.5 90 14 99 23.5ZM109 24 117 15 115 31Z"/>' +
      '<circle cx="104" cy="38" r="15.5" fill="currentColor"/>' +
      /* one closed eye */
      '<path fill="none" stroke="rgba(0,0,0,.35)" stroke-width="2" stroke-linecap="round"' +
        ' d="M95 37q5 4.4 10 0"/>' +
    '</svg>';

  function catSlot() {
    return '<div class="slot slot--cat">' +
      '<button type="button" class="cat-nap" aria-label="A cat, asleep on the shelf">' + CAT_SVG + '</button>' +
      '<span class="peek">' +
        '<span class="peek__title">The library cat</span>' +
        '<span class="peek__author">She came with the shelves.</span>' +
      '</span>' +
    '</div>';
  }

  function wakeCat(node) {
    if (node.classList.contains("is-awake")) return;
    node.classList.add("is-awake");
    /* one long stretch, then she settles. Under reduced motion she simply
       stays stretched: one state, no movement to watch. */
    if (!reduceMotion.matches) {
      setTimeout(function () { node.classList.remove("is-awake"); }, 640);
    }
  }

  var state = {
    q: "",
    families: [],           /* empty means every genre */
    author: null,           /* set while viewing one author's run */
    fives: false,           /* only the books Pob gave five stars */
    sort: "all",
    view: "shelf"
  };

  var el = {};
  function $(id) { return document.getElementById(id); }

  var bySlug = Object.create(null);
  function indexSlugs() {
    bySlug = Object.create(null);
    books.forEach(function (b) { bySlug[b.slug] = b; });
    /* EGG is off the shelf for now. Uncomment this line and the two marked
       "the 342nd book" in render() to put it back; everything else it needs
       -- the record, paintEgg(), the click branch, the leather cloth in the
       CSS -- is deliberately left in place. */
    /* bySlug[EGG.slug] = EGG; */
  }

  /* ---- the address bar ---------------------------------------------------
     Every view of this page is a place: a search, a genre, an author's run, a
     sort, one of the three views, and the book in the drawer. All of it lives
     in the query string, so a shelf can be linked to, bookmarked, reloaded, and
     -- the one that matters on a phone -- backed out of.

     Only two moves push a history entry: opening a book, and jumping to an
     author. Typing in the search box or toggling a genre replaces instead, so
     Back means "close this / go back to everything", never "undo one keystroke".
  ----------------------------------------------------------------------- */
  var DEF_SORT = "all", DEF_VIEW = "shelf";
  var VIEWS = ["shelf", "cards", "carousel"];
  var urlLock = false;      /* raised while a URL is being applied, so the
                               renders it triggers don't write it back */

  function urlFromState() {
    var q = new URLSearchParams();
    if (state.q) q.set("q", state.q);
    if (state.families.length) q.set("genre", state.families.join(","));
    if (state.author) q.set("author", state.author);
    if (state.fives) q.set("five", "1");
    if (state.sort !== DEF_SORT) q.set("sort", state.sort);
    if (state.view !== DEF_VIEW) q.set("view", state.view);
    if (openBook) q.set("book", openBook.slug);
    var qs = q.toString();
    return location.pathname + (qs ? "?" + qs : "") + location.hash;
  }

  function writeURL(push) {
    if (urlLock || !window.history || !history.replaceState) return;
    var next = urlFromState();
    if (next === location.pathname + location.search + location.hash) return;
    try { history[push ? "pushState" : "replaceState"](null, "", next); } catch (e) {}
  }

  function applyURL() {
    var q = new URLSearchParams(location.search);
    urlLock = true;
    try {
      state.q = q.get("q") || "";
      var g = q.get("genre");
      state.families = g ? g.split(",").filter(function (f) { return FAMILY_NAME[f]; }) : [];
      state.author = q.get("author");
      if (state.author && !authorCount[state.author]) state.author = null;   /* left the shelf */
      state.fives = q.get("five") === "1";
      state.view = VIEWS.indexOf(q.get("view")) !== -1 ? q.get("view") : DEF_VIEW;

      var search = $("search"), sort = $("sort");
      if (search) search.value = state.q;
      document.body.classList.toggle("has-q", !!state.q);
      if (sort) {
        /* "My rating" only exists once something is rated, so validate against
           the control rather than against a list that can go stale. Compared,
           not interpolated into a selector: the value comes from the URL. */
        var want = q.get("sort"), ok = false, oi;
        for (oi = 0; want && oi < sort.options.length; oi++) {
          if (sort.options[oi].value === want) { ok = true; break; }
        }
        state.sort = ok ? want : DEF_SORT;
        sort.value = state.sort;
      }
      syncAuthor();
      syncPills();
      syncViews();
      render();

      var b = bySlug[q.get("book")];
      if (b) { if (openBook !== b) openPanel(b, null, true); }
      else if (openBook) closePanel(true);
    } finally {
      urlLock = false;
    }
  }

  /* ---- filtering + sorting ------------------------------------------------ */
  function tokens(q) {
    return fold(q).split(/\s+/).filter(Boolean);
  }

  function visible() {
    var tk = tokens(state.q), fams = state.families;
    var list = books.filter(function (b) {
      if (state.author && b.author !== state.author) return false;
      if (state.fives && b.rating !== 5) return false;
      /* no genres picked shows everything; otherwise any one of them qualifies */
      if (fams.length && fams.indexOf(b.family) === -1) return false;
      for (var i = 0; i < tk.length; i++) {
        if (b.search.indexOf(tk[i]) === -1) return false;
      }
      return true;
    });
    return list.sort(comparator(state.sort));
  }

  var collator = new Intl.Collator("en", { sensitivity: "base", numeric: true });

  function comparator(sort) {
    function byTitle(a, b) { return collator.compare(a.sortTitle, b.sortTitle); }
    /* "all" has no grouping, but the books still need an order: title. */
    if (sort === "author") {
      return function (a, b) {
        return collator.compare(a.surname, b.surname) || byTitle(a, b);
      };
    }
    if (sort === "rating") {
      return function (a, b) {
        if (a.rating === null && b.rating === null) return byTitle(a, b);
        if (a.rating === null) return 1;            /* unrated always sinks */
        if (b.rating === null) return -1;
        return (b.rating - a.rating) || byTitle(a, b);
      };
    }
    if (sort === "genre") {
      return function (a, b) {
        return collator.compare(FAMILY_NAME[a.family], FAMILY_NAME[b.family]) || byTitle(a, b);
      };
    }
    if (sort === "year-old" || sort === "year-new") {
      var dir = sort === "year-new" ? -1 : 1;
      return function (a, b) {
        /* The one book with no year sorts to the end in both directions. */
        if (a.year === null && b.year === null) return byTitle(a, b);
        if (a.year === null) return 1;
        if (b.year === null) return -1;
        return (a.year - b.year) * dir || byTitle(a, b);
      };
    }
    return byTitle;
  }

  /* Numeric collation orders 7, 10, 24, 60, 101 — so a first-character group
     would splinter into a run of singletons. Digits share one "#" shelf. */
  function initial(str) {
    var c = (String(str || "").replace(/^[^0-9a-z]+/i, "")[0] || "#").toUpperCase();
    return /[0-9]/.test(c) ? "#" : (/[A-Z]/.test(c) ? c : "#");
  }

  function groupLabel(b) {
    if (state.sort === "rating") {
      return b.rating === null ? "Unrated" : b.rating + (b.rating === 1 ? " star" : " stars");
    }
    if (state.sort === "author") return initial(b.surname);
    if (state.sort === "genre") return FAMILY_NAME[b.family];
    if (state.sort === "year-old" || state.sort === "year-new") {
      return b.year === null ? "Year unknown" : (Math.floor(b.year / 10) * 10) + "s";
    }
    return initial(b.sortTitle);
  }

  /* ---- rendering ---------------------------------------------------------- */
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function spine(b, i, bare) {
    /* >>> not >>: the hash fills 32 bits, and a signed shift turns values above
       2^31 negative, which JS's % then keeps negative (5px-wide books). */
    var shade = (b.h >>> 16) % 7;            /* subtle cloth variation */
    var treat = (b.h >>> 24) % 4;            /* rules / label panel / doubled / bare */
    return '<div class="slot">' +
      '<button type="button" class="book" data-i="' + i + '" data-fam="' + b.family + '" data-shade="' + shade + '"' +
        ' data-treat="' + treat + '"' +
        (b.rating === 5 ? ' data-five="1"' : '') +
        ' style="--bh:' + b.bh + 'px;--bw:' + b.bw + 'px;--fs:' + b.fs + 'px"' +
        ' aria-label="' + esc(b.title + ", " + b.author + ", " + b.genre + ", " + b.yearText) + '">' +
        '<span class="book__band" aria-hidden="true"></span>' +
        '<span class="book__title" aria-hidden="true">' + esc(b.title) + '</span>' +
        '<span class="book__band book__band--low" aria-hidden="true"></span>' +
      '</button>' +
      (bare ? "" :
        '<span class="peek">' +
          '<span class="peek__title">' + esc(b.title) + '</span>' +
          '<span class="peek__author">' + authorMark(b) + '</span>' +
          '<span class="peek__meta">' + esc(b.genre) + ' &middot; ' + esc(b.yearText) + '</span>' +
        '</span>') +
    '</div>';
  }

  /* Only a repeat author is offered as a link, with the size of the run. */
  function authorMark(b) {
    var n = authorCount[b.author] || 1;
    if (n < 2) return esc(b.author);
    return '<button type="button" class="runlink" data-author="' + esc(b.author) + '">' +
             esc(b.author) + ' <span class="runlink__n">' + n + '</span>' +
           '</button>';
  }

  function card(b, i) {
    return '<article class="card" data-fam="' + b.family + '" data-i="' + i + '">' +
      '<div class="card__art"></div>' +
      '<h3 class="card__title"><button type="button" class="card__open">' + esc(b.title) + '</button></h3>' +
      '<p class="card__author">' + authorMark(b) + '</p>' +
      '<p class="card__meta"><span class="chip">' + esc(b.genre) + '</span>' +
        '<span class="card__year">' + esc(b.yearText) + '</span></p>' +
    '</article>';
  }

  var shown = [];          /* what is on screen, indexed to match the DOM */

  /* Both of these belong to the whole collection, not to a result set: a cat
     asleep in the middle of four search hits is a bug, not a joke. */
  function unfiltered() {
    return !state.q && !state.families.length && !state.author && !state.fives;
  }

  function render() {
    var list = visible();
    shown = list;
    var html = "", group = null, open = false, i, b, label;

    if (state.view === "carousel") {
      renderCarousel(list);
      afterRender(list);
      return;
    }

    var isShelf = state.view === "shelf";
    var extras = isShelf && unfiltered();
    var catAt = extras && list.length >= 60
      ? Math.min(list.length - 2, Math.max(8, Math.round(CAT_AT * list.length)))
      : -1;
    /* A peek card is a hover affordance. On a touch device it can never be
       shown -- a tap opens the drawer instead -- yet all 341 still occupy
       layout while hidden, and each one centred on a narrow slot pushed the
       document ~71px wider than the viewport. Don't build them at all. */
    var bare = !canHover.matches;
    var draw = isShelf ? function (b, i) { return spine(b, i, bare); } : card;
    var box = isShelf ? "wall" : "grid";

    if (state.sort === "all") {
      /* one continuous run, no dividers — the whole collection on one shelf */
      html = '<div class="' + box + '">';
      for (i = 0; i < list.length; i++) {
        if (i === catAt) html += catSlot();
        html += draw(list[i], i);
      }
      /* the 342nd book: if (extras) html += spine(EGG, "egg", bare); */
      html += "</div>";
    } else {
      for (i = 0; i < list.length; i++) {
        b = list[i];
        label = groupLabel(b);
        if (label !== group) {
          if (open) html += "</div>";
          group = label;
          html += '<h2 class="group">' + esc(label) + "</h2>";
          html += '<div class="' + box + '">';
          open = true;
        }
        if (i === catAt) html += catSlot();
        html += draw(b, i);
      }
      if (open) {
        /* the 342nd book: if (extras) html += spine(EGG, "egg", bare); */
        html += "</div>";
      }
    }

    el.results.className = "results results--" + state.view;
    el.results.innerHTML = html;
    afterRender(list);
  }

  function afterRender(list) {
    el.empty.hidden = list.length > 0;
    mountCovers(list);

    /* Stagger the entrance, capped so reordering 341 books stays smooth.
       The carousel is excluded: it paints three copies of the list and a
       staggered fade across a thousand spines is neither cheap nor useful. */
    if (!reduceMotion.matches && state.view !== "carousel") {
      var nodes = el.results.querySelectorAll(state.view === "shelf" ? ".slot" : ".card");
      var i = 0;
      for (; i < nodes.length && i < 24; i++) {
        nodes[i].style.setProperty("--d", (i * 18) + "ms");
        nodes[i].classList.add("in");
      }
      for (; i < nodes.length; i++) nodes[i].classList.add("in");
    }

    var n = list.length;
    el.count.textContent = n === books.length
      ? n + " books"
      : n + " of " + books.length + " books";
    el.live.textContent = n === 0
      ? "No books match."
      : n + (n === 1 ? " book" : " books") + " shown.";

    writeURL(false);
  }

  /* ---- cover art ----------------------------------------------------------
     The card view used to be 341 identical cream rectangles. It carries covers
     now, fetched one card at a time from Open Library as the card nears the
     viewport -- never all at once, and never for cards nobody scrolls to.

     Three rules keep this polite. Nothing is requested until a card is within
     half a screen of being seen; no more than five requests are ever in the
     air; and every answer lands in the same in-memory cache the drawer uses,
     so opening a book you have already seen the cover of costs nothing. When
     there is no cover on file -- or no network, or the reader is on a metered
     connection -- the card draws the book's own spine instead, which is why a
     row is never a grid of grey boxes.
  ------------------------------------------------------------------------- */
  var COVER_MAX = 5;                 /* requests in the air at once */
  var coverObs = null, coverQueue = [], coverBusy = 0, coverGen = 0;

  function coversWanted() {
    if (!window.fetch || !("IntersectionObserver" in window)) return false;
    var c = navigator.connection;
    return !(c && c.saveData);
  }

  function mountCovers(list) {
    /* Every render starts a new generation. Requests still in the air belong to
       the old one: they are left to finish and fill the cache, but they no
       longer touch this counter -- which is what stops a burst of view
       switching from leaving `coverBusy` pinned at its limit forever, with
       every later card waiting behind requests that already landed. */
    coverGen++;
    coverBusy = 0;
    coverQueue.length = 0;
    if (coverObs) coverObs.disconnect();
    if (state.view !== "cards") return;

    var arts = el.results.querySelectorAll(".card__art"), i, art;
    var live = coversWanted();
    for (i = 0; i < arts.length; i++) {
      art = arts[i];
      art.book = list[+art.parentNode.getAttribute("data-i")];
      if (!art.book) continue;
      if (!live) { art.innerHTML = fallbackArt(art.book); continue; }
      if (!coverObs) {
        coverObs = new IntersectionObserver(onNearView, { rootMargin: "50% 0px" });
      }
      coverObs.observe(art);
    }
  }

  function onNearView(entries) {
    for (var i = 0; i < entries.length; i++) {
      if (!entries[i].isIntersecting) continue;
      coverObs.unobserve(entries[i].target);
      coverQueue.push(entries[i].target);
    }
    pumpCovers();
  }

  /* The queue is a stack, not a line. Scrolling a long way fast can leave a
     hundred cards waiting, and a reader who has arrived at row 30 does not want
     row 4 fetched first: whatever came into view most recently goes next. */
  function pumpCovers() {
    while (coverBusy < COVER_MAX && coverQueue.length) loadCover(coverQueue.pop());
  }

  function loadCover(art) {
    var b = art.book, gen = coverGen;
    if (!b || !art.isConnected) return;
    coverBusy++;
    art.classList.add("is-loading");

    var done = function () {
      if (gen !== coverGen) return;      /* a render has happened since */
      coverBusy--;
      pumpCovers();
    };
    lookup(b, null, false).then(function (rec) {
      done();
      if (!art.isConnected || art.book !== b) return;   /* the view moved on */
      art.classList.remove("is-loading");
      if (!rec || !rec.found || !rec.cover) { art.innerHTML = fallbackArt(b); return; }
      var img = new Image();
      img.alt = "";                        /* the title is set right beneath it */
      img.decoding = "async";
      img.onload = function () { img.classList.add("is-in"); };
      img.onerror = function () { art.innerHTML = fallbackArt(b); };
      img.src = rec.cover;
      art.innerHTML = "";
      art.appendChild(img);
    }, function () {
      done();
      if (!art.isConnected) return;
      art.classList.remove("is-loading");
      art.innerHTML = fallbackArt(b);
    });
  }

  /* ---- carousel ----------------------------------------------------------
     One endless horizontal shelf. The list is painted as three identical
     segments and the scroll position is kept inside the middle one: whenever
     it drifts into an outer segment we shift it back by exactly one segment
     width. Since the content repeats with that period the jump is invisible,
     so the rail can be scrolled forever in either direction.

     Only the middle segment is exposed to assistive tech and the tab order;
     the flanking copies are decoration that happens to be made of books.
  ------------------------------------------------------------------------- */
  var rail = null, segW = 0, railBound = false, swallowClick = false;

  function renderCarousel(list) {
    el.results.className = "results results--carousel";
    if (!list.length) { el.results.innerHTML = ""; rail = null; return; }

    /* A short list (a narrow filter) would not fill the rail, so repeat it
       enough times that one segment always overflows the viewport. */
    var unit = 0, i, j;
    for (i = 0; i < list.length; i++) unit += 34 + ((list[i].h >>> 8) % 26);
    var reps = Math.max(1, Math.ceil((el.results.clientWidth * 1.4) / Math.max(unit, 1)));

    var seg = "";
    for (j = 0; j < reps; j++) {
      for (i = 0; i < list.length; i++) seg += spine(list[i], i, true);
    }

    el.results.innerHTML =
      '<div class="carousel">' +
        '<button type="button" class="rail__nav rail__nav--prev" aria-label="Scroll left">' +
          '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="m15 5-7 7 7 7"/></svg>' +
        "</button>" +
        '<div class="rail" id="rail">' +
          '<div class="rail__seg" aria-hidden="true">' + seg + "</div>" +
          '<div class="rail__seg">' + seg + "</div>" +
          '<div class="rail__seg" aria-hidden="true">' + seg + "</div>" +
        "</div>" +
        '<button type="button" class="rail__nav rail__nav--next" aria-label="Scroll right">' +
          '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="m9 5 7 7-7 7"/></svg>' +
        "</button>" +
      "</div>";

    rail = $("rail");
    var segs = rail.children;
    /* keep the clones out of the tab order */
    for (j = 0; j < segs.length; j++) {
      if (j === 1) continue;
      var btns = segs[j].querySelectorAll("button");
      for (i = 0; i < btns.length; i++) btns[i].tabIndex = -1;
    }

    segW = segs[1].offsetWidth;
    rail.scrollLeft = segW;
    bindRail();
  }

  function normalise() {
    if (!rail || segW <= 0) return;
    var sl = rail.scrollLeft;
    if (sl < segW * 0.5) rail.scrollLeft = sl + segW;
    else if (sl > segW * 1.5) rail.scrollLeft = sl - segW;
  }

  function bindRail() {
    if (railBound) return;
    railBound = true;

    el.results.addEventListener("scroll", function (e) {
      if (e.target === rail) normalise();
    }, true);

    /* Deliberately no vertical-wheel hijack. The rail scrolls forever, so
       capturing the wheel would trap the page: a reader hovering the books
       could never scroll past them to the footer. Sideways trackpad gestures
       and shift+wheel already work natively; drag and the arrows cover the
       rest. */

    /* Drag to scroll, for pointing devices only. Touch is deliberately left to
       the browser: it already pans this rail natively, with momentum, and a JS
       drag would fight it for the very same gesture. */
    var down = false, startX = 0, startL = 0, moved = 0;

    function endDrag(cancelled) {
      if (!down) return;
      down = false;
      swallowClick = !cancelled && moved > 6;   /* cleared by the click handler */
      if (rail) rail.classList.remove("is-dragging");
    }

    el.results.addEventListener("pointerdown", function (e) {
      if (e.pointerType === "touch") return;
      if (!rail || !rail.contains(e.target) || e.button) return;
      down = true; moved = 0;
      startX = e.clientX; startL = rail.scrollLeft;
    });
    window.addEventListener("pointermove", function (e) {
      if (!down) return;
      var dx = e.clientX - startX;
      if (Math.abs(dx) > 3) {
        moved = Math.abs(dx);
        rail.classList.add("is-dragging");
        rail.scrollLeft = startL - dx;
        normalise();
      }
    });
    window.addEventListener("pointerup", function () { endDrag(false); });
    /* The browser fires pointercancel -- not pointerup -- when it claims a
       gesture for scrolling. Without this the rail stayed flagged as dragging,
       and .is-dragging sets pointer-events:none on every book, so after one
       swipe nothing could be tapped again. */
    window.addEventListener("pointercancel", function () { endDrag(true); });
    window.addEventListener("blur", function () { endDrag(true); });

    el.results.addEventListener("click", function (e) {
      var nav = e.target.closest && e.target.closest(".rail__nav");
      if (!nav || !rail) return;
      var step = Math.max(240, rail.clientWidth * 0.8);
      rail.scrollBy({ left: nav.classList.contains("rail__nav--prev") ? -step : step,
                      behavior: reduceMotion.matches ? "auto" : "smooth" });
    });
  }

  var canHover = window.matchMedia("(hover: hover)");
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  var PEEK_H = 132, PEEK_GUTTER = 12;
  function flipPeek(e) {
    var slot = e.target.closest && e.target.closest(".slot");
    if (!slot) return;

    /* Flip below when the card would slide under the sticky toolbar. */
    var ctl = document.querySelector(".controls");
    var floor = ctl ? ctl.getBoundingClientRect().bottom : 0;
    slot.classList.toggle("flip", slot.getBoundingClientRect().top - PEEK_H < floor);

    /* And nudge it back on screen for books at either end of a shelf. */
    var peek = slot.querySelector(".peek");
    if (!peek) return;
    slot.style.setProperty("--px", "0px");
    var r = peek.getBoundingClientRect(), shift = 0;
    if (r.left < PEEK_GUTTER) shift = PEEK_GUTTER - r.left;
    else if (r.right > window.innerWidth - PEEK_GUTTER) {
      shift = (window.innerWidth - PEEK_GUTTER) - r.right;
    }
    if (shift) slot.style.setProperty("--px", shift.toFixed(1) + "px");
  }

  /* ---- filter pills ------------------------------------------------------- */
  function buildPills() {
    var counts = {};
    books.forEach(function (b) { counts[b.family] = (counts[b.family] || 0) + 1; });
    var html = '<button type="button" class="pill" data-fam="all" aria-pressed="false">' +
               'Everything <span class="pill__n">' + books.length + '</span></button>';
    FAMILIES.filter(function (f) { return counts[f[0]]; })
      .sort(function (a, b) { return counts[b[0]] - counts[a[0]]; })
      .forEach(function (f) {
        html += '<button type="button" class="pill" data-fam="' + f[0] + '" aria-pressed="false">' +
                '<span class="pill__dot" data-fam="' + f[0] + '"></span>' + esc(f[1]) +
                ' <span class="pill__n">' + counts[f[0]] + '</span></button>';
      });
    var rated = books.filter(function (b) { return b.rating === 5; }).length;
    if (rated) {
      html += '<button type="button" class="pill pill--five" data-five="1" aria-pressed="false">' +
              '<svg class="pill__star" viewBox="0 0 24 24" aria-hidden="true"><path d="' + STAR_PATH + '"/></svg>' +
              'Pob\u2019s 5s <span class="pill__n">' + rated + '</span></button>';
    }
    html += '<button type="button" class="pill pill--clear" data-clear="1" hidden>' +
              '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor"' +
              ' stroke-width="1.9" stroke-linecap="round"><path d="M7 7l10 10M17 7L7 17"/></svg>' +
              'Clear filters</button>';
    el.pills.innerHTML = html;
    syncPills();
  }

  function setAuthor(name) {
    /* Jumping to an author is a fresh view of the shelf, not another facet
       stacked on the last one — so the genre pills and the search box reset. */
    state.author = name;
    state.families = [];
    state.q = "";
    var box = $("search");
    if (box) box.value = "";
    document.body.classList.remove("has-q");
    syncAuthor();
    syncPills();
    writeURL(true);       /* an author's run is a place you can come back from */
    render();
  }

  function syncAuthor() {
    if (!el.authorBar) return;
    el.authorBar.hidden = !state.author;
    if (state.author && el.authorName) el.authorName.textContent = state.author;
  }

  /* The rating control only exists once at least one book is rated. Ratings
     usually arrive from the live sheet rather than the baked seed, so this has
     to run again after a sync -- not just at boot. */
  function syncRatingSort() {
    var sort = $("sort");
    if (!sort) return;
    var any = books.some(function (b) { return b.rating !== null; });
    var opt = sort.querySelector('option[value="rating"]');
    if (any && !opt) {
      opt = document.createElement("option");
      opt.value = "rating";
      opt.textContent = "My rating, highest first";
      sort.insertBefore(opt, sort.options[1]);
    } else if (!any && opt) {
      if (state.sort === "rating") state.sort = DEF_SORT;
      opt.remove();
      sort.value = state.sort;
    }
  }

  function toggleFamily(fam) {
    state.author = null;
    state.fives = false;
    syncAuthor();
    if (fam === "all") { state.families = []; return; }
    var i = state.families.indexOf(fam);
    if (i === -1) state.families.push(fam); else state.families.splice(i, 1);
  }

  function syncPills() {
    var none = state.families.length === 0;
    var all = el.pills.querySelectorAll(".pill[data-fam]");
    for (var i = 0; i < all.length; i++) {
      var fam = all[i].getAttribute("data-fam");
      var on = fam === "all" ? none : state.families.indexOf(fam) !== -1;
      all[i].classList.toggle("is-on", on);
      all[i].setAttribute("aria-pressed", on ? "true" : "false");
    }
    var five = el.pills.querySelector("[data-five]");
    if (five) {
      five.classList.toggle("is-on", state.fives);
      five.setAttribute("aria-pressed", state.fives ? "true" : "false");
    }
    var clear = el.pills.querySelector("[data-clear]");
    if (clear) clear.hidden = none && !state.author && !state.fives;
  }

  function syncViews() {
    var all = el.views.querySelectorAll("button");
    for (var i = 0; i < all.length; i++) {
      var on = all[i].getAttribute("data-view") === state.view;
      all[i].classList.toggle("is-on", on);
      all[i].setAttribute("aria-pressed", on ? "true" : "false");
    }
  }

  function setView(view) {
    state.view = view;
    syncViews();
    render();
  }

  /* ---- the reading lamp --------------------------------------------------
     A lamp that is off leaves the room dark, which is the default: `on` here
     means the light is lit and the room is in daylight. Stamped on <html> by
     the script in the head before first paint; this only has to keep the
     control, the browser chrome and the stored choice in step.
  ----------------------------------------------------------------------- */
  function initLamp() {
    var lamp = $("lamp");
    if (!lamp) return;
    var meta = document.querySelector('meta[name="theme-color"]');

    function paint(on) {
      document.documentElement.setAttribute("data-theme", on ? "day" : "night");
      lamp.setAttribute("aria-pressed", on ? "true" : "false");
      lamp.setAttribute("aria-label", on ? "Turn off the reading lamp" : "Turn on the reading lamp");
      if (meta) meta.setAttribute("content", on ? "#F6EFE2" : "#17120C");
    }

    paint(document.documentElement.getAttribute("data-theme") === "day");
    lamp.addEventListener("click", function () {
      paint(document.documentElement.getAttribute("data-theme") !== "day");
      try {
        localStorage.setItem("lib-lamp",
          document.documentElement.getAttribute("data-theme") === "day" ? "on" : "off");
      } catch (e) {}
    });
  }

  /* ---- live sheet sync ---------------------------------------------------
     Runs after first paint. If the sheet has changed, the shelf quietly
     re-renders with the current search, sort, filter and view preserved.
     Every failure path keeps the baked snapshot on screen and says nothing.
  ----------------------------------------------------------------------- */
  function sync() {
    if (!window.fetch) return;
    fetch(SHEET_CSV, { cache: "no-store" })
      .then(function (r) { return r.ok ? r.text() : Promise.reject(new Error(r.status)); })
      .then(function (text) {
        var next = rowsFromCSV(text);
        if (next.length < 10) return;                                  /* implausible: ignore */
        if (JSON.stringify(next) === JSON.stringify(raw)) return;      /* the common case */
        var before = books.length;
        raw = next;
        books = toBooks(next);
        indexAuthors();
        indexSlugs();
        buildPills();
        syncRatingSort();
        render();
        var delta = books.length - before;
        if (delta !== 0) {
          el.fresh.textContent = delta > 0
            ? (delta === 1 ? "One new book just arrived." : delta + " new books just arrived.")
            : "Shelf updated.";
          el.fresh.hidden = false;
        }
      })
      .catch(function () { /* keep the baked shelf; the reader never sees this */ });
  }

  /* ---- the detail drawer -------------------------------------------------
     Nothing fetched here is stored: the cache is an in-memory Map that dies
     with the page. Open Library is the source (no key, CORS open, no quota)
     and supplies the cover, blurb and page count only -- title, author, genre,
     year and Pob's rating all come from the sheet, because the loose fallback
     sometimes returns the original-language edition of the right work.
  ------------------------------------------------------------------------- */
  var OL = "https://openlibrary.org";
  var lookupCache = {};      /* title|author -> record, for this page view only */
  var inFlight = null;       /* AbortController for the open request */
  var openBook = null;       /* the book currently in the drawer */
  var lastFocus = null;      /* what to hand focus back to on close */
  var hideTimer = null;      /* pending hide after the slide-out */

  function olSearch(url, signal) {
    return fetch(url, { signal: signal }).then(function (r) {
      return r.ok ? r.json() : Promise.reject(new Error(r.status));
    });
  }

  /* The description lives on the work, which is a second request. The card
     view wants covers by the hundred and no prose at all, so it asks for the
     search only; the drawer asks for both and, if the cover already came back
     for a card, pays for nothing but the description. */
  function fetchBlurb(rec, signal) {
    if (rec.blurbDone || !rec.work) { rec.blurbDone = true; return Promise.resolve(rec); }
    return olSearch(OL + rec.work + ".json", signal).then(function (w) {
      var d = w && w.description;
      if (d && typeof d === "object") d = d.value;
      if (typeof d === "string" && d.trim().length > 40) rec.blurb = cleanBlurb(d);
      rec.blurbDone = true;
      return rec;
    }, function (e) {
      if (e && e.name === "AbortError") throw e;
      rec.blurbDone = true;
      return rec;
    });
  }

  function lookup(b, signal, needBlurb) {
    var key = b.title + "|" + b.author;
    var hit = lookupCache[key];
    if (hit) {
      if (!needBlurb || hit.blurbDone) return Promise.resolve(hit);
      return fetchBlurb(hit, signal);
    }

    var fields = "title,cover_i,key,number_of_pages_median,first_publish_year";
    var strict = OL + "/search.json?title=" + encodeURIComponent(b.title) +
                 "&author=" + encodeURIComponent(b.author) +
                 "&limit=1&fields=" + fields;
    var loose  = OL + "/search.json?q=" + encodeURIComponent(b.title + " " + b.author) +
                 "&limit=1&fields=" + fields;

    return olSearch(strict, signal)
      .then(function (d) {
        if (d.docs && d.docs.length) return d;
        return olSearch(loose, signal);          /* finds the work, sometimes in its original language */
      })
      .then(function (d) {
        var doc = (d.docs || [])[0];
        if (!doc) return (lookupCache[key] = { found: false, blurbDone: true });
        var rec = lookupCache[key] = {
          found: true,
          cover: doc.cover_i ? "https://covers.openlibrary.org/b/id/" + doc.cover_i + "-L.jpg" : null,
          pages: doc.number_of_pages_median || null,
          firstYear: doc.first_publish_year || null,
          work: doc.key || null,
          blurb: null,
          blurbDone: false
        };
        return needBlurb ? fetchBlurb(rec, signal) : rec;
      })
      .catch(function (e) {
        if (e && e.name === "AbortError") throw e;
        return { found: false, errored: true, blurbDone: true };
      });
  }

  /* Open Library blurbs arrive as Markdown with a trailing source credit:
     "**From the *New York Times* bestselling author...**  ([source][1])".
     Strip it to plain prose -- the panel sets its own type. */
  function cleanBlurb(t) {
    return t
      .replace(/\r/g, "")
      .replace(/!\[[^\]]*\]\([^)]*\)/g, "")            /* images   */
      .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")          /* links    */
      .replace(/\[([^\]]*)\]\[[^\]]*\]/g, "$1")         /* ref links */
      .split(/\n\s*-{3,}/)[0]                           /* rule before the credit */
      .replace(/\(\s*\[?source[^)]*\)?\s*\)/gi, "")
      .replace(/^\s*(source|description)\s*:.*$/gim, "")
      .replace(/\*{1,3}([^*]+)\*{1,3}/g, "$1")           /* bold / italic */
      .replace(/_{1,3}([^_]+)_{1,3}/g, "$1")
      .replace(/^\s*#{1,6}\s*/gm, "")                    /* headings */
      .replace(/^\s*[-*+]\s+/gm, "")                     /* bullets  */
      .replace(/\n{3,}/g, "\n\n")
      /* Some records hang a cataloguing credit off the end of the prose:
         "- Container." is a MARC field name that leaked into the description.
         The list of credits is deliberately closed, because a short tail after
         a dash is far more often a real clause than a credit. */
      .replace(/\s*-+\s*(container|publisher['\u2019]?s description|from the publisher|provided by publisher|back cover|dust jacket|jacket|amazon\.com)\s*\.?\s*$/i, "")
      /* Open Library prose is typed as plain ASCII: "--" standing in for a dash
         and straight quotes throughout. The panel sets real type, so give it
         real punctuation rather than typewriter substitutes. */
      .replace(/\s*--\s*/g, " - ")
      .replace(/"([^"]*)"/g, "\u201c$1\u201d")
      .replace(/(^|[\s(\u201c])'/g, "$1\u2018")
      .replace(/'/g, "\u2019")
      .trim();
  }

  var STAR_PATH = "M12 2.4l2.94 5.96 6.58.96-4.76 4.64 1.12 6.55L12 17.4l-5.88 3.1 1.12-6.55L2.48 9.32l6.58-.96z";
  function starSVG(cls) {
    return '<span class="star ' + cls + '">' +
      '<svg viewBox="0 0 24 24" aria-hidden="true" class="star__bg"><path d="' + STAR_PATH + '"/></svg>' +
      '<svg viewBox="0 0 24 24" aria-hidden="true" class="star__fg"><path d="' + STAR_PATH + '"/></svg>' +
    "</span>";
  }
  function stars(n) {
    var out = "", i;
    for (i = 1; i <= 5; i++) {
      out += starSVG(n >= i ? "is-full" : (n >= i - 0.5 ? "is-half" : ""));
    }
    return out + '<span class="mine__n">' + n + " out of 5</span>";
  }

  /* The one book that is not from Open Library, because it is not from anyone:
     it is this site. Everything in here is stated plainly and is true. */
  function paintEgg(b) {
    $("pArt").className = "panel__art";
    $("pArt").innerHTML = fallbackArt(b);
    $("pBlurb").innerHTML =
      "<p>You got to the end of the shelf, which means there is one more book " +
      "here than the catalogue owns up to.</p>" +
      "<p>This one is the room you are standing in. It is hand-written HTML, CSS " +
      "and JavaScript with no framework and no build step, and the wall behind " +
      "you is drawn entirely in CSS: every spine is an element, cut to the " +
      "width of its own longest word so the title can be read across it rather " +
      "than down it. The only things this page fetches are the spreadsheet the " +
      "shelf is built from and, when you open a book, its cover.</p>" +
      "<p>If something up there is worth reading, or I am plainly missing " +
      "something, I\u2019d like to hear about it.</p>";
    $("pMeta").innerHTML = "<dt>Binding</dt><dd>Hand-sewn, no build step</dd>" +
                           "<dt>Print run</dt><dd>One</dd>";
    $("pSrc").innerHTML = 'Written and bound at home. ' +
      '<a href="mailto:PobVuti@gmail.com">Say hello</a>, or ' +
      '<a href="index.html">see the rest of the site</a>.';
  }

  function openPanel(b, trigger, silent) {
    if (!el.panel) return;
    openBook = b;
    lastFocus = trigger || null;
    clearTimeout(hideTimer);

    document.querySelectorAll(".slot.is-out").forEach(function (s) { s.classList.remove("is-out"); });
    if (trigger) {
      var slot = trigger.closest(".slot");
      if (slot) slot.classList.add("is-out");       /* the book stays off the shelf while its drawer is open */
    }

    $("pTitle").textContent = b.title;
    $("pAuthor").innerHTML = authorMark(b);
    $("pGenre").textContent = b.genre;
    $("pYear").textContent = b.yearText;

    var mine = $("pMine");
    if (b.rating === null) mine.hidden = true;
    else { mine.hidden = false; $("pStars").innerHTML = stars(b.rating); }

    $("pArt").className = "panel__art is-loading";
    $("pArt").innerHTML = "";
    $("pBlurb").innerHTML = '<p class="skel"></p><p class="skel"></p><p class="skel skel--short"></p>';
    $("pMeta").innerHTML = "";
    $("pSrc").textContent = "";

    el.panel.hidden = false;
    el.scrim.hidden = false;
    /* Commit the closed position with a forced layout read, then flip the class
       in the same task. requestAnimationFrame was unreliable here -- the class
       could land before the browser had painted the start state, or not at all. */
    void el.panel.offsetWidth;
    document.body.classList.add("panel-open");
    el.panel.focus({ preventScroll: true });
    if (!silent) writeURL(true);

    if (inFlight) { inFlight.abort(); inFlight = null; }
    if (b.isEgg) { paintEgg(b); return; }

    inFlight = new AbortController();
    var mine2 = b;
    lookup(b, inFlight.signal, true).then(function (rec) {
      if (openBook !== mine2) return;               /* a different book was opened meanwhile */
      paintLookup(b, rec);
    }, function () {});
  }

  function paintLookup(b, rec) {
    var art = $("pArt");
    art.className = "panel__art";
    if (rec.found && rec.cover) {
      var img = new Image();
      img.alt = "Cover of " + b.title;
      img.decoding = "async";
      img.onerror = function () { art.innerHTML = fallbackArt(b); };
      img.src = rec.cover;
      art.innerHTML = "";
      art.appendChild(img);
    } else {
      art.innerHTML = fallbackArt(b);
    }

    $("pBlurb").innerHTML = rec.blurb
      ? '<p>' + esc(rec.blurb).replace(/\n{2,}/g, "</p><p>") + "</p>"
      : '<p class="panel__none">No blurb for this one. Open Library doesn\u2019t have a description on file.</p>';

    /* Only the page count is taken from Open Library. `first_publish_year` was
       shown when it disagreed with the sheet, which meant it only ever appeared
       when it was wrong: Open Library dates Macbeth to 1508, Slaughterhouse-Five
       to 1956 and The Little Prince to 2003. The sheet's year is authoritative
       and is already printed beside the genre chip. */
    var meta = "";
    if (rec.pages) meta += "<dt>Length</dt><dd>" + rec.pages + " pages</dd>";
    $("pMeta").innerHTML = meta;

    $("pSrc").innerHTML = rec.found && rec.work
      ? 'Cover and blurb from <a href="' + OL + rec.work + '" target="_blank" rel="noopener">Open Library</a>'
      : (rec.errored ? "Couldn\u2019t reach Open Library just now." : "Open Library has no record of this edition.");
  }

  /* When there is no cover, draw the spine instead of showing a broken frame. */
  function fallbackArt(b) {
    return '<div class="noart" data-fam="' + b.family + '">' +
             '<span class="noart__t">' + esc(b.title) + "</span>" +
             '<span class="noart__a">' + esc(b.author) + "</span>" +
           "</div>";
  }

  function closePanel(silent) {
    if (!el.panel || !openBook) return;
    if (inFlight) { inFlight.abort(); inFlight = null; }
    openBook = null;
    document.body.classList.remove("panel-open");
    document.querySelectorAll(".slot.is-out").forEach(function (s) { s.classList.remove("is-out"); });
    /* Hiding waits for the slide-out. Guard it: reopening inside that window
       would otherwise let the stale timer hide the newly opened drawer. */
    clearTimeout(hideTimer);
    var done = function () {
      if (openBook) return;
      el.panel.hidden = true;
      el.scrim.hidden = true;
    };
    if (reduceMotion.matches) done();
    else hideTimer = setTimeout(done, 260);
    if (lastFocus && document.contains(lastFocus)) lastFocus.focus();
    lastFocus = null;
    if (!silent) writeURL(false);
  }

  /* On a phone the search field, sort, view toggle and genre pills add up to
     more than half the viewport, and being sticky they never gave it back. The
     stack now steps out of the way while you read down the shelf and returns as
     soon as you scroll up, reach the top, or focus the search field. */
  function hideChromeOnScroll(search) {
    var narrow = window.matchMedia("(max-width: 760px)");
    var lastY = window.scrollY, away = false, ticking = false;
    var REVEAL_ABOVE = 150;   /* always visible near the top of the page */
    var JITTER = 6;           /* ignore sub-pixel scroll noise */

    function set(next) {
      if (next === away) return;
      away = next;
      document.body.classList.toggle("chrome-away", away);
    }

    function onScroll() {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(function () {
        ticking = false;
        var y = window.scrollY;
        var delta = y - lastY;
        if (Math.abs(delta) < JITTER) return;
        lastY = y;

        /* never hide on desktop, near the top, while typing, or with the
           drawer open -- in each case the controls are what you are using */
        if (!narrow.matches || y < REVEAL_ABOVE ||
            document.activeElement === search || openBook) {
          set(false);
          return;
        }
        set(delta > 0);
      });
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    if (search) {
      search.addEventListener("focus", function () { set(false); });
    }
    narrow.addEventListener("change", function () { set(false); });
  }

  /* ---- boot --------------------------------------------------------------- */
  function init() {
    el.results = $("results");
    el.empty   = $("empty");
    el.count   = $("count");
    el.live    = $("live");
    el.pills   = $("pills");
    el.views   = $("views");
    el.fresh   = $("fresh");
    el.panel      = $("panel");
    el.scrim      = $("scrim");
    el.panelClose = $("panelClose");
    el.authorBar  = $("authorBar");
    el.authorName = $("authorName");
    el.authorClear= $("authorClear");
    var search = $("search");
    var clear  = $("clearSearch");
    var sort   = $("sort");
    if (!el.results || !search || !sort || !el.pills || !el.views) return;

    indexSlugs();
    initLamp();
    buildPills();
    syncRatingSort();

    var t;
    search.addEventListener("input", function () {
      clearTimeout(t);
      t = setTimeout(function () {
        state.q = search.value;
        document.body.classList.toggle("has-q", !!search.value);
        render();
      }, 120);
    });

    if (clear) {
      clear.addEventListener("click", function () {
        search.value = "";
        state.q = "";
        document.body.classList.remove("has-q");
        render();
        search.focus();
      });
    }

    sort.addEventListener("change", function () {
      state.sort = sort.value;
      render();
    });

    el.pills.addEventListener("click", function (e) {
      var five = e.target.closest("[data-five]");
      if (five) {
        state.fives = !state.fives;
        state.author = null;
        syncAuthor();
        syncPills();
        render();
        return;
      }
      if (e.target.closest("[data-clear]")) {
        state.families = [];
        state.fives = false;
        state.author = null;
        syncAuthor();
        syncPills();
        render();
        return;
      }
      var btn = e.target.closest(".pill[data-fam]");
      if (!btn) return;
      toggleFamily(btn.getAttribute("data-fam"));
      syncPills();
      render();
    });

    var reset = $("resetAll");
    if (reset) {
      reset.addEventListener("click", function () {
        search.value = "";
        state.q = "";
        document.body.classList.remove("has-q");
        state.families = [];
        state.fives = false;
        state.author = null;
        syncAuthor();
        syncPills();
        render();
        search.focus();
      });
    }

    /* A peek card anchored above its book would slide under the sticky toolbar
       for books near the top of the viewport. Flip it below when there isn't
       room, measured against the toolbar's real position. */
    el.results.addEventListener("click", function (e) {
      if (swallowClick) { swallowClick = false; return; }   /* that was a drag */
      var link = e.target.closest("[data-author]");
      if (link) { setAuthor(link.getAttribute("data-author")); return; }
      var cat = e.target.closest(".cat-nap");
      if (cat) { wakeCat(cat); return; }
      /* the cover is a click target too, but the title button stays the one
         real control: it is what focus goes back to when the drawer closes */
      var hit = e.target.closest(".book, .card__open, .card__art");
      if (!hit) return;
      var host = hit.closest("[data-i]");
      if (!host) return;
      var key = host.getAttribute("data-i");
      var b = key === "egg" ? EGG : shown[+key];
      if (b) openPanel(b, hit.classList.contains("card__art") ? host.querySelector(".card__open") : hit);
    });

    /* The drawer renders an author link too, and it sits outside #results, so
       the delegation above never saw it: the link looked live and did nothing.
       Close the drawer on the way out. The filter is a fresh view of the shelf
       behind, and the scrim would otherwise leave the reader dimming the very
       result they asked for. Focus lands on "show every author again", which is
       the control that names the state they just entered. */
    if (el.panel) {
      el.panel.addEventListener("click", function (e) {
        var link = e.target.closest("[data-author]");
        if (!link) return;
        closePanel();
        setAuthor(link.getAttribute("data-author"));
        if (el.authorClear) el.authorClear.focus();
      });
    }

    /* wrapped, not passed: closePanel's first argument decides whether the
       address bar is updated, and an Event object is truthy */
    if (el.panelClose) el.panelClose.addEventListener("click", function () { closePanel(); });
    if (el.scrim) el.scrim.addEventListener("click", function () { closePanel(); });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") closePanel();
    });
    window.addEventListener("popstate", function () { applyURL(); });

    if (el.authorClear) {
      el.authorClear.addEventListener("click", function () {
        state.author = null;
        syncAuthor();
        syncPills();
        render();
      });
    }

    hideChromeOnScroll(search);
    canHover.addEventListener("change", render);   /* peeks appear/disappear with the pointer */

    /* the edge fade hints "more this way"; drop it once there is no more */
    var markEnd = function () {
      var slack = el.pills.scrollWidth - el.pills.clientWidth;
      el.pills.classList.toggle("is-end", slack <= 1 || el.pills.scrollLeft >= slack - 1);
    };
    el.pills.addEventListener("scroll", markEnd, { passive: true });
    window.addEventListener("resize", markEnd);
    markEnd();

    var rt;
    window.addEventListener("resize", function () {
      if (state.view !== "carousel") return;
      clearTimeout(rt);
      rt = setTimeout(function () { render(); }, 180);   /* re-fit the segments */
    });

    el.results.addEventListener("pointerover", flipPeek, true);
    el.results.addEventListener("focusin", flipPeek, true);

    el.views.addEventListener("click", function (e) {
      var btn = e.target.closest("button[data-view]");
      if (btn) setView(btn.getAttribute("data-view"));
    });

    applyURL();   /* the query string decides the first render, not the defaults */

    if ("requestIdleCallback" in window) requestIdleCallback(sync, { timeout: 2500 });
    else setTimeout(sync, 600);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else init();
})();
