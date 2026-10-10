/* ---------------------------------------------------------------------------
   The Stacks, Overanalyzed — library-info.html

   Every figure on the page is computed here from the shelf log, never typed
   into the HTML by hand (the numbers in the markup are only no-JS fallbacks).
   First paint uses the baked snapshot in library-data.js; the Google Sheet is
   then re-read and, if it has changed, the whole zine re-renders.

   Every renderer guards its own element and no-ops if it is missing.
--------------------------------------------------------------------------- */
(function () {
  "use strict";

  var SHEET_CSV =
    "https://docs.google.com/spreadsheets/d/1LSyUoNO50mpBUlmAEt9lHR9n7XVE7jGSeH29lT9m1Ik/gviz/tq?tqx=out:csv";

  var reduceMotion = window.matchMedia
    ? window.matchMedia("(prefers-reduced-motion: reduce)")
    : { matches: false };
  var NOW = new Date().getFullYear();

  function $(id) { return document.getElementById(id); }
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function plural(n, one, many) { return n + " " + (n === 1 ? one : (many || one + "s")); }
  function pct(n, total) { return Math.round((n / total) * 100) + "%"; }

  /* ---- kinds of book ------------------------------------------------------
     The sheet has ~70 distinct genre strings. These nine bins are this page's
     own (deliberately silly) grouping; order matters, first match wins.
  ----------------------------------------------------------------------- */
  var FAMS = [
    { key: "pics",     name: "Pictures Included",       ink: "orange", test: /graphic|comic|picture|photograph|^art$/i },
    { key: "fantasy",  name: "Dragons & Magic",         ink: "purple", test: /fantasy|litrpg/i },
    { key: "scifi",    name: "Spaceships & Robots",     ink: "blue",   test: /science fiction/i },
    { key: "classics", name: "Dead Authors' Club",      ink: "brown",  test: /^classic(?! mystery)|drama|fable|folklore/i },
    { key: "chills",   name: "Whodunits & Chills",      ink: "black",  test: /mystery|thriller|crime|horror|gothic/i },
    { key: "hustle",   name: "Hustle Culture",          ink: "green",  test: /business|self-help|career|finance|technology|marketing/i },
    { key: "brainy",   name: "Big Brain Nonfiction",    ink: "teal",   test: /nonfiction|history|science|psycholog|econom|politic|essay|memoir|religion|philosoph/i },
    { key: "feels",    name: "Feelings, Mostly",        ink: "pink",   test: /fiction|novel|stor|romance|ya|satire/i },
    { key: "misc",     name: "Gloriously Unsortable",   ink: "yellow", test: /./ }
  ];
  var QUIPS = {
    feels: "Turns out the most popular genre is just… people having emotions.",
    scifi: "Somewhere, a robot is doing a little dance.",
    fantasy: "A dragon somewhere is very smug about this.",
    chills: "Sleep with the lights on.",
    hustle: "Rise and grind, apparently.",
    brainy: "Big brain energy confirmed."
  };
  function family(genre) {
    for (var i = 0; i < FAMS.length; i++) if (FAMS[i].test.test(genre || "")) return FAMS[i];
    return FAMS[FAMS.length - 1];
  }

  function toBooks(rows) {
    var out = [];
    rows.forEach(function (r) {
      var t = String(r[0] || "").trim(), a = String(r[1] || "").trim();
      if (!t || !a) return;
      var y = parseInt(r[3], 10);
      out.push({ title: t, author: a, genre: String(r[2] || "").trim(), year: isNaN(y) ? null : y, fam: family(r[2]) });
    });
    return out;
  }

  /* ---- RFC 4180 CSV + header lookup (the sheet can reorder its columns) - */
  function parseCSV(text) {
    var rows = [], row = [], field = "", inQ = false, c;
    text = String(text).replace(/\r\n?/g, "\n");
    for (var i = 0; i < text.length; i++) {
      c = text[i];
      if (inQ) {
        if (c === '"') { if (text[i + 1] === '"') { field += '"'; i++; } else inQ = false; }
        else field += c;
      } else if (c === '"') inQ = true;
      else if (c === ",") { row.push(field); field = ""; }
      else if (c === "\n") { row.push(field); rows.push(row); row = []; field = ""; }
      else field += c;
    }
    if (field !== "" || row.length) { row.push(field); rows.push(row); }
    return rows;
  }
  function rowsFromCSV(text) {
    var all = parseCSV(text);
    if (!all.length) return [];
    var head = all[0].map(function (h) { return String(h || "").trim().toLowerCase(); });
    function col(names, fb) {
      for (var i = 0; i < names.length; i++) { var k = head.indexOf(names[i]); if (k !== -1) return k; }
      return fb;
    }
    var iT = col(["title"], 0), iA = col(["author", "authors"], 1),
        iG = col(["genre", "genres"], 2), iY = col(["release year", "year", "published"], 3);
    var start = head.indexOf("title") !== -1 ? 1 : 0, out = [];
    for (var i = start; i < all.length; i++) {
      var r = all[i], t = (r[iT] || "").trim(), a = (r[iA] || "").trim();
      if (t && a) out.push([t, a, (r[iG] || "").trim(), (r[iY] || "").trim()]);
    }
    return out;
  }

  /* ---- helpers ------------------------------------------------------------ */
  function tally(list, keyFn) {
    var m = Object.create(null);
    list.forEach(function (x) { var k = keyFn(x); if (k != null) m[k] = (m[k] || 0) + 1; });
    return m;
  }
  function sortedEntries(m) {
    return Object.keys(m).map(function (k) { return [k, m[k]]; })
      .sort(function (a, b) { return b[1] - a[1] || a[0].localeCompare(b[0]); });
  }
  function stripArticle(t) { return t.replace(/^(the|a|an)\s+/i, ""); }
  function shortTitle(t) { return t.replace(/\s*\(.*?\)\s*/g, " ").trim(); }
  function setStat(name, value) {
    document.querySelectorAll('[data-stat="' + name + '"]').forEach(function (n) {
      if (n.hasAttribute("data-count")) n.setAttribute("data-target", value);
      n.textContent = value;
    });
  }

  /* ======================================================================= */
  var books = toBooks(window.LIBRARY_SEED || []);

  function render() {
    if (!books.length) return;
    renderNumbers();
    renderWaffle();
    renderHist();
    renderAuthors();
    renderTitles();
    renderPatterns();
    renderAbc();
    renderTower();
    newDate();
    countUp();
  }

  /* ---- 01 ---------------------------------------------------------------- */
  function renderNumbers() {
    var dated = books.filter(function (b) { return b.year; })
                     .sort(function (a, b) { return a.year - b.year; });
    var authors = tally(books, function (b) { return b.author; });
    var oldest = dated[0], newest = dated[dated.length - 1];
    var median = dated[Math.floor((dated.length - 1) / 2)].year;
    var age = NOW - median;

    setStat("count", books.length);
    setStat("authors", Object.keys(authors).length);
    setStat("oldest", oldest.year);
    setStat("oldestTitle", oldest.title);
    setStat("span", newest.year - oldest.year);
    setStat("median", median);
    setStat("repeat", Object.keys(authors).filter(function (k) { return authors[k] > 1; }).length);
    setStat("medianAge", age < 13 ? "still in primary school." : age < 20 ? "a teenager." : age < 30 ? "in its twenties." : "having a midlife crisis.");
  }

  /* ---- 02 waffle --------------------------------------------------------- */
  var waffleBooks = [];
  function renderWaffle() {
    var el = $("waffle"), legend = $("legend");
    if (!el) return;
    var counts = tally(books, function (b) { return b.fam.key; });
    var order = FAMS.slice().sort(function (a, b) { return (counts[b.key] || 0) - (counts[a.key] || 0); })
                    .filter(function (f) { return counts[f.key]; });
    waffleBooks = [];
    order.forEach(function (f) {
      books.filter(function (b) { return b.fam === f; })
           .sort(function (a, b) { return (a.year || 0) - (b.year || 0); })
           .forEach(function (b) { waffleBooks.push(b); });
    });
    el.innerHTML = waffleBooks.map(function (b, i) {
      return '<i class="sq ink-' + b.fam.ink + '" data-i="' + i + '" style="--d:' + (i % 40) * 12 + 'ms"></i>';
    }).join("");

    if (legend) {
      legend.innerHTML = order.map(function (f) {
        return '<li><button type="button" class="legend__btn" data-fam="' + f.key + '">' +
          '<span class="sw ink-' + f.ink + '"></span>' +
          '<span class="legend__name">' + esc(f.name) + '</span>' +
          '<span class="legend__n">' + counts[f.key] + ' <small>' + pct(counts[f.key], books.length) + '</small></span>' +
          '</button></li>';
      }).join("");
    }
    var top = order[0], second = order[1];
    var callout = $("genre-callout");
    if (callout && top) {
      callout.innerHTML = "<b>" + esc(top.name) + "</b> wins with " + plural(counts[top.key], "book") +
        ", beating <b>" + esc(second.name) + "</b> by " + (counts[top.key] - counts[second.key]) +
        ". " + (QUIPS[top.key] || "Nobody saw that coming.");
    }
  }

  function wireWaffle() {
    var el = $("waffle"), out = $("readout"), legend = $("legend");
    if (!el || !out) return;
    var last = null;
    function show(target) {
      if (!target || !target.classList.contains("sq")) return;
      var b = waffleBooks[+target.getAttribute("data-i")];
      if (!b) return;
      if (last) last.classList.remove("is-hot");
      target.classList.add("is-hot");
      last = target;
      out.innerHTML = '<span class="readout__fam ink-' + b.fam.ink + '">' + esc(b.fam.name) + '</span>' +
        '<b class="readout__t">' + esc(b.title) + '</b>' +
        '<span class="readout__a">' + esc(b.author) + (b.year ? " &middot; " + b.year : "") + '</span>' +
        '<span class="readout__g">filed as &ldquo;' + esc(b.genre || "unfiled") + '&rdquo;</span>';
    }
    el.addEventListener("pointerover", function (e) { show(e.target); });
    el.addEventListener("click", function (e) { show(e.target); });

    if (legend) {
      legend.addEventListener("click", function (e) {
        var btn = e.target.closest(".legend__btn");
        if (!btn) return;
        var key = btn.getAttribute("data-fam");
        var on = !btn.classList.contains("is-on");
        legend.querySelectorAll(".legend__btn").forEach(function (b) {
          b.classList.remove("is-on"); b.setAttribute("aria-pressed", "false");
        });
        el.classList.toggle("is-filtered", on);
        el.querySelectorAll(".sq").forEach(function (sq) {
          var b = waffleBooks[+sq.getAttribute("data-i")];
          sq.classList.toggle("is-lit", on && b && b.fam.key === key);
        });
        if (on) { btn.classList.add("is-on"); btn.setAttribute("aria-pressed", "true"); }
      });
    }
  }

  /* ---- 03 histogram ------------------------------------------------------ */
  function renderHist() {
    var el = $("hist");
    if (!el) return;
    var dated = books.filter(function (b) { return b.year; });
    var minY = Math.min.apply(null, dated.map(function (b) { return b.year; }));
    var maxY = Math.max.apply(null, dated.map(function (b) { return b.year; }));
    var bins = [];
    for (var c = Math.floor(minY / 100) * 100; c < 1900; c += 100) bins.push({ from: c, to: c + 99, label: c + "s" });
    for (var d = 1900; d <= maxY; d += 10) bins.push({ from: d, to: d + 9, label: "'" + String(d).slice(2) + "s" });
    bins.forEach(function (bin) {
      bin.books = dated.filter(function (b) { return b.year >= bin.from && b.year <= bin.to; });
    });
    var peak = Math.max.apply(null, bins.map(function (b) { return b.books.length; }));
    el.innerHTML = bins.map(function (bin, i) {
      var n = bin.books.length, h = n ? Math.max(2, (n / peak) * 100) : 0;
      var cls = bin.from < 1900 ? "bar bar--old" : (n === peak ? "bar bar--peak" : "bar");
      var tip = n ? bin.books.slice(0, 3).map(function (b) { return b.title; }).join(", ") + (n > 3 ? "…" : "") : "nothing";
      return '<div class="' + cls + '" style="--h:' + h + '%;--d:' + i * 40 + 'ms" title="' + esc(bin.label + ": " + tip) + '">' +
        '<span class="bar__n">' + (n || "") + '</span><span class="bar__fill"></span>' +
        '<span class="bar__l">' + bin.label + '</span></div>';
    }).join("");

    var since2010 = dated.filter(function (b) { return b.year >= 2010; }).length;
    var f1 = $("fact-recent");
    if (f1) f1.innerHTML = "<b>" + pct(since2010, dated.length) + "</b> of the collection came out in " + 2010 +
      " or later. Recency bias? In <i>this</i> economy? Absolutely.";

    var sorted = dated.slice().sort(function (a, b) { return a.year - b.year; });
    var gap = { n: 0 };
    for (var k = 1; k < sorted.length; k++) {
      var g = sorted[k].year - sorted[k - 1].year;
      if (g > gap.n) gap = { n: g, a: sorted[k - 1], b: sorted[k] };
    }
    var f2 = $("fact-gap");
    if (f2 && gap.a) f2.innerHTML = "The loneliest stretch: <b>" + gap.n + " years</b> with no books at all, between <i>" +
      esc(gap.a.title) + "</i> (" + gap.a.year + ") and <i>" + esc(gap.b.title) + "</i> (" + gap.b.year + ").";

    var years = sortedEntries(tally(dated, function (b) { return b.year; }));
    var f3 = $("fact-year");
    if (f3 && years.length) f3.innerHTML = "Best single year: <b>" + years[0][0] + "</b>, with " +
      plural(years[0][1], "book") + ". A vintage year.";
  }

  /* ---- 04 authors -------------------------------------------------------- */
  function renderAuthors() {
    var counts = sortedEntries(tally(books, function (b) { return b.author; }));
    var podium = $("podium"), ranks = $("ranks");
    var medals = ["gold", "silver", "bronze"];
    if (podium) {
      var top = counts.slice(0, 3);
      /* visual order: 2nd, 1st, 3rd */
      var visual = [top[1], top[0], top[2]].map(function (e, i) { return { e: e, place: [2, 1, 3][i] }; })
                     .filter(function (x) { return x.e; });
      podium.innerHTML = visual.map(function (x) {
        var titles = books.filter(function (b) { return b.author === x.e[0]; }).map(function (b) { return b.title; });
        return '<div class="pod pod--' + x.place + '">' +
          '<div class="pod__who"><span class="pod__medal medal-' + medals[x.place - 1] + '">' + x.place + '</span>' +
          '<b class="pod__name">' + esc(x.e[0]) + '</b>' +
          '<span class="pod__n">' + plural(x.e[1], "book") + '</span></div>' +
          '<div class="pod__block" title="' + esc(titles.join(" · ")) + '">' +
          '<span class="pod__place">' + ["1st", "2nd", "3rd"][x.place - 1] + '</span></div></div>';
      }).join("");
    }
    if (ranks) {
      var rest = counts.slice(3).filter(function (e) { return e[1] >= 4; });
      var peak = counts[0] ? counts[0][1] : 1;
      ranks.innerHTML = rest.map(function (e, i) {
        return '<li class="rank" style="--w:' + (e[1] / peak) * 100 + '%;--d:' + i * 50 + 'ms">' +
          '<span class="rank__name">' + esc(e[0]) + '</span>' +
          '<span class="rank__bar"><span class="rank__fill"></span></span>' +
          '<span class="rank__n">' + e[1] + '</span></li>';
      }).join("");
    }
    var club = $("club");
    if (club) {
      var three = counts.slice(3).filter(function (e) { return e[1] === 3; });
      club.innerHTML = three.length
        ? '<h3 class="club__h">The Trilogy Club<span>' + plural(three.length, "author") + ' with exactly three books each</span></h3>' +
          '<ul class="club__list">' + three.map(function (e) { return "<li>" + esc(e[0]) + "</li>"; }).join("") + "</ul>"
        : "";
    }
    var collab = books.filter(function (b) { return /\s(and|with)\s/.test(b.author) && !/\(eds?\.\)/.test(b.author); });
    var one = counts.filter(function (e) { return e[1] === 1; }).length;
    var c = $("collab");
    if (c) c.innerHTML = "Meanwhile <b>" + one + " authors</b> are one-hit wonders on this shelf, and <b>" +
      plural(collab.length, "book") + "</b> needed two or more people to write" +
      (collab.length ? ", like <i>" + esc(collab[0].title) + "</i>." : ".");
  }

  /* ---- 05 titles --------------------------------------------------------- */
  var STOP = ("the of a and to in on with you is for who at an we i that your how all it this from " +
    "be my me are or as by its not was what his her he she they them our us").split(" ");

  function renderTitles() {
    var bout = $("bout");
    if (bout) {
      var byLen = books.slice().sort(function (a, b) { return a.title.length - b.title.length; });
      var s = byLen[0], l = byLen[byLen.length - 1];
      var avg = Math.round(books.reduce(function (n, b) { return n + b.title.length; }, 0) / books.length);
      var words = Math.round(books.reduce(function (n, b) { return n + b.title.split(/\s+/).length; }, 0) / books.length * 10) / 10;
      bout.innerHTML =
        '<div class="corner corner--blue"><span class="corner__tag">Shortest</span>' +
          '<b class="corner__t corner__t--short">' + esc(s.title) + '</b>' +
          '<span class="corner__by">' + esc(s.author) + '</span>' +
          '<span class="corner__n">' + plural(s.title.length, "character") + '</span></div>' +
        '<div class="vs" aria-hidden="true">VS</div>' +
        '<div class="corner corner--pink"><span class="corner__tag">Longest</span>' +
          '<b class="corner__t">' + esc(l.title) + '</b>' +
          '<span class="corner__by">' + esc(l.author) + '</span>' +
          '<span class="corner__n">' + plural(l.title.length, "character") + '</span></div>' +
        '<p class="bout__ref">Referee&rsquo;s note: the average title is ' + avg + ' characters, or about ' + words + ' words.</p>';
    }

    var cloud = $("cloud");
    if (cloud) {
      var words = tally([].concat.apply([], books.map(function (b) {
        return shortTitle(b.title).toLowerCase().replace(/[^a-z\s'-]/g, " ").split(/\s+/);
      })), function (w) { w = w.replace(/^'+|'+$/g, ""); return w.length > 2 && STOP.indexOf(w) === -1 ? w : null; });
      var top = sortedEntries(words).filter(function (e) { return e[1] >= 3; }).slice(0, 30);
      var max = top.length ? top[0][1] : 1, min = top.length ? top[top.length - 1][1] : 1;
      var inks = ["blue", "pink", "purple", "green", "orange", "teal", "black"];
      /* shuffle deterministically so the biggest word sits mid-cloud */
      var arranged = [];
      top.forEach(function (e, i) { if (i % 2) arranged.push(e); else arranged.unshift(e); });
      cloud.innerHTML = arranged.map(function (e, i) {
        var t = max === min ? 1 : (e[1] - min) / (max - min);
        var rot = [0, -4, 3, 0, -2, 5, 0][i % 7];
        return '<span class="word ink-text-' + inks[i % inks.length] + '" style="--s:' + (1 + t * 2.6).toFixed(2) +
          ';--r:' + rot + 'deg" title="' + esc(e[0] + ": in " + e[1] + " titles") + '">' + esc(e[0]) +
          '<sup>' + e[1] + '</sup></span>';
      }).join(" ");
    }
  }

  /* ---- 06 patterns ------------------------------------------------------- */
  var PATTERNS = [
    { re: /\b(death|die|dies|dying|dead|deaths|kill|killed|killing|murders?|murdle)\b/i, big: "Body count", note: "titles that mention death, dying or murder. Cosy!", ink: "black" },
    { re: /\bgirls?\b/i, big: "The Girl Who…", note: "titles featuring a girl. Publishers love a girl.", ink: "pink" },
    { re: /\bstrange(r)?\b/i, big: "Strange things", note: "titles that are openly strange about it.", ink: "purple" },
    { re: /\d/, big: "Numberwang", note: "titles with a number in them.", ink: "blue" },
    { re: /\?/, big: "Asking questions", note: "titles that end on a question.", ink: "orange" },
    { re: /\b(time|minutes?|seconds?|hours?|days?|years?|decembers?|night)\b/i, big: "Clock watchers", note: "titles obsessed with time.", ink: "teal" },
    { re: /\b(how to|guide|habits|rich|wealth|win)\b/i, big: "Self-improvement era", note: "titles promising to fix your life.", ink: "green" },
    { re: /\b(planet|space|mars|martian|orbital|universe|stars?|sun|moon)\b/i, big: "Going to space", note: "titles that leave the atmosphere.", ink: "yellow" }
  ];
  function renderPatterns() {
    var el = $("stickers");
    if (!el) return;
    el.innerHTML = PATTERNS.map(function (p, i) {
      var hits = books.filter(function (b) { return p.re.test(b.title); });
      if (!hits.length) return "";
      var sample = hits.slice(0, 3).map(function (b) { return "<li>" + esc(b.title) + "</li>"; }).join("");
      var more = hits.length > 3 ? '<li class="more">+ ' + (hits.length - 3) + ' more</li>' : "";
      return '<details class="sticker sticker--' + p.ink + '" style="--r:' + [-2, 1.5, -1, 2, -1.5, 1, -2.5, 1.2][i % 8] + 'deg">' +
        '<summary><b class="sticker__n">' + hits.length + '</b>' +
        '<span class="sticker__big">' + esc(p.big) + '</span>' +
        '<span class="sticker__note">' + esc(p.note) + '</span>' +
        '<span class="sticker__peek">show me</span></summary>' +
        '<ul class="sticker__list">' + sample + more + '</ul></details>';
    }).join("");
    el.querySelectorAll(".sticker").forEach(function (d) {
      var p = PATTERNS.filter(function (x) { return x.big === d.querySelector(".sticker__big").textContent; })[0];
      d.addEventListener("toggle", function () {
        if (!d.open || !p) return;
        d.querySelector(".sticker__list").innerHTML = books.filter(function (b) { return p.re.test(b.title); })
          .map(function (b) { return "<li>" + esc(b.title) + "</li>"; }).join("");
      });
    });
  }

  /* ---- 07 alphabet ------------------------------------------------------- */
  function renderAbc() {
    var el = $("abc");
    if (!el) return;
    var counts = tally(books, function (b) {
      var ch = stripArticle(b.title).charAt(0).toUpperCase();
      return /[A-Z]/.test(ch) ? ch : "#";
    });
    var letters = "#ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
    var peak = Math.max.apply(null, letters.map(function (l) { return counts[l] || 0; }));
    var inks = ["blue", "pink", "purple", "green", "orange", "teal"];
    el.innerHTML = letters.map(function (l, i) {
      var n = counts[l] || 0;
      return '<div class="abc__col' + (n ? "" : " is-empty") + '" title="' + (l === "#" ? "Starts with a number" : l) + ": " + plural(n, "title") + '">' +
        '<span class="abc__bar ink-' + inks[i % inks.length] + '" style="--h:' + (n / peak) * 100 + '%;--d:' + i * 25 + 'ms"></span>' +
        '<b class="abc__l">' + l + '</b><span class="abc__n">' + n + '</span></div>';
    }).join("");
    var top = sortedEntries(counts)[0];
    var missing = letters.filter(function (l) { return l !== "#" && !counts[l]; });
    var c = $("abc-callout");
    if (c) c.innerHTML = "<b>" + top[0] + "</b> is the most popular opening letter (" + plural(top[1], "title") + "). " +
      (missing.length
        ? "Still waiting on a title that starts with " + missing.map(function (l) { return "<b>" + l + "</b>"; }).join(", ").replace(/, ([^,]*)$/, " or $1") + ". Authors, you know what to do."
        : "Every single letter is represented. Show-off.");
  }

  /* ---- 08 tower ---------------------------------------------------------- */
  function renderTower() {
    var el = $("tower-chart");
    if (!el) return;
    var stack = books.length * 0.03;
    /* reference heights are rough, rounded averages */
    var refs = [
      { label: "A person", m: 1.7, ink: "teal" },
      { label: "Double-decker bus", m: 4.4, ink: "orange" },
      { label: "Giraffe", m: 5.5, ink: "yellow" },
      { label: "The book stack", m: stack, ink: "stack" }
    ];
    var tallest = Math.max.apply(null, refs.map(function (r) { return r.m; }));
    var inks = ["blue", "pink", "purple", "green", "orange", "teal", "brown", "black"];
    el.innerHTML = refs.map(function (r) {
      var h = (r.m / tallest) * 100;
      var inner = "";
      if (r.ink === "stack") {
        var slabs = Math.min(60, books.length);
        for (var i = 0; i < slabs; i++) {
          inner += '<i class="slab ink-' + inks[(i * 5) % inks.length] + '" style="--x:' + ((i * 37) % 9 - 4) + 'px"></i>';
        }
      }
      return '<div class="tw tw--' + r.ink + '">' +
        '<span class="tw__m">' + r.m.toFixed(1) + ' m</span>' +
        '<div class="tw__col" style="--h:' + h + '%">' + inner + '</div>' +
        '<span class="tw__l">' + r.label + '</span></div>';
    }).join("");
    var c = $("tower-callout");
    if (c) c.innerHTML = "That&rsquo;s roughly <b>" + (stack / 5.5).toFixed(1) + " giraffes</b> standing on each other&rsquo;s heads, " +
      "or <b>" + Math.round(stack / 1.7) + " people</b> doing a very unstable circus act. Please do not attempt.";
  }

  /* ---- 09 blind date ----------------------------------------------------- */
  var current = null, lastIdx = -1;
  function newDate() {
    var clues = $("date-clues"), reveal = $("date-reveal"), btn = $("date-show");
    if (!clues || !books.length) return;
    var i;
    do { i = Math.floor(Math.random() * books.length); } while (books.length > 1 && i === lastIdx);
    lastIdx = i;
    current = books[i];
    var b = current;
    var initials = b.author.split(/\s+/).filter(function (w) { return /^[A-Z]/.test(w) && !/^(and|with)$/i.test(w); })
      .map(function (w) { return w.charAt(0) + "."; }).join(" ");
    var era = !b.year ? "a mystery" : b.year < 1900 ? "the " + Math.floor(b.year / 100) * 100 + "s (vintage!)" : "the " + Math.floor(b.year / 10) * 10 + "s";
    var wc = b.title.split(/\s+/).length;
    var list = [
      ["Into", b.genre || "keeping it vague"],
      ["Born in", era],
      ["Name", plural(wc, "word") + ", starts with “" + stripArticle(b.title).charAt(0).toUpperCase() + "”"],
      ["Parents' initials", initials || "?"]
    ];
    clues.innerHTML = list.map(function (c) {
      return '<li><span class="date__k">' + esc(c[0]) + '</span><span class="date__v">' + esc(c[1]) + '</span></li>';
    }).join("");
    if (reveal) { reveal.hidden = true; reveal.innerHTML = ""; }
    if (btn) btn.disabled = false;
  }
  function showDate() {
    var reveal = $("date-reveal"), card = $("date-card"), btn = $("date-show");
    if (!reveal || !current) return;
    reveal.innerHTML = '<span class="date__it">It&rsquo;s&hellip;</span><b class="date__t">' + esc(current.title) + '</b>' +
      '<span class="date__a">by ' + esc(current.author) + (current.year ? ", " + current.year : "") + '</span>';
    reveal.hidden = false;
    if (btn) btn.disabled = true;
    if (card && !reduceMotion.matches) {
      card.classList.remove("is-pop"); void card.offsetWidth; card.classList.add("is-pop");
    }
  }

  /* ---- count-up for the big numbers ------------------------------------- */
  function countUp() {
    var nodes = document.querySelectorAll("[data-count]");
    nodes.forEach(function (n) {
      var target = parseInt(n.getAttribute("data-target") || n.textContent, 10);
      if (isNaN(target) || reduceMotion.matches || !window.requestAnimationFrame || n.dataset.done) {
        n.textContent = isNaN(target) ? n.textContent : target; return;
      }
      n.dataset.done = "1";
      var t0 = null, dur = 1100;
      n.textContent = "0";
      function step(t) {
        if (!t0) t0 = t;
        var p = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - p, 3);
        n.textContent = Math.round(target * e);
        if (p < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    });
  }

  /* ---- reveal sections as they scroll in -------------------------------- */
  function watchSections() {
    var secs = document.querySelectorAll(".sec");
    if (!("IntersectionObserver" in window)) {
      secs.forEach(function (s) { s.classList.add("is-in"); }); return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); }
      });
    }, { threshold: 0.15 });
    secs.forEach(function (s) { io.observe(s); });
  }

  /* ---- live sheet sync -------------------------------------------------- */
  function sync() {
    if (!window.fetch) return;
    fetch(SHEET_CSV, { cache: "no-store" })
      .then(function (r) { return r.ok ? r.text() : Promise.reject(new Error(r.status)); })
      .then(function (text) {
        var next = toBooks(rowsFromCSV(text));
        if (next.length < 10) return;
        var note = $("sync-note");
        if (note) note.textContent = "synced live from the sheet just now";
        var same = next.length === books.length && next.every(function (b, i) {
          return b.title === books[i].title && b.year === books[i].year && b.genre === books[i].genre;
        });
        if (same) return;
        books = next;
        document.querySelectorAll("[data-count]").forEach(function (n) { delete n.dataset.done; });
        render();
      })
      .catch(function () { /* keep the baked snapshot */ });
  }

  /* ---- boot ------------------------------------------------------------- */
  document.documentElement.classList.add("js");
  render();
  wireWaffle();
  watchSections();
  var showBtn = $("date-show"), nextBtn = $("date-next");
  if (showBtn) showBtn.addEventListener("click", showDate);
  if (nextBtn) nextBtn.addEventListener("click", newDate);
  sync();
})();
