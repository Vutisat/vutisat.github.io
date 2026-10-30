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
    newDuel();
    renderBirth();
    renderStrip();
    renderNames();
    remix();
    newBingo();
    updateRun();
    ask();
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
    var authors = b.author.split(/\s+(?:and|&|with)\s+|,\s*/i).filter(Boolean);
    var initials = authors.map(function (a) {
      return a.split(/\s+/).filter(function (w) { return /^[A-Z]/.test(w); })
        .map(function (w) { return w.charAt(0) + "."; }).join(" ");
    }).filter(Boolean).join(" & ");
    var era = !b.year ? "a mystery" : b.year < 1900 ? "the " + Math.floor(b.year / 100) * 100 + "s (vintage!)" : "the " + Math.floor(b.year / 10) * 10 + "s";
    var wc = b.title.split(/\s+/).length;
    var list = [
      ["Into", b.genre || "keeping it vague"],
      ["Born in", era],
      ["Name", plural(wc, "word") + ", starts with “" + stripArticle(b.title).charAt(0).toUpperCase() + "”"],
      [authors.length > 1 ? "Authors' initials" : "Author's initials", initials || "?"]
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

  /* ---- shared: split a byline into people -------------------------------- */
  function people(author) {
    return author.split(/\s+(?:and|&|with)\s+|,\s*/i)
      .map(function (a) { return a.replace(/\s*\(eds?\.\)\s*/i, "").trim(); }).filter(Boolean);
  }
  function pick(list) { return list[Math.floor(Math.random() * list.length)]; }
  var MONTHS = "January February March April May June July August September October November December".split(" ");
  function monthsFromNow(n) {
    var d = new Date(), m = d.getMonth() + Math.round(n);
    return MONTHS[((m % 12) + 12) % 12] + " " + (d.getFullYear() + Math.floor(m / 12));
  }

  /* ---- 10 which came first ----------------------------------------------- */
  var duel = null, streak = 0, best = 0;
  try { best = parseInt(localStorage.getItem("stacks-best"), 10) || 0; } catch (e) {}
  function newDuel() {
    var el = $("duel");
    if (!el) return;
    var dated = books.filter(function (b) { return b.year; });
    if (dated.length < 2) return;
    var a, b, tries = 0;
    do { a = pick(dated); b = pick(dated); } while ((a === b || a.year === b.year) && ++tries < 200);
    duel = { pair: [a, b], done: false };
    el.innerHTML = duel.pair.map(function (bk, i) {
      return '<button type="button" class="duel__card duel__card--' + (i ? "pink" : "blue") + '" data-side="' + i + '">' +
        '<span class="duel__fam">' + esc(bk.fam.name) + '</span>' +
        '<b class="duel__t">' + esc(bk.title) + '</b>' +
        '<span class="duel__a">' + esc(bk.author) + '</span>' +
        '<span class="duel__y">????</span></button>';
    }).join('<span class="duel__or" aria-hidden="true">or</span>');
    var v = $("duel-verdict"), nx = $("duel-next");
    if (v) v.innerHTML = "&nbsp;";
    if (nx) nx.hidden = true;
    scoreDuel();
  }
  function scoreDuel() {
    var s = $("duel-score");
    if (s) s.innerHTML = "Streak <b>" + streak + "</b> &middot; Best <b>" + best + "</b>";
  }
  function pickDuel(side) {
    if (!duel || duel.done) return;
    duel.done = true;
    var mine = duel.pair[side], theirs = duel.pair[1 - side];
    var right = mine.year < theirs.year, older = right ? mine : theirs;
    var gap = Math.abs(mine.year - theirs.year);
    streak = right ? streak + 1 : 0;
    if (streak > best) { best = streak; try { localStorage.setItem("stacks-best", best); } catch (e) {} }
    $("duel").querySelectorAll(".duel__card").forEach(function (c) {
      var i = +c.getAttribute("data-side"), bk = duel.pair[i];
      c.querySelector(".duel__y").textContent = bk.year;
      c.classList.add(bk === older ? "is-older" : "is-newer");
      if (i === side) c.classList.add("is-picked");
      c.setAttribute("aria-disabled", "true");
    });
    var quip = gap <= 2 ? "That was basically a coin toss." :
               gap >= 100 ? "Only " + plural(gap, "year") + " apart. Practically neighbours." :
               plural(gap, "year") + " apart.";
    var v = $("duel-verdict");
    if (v) v.innerHTML = (right ? "<b>Correct!</b> " : "<b>Nope.</b> ") + "<i>" + esc(shortTitle(older.title)) +
      "</i> came first. " + quip + (right ? "" : " Streak reset.");
    scoreDuel();
    var nx = $("duel-next");
    if (nx) { nx.hidden = false; nx.focus({ preventScroll: true }); }
  }

  /* ---- 11 book twin ------------------------------------------------------ */
  function renderBirth() {
    var r = $("birth-range");
    if (!r) return;
    r.max = NOW;
    if (+r.value > NOW) r.value = NOW;
    updateBirth();
  }
  function updateBirth() {
    var r = $("birth-range"), out = $("birth-out"), yEl = $("birth-year");
    if (!r || !out) return;
    var y = +r.value;
    if (yEl) yEl.textContent = y;
    var dated = books.filter(function (b) { return b.year; });
    var same = dated.filter(function (b) { return b.year === y; });
    var older = dated.filter(function (b) { return b.year < y; }).length;
    var younger = dated.length - older - same.length;
    var html;
    if (same.length) {
      html = '<p class="birth__lead"><b>' + plural(same.length, "book") + "</b> on the shelf came out the same year you did:</p>" +
        '<ul class="birth__list">' + same.map(function (b) {
          return '<li><span class="sw ink-' + b.fam.ink + '"></span><i>' + esc(b.title) + "</i> <span>" + esc(b.author) + "</span></li>";
        }).join("") + "</ul>";
    } else {
      var near = dated.slice().sort(function (a, b) { return Math.abs(a.year - y) - Math.abs(b.year - y) || a.year - b.year; })[0];
      var d = Math.abs(near.year - y);
      html = '<p class="birth__lead">Nothing on the shelf from ' + y + ". Your closest book twin is <i>" + esc(near.title) +
        "</i> by " + esc(near.author) + " (" + near.year + "), " + plural(d, "year") + " " + (near.year < y ? "older" : "younger") + " than you.</p>";
    }
    var po = (older / dated.length) * 100, ps = (same.length / dated.length) * 100;
    html += '<div class="birth__bar"><span class="birth__old" style="width:' + po + '%"></span>' +
      '<span class="birth__same" style="width:' + ps + '%"></span></div>' +
      '<p class="birth__split"><span><b>' + older + "</b> older than you</span>" +
      (same.length ? "<span><b>" + same.length + "</b> your age</span>" : "") +
      "<span><b>" + younger + "</b> younger</span></p>" +
      '<p class="birth__quip">' + (po > 60 ? "Most of these books are your elders. Show some respect."
        : po < 15 ? "You're older than almost everything here. Practically a first edition."
        : "You're younger than " + pct(older, dated.length) + " of the shelf. A fresh release.") + "</p>";
    out.innerHTML = html;
  }

  /* ---- 12 strip plot ----------------------------------------------------- */
  var stripBooks = [];
  function yearX(y, lo) {
    var stops = [[Math.min(lo, 1899), 0], [1900, 18], [1980, 40], [NOW, 100]];
    for (var i = 1; i < stops.length; i++) {
      if (y <= stops[i][0]) {
        var a = stops[i - 1], b = stops[i];
        return a[1] + ((y - a[0]) / (b[0] - a[0] || 1)) * (b[1] - a[1]);
      }
    }
    return 100;
  }
  function jitter(s) {
    var h = 0;
    for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
    return 14 + (Math.abs(h) % 73);
  }
  function renderStrip() {
    var el = $("strip");
    if (!el) return;
    var dated = books.filter(function (b) { return b.year; });
    var lo = Math.min.apply(null, dated.map(function (b) { return b.year; }));
    var rows = FAMS.map(function (f) {
      var mine = dated.filter(function (b) { return b.fam === f; }).sort(function (a, b) { return a.year - b.year; });
      return { f: f, books: mine, median: mine.length ? mine[Math.floor((mine.length - 1) / 2)].year : null };
    }).filter(function (r) { return r.books.length; })
      .sort(function (a, b) { return a.median - b.median; });
    stripBooks = [];
    var html = rows.map(function (r) {
      var dots = r.books.map(function (b) {
        var i = stripBooks.push(b) - 1;
        return '<i class="dot ink-' + r.f.ink + '" data-i="' + i + '" style="left:' + yearX(b.year, lo).toFixed(2) +
          '%;top:' + jitter(b.title) + '%"></i>';
      }).join("");
      return '<div class="strip__row"><span class="strip__name">' + esc(r.f.name) + "<small>median " + r.median + "</small></span>" +
        '<div class="strip__track">' + dots + '<span class="strip__med" style="left:' + yearX(r.median, lo).toFixed(2) + '%"></span></div></div>';
    }).join("");
    var ticks = [1600, 1800, 1900, 1950, 1980, 2000, 2020].filter(function (t) { return t >= lo && t <= NOW; });
    html += '<div class="strip__row strip__row--axis"><span class="strip__name"></span><div class="strip__axis">' +
      ticks.map(function (t) {
        return '<span class="strip__tick' + (t < 1900 ? " strip__tick--old" : "") + '" style="left:' + yearX(t, lo).toFixed(2) + '%">' + t + "</span>";
      }).join("") + "</div></div>";
    el.innerHTML = html;

    var real = rows.filter(function (r) { return r.f.key !== "misc"; });
    var c = $("strip-callout"), first = real[0], last = real[real.length - 1];
    if (c && first && last && first !== last) c.innerHTML = "The oldest kind of book here is <b>" + esc(first.f.name) +
      "</b> (median " + first.median + "). The newest is <b>" + esc(last.f.name) + "</b> (median " + last.median + "). " +
      plural(last.median - first.median, "year") + " between them, give or take a war or two.";
  }
  function wireStrip() {
    var el = $("strip"), out = $("strip-readout");
    if (!el || !out) return;
    var last = null;
    function show(t) {
      if (!t || !t.classList || !t.classList.contains("dot")) return;
      var b = stripBooks[+t.getAttribute("data-i")];
      if (!b) return;
      if (last) last.classList.remove("is-hot");
      t.classList.add("is-hot"); last = t;
      out.innerHTML = '<span class="readout__fam ink-' + b.fam.ink + '">' + esc(b.fam.name) + "</span>" +
        '<b class="readout__t">' + esc(b.title) + "</b>" +
        '<span class="readout__a">' + esc(b.author) + " &middot; " + b.year + "</span>";
    }
    el.addEventListener("pointerover", function (e) { show(e.target); });
    el.addEventListener("click", function (e) { show(e.target); });
  }

  /* ---- 13 name tags ------------------------------------------------------ */
  var nameGroups = [];
  function renderNames() {
    var el = $("tags");
    if (!el) return;
    var who = Object.create(null);
    books.forEach(function (b) { people(b.author).forEach(function (p) { who[p] = (who[p] || 0) + 1; }); });
    var byFirst = Object.create(null), initialed = [];
    Object.keys(who).forEach(function (p) {
      var w = p.split(/\s+/);
      if (w.length < 2) return;
      if (/\./.test(w[0])) { initialed.push(p); return; }
      (byFirst[w[0]] = byFirst[w[0]] || []).push(p);
    });
    nameGroups = Object.keys(byFirst).filter(function (f) { return byFirst[f].length > 1; })
      .map(function (f) {
        return { name: f, who: byFirst[f].sort(function (a, b) { return who[b] - who[a] || a.localeCompare(b); }),
                 books: byFirst[f].reduce(function (n, p) { return n + who[p]; }, 0) };
      })
      .sort(function (a, b) { return b.who.length - a.who.length || b.books - a.books || a.name.localeCompare(b.name); })
      .slice(0, 14);
    var inks = ["pink", "blue", "green", "orange", "purple", "teal", "brown"];
    el.innerHTML = nameGroups.map(function (g, i) {
      return '<button type="button" class="tag tag--' + inks[i % inks.length] + '" data-i="' + i + '" aria-pressed="false" style="--r:' +
        [-3, 2, -1.5, 3, -2, 1, 2.5][i % 7] + 'deg">' +
        '<span class="tag__hi">Hello<small>my name is</small></span>' +
        '<b class="tag__name">' + esc(g.name) + "</b>" +
        '<span class="tag__n">&times;' + g.who.length + "</span></button>";
    }).join("");
    var out = $("tags-out");
    if (out) {
      var top = nameGroups[0];
      out.innerHTML = top ? "<b>" + plural(top.who.length, "different " + top.name) + "</b> " + (top.who.length === 1 ? "is" : "are") +
        " on the guest list. Then there are " + plural(initialed.length, "author") + " who go by initials" +
        (initialed.length ? ", like " + esc(initialed.sort()[0]) : "") + ". Very mysterious." : "";
      out.setAttribute("data-default", out.innerHTML);
    }
  }
  function wireNames() {
    var el = $("tags"), out = $("tags-out");
    if (!el || !out) return;
    el.addEventListener("click", function (e) {
      var t = e.target.closest(".tag");
      if (!t) return;
      var on = t.getAttribute("aria-pressed") !== "true";
      el.querySelectorAll(".tag").forEach(function (x) { x.setAttribute("aria-pressed", "false"); });
      if (!on) { out.innerHTML = out.getAttribute("data-default") || ""; return; }
      t.setAttribute("aria-pressed", "true");
      var g = nameGroups[+t.getAttribute("data-i")];
      out.innerHTML = "<b>The " + esc(g.name) + "s:</b> " + g.who.map(function (p) { return esc(p); }).join(", ").replace(/, ([^,]*)$/, " and $1") +
        ". Between them, " + plural(g.books, "book") + ".";
    });
  }

  /* ---- 14 bestseller machine --------------------------------------------- */
  function remix() {
    var el = $("remix"), src = $("remix-src");
    if (!el || books.length < 2) return;
    var a, b, tries = 0;
    do { a = pick(books); b = pick(books); } while ((a === b || a.author === b.author) && ++tries < 200);
    var wa = shortTitle(a.title).split(/\s+/), wb = shortTitle(b.title).split(/\s+/);
    var head = wa.slice(0, Math.max(1, Math.ceil(wa.length / 2)));
    var tail = wb.slice(Math.min(wb.length - 1, Math.floor(wb.length / 2)));
    var title = head.concat(tail).join(" ").replace(/[:;,\-–]+\s/g, " ").replace(/[:;,\-–]+$/, "");
    var pa = people(a.author)[0].split(/\s+/), pb = people(b.author)[0].split(/\s+/);
    var author = pa.length > 1 || pb.length > 1 ? pa[0] + " " + pb[pb.length - 1] : pa[0] + pb[0];
    var inks = ["blue", "pink", "purple", "green", "orange", "teal", "yellow"];
    var ink = pick(inks), accent = pick(inks.filter(function (x) { return x !== ink; }));
    el.innerHTML = '<div class="cover cover--' + ink + '" style="--acc:var(--' + accent + ')">' +
      '<span class="cover__pub">Overanalyzed Press</span>' +
      '<b class="cover__t">' + esc(title) + "</b>" +
      '<span class="cover__rule"></span>' +
      '<span class="cover__a">' + esc(author) + "</span>" +
      '<span class="cover__blurb">&ldquo;' + esc(pick(["Unputdownable.", "A triumph, probably.", "I have questions.", "Nobody asked for this.", "Better than the original two.", "Somehow it works.", "Instant classic (citation needed)."])) + "&rdquo;</span>" +
      "</div>";
    if (!reduceMotion.matches) { el.classList.remove("is-print"); void el.offsetWidth; el.classList.add("is-print"); }
    if (src) src.innerHTML = 'Made from <i>' + esc(a.title) + "</i> (" + esc(a.author) + ") and <i>" + esc(b.title) +
      "</i> (" + esc(b.author) + ").<br>Shelve under: <b>" + esc(a.fam.name) + "</b>" +
      (a.fam === b.fam ? ", definitely." : " meets <b>" + esc(b.fam.name) + "</b>.");
  }

  /* ---- 15 shelf bingo ---------------------------------------------------- */
  var bingoCard = [];
  function bingoPool() {
    var count = tally(books, function (b) { return b.author; });
    var COLOR = /\b(red|blue|green|black|white|gold|golden|silver|gr[ae]y|yellow|purple|pink|orange)\b/i;
    var BEAST = /\b(dogs?|cats?|birds?|wol(f|ves)|fox(es)?|lions?|bears?|horses?|dragons?|rabbits?|mice|mouse|fish|whales?|crows?|ravens?|owls?|bees?|spiders?|sharks?|tigers?|monkeys?|pigs?|elephants?|snakes?|butterfl\w+)\b/i;
    return [
      ["Published before 1900", function (b) { return b.year && b.year < 1900; }],
      ["One-word title", function (b) { return !/\s/.test(b.title.trim()); }],
      ["A number in the title", function (b) { return /\d/.test(b.title); }],
      ["Title asks a question", function (b) { return /\?/.test(b.title); }],
      ["Author has 3+ books here", function (b) { return count[b.author] >= 3; }],
      ["Written by a team", function (b) { return people(b.author).length > 1; }],
      ["Title starts with “The”", function (b) { return /^the\s/i.test(b.title); }],
      ["Has pictures", function (b) { return b.fam.key === "pics"; }],
      ["Has a dragon, or could", function (b) { return b.fam.key === "fantasy"; }],
      ["Goes to space", function (b) { return b.fam.key === "scifi"; }],
      ["Came out 2020 or later", function (b) { return b.year >= 2020; }],
      ["From the 1980s", function (b) { return b.year >= 1980 && b.year < 1990; }],
      ["Title over 35 characters", function (b) { return b.title.length > 35; }],
      ["A colour in the title", function (b) { return COLOR.test(b.title); }],
      ["An animal in the title", function (b) { return BEAST.test(b.title); }],
      ["Promises to fix your life", function (b) { return b.fam.key === "hustle"; }],
      ["Someone probably dies", function (b) { return b.fam.key === "chills"; }],
      ["Author uses initials", function (b) { return /^[A-Z]\./.test(b.author); }],
      ["Alliterative author", function (b) { var w = people(b.author)[0].split(/\s+/); return w.length > 1 && w[0].charAt(0) === w[w.length - 1].charAt(0); }],
      ["Title is possessive", function (b) { return /\w['’]s\b/.test(b.title); }],
      ["From the Dead Authors' Club", function (b) { return b.fam.key === "classics"; }],
      ["“Life” in the title", function (b) { return /\b(life|lives|live|living)\b/i.test(b.title); }],
      ["A how-to", function (b) { return /^how\b/i.test(b.title); }],
      ["“World” in the title", function (b) { return /\bworlds?\b/i.test(b.title); }],
      ["Big brain nonfiction", function (b) { return b.fam.key === "brainy"; }],
      ["Published 2000–2009", function (b) { return b.year >= 2000 && b.year < 2010; }],
      ["A girl in the title", function (b) { return /\bgirls?\b/i.test(b.title); }],
      ["Ends with an S", function (b) { return /s$/i.test(shortTitle(b.title)); }],
      ["Title has an “and”", function (b) { return /\s(and|&)\s/i.test(b.title); }],
      ["A Mr, Mrs, Dr or Lady", function (b) { return /\b(mr|mrs|ms|dr|lady|lord|sir)\b\.?/i.test(b.title); }]
    ].map(function (p) {
      return { label: p[0], hits: books.filter(p[1]) };
    }).filter(function (p) { return p.hits.length; });
  }
  function newBingo() {
    var el = $("bingo");
    if (!el) return;
    var pool = bingoPool();
    for (var i = pool.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), t = pool[i]; pool[i] = pool[j]; pool[j] = t; }
    bingoCard = pool.slice(0, 24);
    bingoCard.splice(12, 0, { label: "Free square", free: true });
    if (bingoCard.length < 25) return;
    el.innerHTML = '<div class="bingo__head" aria-hidden="true">' + "BINGO".split("").map(function (l) { return "<span>" + l + "</span>"; }).join("") + "</div>" +
      bingoCard.map(function (c, i) {
        return '<button type="button" class="cell' + (c.free ? " cell--free is-on" : "") + '" data-i="' + i + '" aria-pressed="' + (c.free ? "true" : "false") + '"' +
          (c.free ? " disabled" : "") + ">" +
          '<span class="cell__l">' + esc(c.label) + "</span>" +
          '<span class="cell__b">' + (c.free ? "you own books" : "") + "</span></button>";
      }).join("");
    checkBingo();
  }
  var LINES = (function () {
    var L = [], r, c;
    for (r = 0; r < 5; r++) { L.push([0, 1, 2, 3, 4].map(function (k) { return r * 5 + k; })); }
    for (c = 0; c < 5; c++) { L.push([0, 1, 2, 3, 4].map(function (k) { return k * 5 + c; })); }
    L.push([0, 6, 12, 18, 24], [4, 8, 12, 16, 20]);
    return L;
  })();
  function checkBingo() {
    var el = $("bingo"), msg = $("bingo-msg");
    if (!el) return;
    var cells = el.querySelectorAll(".cell");
    var on = [].map.call(cells, function (c) { return c.classList.contains("is-on"); });
    var wins = LINES.filter(function (l) { return l.every(function (i) { return on[i]; }); });
    cells.forEach(function (c) { c.classList.remove("is-win"); });
    wins.forEach(function (l) { l.forEach(function (i) { cells[i].classList.add("is-win"); }); });
    el.classList.toggle("is-bingo", wins.length > 0);
    var n = on.filter(Boolean).length - 1;
    if (msg) msg.innerHTML = wins.length
      ? '<b class="bingo__yell">Bingo!</b>' + (wins.length > 1 ? " &times;" + wins.length + ". Greedy." : " Your prize is the satisfaction.")
      : plural(n, "square") + " stamped. " + (n >= 18 ? "Statistically this is getting embarrassing." : "Keep going.");
  }
  function wireBingo() {
    var el = $("bingo");
    if (!el) return;
    el.addEventListener("click", function (e) {
      var cell = e.target.closest(".cell");
      if (!cell || cell.disabled) return;
      var c = bingoCard[+cell.getAttribute("data-i")];
      var on = !cell.classList.contains("is-on");
      cell.classList.toggle("is-on", on);
      cell.setAttribute("aria-pressed", on ? "true" : "false");
      cell.querySelector(".cell__b").textContent = on ? shortTitle(pick(c.hits).title) : "";
      checkBingo();
    });
  }

  /* ---- 16 read it all ---------------------------------------------------- */
  function updateRun() {
    var r = $("run-range"), big = $("run-big");
    if (!r || !big) return;
    var pace = +r.value, n = books.length, months = n / pace;
    var pEl = $("run-pace");
    if (pEl) pEl.textContent = pace;
    var y = Math.floor(months / 12), m = Math.ceil(months - y * 12);
    if (m === 12) { y++; m = 0; }
    var span = (y ? plural(y, "year") : "") + (y && m ? ", " : "") + (m ? plural(m, "month") : "");
    big.innerHTML = "<b>" + span + "</b> to read all " + n + " books. You'd turn the last page around <b>" + monthsFromNow(months) + "</b>.";

    var years = $("run-years");
    if (years) {
      var startM = new Date().getMonth(), startY = new Date().getFullYear(), html = "", left = months, yr = startY, first = true;
      var inks = ["blue", "pink", "green", "orange", "purple", "teal"], k = 0;
      while (left > 0 && k < 80) {
        var cap = first ? 12 - startM : 12, take = Math.min(cap, left);
        html += '<span class="yr ink-' + inks[k % inks.length] + '" style="flex-grow:' + take.toFixed(2) + '">' + (take >= 4 ? "<em>" + yr + "</em>" : "") + "</span>";
        left -= take; yr++; first = false; k++;
      }
      years.innerHTML = html;
    }
    var legs = $("run-legs");
    if (legs) {
      var order = books.filter(function (b) { return b.year; }).sort(function (a, b) { return a.year - b.year; });
      if (!order.length) return;
      var half = order[Math.floor(order.length / 2)];
      var y2000 = order.filter(function (b) { return b.year < 2000; }).length;
      var stops = [
        ["This month", "you start with <i>" + esc(order[0].title) + "</i> (" + order[0].year + ")."],
        [monthsFromNow(y2000 / pace), "you finally reach the year 2000."],
        [monthsFromNow((order.length / 2) / pace), "halfway, with <i>" + esc(half.title) + "</i>."],
        [monthsFromNow(order.length / pace), "you close the newest book, <i>" + esc(order[order.length - 1].title) + "</i>. Assuming no new books show up in the meantime. They will."]
      ];
      legs.innerHTML = stops.map(function (s) { return '<li><span class="run__when">' + s[0] + "</span> " + s[1] + "</li>"; }).join("");
    }
  }

  /* ---- 17 ask the librarian ---------------------------------------------- */
  function fold(s) { return String(s).toLowerCase().normalize ? String(s).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "") : String(s).toLowerCase(); }
  function ask() {
    var q = $("ask-q"), out = $("ask-out");
    if (!q || !out) return;
    var raw = q.value.trim(), terms = fold(raw).split(/\s+/).filter(Boolean);
    if (raw.length < 2) { out.innerHTML = '<p class="ask__hint">The librarian is waiting. Patiently. Mostly.</p>'; return; }
    var hits = books.filter(function (b) {
      var words = fold(b.title + " " + b.author).split(/[^a-z0-9']+/);
      return terms.every(function (t) {
        t = t.replace(/[^a-z0-9']/g, "");
        return !t || words.some(function (w) { return w.indexOf(t) === 0; });
      });
    }).sort(function (a, b) {
      var A = fold(stripArticle(a.title)).indexOf(terms[0]) === 0 ? 0 : 1, B = fold(stripArticle(b.title)).indexOf(terms[0]) === 0 ? 0 : 1;
      return A - B || a.title.localeCompare(b.title);
    });
    if (!hits.length) {
      out.innerHTML = '<p class="stamp stamp--no">Not on the shelf</p>' +
        '<p class="ask__note">No match for &ldquo;' + esc(raw) + "&rdquo;. Sounds like a gift idea.</p>";
      return;
    }
    out.innerHTML = '<p class="stamp stamp--yes">' + (hits.length === 1 ? "Yes, it's here" : plural(hits.length, "match", "matches")) + "</p>" +
      '<ul class="ask__list">' + hits.slice(0, 8).map(function (b) {
        return '<li><span class="sw ink-' + b.fam.ink + '"></span><a href="library.html?q=' + encodeURIComponent(b.title) + '"><b>' + esc(b.title) + "</b></a>" +
          "<span>" + esc(b.author) + (b.year ? " &middot; " + b.year : "") + "</span></li>";
      }).join("") + "</ul>" +
      (hits.length > 8 ? '<p class="ask__note">&hellip;and ' + (hits.length - 8) + ' more. <a href="library.html?q=' + encodeURIComponent(raw) + '">See them all on the shelves &rarr;</a></p>' : "");
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
  wireStrip();
  wireNames();
  wireBingo();
  var duelEl = $("duel");
  if (duelEl) duelEl.addEventListener("click", function (e) {
    var c = e.target.closest(".duel__card");
    if (c) pickDuel(+c.getAttribute("data-side"));
  });
  [["duel-next", "click", newDuel], ["birth-range", "input", updateBirth], ["remix-go", "click", remix],
   ["bingo-new", "click", newBingo], ["run-range", "input", updateRun], ["ask-q", "input", ask]].forEach(function (w) {
    var n = $(w[0]);
    if (n) n.addEventListener(w[1], w[2]);
  });
  sync();
})();
