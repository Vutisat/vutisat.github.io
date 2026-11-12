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
  /* countries the Timeline never logged carry only a year */
  function entry(c) { return c.yearOnly ? c.first.slice(0, 4) : day(c.first); }
  function countLine(c) { return c.yearOnly ? "off the record (before or outside the Timeline)" : num(c.places) + (c.places === 1 ? " place" : " places"); }
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

  /* ---------- play: more facts, the continents, surprise me, on this day, the quiz ---------- */
  var regionName = (function () {
    var dn = window.Intl && Intl.DisplayNames ? new Intl.DisplayNames(["en"], { type: "region" }) : null;
    return function (code) { try { return dn ? dn.of(code) : code; } catch (e) { return code; } };
  })();
  var byCode = {};
  D.countryList.forEach(function (c, i) { if (c.code) byCode[c.code] = { c: c, i: i }; });
  function longDay(iso) { return day(iso.slice(0, 10)); }
  function shuffle(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function pick(a) { return a[Math.floor(Math.random() * a.length)]; }
  var HOURS = ["midnight", "1 AM", "2 AM", "3 AM", "4 AM", "5 AM", "6 AM", "7 AM", "8 AM", "9 AM", "10 AM", "11 AM", "noon",
    "1 PM", "2 PM", "3 PM", "4 PM", "5 PM", "6 PM", "7 PM", "8 PM", "9 PM", "10 PM", "11 PM"];
  var DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

  function fly(lat, lng, z, label) {
    if (frame) {
      if (loading) { $("[data-loading-name]", loading).textContent = label.split(",")[0]; loading.hidden = false; }
      frame.src = mapSrc(lat, lng, z);
    }
    if (where) where.textContent = label;
    if (reset) reset.hidden = false;
    $$(".stamp").forEach(function (b) { b.setAttribute("aria-pressed", "false"); });
    window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
  }

  /* pins load only when someone asks for one */
  var pinsPromise = null;
  function pins() {
    if (!pinsPromise) pinsPromise = fetch("assets/js/places-pins.json").then(function (r) { return r.json(); });
    return pinsPromise;
  }
  function pinDate(n) { var s = String(n); return day(s.slice(0, 4) + "-" + s.slice(4, 6) + "-" + s.slice(6, 8)); }
  function pinLabel(p) { return p[0] + ", " + [p[6], p[7]].filter(Boolean).join(", "); }
  var surprise = $("[data-surprise]"), onDay = $("[data-onthisday]");
  if (surprise) surprise.addEventListener("click", function () {
    pins().then(function (all) {
      var p = pick(all);
      fly(p[1], p[2], 15, pinLabel(p) + ". First visit " + pinDate(p[4]));
    }).catch(function () { if (where) where.textContent = "the whole world (couldn't load the pins, try again)"; });
  });
  if (onDay) onDay.addEventListener("click", function () {
    pins().then(function (all) {
      var now = new Date(), year = now.getFullYear();
      for (var off = 0; off <= 10; off++) {
        var hits = [];
        [off, -off].forEach(function (o) {
          var d = new Date(now.getTime() + o * 864e5), md = (d.getMonth() + 1) * 100 + d.getDate();
          all.forEach(function (p) { if (p[4] % 10000 === md && Math.floor(p[4] / 10000) < year) hits.push(p); });
        });
        if (hits.length) {
          var p = pick(hits), y = Math.floor(p[4] / 10000);
          fly(p[1], p[2], 14, (off ? "Around this day in " : "On this day in ") + y + ": " + pinLabel(p));
          return;
        }
      }
      if (where) where.textContent = "nothing logged around this date, try Surprise me";
    }).catch(function () { if (where) where.textContent = "the whole world (couldn't load the pins, try again)"; });
  });

  /* the continents: every country a dot */
  var contEl = $("[data-continents]");
  if (contEl && F && F.continents) {
    var sovVisited = 0;
    F.continents.forEach(function (k) { sovVisited += k.visited.length; });
    $$('[data-field="sovVisited"]').forEach(function (el) { el.textContent = sovVisited; });
    contEl.innerHTML = F.continents.map(function (k) {
      var ink = INKS[k.name] || "--ink-antarctica", left = k.codes.length - k.visited.length;
      var codes = k.visited.concat(k.codes.filter(function (c) { return k.visited.indexOf(c) < 0; }));
      var count = k.codes.length
        ? "<b>" + k.visited.length + "</b> of " + k.codes.length + (left ? ", " + left + " to go" : ", all done")
        : (k.visited.length ? "been" : "no countries, just penguins");
      return '<div class="cont" style="--c:var(' + ink + ')"><div class="cont__head"><h3>' + esc(k.name) + '</h3><p>' + count + "</p></div>" +
        (k.codes.length ? '<div class="cont__dots">' + codes.map(function (c) {
          var v = k.visited.indexOf(c) >= 0;
          return '<button type="button" class="dot' + (v ? " is-v" : "") + '" data-code="' + c + '" aria-label="' + esc(regionName(c) + (v ? ", visited" : ", not yet")) + '"></button>';
        }).join("") + "</div>" : '<div class="cont__dots cont__dots--ice" aria-hidden="true"><i></i><i></i><i></i></div>') +
        '<p class="cont__out" aria-live="polite"></p></div>';
    }).join("") + (F.extras && F.extras.length ? '<p class="cont__extra">Plus ' + esc(F.extras.join(", ")) + ", which the UN list doesn't count.</p>" : "");
    contEl.addEventListener("click", function (e) {
      var d = e.target.closest(".dot");
      if (!d) return;
      var code = d.dataset.code, out = $(".cont__out", d.closest(".cont")), hit = byCode[code];
      $$(".dot.is-on", contEl).forEach(function (x) { x.classList.remove("is-on"); });
      d.classList.add("is-on");
      if (hit) {
        out.innerHTML = "<b>" + esc(hit.c.name) + "</b>: first entry " + esc(entry(hit.c)) + ", " + esc(countLine(hit.c)) + "." +
          ' <button type="button" class="linkish" data-fly="' + hit.i + '">Show it on the map</button>';
      } else {
        out.innerHTML = "<b>" + esc(regionName(code)) + "</b>: not yet.";
      }
    });
    contEl.addEventListener("click", function (e) {
      var b = e.target.closest("[data-fly]");
      if (b && typeof show === "function") show(+b.dataset.fly);
    });

    var nextBtn = $("[data-next]"), nextOut = $("[data-next-out]");
    var todo = [];
    F.continents.forEach(function (k) { k.codes.forEach(function (c) { if (k.visited.indexOf(c) < 0) todo.push({ code: c, cont: k.name }); }); });
    if (nextBtn && nextOut && todo.length) nextBtn.addEventListener("click", function () {
      var final = pick(todo), n = reduce ? 0 : 14, t = 0;
      nextBtn.disabled = true;
      (function tick(k) {
        if (k < n) {
          nextOut.textContent = regionName(pick(todo).code);
          nextOut.classList.add("is-spin");
          t = setTimeout(function () { tick(k + 1); }, 40 + k * k * 1.6);
          return;
        }
        nextOut.classList.remove("is-spin");
        nextOut.innerHTML = "Next stop: <b>" + esc(regionName(final.code)) + "</b>, in " + esc(final.cont) + ". " +
          pick(["Booking it?", "Seems reasonable.", "Someone tell my manager.", "Pack light.", "Window seat, please."]);
        $$(".dot.is-on", contEl).forEach(function (x) { x.classList.remove("is-on"); });
        var dot = contEl.querySelector('.dot[data-code="' + final.code + '"]');
        if (dot) dot.classList.add("is-on");
        nextBtn.disabled = false;
        nextBtn.textContent = "Spin again";
      })(0);
    });
  }

  /* more fact panels */
  if (factsEl && F) {
    var after = function (sel, html) { var el = $(sel, factsEl); if (el) el.insertAdjacentHTML("afterend", html); else factsEl.insertAdjacentHTML("beforeend", html); };
    if (F.modes && F.modes.length) {
      var UNITS = [
        { id: "km", label: "km", f: function (k) { return num(Math.round(k)) + " km"; } },
        { id: "mi", label: "miles", f: function (k) { return num(Math.round(k * 0.621371)) + " mi"; } },
        { id: "earth", label: "laps of Earth", f: function (k) { var x = k / 40075; return (x >= 1 ? x.toFixed(1) : x.toFixed(2)) + " laps"; } },
        { id: "moon", label: "Moon trips", f: function (k) { var x = k / 384400; return (x >= .1 ? Math.round(x * 100) : (x * 100).toFixed(2)) + "% to the Moon"; } }
      ];
      var top = F.modes.filter(function (m) { return m.km > 0; }).slice(0, 9), maxK = top[0] ? Math.max.apply(null, top.map(function (m) { return m.km; })) : 1;
      var fl = F.modes.filter(function (m) { return m.key === "FLYING"; })[0];
      after(".fact--compass",
        '<article class="fact fact--modes"><h3>Getting around</h3>' +
        (fl ? "<p>" + num(fl.count) + " flights add up to " + (fl.km / 40075).toFixed(1) + " times around the Earth. The longest single one: " + num(fl.longest) + " km.</p>" : "") +
        '<div class="units" role="group" aria-label="Units">' + UNITS.map(function (u, i) {
          return '<button type="button" class="unit" data-unit="' + i + '" aria-pressed="' + (i === 0) + '">' + esc(u.label) + "</button>";
        }).join("") + "</div>" +
        '<ul class="modes">' + top.map(function (m) {
          return '<li><span class="modes__name">' + esc(m.name) + '</span><i style="--w:' + Math.max(1, Math.round(Math.sqrt(m.km / maxK) * 100)) + '%"></i><b data-km="' + m.km + '">' + UNITS[0].f(m.km) + "</b></li>";
        }).join("") + "</ul></article>" +
        '<article class="fact fact--clock"><h3>When I\'m out</h3><div class="clock"><svg viewBox="0 0 200 200" role="img" aria-label="Stops by hour of day"></svg>' +
        '<p class="clock__mid" aria-live="polite"></p></div><p class="clock__line"></p></article>');
      var unitsEl = $(".units", factsEl);
      if (unitsEl) unitsEl.addEventListener("click", function (e) {
        var b = e.target.closest(".unit");
        if (!b) return;
        var u = UNITS[+b.dataset.unit];
        $$(".unit", unitsEl).forEach(function (x) { x.setAttribute("aria-pressed", String(x === b)); });
        $$(".modes b", factsEl).forEach(function (x) { x.textContent = u.f(+x.dataset.km); });
      });
      /* the clock */
      var svg = $(".clock svg", factsEl), mid = $(".clock__mid", factsEl), line = $(".clock__line", factsEl);
      if (svg && F.hours24) {
        var H = F.hours24, total = H.reduce(function (a, b) { return a + b; }, 0), maxH = Math.max.apply(null, H), peakH = H.indexOf(maxH);
        var paths = H.map(function (v, h) {
          var a0 = (h / 24) * 2 * Math.PI - Math.PI / 2 + .02, a1 = ((h + 1) / 24) * 2 * Math.PI - Math.PI / 2 - .02;
          var r0 = 58, r1 = 60 + (v / maxH) * 38;
          var p = function (r, a) { return (100 + r * Math.cos(a)).toFixed(1) + " " + (100 + r * Math.sin(a)).toFixed(1); };
          return '<path data-h="' + h + '" class="' + (h === peakH ? "is-peak" : "") + '" d="M' + p(r0, a0) + " L" + p(r1, a0) + " A" + r1 + " " + r1 + " 0 0 1 " + p(r1, a1) + " L" + p(r0, a1) + " A" + r0 + " " + r0 + ' 0 0 0 ' + p(r0, a0) + 'Z"/>';
        }).join("");
        var ticks = [0, 6, 12, 18].map(function (h) {
          var a = (h / 24) * 2 * Math.PI - Math.PI / 2;
          return '<text x="' + (100 + 50 * Math.cos(a)).toFixed(1) + '" y="' + (100 + 50 * Math.sin(a) + 3).toFixed(1) + '" text-anchor="middle">' + ["12a", "6a", "12p", "6p"][h / 6] + "</text>";
        }).join("");
        svg.innerHTML = paths + ticks;
        var say = function (h) {
          mid.innerHTML = "<b>" + HOURS[h] + "</b>" + Math.round(H[h] / total * 1000) / 10 + "% of stops";
          $$("path", svg).forEach(function (p) { p.classList.toggle("is-on", +p.dataset.h === h); });
        };
        say(peakH);
        svg.addEventListener("pointerover", function (e) { var p = e.target.closest("path"); if (p) say(+p.dataset.h); });
        svg.addEventListener("click", function (e) { var p = e.target.closest("path"); if (p) say(+p.dataset.h); });
        var W = F.weekdays || [], wmax = W.indexOf(Math.max.apply(null, W)), night = H.slice(22).concat(H.slice(0, 5)).reduce(function (a, b) { return a + b; }, 0);
        line.innerHTML = "Busiest hour to be out: <b>" + HOURS[peakH] + "</b>. Favourite day: <b>" + (DAYS[wmax] || "") + "</b>. " +
          Math.round(night / total * 100) + "% of stops start between 10 PM and 5 AM. Hover or tap the clock.";
      }
    }
    var rec = [];
    if (F.mostCountriesDay) rec.push("<li><b>" + F.mostCountriesDay.countries.length + " countries in one day</b><span>" + esc(F.mostCountriesDay.countries.join(", ")) + " on " + esc(longDay(F.mostCountriesDay.date)) + "</span></li>");
    if (F.biggestTrip) {
      var days = Math.round((new Date(F.biggestTrip.end) - new Date(F.biggestTrip.start)) / 864e5) + 1;
      rec.push("<li><b>" + F.biggestTrip.countries + " countries in one trip</b><span>" + days + " days, " + esc(monthYear(F.biggestTrip.start)) + " to " + esc(monthYear(F.biggestTrip.end)) + "</span></li>");
    }
    if (F.busiestDay) rec.push("<li><b>" + F.busiestDay.places + " places in one day</b><span>" + esc(longDay(F.busiestDay.date)) + ". I was tired.</span></li>");
    if (F.longestStop) rec.push("<li><b>" + num(F.longestStop.hours) + " hours without leaving</b><span>" + esc(F.longestStop.name) + ", " + esc(F.longestStop.city || F.longestStop.country) + "</span></li>");
    if (rec.length) after(".fact--air", '<article class="fact fact--records"><h3>Personal records</h3><ul class="records">' + rec.join("") + "</ul></article>");
    if (F.hemispheres) {
      var hs = F.hemispheres, ns = hs.north + hs.south, ew = hs.east + hs.west;
      var pc = function (a, b) { return Math.round(a / b * 100); };
      after(".fact--records", '<article class="fact fact--hemi"><h3>Which half of the planet</h3>' +
        '<div class="hemi"><div class="hemi__bar"><i style="--w:' + pc(hs.north, ns) + '%"></i></div><p><b>' + pc(hs.north, ns) + "%</b> north of the equator, " + pc(hs.south, ns) + "% south</p>" +
        '<div class="hemi__bar hemi__bar--ew"><i style="--w:' + pc(hs.west, ew) + '%"></i></div><p><b>' + pc(hs.west, ew) + "%</b> west of Greenwich, " + pc(hs.east, ew) + "% east</p></div></article>");
    }
    /* the country alphabet */
    var letters = {};
    D.countryList.forEach(function (c) { var L = c.name.charAt(0).toUpperCase(); (letters[L] = letters[L] || []).push(c.name); });
    var todoNames = [];
    (F.continents || []).forEach(function (k) { k.codes.forEach(function (c) { if (k.visited.indexOf(c) < 0) todoNames.push(regionName(c)); }); });
    var AZ = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split(""), lit = AZ.filter(function (L) { return letters[L]; });
    after(".fact--cities", '<article class="fact fact--alpha"><h3>The country alphabet</h3><p>' + lit.length + " of 26 letters stamped. Tap a letter.</p>" +
      '<div class="alpha">' + AZ.map(function (L) {
        return '<button type="button" class="alpha__l' + (letters[L] ? " is-lit" : "") + '" data-l="' + L + '" aria-pressed="false">' + L + "</button>";
      }).join("") + '</div><p class="alpha__out" aria-live="polite">&nbsp;</p></article>');
    var alpha = $(".alpha", factsEl), alphaOut = $(".alpha__out", factsEl);
    if (alpha) alpha.addEventListener("click", function (e) {
      var b = e.target.closest(".alpha__l");
      if (!b) return;
      var L = b.dataset.l;
      $$(".alpha__l", alpha).forEach(function (x) { x.setAttribute("aria-pressed", String(x === b)); });
      if (letters[L]) alphaOut.innerHTML = "<b>" + L + "</b>: " + esc(letters[L].join(", "));
      else {
        var cand = todoNames.filter(function (n) { return n.charAt(0).toUpperCase() === L; });
        alphaOut.innerHTML = "<b>" + L + "</b>: " + (cand.length ? "nothing yet. " + esc(pick(cand)) + " would fix that." : "no country starts with " + L + ". Off the hook.");
      }
    });
  }

  /* the quiz */
  var quizEl = $("[data-quiz]");
  if (quizEl && F) {
    var Q = [];
    var n = D.countries;
    Q.push({ q: "How many countries have I been to?", a: String(n), o: [String(n), String(n - 23), String(n + 17), String(n - 41)], why: num(n) + ", counted from the stamps. " + (D.continents) + " continents too." });
    if (F.brands && F.brands.length >= 4) Q.push({ q: "Which chain have I stopped at in the most different locations?", a: F.brands[0].name, o: F.brands.slice(0, 4).map(function (b) { return b.name; }), why: F.brands[0].name + ": " + F.brands[0].count + " different locations. No regrets." });
    var per = (F.perYear || []).slice(), pk = per.reduce(function (a, y) { return y.countries > a.countries ? y : a; }, per[0]);
    if (pk) Q.push({ q: "Which year did I add the most new countries?", a: pk.year, o: [pk.year].concat(shuffle(per.filter(function (y) { return y.year !== pk.year; }).map(function (y) { return y.year; })).slice(0, 3)), why: pk.year + ", with " + pk.countries + " new countries." });
    var flm = (F.modes || []).filter(function (m) { return m.key === "FLYING"; })[0];
    if (flm) { var laps = Math.round(flm.km / 40075); Q.push({ q: "Roughly how many times around the Earth have I flown?", a: laps + " times", o: [laps + " times", Math.max(1, Math.round(laps / 3)) + " times", laps * 3 + " times", laps + 12 + " times"], why: num(flm.km) + " km in the air, about " + (flm.km / 40075).toFixed(1) + " laps." }); }
    if (F.north) Q.push({ q: "Where's the northernmost place I've been?", a: F.north.country, o: shuffle([F.north.country].concat(shuffle(D.countryList.map(function (c) { return c.name; }).filter(function (x) { return x !== F.north.country; })).slice(0, 3))), why: F.north.name + " in " + F.north.city + ", " + F.north.country + "." });
    var qi = 0, score = 0;
    var render = function () {
      if (qi >= Q.length) {
        var msg = score === Q.length ? "Perfect. Have you been following me?" : score >= Q.length - 1 ? "Very good. We should travel together." : score >= 2 ? "Not bad. Scroll up and study." : "Did you skip the page?";
        quizEl.innerHTML = '<div class="quiz__end"><p class="quiz__score"><b>' + score + "</b> / " + Q.length + '</p><p>' + msg + '</p><button type="button" class="quiz__next" data-again>Play again</button></div>';
        return;
      }
      var q = Q[qi];
      quizEl.innerHTML = '<p class="quiz__count">Question ' + (qi + 1) + " of " + Q.length + '</p><h3 class="quiz__q">' + esc(q.q) + '</h3><div class="quiz__opts">' +
        shuffle(q.o).map(function (o) { return '<button type="button" class="quiz__opt" data-o="' + esc(o) + '">' + esc(o) + "</button>"; }).join("") +
        '</div><p class="quiz__why" aria-live="polite"></p>';
    };
    quizEl.addEventListener("click", function (e) {
      var o = e.target.closest(".quiz__opt");
      if (o && !quizEl.classList.contains("answered")) {
        var q = Q[qi], right = o.dataset.o === q.a;
        if (right) score++;
        $$(".quiz__opt", quizEl).forEach(function (b) { b.disabled = true; if (b.dataset.o === q.a) b.classList.add("is-right"); });
        if (!right) o.classList.add("is-wrong");
        $(".quiz__why", quizEl).innerHTML = (right ? "<b>Yes.</b> " : "<b>Nope.</b> ") + esc(q.why) + ' <button type="button" class="quiz__next" data-next-q>' + (qi + 1 < Q.length ? "Next question" : "See my score") + "</button>";
        quizEl.classList.add("answered");
        return;
      }
      if (e.target.closest("[data-next-q]")) { qi++; quizEl.classList.remove("answered"); render(); return; }
      if (e.target.closest("[data-again]")) { qi = 0; score = 0; render(); }
    });
    render();
  }

  /* ---------- photos from the road ---------- */
  var picker = $("[data-photo-picker]"), album = $("[data-album]"), PH = window.PLACES_PHOTOS || {};
  var viewer = $("[data-viewer]");
  function photosFor(code) {
    var c = byCode[code] && byCode[code].c;
    if (!album || !c) return;
    $$(".photo-chip", picker).forEach(function (b) { b.setAttribute("aria-pressed", String(b.dataset.code === code)); });
    var list = PH[code] || [], ink = INKS[c.continent] || "--ink-antarctica";
    var head = '<div class="album__head"><h3>' + esc(c.name) + "</h3><p>" + (list.length ? list.length + (list.length === 1 ? " photo" : " photos") : "Photos coming soon") +
      ' · <button type="button" class="linkish" data-fly="' + byCode[code].i + '">Show on the map</button></p></div>';
    var prints = list.length ? list.map(function (p, i) {
      return '<button type="button" class="print" data-photo="' + i + '" style="--r:' + ((i % 3) - 1) * 1.6 + 'deg"><img src="' + esc(p.src) + '" alt="' + esc(p.alt || "") + '" loading="lazy">' +
        "<span>" + esc(p.caption || c.name) + "</span></button>";
    }) : [0, 1, 2].map(function (i) {
      return '<div class="print print--empty" style="--r:' + (i - 1) * 1.6 + 'deg;--c:var(' + ink + ')"><div class="print__ph" aria-hidden="true">' +
        '<svg viewBox="0 0 24 24"><path d="M4 8h3l2-3h6l2 3h3v11H4z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><circle cx="12" cy="13" r="3.5" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>' +
        "<b>Photo coming soon</b></div><span>" + esc(c.name) + "</span></div>";
    });
    album.innerHTML = head + '<div class="album__prints">' + prints.join("") + "</div>";
    album.dataset.code = code;
  }
  if (picker && album) {
    picker.innerHTML = D.countryList.map(function (c) {
      return c.code ? '<button type="button" class="photo-chip" aria-pressed="false" data-code="' + c.code + '" style="--c:var(' + (INKS[c.continent] || "--ink-antarctica") + ')">' +
        esc(c.name) + (PH[c.code] && PH[c.code].length ? ' <span class="photo-chip__n">' + PH[c.code].length + "</span>" : "") + "</button>" : "";
    }).join("");
    picker.addEventListener("click", function (e) { var b = e.target.closest(".photo-chip"); if (b) photosFor(b.dataset.code); });
    album.addEventListener("click", function (e) {
      var f = e.target.closest("[data-fly]");
      if (f && typeof show === "function") { show(+f.dataset.fly); return; }
      var p = e.target.closest("[data-photo]"), list = PH[album.dataset.code] || [];
      if (p && viewer && viewer.showModal && list[+p.dataset.photo]) {
        var ph = list[+p.dataset.photo];
        $("[data-viewer-img]", viewer).src = ph.src; $("[data-viewer-img]", viewer).alt = ph.alt || "";
        $("[data-viewer-cap]", viewer).textContent = ph.caption || "";
        viewer.showModal();
      }
    });
    if (viewer) viewer.addEventListener("click", function (e) { if (e.target === viewer) viewer.close(); });
    /* open on the country with photos, else the most-visited one abroad */
    var withPhotos = D.countryList.filter(function (c) { return PH[c.code] && PH[c.code].length; });
    var start = withPhotos[0] || D.countryList.filter(function (c) { return c.code !== "US"; }).reduce(function (a, c) { return c.places > a.places ? c : a; });
    photosFor(start.code);
  }

  /* ---------- entry stamps ---------- */
  var grid = $("[data-stamps]");
  if (!grid || !D.countryList) return;

  function fit(text, max) { return text.length > max ? ' textLength="' + (max * 6.4).toFixed(0) + '" lengthAdjust="spacingAndGlyphs"' : ""; }

  function stampSVG(c, i) {
    var r = rng(hash(c.code || c.name)), shape = Math.floor(r() * 5), id = "s" + i;
    var name = esc(c.name.toUpperCase()), date = esc(entry(c).toUpperCase());
    var places = c.yearOnly ? "OFF THE RECORD" : num(c.places) + (c.places === 1 ? " PLACE" : " PLACES");
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
          '<text class="t-small" x="60" y="84" font-size="7" text-anchor="middle">' + (c.yearOnly ? '' : 'ARRIVAL · ') + esc(places) + "</text>";
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
    var label = c.name + ", first entry " + entry(c) + ", " + countLine(c) + ". Show on the map";
    return '<li data-continent="' + esc(c.continent) + '"><button type="button" class="stamp" aria-pressed="false" data-i="' + i + '"' +
      ' aria-label="' + esc(label) + '" style="--c:var(' + ink + ");--r:" + s.tilt + "deg;--dx:" + s.dx + "px;--dy:" + s.dy + 'px">' +
      s.svg + "</button></li>";
  }).join("");

  function show(i) {
    var c = D.countryList[i];
    $$(".stamp", grid).forEach(function (b) { b.setAttribute("aria-pressed", String(+b.dataset.i === i)); });
    if (where) where.textContent = c.name + " · since " + (c.yearOnly ? c.first.slice(0, 4) : monthYear(c.first));
    if (frame) {
      if (loading) { $("[data-loading-name]", loading).textContent = c.name; loading.hidden = false; }
      frame.src = mapSrc(c.lat, c.lng, c.zoom);
    }
    if (reset) reset.hidden = false;
    if (c.code && album) photosFor(c.code);
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
