/* Pob's Places: fills the passport from window.PLACES (assets/js/places-data.js, written by
   visited-places/timeline.py site), sets the My Maps map, inks one entry stamp per
   country and counts the facts. Tapping a stamp turns the map to that country. Every part checks its own element. */
(function () {
  "use strict";
  var D = window.PLACES;
  if (!D) return;

  var MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  var INKS = {
    "Asia": "--ink-asia", "Europe": "--ink-europe", "North America": "--ink-north-america",
    "South America": "--ink-south-america", "Africa": "--ink-africa", "Oceania": "--ink-oceania",
    "Antarctica": "--ink-antarctica"
  };
  var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;

  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function num(n) { return n.toLocaleString("en-US"); }
  function day(iso) { var p = iso.split("-"); return +p[2] + " " + MONTHS[+p[1] - 1] + " " + p[0]; }
  function monthYear(iso) { var p = iso.split("-"); return MONTHS[+p[1] - 1] + " " + p[0]; }
  function hash(s) { var h = 2166136261; for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  function rng(seed) { return function () { seed = (seed + 0x6D2B79F5) >>> 0; var t = seed; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

  /* ---------- the data page ---------- */
  var fields = {
    places: num(D.places), countries: num(D.countries), first: day(D.first), last: day(D.last),
    sinceMonth: monthYear(D.first), generated: day(D.generated)
  };
  $$("[data-field]").forEach(function (el) {
    var v = fields[el.getAttribute("data-field")];
    if (v != null) el.textContent = v;
  });
  var mrz1 = $('[data-mrz="1"]'), mrz2 = $('[data-mrz="2"]');
  function pad(s) { return (s + Array(45).join("<")).slice(0, 44); }
  if (mrz1) mrz1.textContent = pad("P<PLACES<VUTISALCHAVAKUL<<POB");
  if (mrz2) {
    var ymd = function (iso) { return iso.slice(2).replace(/-/g, ""); };
    mrz2.textContent = pad(("000000" + D.places).slice(-6) + "<" + ("000" + D.countries).slice(-3) + "<<" + ymd(D.first) + "<" + ymd(D.last) + "<" + D.continents);
  }

  /* ---------- the map: My Maps embed, front and centre ---------- */
  var frame = $("#map"), where = $("[data-where]"), loading = $("[data-loading]"), reset = $("[data-reset]");
  function mapSrc(lat, lng, z) {
    return "https://www.google.com/maps/d/embed?mid=" + encodeURIComponent(D.mapId) +
      "&ehbc=1E2D4F&ll=" + lat + "%2C" + lng + "&z=" + z;
  }
  function world() {
    if (frame) frame.src = mapSrc(28, 5, frame.clientWidth > 700 ? 2 : 1);
    if (where) where.textContent = "the whole world";
    if (reset) reset.hidden = true;
  }
  if (frame) {
    world();
    frame.addEventListener("load", function () { if (loading) loading.hidden = true; });
  }

  var layers = $(".atlas__layers");
  if (layers && D.layers) {
    layers.innerHTML = D.layers.map(function (l) {
      return '<li><svg viewBox="0 0 12 16" aria-hidden="true"><path d="M6 15.5C2.6 10.7 1 8 1 5.6a5 5 0 0 1 10 0C11 8 9.4 10.7 6 15.5z" fill="' + esc(l.colour) + '"/><circle cx="6" cy="5.6" r="1.9" fill="#fff"/></svg>' +
        esc(l.name) + " <b>" + num(l.count) + "</b></li>";
    }).join("");
  }

  if (reset) reset.addEventListener("click", function () {
    world();
    $$(".stamp").forEach(function (b) { b.setAttribute("aria-pressed", "false"); });
  });

  /* ---------- facts, counted from the same rows as the map ---------- */
  var factsEl = $("[data-facts]"), F = D.facts;
  if (factsEl && F) {
    var html = "";
    var per = F.perYear || [], peak = per.reduce(function (a, y) { return y.countries > a.countries ? y : a; }, per[0] || { countries: 0 });
    var maxP = Math.max.apply(null, per.map(function (y) { return y.places; }).concat([1]));
    if (per.length) {
      html += '<article class="fact fact--year"><h3>' + esc(peak.year) + ": " + peak.countries + " new countries</h3>" +
        "<p>The most new countries in a single year. Each column is new places that year; the gold number is new countries.</p>" +
        '<div class="years" role="img" aria-label="New places per year, ' + per.map(function (y) { return y.year + ": " + y.places; }).join(", ") + '">' +
        per.map(function (y, i) {
          return '<div class="years__col' + (y.year === peak.year ? " is-peak" : "") + '"><span class="years__c">' + (y.countries ? "+" + y.countries : "") +
            '</span><span class="years__n">' + num(y.places) + '</span><i class="years__bar" style="height:' + Math.max(2, Math.round(y.places / maxP * 100)) +
            "%;--d:" + i * 50 + 'ms"></i><span class="years__y">&rsquo;' + esc(y.year.slice(2)) + "</span></div>";
        }).join("") + "</div></article>";
    }
    if (F.north) {
      var pt = function (k, label) { var x = F[k]; return "<div><dt>" + label + "</dt><dd>" + esc(x.name) + "<span>" + esc([x.city, x.country].filter(Boolean).join(", ")) + "</span></dd></div>"; };
      html += '<article class="fact fact--compass"><h3>The edges of the map</h3><dl class="compass">' +
        pt("north", "North") + pt("east", "East") + pt("west", "West") + pt("south", "South") + "</dl></article>";
    }
    html += '<article class="fact fact--hours"><span class="big">' + num(F.hours) + "</span><h3>hours spent at these places</h3>" +
      "<p>About " + num(Math.round(F.hours / 24)) + " days in total, spread across " + num(F.days) + " different days since " + esc(monthYear(D.first)) + ".</p></article>";
    if (F.brands && F.brands.length) {
      html += '<article class="fact fact--brands"><h3>Same brand, different door</h3><p>Chains, counted by how many different locations I stopped at.</p><ul class="brands">' +
        F.brands.slice(0, 7).map(function (b) { return "<li><span>" + esc(b.name) + "</span><b>" + num(b.count) + "</b></li>"; }).join("") + "</ul></article>";
    }
    html += '<article class="fact fact--air"><span class="big">' + num(F.airports) + "</span><h3>airports</h3>" +
      (F.busiestAirport ? "<p>Passed through " + esc(F.busiestAirport.name) + " most: " + F.busiestAirport.visits + " times.</p>" : "") + "</article>";
    if (F.farthest) {
      html += '<article class="fact fact--far"><span class="big">' + num(F.farthest.km) + " km</span><h3>The farthest from home</h3><p>" +
        esc(F.farthest.name) + ", " + esc([F.farthest.city, F.farthest.country].filter(Boolean).join(", ")) + ".</p>" +
        "<p>That is " + Math.round(F.farthest.km / 20037 * 100) + "% of the way to the exact opposite side of the Earth.</p></article>";
    }
    if (F.cities && F.cities.length) {
      var top = F.cities[0].count;
      html += '<article class="fact fact--cities"><h3>Where the pins pile up</h3><ul class="cities">' +
        F.cities.map(function (c) { return "<li><span>" + esc(c.name) + '</span><i style="--w:' + Math.max(2, Math.round(c.count / top * 100)) + '%"></i><b>' + num(c.count) + "</b></li>"; }).join("") + "</ul></article>";
    }
    if (F.types && F.types.length) {
      html += '<article class="fact fact--types"><h3>A few of the kinds of places</h3><ul class="types">' +
        F.types.map(function (t) { return "<li><b>" + num(t.count) + "</b>" + esc((t.count === 1 ? t.name : plural(t.name)).toLowerCase()) + "</li>"; }).join("") + "</ul></article>";
    }
    factsEl.innerHTML = html;
    if (!reduce && "IntersectionObserver" in window) {
      var fio = new IntersectionObserver(function (es) {
        if (es[0].isIntersecting) { factsEl.classList.add("shown"); fio.disconnect(); }
      }, { rootMargin: "0px 0px -15% 0px" });
      fio.observe(factsEl);
    } else factsEl.classList.add("shown");
  }
  function plural(w) { return /[^aeiou]y$/i.test(w) ? w.slice(0, -1) + "ies" : /(s|sh|ch|x)$/i.test(w) ? w + "es" : w + "s"; }

  /* ---------- entry stamps ---------- */
  var grid = $("[data-stamps]");
  if (!grid || !D.countryList) return;

  function fit(text, max) { return text.length > max ? ' textLength="' + (max * 6.4).toFixed(0) + '" lengthAdjust="spacingAndGlyphs"' : ""; }

  function stampSVG(c, i) {
    var r = rng(hash(c.code || c.name)), shape = Math.floor(r() * 5), id = "s" + i;
    var name = esc(c.name.toUpperCase()), date = esc(day(c.first).toUpperCase());
    var places = num(c.places) + (c.places === 1 ? " PLACE" : " PLACES");
    var plane = '<use href="#plane" x="52" y="__Y" width="16" height="16" fill="currentColor"/>';
    var g = "";
    if (shape === 0) { // round, name around the rim
      g = '<circle cx="60" cy="60" r="55" fill="none" stroke="currentColor" stroke-width="3.4"/>' +
          '<circle cx="60" cy="60" r="44" fill="none" stroke="currentColor" stroke-width="1.3"/>' +
          '<path id="' + id + 't" d="M14 60a46 46 0 0 1 92 0" fill="none"/><path id="' + id + 'b" d="M12 60a48 48 0 0 0 96 0" fill="none"/>' +
          '<text class="t-big" font-size="9.5"><textPath href="#' + id + 't" startOffset="50%" text-anchor="middle"' + fit(c.name, 20) + ">" + name + "</textPath></text>" +
          '<text class="t-small" font-size="7"><textPath href="#' + id + 'b" startOffset="50%" text-anchor="middle">' + esc(places) + "</textPath></text>" +
          plane.replace("__Y", "33") +
          '<text class="t-date" x="60" y="66" font-size="11" text-anchor="middle">' + date + "</text>" +
          '<text class="t-small" x="60" y="80" font-size="7" text-anchor="middle">ADMITTED</text>';
    } else if (shape === 1) { // landscape box
      g = '<rect x="5" y="22" width="110" height="76" rx="7" fill="none" stroke="currentColor" stroke-width="3.2"/>' +
          '<rect x="11" y="28" width="98" height="64" rx="3" fill="none" stroke="currentColor" stroke-width="1.1"/>' +
          '<text class="t-big" x="60" y="45" font-size="11" text-anchor="middle"' + fit(c.name, 15) + ">" + name + "</text>" +
          '<line x1="18" y1="51" x2="102" y2="51" stroke="currentColor" stroke-width="1"/>' +
          '<text class="t-date" x="60" y="68" font-size="11.5" text-anchor="middle">' + date + "</text>" +
          '<text class="t-small" x="60" y="84" font-size="7" text-anchor="middle">ARRIVAL · ' + esc(places) + "</text>";
    } else if (shape === 2) { // oval
      g = '<ellipse cx="60" cy="60" rx="56" ry="40" fill="none" stroke="currentColor" stroke-width="3.2"/>' +
          '<ellipse cx="60" cy="60" rx="49" ry="33" fill="none" stroke="currentColor" stroke-width="1.1"/>' +
          plane.replace("__Y", "30") +
          '<text class="t-big" x="60" y="58" font-size="10.5" text-anchor="middle"' + fit(c.name, 13) + ">" + name + "</text>" +
          '<text class="t-date" x="60" y="73" font-size="10" text-anchor="middle">' + date + "</text>" +
          '<text class="t-small" x="60" y="85" font-size="6.5" text-anchor="middle">' + esc(places) + "</text>";
    } else if (shape === 3) { // octagon
      g = '<polygon points="38,6 82,6 114,38 114,82 82,114 38,114 6,82 6,38" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linejoin="round"/>' +
          '<polygon points="41,13 79,13 107,41 107,79 79,107 41,107 13,79 13,41" fill="none" stroke="currentColor" stroke-width="1.1" stroke-linejoin="round"/>' +
          '<text class="t-small" x="60" y="32" font-size="7" text-anchor="middle">ENTRY</text>' +
          '<text class="t-big" x="60" y="56" font-size="10.5" text-anchor="middle"' + fit(c.name, 14) + ">" + name + "</text>" +
          '<text class="t-date" x="60" y="74" font-size="11" text-anchor="middle">' + date + "</text>" +
          '<text class="t-small" x="60" y="92" font-size="6.5" text-anchor="middle">' + esc(places) + "</text>";
    } else { // tall ticket with notched corners
      g = '<path d="M30 6h60a8 8 0 0 0 8 8v92a8 8 0 0 0-8 8H30a8 8 0 0 0-8-8V14a8 8 0 0 0 8-8z" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linejoin="round"/>' +
          plane.replace("__Y", "18") +
          '<text class="t-big" x="60" y="52" font-size="9.5" text-anchor="middle"' + fit(c.name, 8) + ">" + name + "</text>" +
          '<text class="t-date" x="60" y="70" font-size="9.5" text-anchor="middle">' + date + "</text>" +
          '<line x1="32" y1="80" x2="88" y2="80" stroke="currentColor" stroke-width="1" stroke-dasharray="3 3"/>' +
          '<text class="t-small" x="60" y="95" font-size="6.5" text-anchor="middle">' + esc(places) + "</text>";
    }
    var tilt = (r() * 22 - 11).toFixed(1), dx = (r() * 14 - 7).toFixed(0), dy = (r() * 14 - 7).toFixed(0);
    return { svg: '<svg viewBox="0 0 120 120" aria-hidden="true"><g filter="url(#ink)">' + g + "</g></svg>", tilt: tilt, dx: dx, dy: dy };
  }

  grid.innerHTML = D.countryList.map(function (c, i) {
    var s = stampSVG(c, i), ink = INKS[c.continent] || "--ink-antarctica";
    var label = c.name + ", first entry " + day(c.first) + ", " + num(c.places) + (c.places === 1 ? " place" : " places") + ". Show on the map";
    return '<li data-continent="' + esc(c.continent) + '"><button type="button" class="stamp" aria-pressed="false" data-i="' + i + '"' +
      ' aria-label="' + esc(label) + '" style="--c:var(' + ink + ");--r:" + s.tilt + "deg;--dx:" + s.dx + "px;--dy:" + s.dy + 'px">' +
      s.svg + "</button></li>";
  }).join("");

  function show(i) {
    var c = D.countryList[i];
    $$(".stamp", grid).forEach(function (b) { b.setAttribute("aria-pressed", String(+b.dataset.i === i)); });
    if (where) where.textContent = c.name + " · since " + monthYear(c.first);
    if (frame) {
      if (loading) { $("[data-loading-name]", loading).textContent = c.name; loading.hidden = false; }
      frame.src = mapSrc(c.lat, c.lng, c.zoom);
    }
    if (reset) reset.hidden = false;
    window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
  }
  grid.addEventListener("click", function (e) {
    var b = e.target.closest(".stamp");
    if (b) show(+b.dataset.i);
  });

  /* ink filter chips, one per continent */
  var inks = $(".inks");
  if (inks) {
    var counts = {};
    D.countryList.forEach(function (c) { if (c.continent) counts[c.continent] = (counts[c.continent] || 0) + 1; });
    var all = $(".ink-chip", inks);
    if (all) all.innerHTML = 'Everywhere <span class="n">' + D.countryList.length + "</span>";
    Object.keys(INKS).forEach(function (k) {
      if (!counts[k]) return;
      inks.insertAdjacentHTML("beforeend", '<button type="button" class="ink-chip" aria-pressed="false" data-continent="' + esc(k) +
        '" style="--c:var(' + INKS[k] + ')"><i aria-hidden="true"></i>' + esc(k) + ' <span class="n">' + counts[k] + "</span></button>");
    });
    inks.addEventListener("click", function (e) {
      var chip = e.target.closest(".ink-chip");
      if (!chip) return;
      var k = chip.dataset.continent;
      $$(".ink-chip", inks).forEach(function (b) { b.setAttribute("aria-pressed", String(b === chip)); });
      $$("li", grid).forEach(function (li) { li.hidden = !!k && li.dataset.continent !== k; });
    });
  }

  /* the authored moment: each stamp lands as it scrolls into view */
  if (!reduce && "IntersectionObserver" in window) {
    document.documentElement.classList.add("js-motion");
    var stamps = $$(".stamp", grid);
    stamps.forEach(function (s) { s.classList.add("pre"); });
    var io = new IntersectionObserver(function (entries) {
      var batch = entries.filter(function (e) { return e.isIntersecting; });
      batch.forEach(function (e, n) {
        var s = e.target;
        s.style.setProperty("--delay", n * 45 + "ms");
        s.classList.remove("pre");
        s.classList.add("landed");
        s.addEventListener("animationend", function done() {
          s.classList.remove("landed"); s.style.removeProperty("--delay"); s.removeEventListener("animationend", done);
        });
        io.unobserve(s);
      });
    }, { rootMargin: "0px 0px -8% 0px" });
    stamps.forEach(function (s) { io.observe(s); });
  }
})();
