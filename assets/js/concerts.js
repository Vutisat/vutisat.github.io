/* Concerts & Shows — concerts.html
   Lays every show into the drawer as a wristband, grouped by year, newest
   first. Each band is a <details>, so it opens and closes with keyboard and
   without any further script. First paint uses concerts-data.js; then the
   Google Sheet (window.CONCERTS_SHEET) is re-read and, if it loads, the drawer
   is redrawn from it. Guards its elements. */
(function () {
  "use strict";
  var drawer = document.getElementById("drawer");
  var wish = document.getElementById("wish");

  function esc(t) {
    return String(t == null ? "" : t).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  var MONTHS = "Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec".split(" ");
  function when(d) {
    var p = String(d).split("-");
    if (p.length >= 3) return +p[2] + " " + MONTHS[+p[1] - 1];
    if (p.length === 2) return MONTHS[+p[1] - 1];
    return "";
  }
  /* a stable little offset per band, so the pile looks tossed in, not stacked */
  function jitter(s, n) {
    var h = 0;
    for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
    return ((Math.abs(h) % 1000) / 1000) * 2 - 1;
  }
  /* readable ink for whatever colour the band is */
  function inkFor(hex, woven) {
    var m = /^#?([0-9a-f]{6})$/i.exec(String(hex || "").trim());
    if (!m) return "#fff";
    var v = parseInt(m[1], 16), k = woven ? 0.7 : 1;   /* the jacquard multiplies woven bands down ~30% */
    function lin(c) { c = c * k / 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); }
    var L = 0.2126 * lin(v >> 16) + 0.7152 * lin((v >> 8) & 255) + 0.0722 * lin(v & 255);
    /* whichever ink gives the band's small print the higher WCAG contrast */
    return (1.05 / (L + 0.05)) >= ((L + 0.05) / (0.0074 + 0.05)) ? "#FFFFFF" : "#0E0C12";
  }

  function render(list) {
    var shows = (list || []).filter(function (s) { return s && s.artist && s.date; });
    if (!drawer) return;
    if (!shows.length) {
      drawer.innerHTML = '<p class="drawer__empty">The drawer is empty. Add a show to concerts-data.js.</p>';
    } else {
      shows.sort(function (a, b) { return String(b.date).localeCompare(String(a.date)); });
      var years = {}, order = [];
      shows.forEach(function (s) {
        var y = String(s.date).slice(0, 4);
        if (!years[y]) { years[y] = []; order.push(y); }
        years[y].push(s);
      });
      var html = "";
      order.forEach(function (y) {
        html += '<div class="year"><h2 class="year__tab"><span>' + esc(y) + '</span><small>' +
          years[y].length + (years[y].length === 1 ? " band" : " bands") + '</small></h2><ul class="pile">';
        years[y].forEach(function (s) {
          var kind = ["woven", "paper", "silicone"].indexOf(s.band) >= 0 ? s.band : "woven";
          var j = jitter(s.artist + s.date);
          var meta = [s.venue, s.city].filter(Boolean).map(esc).join(", ");
          var extra = "";
          if (s.support) extra += "<dt>Opening</dt><dd>" + esc(s.support) + "</dd>";
          if (s.with) extra += "<dt>With</dt><dd>" + esc(s.with) + "</dd>";
          if (s.kind) extra += "<dt>Kind</dt><dd>" + esc(s.kind) + "</dd>";
          html += '<li class="pile__item" style="--x:' + (j * 18).toFixed(1) + 'px;--r:' + (j * .6).toFixed(2) + 'deg">' +
            '<details class="band band--' + kind + '" style="--c:' + esc(s.color || "#E4572E") + ';--ink:' + inkFor(s.color, kind === "woven") + '">' +
            '<summary><span class="band__clasp" aria-hidden="true"></span>' +
            '<span class="band__weave">' + esc(s.artist) + '</span>' +
            '<span class="band__print">' + esc(when(s.date)) + (meta ? " · " + meta : "") + '</span>' +
            '<span class="band__tail" aria-hidden="true"></span></summary>' +
            '<div class="night">' +
            (s.note ? '<p class="night__note">' + esc(s.note) + '</p>' : "") +
            (extra ? '<dl class="night__facts">' + extra + '</dl>' : "") +
            '</div></details></li>';
        });
        html += "</ul></div>";
      });
      drawer.innerHTML = html;
    }
  }
  render(window.CONCERTS);

  /* ---- live sheet sync --------------------------------------------------
     RFC 4180 CSV; columns found by header text, so the sheet can be
     reordered. Rows whose Show column says No are left out. */
  function parseCSV(text) {
    var rows = [], row = [], cell = "", q = false;
    for (var i = 0; i < text.length; i++) {
      var c = text[i];
      if (q) {
        if (c === '"') { if (text[i + 1] === '"') { cell += '"'; i++; } else q = false; }
        else cell += c;
      } else if (c === '"') q = true;
      else if (c === ",") { row.push(cell); cell = ""; }
      else if (c === "\n" || c === "\r") {
        if (c === "\r" && text[i + 1] === "\n") i++;
        row.push(cell); rows.push(row); row = []; cell = "";
      } else cell += c;
    }
    if (cell || row.length) { row.push(cell); rows.push(row); }
    return rows;
  }
  /* the sheet may hand back a date as "9/23/2017"; keep the page's ISO form */
  function isoDate(d) {
    d = String(d || "").trim();
    var m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(d);
    if (m) return m[3] + "-" + ("0" + m[1]).slice(-2) + "-" + ("0" + m[2]).slice(-2);
    return d;
  }
  function fromSheet(text) {
    var all = parseCSV(text);
    if (!all.length) return null;
    var head = all[0].map(function (h) { return h.trim().toLowerCase(); });
    function col(name) { return head.indexOf(name); }
    var ev = col("event"), dt = col("date");
    if (ev < 0 || dt < 0) return null;
    var keys = { venue: "venue", city: "city", kind: "kind", band: "band", color: "color", "with": "with", support: "support", note: "note" };
    var show = col("show");
    var out = [];
    all.slice(1).forEach(function (r) {
      if (!r[ev] || !r[dt]) return;
      if (show >= 0 && /^no$/i.test((r[show] || "").trim())) return;
      var s = { artist: r[ev].trim(), date: isoDate(r[dt]) };
      Object.keys(keys).forEach(function (k) { var i = col(keys[k]); if (i >= 0 && r[i]) s[k] = r[i].trim(); });
      out.push(s);
    });
    return out.length ? out : null;
  }
  if (window.CONCERTS_SHEET && window.fetch && drawer) {
    fetch(window.CONCERTS_SHEET, { cache: "no-store" })
      .then(function (r) { return r.ok ? r.text() : Promise.reject(); })
      .then(function (t) { var list = fromSheet(t); if (list) render(list); })
      .catch(function () { /* offline or not shared yet: the bundled copy stays */ });
  }

  if (wish) {
    var list = (window.WISHLIST || []).filter(Boolean);
    wish.innerHTML = list.map(function (w, i) {
      return '<li class="ghost" style="--r:' + ((i % 2 ? 1 : -1) * (0.4 + i * .15)).toFixed(2) + 'deg"><span class="ghost__clasp" aria-hidden="true"></span>' +
        '<span class="ghost__name">' + esc(w) + '</span></li>';
    }).join("");
    if (!list.length) wish.parentNode.hidden = true;
  }

  var sample = document.getElementById("sample");
  if (sample && !window.CONCERTS_ARE_REAL) sample.hidden = false;
  else if (sample) sample.hidden = true;
})();
