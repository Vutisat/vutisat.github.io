/* =============================================================================
   พวงมาลัย — thailand.html
   Seven behaviours, each guarding its own elements so the page degrades cleanly:
     1. the cord strings itself to your eye line as you scroll
     2. the planner: every place gets an id and an "add to trip" toggle, and the
        At a glance strands are built from the places themselves
     3. the sift — all / top picks / must-do / mine — which re-seats run heads
     4. my trip: the short garland you keep, its panel, and its copyable list
     5. each piece cinches onto the cord when it arrives
     6. the knot index marks the tier you are reading
     7. the month you pick, and every verdict that follows from it
   No dependencies. Everything respects prefers-reduced-motion.
   ============================================================================= */

(function () {
  "use strict";

  var doc = document;
  var root = doc.documentElement;
  var calm = window.matchMedia("(prefers-reduced-motion: reduce)");

  /* the page is alive: release the safety that un-hides content if we fail */
  root.setAttribute("data-ready", "");

  var MONTHS = ["January", "February", "March", "April", "May", "June",
                "July", "August", "September", "October", "November", "December"];
  var today = new Date().getMonth() + 1;
  var picked = today;

  var keep = function (key, value) {
    try { window.localStorage.setItem(key, value); } catch (e) {}
  };
  var recall = function (key) {
    try { return window.localStorage.getItem(key); } catch (e) { return null; }
  };

  var make = function (tag, cls, text) {
    var el = doc.createElement(tag);
    if (cls) el.className = cls;
    if (text != null) el.textContent = text;
    return el;
  };
  var icon = function (id, cls) {
    var svg = doc.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", "0 0 20 20");
    svg.setAttribute("aria-hidden", "true");
    if (cls) svg.setAttribute("class", cls);
    var use = doc.createElementNS("http://www.w3.org/2000/svg", "use");
    use.setAttribute("href", "#" + id);
    svg.appendChild(use);
    return svg;
  };
  /* the words of an element, without any Thai or hidden label nested in it */
  var own = function (el) {
    if (!el) return "";
    var out = "";
    for (var n = el.firstChild; n; n = n.nextSibling) {
      if (n.nodeType === 3) out += n.textContent;
    }
    return out.replace(/\s+/g, " ").trim();
  };
  var slug = function (text) {
    return text.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  };

  /* --- 1. the cord ------------------------------------------------------- */

  var garland = doc.querySelector(".garland");
  if (garland) {
    var ticking = false;

    var string = function () {
      ticking = false;
      var r = garland.getBoundingClientRect();
      var eye = window.innerHeight * 0.52;
      var len = Math.min(Math.max(eye - r.top, 0), r.height);
      garland.style.setProperty("--strung", len.toFixed(1) + "px");
    };

    var queue = function () {
      if (!ticking) { ticking = true; requestAnimationFrame(string); }
    };

    window.addEventListener("scroll", queue, { passive: true });
    window.addEventListener("resize", queue, { passive: true });
    string();
  }

  /* --- 2. the planner ---------------------------------------------------- */

  /* Read every place off the strand once, in page order. The page is the data;
     the overview, the trip panel and the copied list are all views of it. */
  var places = [];
  var byId = {};
  var regions = [];

  var FACTS = ["Base", "From", "Role"];
  var factOf = function (el) {
    var rows = el.querySelectorAll(".hangtag > div");
    for (var f = 0; f < FACTS.length; f++) {
      for (var r = 0; r < rows.length; r++) {
        var dt = rows[r].querySelector("dt");
        var dd = rows[r].querySelector("dd");
        if (dt && dd && dt.textContent.trim() === FACTS[f]) {
          return { label: FACTS[f], value: dd.textContent.trim() };
        }
      }
    }
    return null;
  };

  var tierEls = doc.querySelectorAll(".strand > .tier");
  for (var ti = 0; ti < tierEls.length; ti++) {
    var tier = tierEls[ti];
    if (!tier.querySelector(".bud")) continue;

    var h2 = tier.querySelector(".band h2");
    var region = {
      id: tier.id,
      name: h2 ? h2.textContent.trim() : tier.id,
      th: (tier.querySelector(".band__th") || {}).textContent || "",
      coast: tier.dataset.coast || "",
      groups: []
    };
    var group = { name: "", coast: "", day: false, places: [] };
    region.groups.push(group);

    for (var kid = tier.firstElementChild; kid; kid = kid.nextElementSibling) {
      if (kid.classList.contains("subband")) {
        var mark = kid.querySelector(".seasonmark[data-coast]");
        group = {
          name: own(kid.querySelector("h3")),
          coast: mark ? mark.dataset.coast : "",
          day: kid.classList.contains("subband--day"),
          places: []
        };
        region.groups.push(group);
        continue;
      }

      var found = [];
      if (kid.classList.contains("buds")) found = kid.querySelectorAll(".bud");
      else if (kid.classList.contains("unstrung")) found = [kid];

      for (var fi = 0; fi < found.length; fi++) {
        var el = found[fi];
        var skip = el.classList.contains("unstrung");
        var nameEl = skip ? el.querySelector(".unstrung__head h3") : el.querySelector(".bud__name .en");
        var name = skip ? own(nameEl) : nameEl.textContent.trim();
        var th = el.querySelector(skip ? ".unstrung__head h3 .th" : ".bud__name .th");
        var id = el.id || slug(name);
        el.id = id;

        var place = {
          id: id, el: el, name: name,
          th: th ? th.textContent.trim() : "",
          mark: skip ? "skip" : el.dataset.mark,
          verdict: own(el.querySelector(".verdict")),
          fact: factOf(el),
          region: region, group: group
        };
        places.push(place);
        byId[id] = place;
        group.places.push(place);
      }
    }

    region.groups = region.groups.filter(function (g) { return g.places.length; });
    regions.push(region);
  }

  var MARKS = { must: "bud-solid", rec: "bud-half", time: "bud-open", skip: "bud-cut" };

  /* a toggle on every bud, beside its verdict */
  places.forEach(function (p) {
    if (p.mark === "skip") return;
    var head = p.el.querySelector(".bud__head");
    if (!head) return;
    var btn = make("button", "keep");
    btn.type = "button";
    btn.setAttribute("aria-pressed", "false");
    btn.dataset.keep = p.id;
    btn.appendChild(icon("keep-off", "keep__off"));
    btn.appendChild(icon("keep-on", "keep__on"));
    btn.appendChild(make("span", "keep__t", "Add to trip"));
    btn.appendChild(make("span", "vh", ": " + p.name));
    head.appendChild(btn);
  });

  /* At a glance: one short strand per region */
  var glance = doc.querySelector("#glance");
  var strands = doc.querySelector("[data-glance]");
  if (glance && strands && places.length) {
    regions.forEach(function (rg) {
      var col = make("div", "glance__col");
      var h = make("h3", "glance__h");
      var a = make("a", null, rg.name);
      a.href = "#" + rg.id;
      h.appendChild(a);
      if (rg.th) h.appendChild(make("span", "th", rg.th.trim()));
      col.appendChild(h);
      if (rg.coast) {
        var sm = make("span", "seasonmark");
        sm.dataset.coast = rg.coast;
        sm.hidden = true;
        col.appendChild(sm);
      }

      rg.groups.forEach(function (g) {
        if (g.name) {
          var gh = make("p", "glance__group", g.name);
          if (g.coast) {
            var gm = make("span", "seasonmark");
            gm.dataset.coast = g.coast;
            gm.hidden = true;
            gh.appendChild(gm);
          }
          col.appendChild(gh);
        }
        var ol = make("ol", "glance__list" + (g.day ? " glance__list--day" : ""));
        g.places.forEach(function (p) {
          var li = make("li", "glance__item");
          li.dataset.mark = p.mark;
          li.appendChild(icon(MARKS[p.mark], "glance__mark"));

          var link = make("a", "glance__name");
          link.href = "#" + p.id;
          link.appendChild(make("span", "en", p.name));
          var sub = p.mark === "skip" ? "Skip it" : p.fact ? p.fact.value : "";
          if (sub) link.appendChild(make("span", "glance__fact", sub));
          link.appendChild(make("span", "vh", " — " + p.verdict));
          li.appendChild(link);

          if (p.mark !== "skip") {
            var b = make("button", "glance__keep");
            b.type = "button";
            b.dataset.keep = p.id;
            b.setAttribute("aria-pressed", "false");
            b.setAttribute("aria-label", "Add " + p.name + " to my trip");
            b.appendChild(icon("keep-off", "keep__off"));
            b.appendChild(icon("keep-on", "keep__on"));
            li.appendChild(b);
          }
          ol.appendChild(li);
        });
        col.appendChild(ol);
      });
      strands.appendChild(col);
    });

    var real = places.filter(function (p) { return p.mark !== "skip"; }).length;
    var gc = doc.querySelector("[data-glance-count]");
    if (gc) gc.textContent = real + " places · " + regions.length + " regions";

    glance.hidden = false;
    var gk = doc.querySelector('.knot[data-tier="glance"]');
    if (gk) gk.hidden = false;
  }

  /* --- 3. the sift ------------------------------------------------------- */

  /* The first piece on each run of cord carries no rule above it, and which
     piece that is changes when the garland is shortened. */
  var reseat = function () {
    var runs = doc.querySelectorAll(".buds, .rules");
    for (var r = 0; r < runs.length; r++) {
      var items = runs[r].children;
      var seen = false;
      for (var n = 0; n < items.length; n++) {
        var el = items[n];
        if (!el.classList.contains("bud") && !el.classList.contains("rule")) continue;
        var shown = getComputedStyle(el).display !== "none";
        el.classList.toggle("is-first", shown && !seen);
        if (shown) seen = true;
      }
    }
  };

  /* A sub-band heads a run of buds. Shorten the garland and a run can empty out
     (the Gulf side holds no must-dos), so a heading would be left over nothing. */
  var reband = function () {
    var bands = doc.querySelectorAll(".subband");
    for (var i = 0; i < bands.length; i++) {
      var run = bands[i].nextElementSibling;
      while (run && !run.classList.contains("buds")) run = run.nextElementSibling;
      var live = 0;
      if (run) {
        var buds = run.querySelectorAll(".bud");
        for (var b = 0; b < buds.length; b++) {
          if (getComputedStyle(buds[b]).display !== "none") live++;
        }
      }
      bands[i].classList.toggle("is-empty", live === 0);
    }
  };

  var recount = function () {
    var counts = doc.querySelectorAll(".band__count[data-counts]");
    for (var c = 0; c < counts.length; c++) {
      var tier = counts[c].closest(".tier");
      if (!tier) continue;
      var shown = 0;
      var buds = tier.querySelectorAll(".bud");
      for (var b = 0; b < buds.length; b++) {
        if (getComputedStyle(buds[b]).display !== "none") shown++;
      }
      var slot = counts[c].querySelector(".n");
      if (slot) slot.textContent = String(shown);
      var unit = counts[c].querySelector(".u");
      if (unit) unit.textContent = shown === 1 ? "place" : "places";
    }
  };

  var refit = function () { reseat(); reband(); recount(); };

  var strand = doc.querySelector(".strand");
  var sift = doc.querySelectorAll(".sift button[data-sift]");
  var sifted = "all";
  var choose = function () {};

  if (strand && sift.length) {
    /* the counts on the buttons come from the buds, not from the markup */
    var tally = { all: 0, top: 0, must: 0 };
    places.forEach(function (p) {
      if (p.mark === "skip") return;
      tally.all++;
      if (p.mark === "must" || p.mark === "rec") tally.top++;
      if (p.mark === "must") tally.must++;
    });
    for (var sc = 0; sc < sift.length; sc++) {
      var n = sift[sc].querySelector(".n");
      if (n && tally[sift[sc].dataset.sift] != null) n.textContent = String(tally[sift[sc].dataset.sift]);
    }

    choose = function (value) {
      sifted = value;
      if (value === "all") strand.removeAttribute("data-sift");
      else strand.setAttribute("data-sift", value);
      for (var s = 0; s < sift.length; s++) {
        sift[s].setAttribute("aria-pressed", sift[s].dataset.sift === value ? "true" : "false");
      }
      refit();
    };

    for (var m = 0; m < sift.length; m++) {
      sift[m].addEventListener("click", function () { choose(this.dataset.sift); });
    }
  }

  /* --- 4. my trip -------------------------------------------------------- */

  var TRIP_KEY = "thai-trip";
  var trip = [];
  try {
    var stored = JSON.parse(recall(TRIP_KEY) || "[]");
    if (Array.isArray(stored)) trip = stored.filter(function (id) { return byId[id] && byId[id].mark !== "skip"; });
  } catch (e) {}

  var panel = doc.querySelector("dialog.trip");
  var openers = doc.querySelectorAll("[data-trip-open]");
  var listOut = doc.querySelector("[data-trip-list]");
  var subOut = doc.querySelector("[data-trip-sub]");
  var mineBtn = doc.querySelector('.sift button[data-sift="mine"]');

  var kept = function (id) { return trip.indexOf(id) !== -1; };

  var inOrder = function () {
    return places.filter(function (p) { return kept(p.id); });
  };

  var renderTrip = function () {
    if (!listOut) return;
    listOut.textContent = "";
    var chosen = inOrder();

    if (subOut) {
      subOut.textContent = chosen.length
        ? chosen.length + (chosen.length === 1 ? " place" : " places") + " · planning for " + MONTHS[picked - 1]
        : "";
    }

    if (!chosen.length) {
      var empty = make("p", "trip__empty");
      empty.appendChild(doc.createTextNode("Nothing strung yet. Tap "));
      empty.appendChild(make("b", null, "Add to trip"));
      empty.appendChild(doc.createTextNode(" on any place, or the "));
      var plus = make("span", "glance__plus");
      plus.appendChild(icon("keep-off"));
      empty.appendChild(plus);
      empty.appendChild(doc.createTextNode(" in At a glance, and it will wait for you here — in this browser, for next time."));
      listOut.appendChild(empty);
      return;
    }

    regions.forEach(function (rg) {
      var mine = chosen.filter(function (p) { return p.region === rg; });
      if (!mine.length) return;
      var sec = make("section", "trip__region");
      var h = make("h3", null, rg.name);
      if (rg.th) h.appendChild(make("span", "th", rg.th.trim()));
      sec.appendChild(h);
      var ol = make("ol", "trip__list");
      mine.forEach(function (p) {
        var li = make("li", "trip__item");
        li.dataset.mark = p.mark;
        li.appendChild(icon(MARKS[p.mark], "glance__mark"));
        var a = make("a", "glance__name");
        a.href = "#" + p.id;
        a.dataset.tripJump = "";
        a.appendChild(make("span", "en", p.name));
        var bits = [p.verdict];
        if (p.group.name) bits.push(p.group.name);
        if (p.fact) bits.push(p.fact.label + ": " + p.fact.value);
        a.appendChild(make("span", "glance__fact", bits.join(" · ")));
        li.appendChild(a);
        var x = make("button", "trip__drop");
        x.type = "button";
        x.dataset.drop = p.id;
        x.setAttribute("aria-label", "Remove " + p.name);
        x.appendChild(icon("untie"));
        li.appendChild(x);
        ol.appendChild(li);
      });
      sec.appendChild(ol);
      listOut.appendChild(sec);
    });
  };

  var tripText = function () {
    var lines = ["My Thailand trip — planning for " + MONTHS[picked - 1],
                 "From Pob's recommendations: " + location.origin + location.pathname, ""];
    regions.forEach(function (rg) {
      var mine = inOrder().filter(function (p) { return p.region === rg; });
      if (!mine.length) return;
      lines.push(rg.name.toUpperCase());
      mine.forEach(function (p) {
        var bits = [p.verdict];
        if (p.group.name) bits.push(p.group.name);
        if (p.fact) bits.push(p.fact.label + ": " + p.fact.value);
        lines.push("• " + p.name + (p.th ? " (" + p.th + ")" : "") + " — " + bits.join(" · "));
      });
      lines.push("");
    });
    return lines.join("\n").trim() + "\n";
  };

  var sync = function () {
    places.forEach(function (p) { p.el.classList.toggle("is-kept", kept(p.id)); });

    var toggles = doc.querySelectorAll("[data-keep]");
    for (var t = 0; t < toggles.length; t++) {
      var on = kept(toggles[t].dataset.keep);
      toggles[t].setAttribute("aria-pressed", on ? "true" : "false");
      var label = toggles[t].querySelector(".keep__t");
      if (label) label.textContent = on ? "On my trip" : "Add to trip";
    }

    for (var o = 0; o < openers.length; o++) {
      openers[o].dataset.count = String(trip.length);
      var c = openers[o].querySelector(".n");
      if (c) c.textContent = String(trip.length);
    }

    if (mineBtn) {
      mineBtn.hidden = trip.length === 0;
      var mn = mineBtn.querySelector(".n");
      if (mn) mn.textContent = String(trip.length);
    }

    if (sifted === "mine") {
      if (!trip.length) choose("all");
      else refit();
    }

    renderTrip();
  };

  var setKept = function (id, on) {
    var at = trip.indexOf(id);
    if (on && at === -1) trip.push(id);
    if (!on && at !== -1) trip.splice(at, 1);
    keep(TRIP_KEY, JSON.stringify(trip));
    sync();
  };

  if (places.length) {
    doc.addEventListener("click", function (e) {
      var t = e.target.closest ? e.target.closest("[data-keep]") : null;
      if (t) { setKept(t.dataset.keep, !kept(t.dataset.keep)); return; }
      var d = e.target.closest ? e.target.closest("[data-drop]") : null;
      if (d) setKept(d.dataset.drop, false);
    });

    for (var op = 0; op < openers.length; op++) openers[op].hidden = false;
  }

  if (panel && typeof panel.showModal === "function") {
    var opener = null;

    for (var oi = 0; oi < openers.length; oi++) {
      openers[oi].addEventListener("click", function () {
        opener = this;
        renderTrip();
        panel.showModal();
      });
    }

    var shut = function () { if (panel.open) panel.close(); };

    panel.addEventListener("click", function (e) {
      /* a click on the backdrop lands on the dialog itself */
      if (e.target === panel) { shut(); return; }
      var c = e.target.closest("[data-trip-close]");
      if (c) { shut(); return; }
      var j = e.target.closest("[data-trip-jump]");
      if (j) { opener = null; shut(); }
    });

    panel.addEventListener("close", function () {
      if (opener && opener.focus) opener.focus();
    });

    var copyBtn = panel.querySelector("[data-trip-copy]");
    if (copyBtn) {
      copyBtn.addEventListener("click", function () {
        if (!trip.length) return;
        var text = tripText();
        var done = function () {
          copyBtn.textContent = "Copied";
          setTimeout(function () { copyBtn.textContent = "Copy as a list"; }, 1800);
        };
        var fallback = function () {
          var ta = make("textarea");
          ta.value = text;
          ta.setAttribute("readonly", "");
          ta.style.position = "fixed"; ta.style.opacity = "0";
          panel.appendChild(ta);
          ta.select();
          try { doc.execCommand("copy"); done(); } catch (err) {}
          panel.removeChild(ta);
        };
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(text).then(done, fallback);
        } else {
          fallback();
        }
      });
    }

    var onlyBtn = panel.querySelector("[data-trip-only]");
    if (onlyBtn) {
      onlyBtn.addEventListener("click", function () {
        if (!trip.length) return;
        choose("mine");
        opener = null;
        shut();
        var first = inOrder()[0];
        var to = first && doc.getElementById(first.region.id);
        if (to) to.scrollIntoView();
      });
    }

    var clearBtn = panel.querySelector("[data-trip-clear]");
    if (clearBtn) {
      clearBtn.addEventListener("click", function () {
        trip = [];
        keep(TRIP_KEY, "[]");
        sync();
      });
    }
  }

  /* --- 5. buds cinch onto the cord --------------------------------------- */

  var cinchers = doc.querySelectorAll("[data-cinch]");
  if (cinchers.length) {
    if (calm.matches || !("IntersectionObserver" in window)) {
      for (var i = 0; i < cinchers.length; i++) cinchers[i].classList.add("strung");
    } else {
      /* strung the moment any of it is on screen — reading never waits on it */
      var strung = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (!e.isIntersecting) return;
          e.target.classList.add("strung");
          strung.unobserve(e.target);
        });
      }, { rootMargin: "0px 0px 8% 0px", threshold: 0 });

      for (var j = 0; j < cinchers.length; j++) strung.observe(cinchers[j]);
    }
  }

  /* --- 6. the knot index ------------------------------------------------- */

  var tiers = doc.querySelectorAll(".tier[id]");
  var knots = doc.querySelectorAll(".knot[data-tier]");
  if (tiers.length && knots.length && "IntersectionObserver" in window) {
    var mark = function (id) {
      for (var k = 0; k < knots.length; k++) {
        var on = knots[k].dataset.tier === id;
        knots[k].setAttribute("aria-current", on ? "true" : "false");
        /* on the swipeable rail, keep the lit knot in view */
        if (on && knots[k].parentNode.scrollWidth > knots[k].parentNode.clientWidth) {
          var rail = knots[k].parentNode;
          var left = knots[k].offsetLeft - 24;
          if (left < rail.scrollLeft || left + knots[k].offsetWidth > rail.scrollLeft + rail.clientWidth) {
            rail.scrollTo({ left: left, behavior: calm.matches ? "auto" : "smooth" });
          }
        }
      }
    };

    var here = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) mark(e.target.id); });
    }, { rootMargin: "-12% 0px -72% 0px" });

    for (var t = 0; t < tiers.length; t++) here.observe(tiers[t]);
  }

  /* --- 7. the month you are planning for --------------------------------- */

  /* Four windows, and every verdict on the page is derived from them, so the
     guide can never disagree with itself. Today is only the default. */
  var ANDAMAN = [11, 12, 1, 2, 3, 4];   /* the west coast's dry window */
  var GULF    = [6, 7, 8, 9];           /* the east coast's, opposite  */
  var HAZE    = [2, 3, 4];              /* burning season in the north */

  var holds = function (list, m) { return list.indexOf(m) !== -1; };

  var season = doc.querySelector(".season");

  if (season) {
    var months = season.querySelectorAll(".season__months button[data-month]");
    var pickedOut = doc.querySelector("[data-picked]");
    var line = doc.querySelector("[data-nowline]");
    var coastMarks = doc.querySelectorAll(".seasonmark[data-coast]");
    var hazeLive = doc.querySelector('[data-live="haze"]');
    var coastLive = doc.querySelector('[data-live="coast"]');
    var glanceMonth = doc.querySelector("[data-glance-month]");

    var say = function (el, text, state) {
      if (!el) return;
      el.textContent = text;
      if (state) el.setAttribute("data-state", state);
      el.hidden = false;
    };

    var answer = function (m) {
      var name = MONTHS[m - 1];
      var andaman = holds(ANDAMAN, m);
      var gulf = holds(GULF, m);
      var haze = holds(HAZE, m);

      season.style.setProperty("--pick", String(m));
      season.setAttribute("data-pick", String(m));

      for (var i = 0; i < months.length; i++) {
        var on = Number(months[i].dataset.month) === m;
        months[i].setAttribute("aria-checked", on ? "true" : "false");
        months[i].tabIndex = on ? 0 : -1;
      }

      if (pickedOut) pickedOut.textContent = name;

      /* the running verdict under the chart */
      if (line) {
        line.textContent = "";
        var lede = doc.createElement("span");
        lede.className = "lede";
        lede.textContent = m === today ? "As of today" : "Planning ahead";

        var strong = doc.createElement("b");
        strong.textContent = name;

        line.appendChild(lede);
        line.appendChild(doc.createTextNode("In "));
        line.appendChild(strong);
        line.appendChild(doc.createTextNode(
          " — " +
          (andaman ? "the Andaman coast is in its window"
                   : "the Andaman coast is in its wet half") + ", " +
          (gulf ? "the Gulf side is in its window"
                : "the Gulf side is off-season") + ", and " +
          (haze ? "the north is in burning season, so check the AQI before you book it."
                : "the north is clear of haze.")
        ));

        if (m !== today) {
          var back = doc.createElement("button");
          back.type = "button";
          back.className = "nowline__today";
          back.setAttribute("data-today", "");
          back.textContent = "Back to " + MONTHS[today - 1];
          line.appendChild(back);
        }
        line.hidden = false;
      }

      /* each coast on its own sub-band, and the north on its strand */
      for (var c = 0; c < coastMarks.length; c++) {
        var coast = coastMarks[c].dataset.coast;
        if (coast === "north") {
          say(coastMarks[c], (haze ? "Haze in " : "Clear in ") + name, haze ? "out" : "in");
          continue;
        }
        var open = coast === "gulf" ? gulf : andaman;
        say(coastMarks[c],
            (open ? "In season in " : "Off-season in ") + name,
            open ? "in" : "out");
      }

      if (glanceMonth) {
        glanceMonth.textContent = "";
        glanceMonth.appendChild(doc.createTextNode("Seasons are marked for "));
        glanceMonth.appendChild(make("b", null, name));
        glanceMonth.appendChild(doc.createTextNode(" — "));
        var to = make("a", null, "change the month");
        to.href = "#when";
        glanceMonth.appendChild(to);
        glanceMonth.appendChild(doc.createTextNode("."));
      }

      /* the two callouts stop being general advice and answer the question */
      if (haze) {
        say(hazeLive, "You picked " + name + " — that is inside the haze window.", "hit");
      } else {
        say(hazeLive, name + " falls outside it. The north will be clear.", "clear");
      }

      if (andaman && !gulf) {
        say(coastLive, "For " + name + ": take the Andaman side.", "hit");
      } else if (gulf && !andaman) {
        say(coastLive, "For " + name + ": take the Gulf side.", "hit");
      } else {
        say(coastLive, name + " sits between the two windows — neither coast is at its best.", "clear");
      }
    };

    var pickMonth = function (m, remember) {
      picked = m;
      if (remember) keep("thai-month", String(m));
      answer(m);
      if (subOut && trip.length) renderTrip();
    };

    for (var b = 0; b < months.length; b++) {
      months[b].addEventListener("click", function () {
        pickMonth(Number(this.dataset.month), true);
        this.focus();
      });
    }

    /* the ruler is a radio group, so the arrows walk it */
    season.addEventListener("keydown", function (e) {
      if (!e.target.dataset || !e.target.dataset.month) return;
      var step = e.key === "ArrowRight" || e.key === "ArrowDown" ? 1
               : e.key === "ArrowLeft" || e.key === "ArrowUp" ? -1
               : e.key === "Home" ? "first"
               : e.key === "End" ? "last" : 0;
      if (!step) return;
      e.preventDefault();
      var next = step === "first" ? 1
               : step === "last" ? 12
               : ((picked - 1 + step + 12) % 12) + 1;
      pickMonth(next, true);
      var el = season.querySelector('[data-month="' + next + '"]');
      if (el) el.focus();
    });

    if (line) {
      line.addEventListener("click", function (e) {
        if (e.target.hasAttribute && e.target.hasAttribute("data-today")) pickMonth(today, true);
      });
    }

    var saved = parseInt(recall("thai-month"), 10);
    pickMonth(saved >= 1 && saved <= 12 ? saved : today, false);
  }

  sync();
  refit();
})();
