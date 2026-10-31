/* Concerts & Shows — concerts.html
   Lays every show from concerts-data.js into the drawer as a wristband,
   grouped by year, newest first. Each band is a <details>, so it opens and
   closes with keyboard and without any further script. Guards its elements. */
(function () {
  "use strict";
  var drawer = document.getElementById("drawer");
  var wish = document.getElementById("wish");
  var shows = (window.CONCERTS || []).filter(function (s) { return s && s.artist && s.date; });

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

  if (drawer) {
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
