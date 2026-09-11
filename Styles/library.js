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
  var FAMILY_NAME = {};
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

  function toBooks(rows) {
    return rows.map(function (r) {
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
        yearText: year === null ? "—" : String(year),
        rating: rating,
        surname: surnameOf(author),
        sortTitle: sortTitle(title),
        h: h,
        maxWord: title.split(/\s+/).reduce(function (m, w) {
          return w.length > m ? w.length : m;
        }, 0),
        search: fold(title + " " + author + " " + genre)
      };
    });
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
  var authorCount = {};
  function indexAuthors() {
    authorCount = {};
    books.forEach(function (b) { authorCount[b.author] = (authorCount[b.author] || 0) + 1; });
  }
  indexAuthors();

  var state = {
    q: "",
    families: [],           /* empty means every genre */
    author: null,           /* set while viewing one author's run */
    fives: false,           /* only the books Pob gave five stars */
    sort: "genre",
    view: window.matchMedia("(min-width: 760px)").matches ? "shelf" : "cards"
  };

  var el = {};
  function $(id) { return document.getElementById(id); }

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

  function spine(b, i) {
    /* >>> not >>: the hash fills 32 bits, and a signed shift turns values above
       2^31 negative, which JS's % then keeps negative (5px-wide books). */
    var height = 152 + (b.h % 56);           /* 152-207px */
    var width = 30 + ((b.h >>> 8) % 26);     /* 30-55px   */
    var shade = (b.h >>> 16) % 7;            /* subtle cloth variation */
    var treat = (b.h >>> 24) % 4;            /* rules / label panel / doubled / bare */
    /* A thick spine with a short title prints it across, like a real hardback --
       but only when the longest word actually fits the width. Otherwise the text
       breaks mid-word ("Impossib / le"), which no printer has ever done. */
    var horiz = width >= 46 && b.title.length <= 24 && b.maxWord <= (width - 10) / 4.6;
    return '<div class="slot">' +
      '<button type="button" class="book" data-i="' + i + '" data-fam="' + b.family + '" data-shade="' + shade + '"' +
        ' data-treat="' + treat + '"' + (horiz ? ' data-horiz="1"' : '') +
        (b.rating === 5 ? ' data-five="1"' : '') +
        ' style="--bh:' + height + 'px;--bw:' + width + 'px"' +
        ' aria-label="' + esc(b.title + ", " + b.author + ", " + b.genre + ", " + b.yearText) + '">' +
        '<span class="book__band" aria-hidden="true"></span>' +
        '<span class="book__title" aria-hidden="true">' + esc(b.title) + '</span>' +
        '<span class="book__band book__band--low" aria-hidden="true"></span>' +
      '</button>' +
      '<span class="peek">' +
        '<span class="peek__title">' + esc(b.title) + '</span>' +
        '<span class="peek__author">' + authorMark(b) + '</span>' +
        '<span class="peek__meta">' + esc(b.genre) + ' &middot; ' + esc(b.yearText) + '</span>' +
      '</span>' +
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
      '<h3 class="card__title"><button type="button" class="card__open">' + esc(b.title) + '</button></h3>' +
      '<p class="card__author">' + authorMark(b) + '</p>' +
      '<p class="card__meta"><span class="chip">' + esc(b.genre) + '</span>' +
        '<span class="card__year">' + esc(b.yearText) + '</span></p>' +
    '</article>';
  }

  var shown = [];          /* what is on screen, indexed to match the DOM */

  function render() {
    var list = visible();
    shown = list;
    var html = "", group = null, open = false, i, b, label;
    var isShelf = state.view === "shelf";
    var draw = isShelf ? spine : card;
    var box = isShelf ? "wall" : "grid";

    if (state.sort === "all") {
      /* one continuous run, no dividers — the whole collection on one shelf */
      html = '<div class="' + box + '">';
      for (i = 0; i < list.length; i++) html += draw(list[i], i);
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
        html += draw(b, i);
      }
      if (open) html += "</div>";
    }

    el.results.className = "results results--" + state.view;
    el.results.innerHTML = html;
    el.empty.hidden = list.length > 0;

    /* Stagger the entrance, capped so reordering 341 books stays smooth. */
    if (!reduceMotion.matches) {
      var nodes = el.results.querySelectorAll(isShelf ? ".slot" : ".card");
      for (i = 0; i < nodes.length && i < 24; i++) {
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
  }

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
      if (state.sort === "rating") state.sort = "genre";
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

  function setView(view) {
    state.view = view;
    var all = el.views.querySelectorAll("button");
    for (var i = 0; i < all.length; i++) {
      var on = all[i].getAttribute("data-view") === view;
      all[i].classList.toggle("is-on", on);
      all[i].setAttribute("aria-pressed", on ? "true" : "false");
    }
    render();
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

  function lookup(b, signal) {
    var key = b.title + "|" + b.author;
    if (lookupCache[key]) return Promise.resolve(lookupCache[key]);

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
        if (!doc) return (lookupCache[key] = { found: false });
        var rec = {
          found: true,
          cover: doc.cover_i ? "https://covers.openlibrary.org/b/id/" + doc.cover_i + "-L.jpg" : null,
          pages: doc.number_of_pages_median || null,
          firstYear: doc.first_publish_year || null,
          work: doc.key || null,
          blurb: null
        };
        if (!rec.work) return (lookupCache[key] = rec);
        return olSearch(OL + rec.work + ".json", signal).then(function (w) {
          var d2 = w && w.description;
          if (d2 && typeof d2 === "object") d2 = d2.value;
          if (typeof d2 === "string" && d2.trim().length > 40) rec.blurb = cleanBlurb(d2);
          return (lookupCache[key] = rec);
        }, function () { return (lookupCache[key] = rec); });
      })
      .catch(function (e) {
        if (e && e.name === "AbortError") throw e;
        return { found: false, errored: true };
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

  function openPanel(b, trigger) {
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

    if (inFlight) inFlight.abort();
    inFlight = new AbortController();
    var mine2 = b;
    lookup(b, inFlight.signal).then(function (rec) {
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
      : '<p class="panel__none">No blurb for this one — Open Library doesn\u2019t have a description on file.</p>';

    var meta = "";
    if (rec.pages) meta += "<dt>Length</dt><dd>" + rec.pages + " pages</dd>";
    if (rec.firstYear && rec.firstYear !== b.year) {
      meta += "<dt>First published</dt><dd>" + rec.firstYear + "</dd>";
    }
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

  function closePanel() {
    if (!el.panel || el.panel.hidden) return;
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

    buildPills();
    syncRatingSort();
    sort.value = state.sort;   /* keep the control showing the real default */

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
      var link = e.target.closest("[data-author]");
      if (link) { setAuthor(link.getAttribute("data-author")); return; }
      var hit = e.target.closest(".book, .card__open");
      if (!hit) return;
      var host = hit.closest("[data-i]");
      var b = host && shown[+host.getAttribute("data-i")];
      if (b) openPanel(b, hit);
    });

    if (el.panelClose) el.panelClose.addEventListener("click", closePanel);
    if (el.scrim) el.scrim.addEventListener("click", closePanel);
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") closePanel();
    });

    if (el.authorClear) {
      el.authorClear.addEventListener("click", function () {
        state.author = null;
        syncAuthor();
        syncPills();
        render();
      });
    }

    el.results.addEventListener("pointerover", flipPeek, true);
    el.results.addEventListener("focusin", flipPeek, true);

    el.views.addEventListener("click", function (e) {
      var btn = e.target.closest("button[data-view]");
      if (btn) setView(btn.getAttribute("data-view"));
    });

    setView(state.view);

    if ("requestIdleCallback" in window) requestIdleCallback(sync, { timeout: 2500 });
    else setTimeout(sync, 600);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else init();
})();
