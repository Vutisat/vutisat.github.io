/* =============================================================================
   พวงมาลัย — thailand.html
   Six behaviours, each guarding its own elements so the page degrades cleanly:
     1. the cord strings itself to your eye line as you scroll
     2. each bud cinches onto the cord when it arrives
     3. the knot index marks the tier you are reading
     4. the full / short garland switch, which also re-seats the run heads
     5. the month you pick, and every verdict that follows from it
     6. the garland you string yourself
   No dependencies. Everything respects prefers-reduced-motion.
   ============================================================================= */

(function () {
  "use strict";

  var doc = document;
  var root = doc.documentElement;
  var calm = window.matchMedia("(prefers-reduced-motion: reduce)");

  /* the page is alive: release the safety that un-hides content if we fail */
  root.setAttribute("data-ready", "");

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

  /* --- 2. buds cinch onto the cord --------------------------------------- */

  var cinchers = doc.querySelectorAll("[data-cinch]");
  if (cinchers.length) {
    if (calm.matches || !("IntersectionObserver" in window)) {
      for (var i = 0; i < cinchers.length; i++) cinchers[i].classList.add("strung");
    } else {
      var strung = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (!e.isIntersecting) return;
          e.target.classList.add("strung");
          strung.unobserve(e.target);
        });
      }, { rootMargin: "0px 0px -12% 0px", threshold: 0.08 });

      for (var j = 0; j < cinchers.length; j++) strung.observe(cinchers[j]);
    }
  }

  /* --- 3. the knot index ------------------------------------------------- */

  var tiers = doc.querySelectorAll(".tier[id]");
  var knots = doc.querySelectorAll(".knot[data-tier]");
  if (tiers.length && knots.length && "IntersectionObserver" in window) {
    var mark = function (id) {
      for (var k = 0; k < knots.length; k++) {
        knots[k].setAttribute("aria-current", knots[k].dataset.tier === id ? "true" : "false");
      }
    };

    var here = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) mark(e.target.id); });
    }, { rootMargin: "-12% 0px -72% 0px" });

    for (var t = 0; t < tiers.length; t++) here.observe(tiers[t]);
  }

  /* --- 4. full / short garland ------------------------------------------- */

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

  var strand = doc.querySelector(".strand");
  var sift = doc.querySelectorAll(".sift button[data-sift]");
  if (strand && sift.length) {
    var choose = function (value) {
      if (value === "all") strand.removeAttribute("data-sift");
      else strand.setAttribute("data-sift", value);
      for (var s = 0; s < sift.length; s++) {
        sift[s].setAttribute("aria-pressed", sift[s].dataset.sift === value ? "true" : "false");
      }
      reseat();
      reband();
      recount();
    };

    for (var m = 0; m < sift.length; m++) {
      sift[m].addEventListener("click", function () { choose(this.dataset.sift); });
    }
  }

  /* --- 5. the month you are planning for --------------------------------- */

  /* Four windows, and every verdict on the page is derived from them, so the
     guide can never disagree with itself. Today is only the default. */
  var MONTHS = ["January", "February", "March", "April", "May", "June",
                "July", "August", "September", "October", "November", "December"];

  var ANDAMAN = [11, 12, 1, 2, 3, 4];   /* the west coast's dry window */
  var GULF    = [6, 7, 8, 9];           /* the east coast's, opposite  */
  var HAZE    = [2, 3, 4];              /* burning season in the north */

  var holds = function (list, m) { return list.indexOf(m) !== -1; };

  var keep = function (key, value) {
    try { window.localStorage.setItem(key, value); } catch (e) {}
  };
  var recall = function (key) {
    try { return window.localStorage.getItem(key); } catch (e) { return null; }
  };

  var season = doc.querySelector(".season");
  var today = new Date().getMonth() + 1;
  var picked = today;

  if (season) {
    var months = season.querySelectorAll(".season__months button[data-month]");
    var pickedOut = doc.querySelector("[data-picked]");
    var line = doc.querySelector("[data-nowline]");
    var coastMarks = doc.querySelectorAll(".seasonmark[data-coast]");
    var hazeLive = doc.querySelector('[data-live="haze"]');
    var coastLive = doc.querySelector('[data-live="coast"]');

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

      /* each coast, on its own sub-band */
      for (var c = 0; c < coastMarks.length; c++) {
        var isGulf = coastMarks[c].dataset.coast === "gulf";
        var open = isGulf ? gulf : andaman;
        say(coastMarks[c],
            (open ? "In season in " : "Off-season in ") + name,
            open ? "in" : "out");
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

    var choose = function (m, remember) {
      picked = m;
      if (remember) keep("thai-month", String(m));
      answer(m);
      if (typeof restring === "function") restring();
    };

    for (var b = 0; b < months.length; b++) {
      months[b].addEventListener("click", function () {
        choose(Number(this.dataset.month), true);
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
      choose(next, true);
      var el = season.querySelector('[data-month="' + next + '"]');
      if (el) el.focus();
    });

    if (line) {
      line.addEventListener("click", function (e) {
        if (e.target.hasAttribute && e.target.hasAttribute("data-today")) choose(today, true);
      });
    }

    var saved = parseInt(recall("thai-month"), 10);
    choose(saved >= 1 && saved <= 12 ? saved : today, false);
  }

  /* --- 6. the garland you string yourself -------------------------------- */

  /* Every bud gets its tie from here rather than from the markup, so a place
     added to the page later is threadable without touching this file. */
  var mine = doc.querySelector(".mine");
  var restring = null;

  if (mine) {
    var list = mine.querySelector("[data-mine-list]");
    var countOut = mine.querySelector("[data-mine-count]");
    var acts = mine.querySelector("[data-mine-acts]");
    var said = mine.querySelector("[data-mine-said]");
    var chip = doc.querySelector("[data-mine-chip]");
    var chipN = doc.querySelector("[data-mine-n]");

    var slug = function (text) {
      return text.toLowerCase().replace(/&/g, "and")
                 .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    };

    /* one pass over the strand: id every bud and record where it hangs */
    var places = [];
    var allBuds = doc.querySelectorAll(".strand .bud");
    for (var q = 0; q < allBuds.length; q++) {
      var bud = allBuds[q];
      var nameEl = bud.querySelector(".bud__name .en");
      if (!nameEl) continue;
      var tier = bud.closest(".tier");
      var band = tier && tier.querySelector(".band h2");
      var id = "place-" + slug(nameEl.textContent);
      if (!bud.id) bud.id = id;
      places.push({
        el: bud,
        id: id,
        name: nameEl.textContent.trim(),
        where: band ? band.textContent.trim() : "",
        mark: bud.dataset.mark || "rec"
      });
    }

    var chosen = {};
    try {
      var stored = JSON.parse(recall("thai-garland") || "[]");
      for (var t = 0; t < stored.length; t++) chosen[stored[t]] = true;
    } catch (e) {}

    var MARK = { must: "#bud-solid", rec: "#bud-half", time: "#bud-open" };

    var svgUse = function (href, cls) {
      var svg = doc.createElementNS("http://www.w3.org/2000/svg", "svg");
      svg.setAttribute("viewBox", "0 0 20 20");
      svg.setAttribute("aria-hidden", "true");
      if (cls) svg.setAttribute("class", cls);
      var use = doc.createElementNS("http://www.w3.org/2000/svg", "use");
      use.setAttribute("href", href);
      svg.appendChild(use);
      return svg;
    };

    var on = function (p) { return chosen[p.id] === true; };

    restring = function () {
      var picks = [];
      for (var i = 0; i < places.length; i++) if (on(places[i])) picks.push(places[i]);

      /* the buttons */
      for (var j = 0; j < places.length; j++) {
        var btn = places[j].el.querySelector(".thread");
        if (!btn) continue;
        var isOn = on(places[j]);
        btn.setAttribute("aria-pressed", isOn ? "true" : "false");
        btn.querySelector(".thread__t").textContent = isOn ? "On your garland" : "Thread it on";
      }

      /* the tray */
      list.textContent = "";
      for (var k = 0; k < picks.length; k++) {
        (function (p) {
          var li = doc.createElement("li");
          li.appendChild(svgUse(MARK[p.mark] || MARK.rec, "mine__mark"));

          var mid = doc.createElement("span");
          var where = doc.createElement("span");
          where.className = "mine__where";
          where.textContent = p.where;
          var a = doc.createElement("a");
          a.className = "mine__name";
          a.href = "#" + p.id;
          a.textContent = p.name;
          mid.appendChild(where);
          mid.appendChild(a);
          li.appendChild(mid);

          var x = doc.createElement("button");
          x.type = "button";
          x.className = "mine__x";
          x.setAttribute("aria-label", "Take " + p.name + " off your garland");
          x.appendChild(svgUse("#untie"));
          x.addEventListener("click", function () {
            delete chosen[p.id];
            save();
            restring();
          });
          li.appendChild(x);
          list.appendChild(li);
        })(picks[k]);
      }

      var n = picks.length;
      if (n) mine.setAttribute("data-has", ""); else mine.removeAttribute("data-has");
      countOut.textContent = n ? n + (n === 1 ? " place" : " places") : "Nothing strung yet";
      acts.hidden = n === 0;
      if (chip) chip.hidden = n === 0;
      if (chipN) chipN.textContent = String(n);
      if (said) said.textContent = "";
    };

    var save = function () {
      var keys = [];
      for (var i = 0; i < places.length; i++) if (on(places[i])) keys.push(places[i].id);
      keep("thai-garland", JSON.stringify(keys));
    };

    /* hang a tie off every bud */
    for (var r = 0; r < places.length; r++) {
      (function (p) {
        var rest = p.el.querySelector(".bud__rest");
        if (!rest) return;
        var btn = doc.createElement("button");
        btn.type = "button";
        btn.className = "thread";
        btn.setAttribute("aria-pressed", "false");
        btn.appendChild(svgUse("#knot"));
        var t = doc.createElement("span");
        t.className = "thread__t";
        t.textContent = "Thread it on";
        btn.appendChild(t);
        btn.addEventListener("click", function () {
          if (on(p)) delete chosen[p.id]; else chosen[p.id] = true;
          save();
          restring();
        });
        rest.appendChild(btn);
      })(places[r]);
    }

    /* copy it out as something you can paste to whoever you are going with */
    var asText = function () {
      var out = ["Pob's Thailand recs — my garland", ""];
      var lastWhere = null;
      var verdict = { must: "must-do", rec: "recommended", time: "if there is time" };
      for (var i = 0; i < places.length; i++) {
        if (!on(places[i])) continue;
        if (places[i].where !== lastWhere) {
          if (lastWhere !== null) out.push("");
          out.push(places[i].where.toUpperCase());
          lastWhere = places[i].where;
        }
        out.push("- " + places[i].name + " (" + (verdict[places[i].mark] || "") + ")");
      }
      out.push("");
      out.push("Planning for " + MONTHS[picked - 1] + ".");
      out.push(location.origin + location.pathname);
      return out.join("\n");
    };

    /* The async clipboard is the good path but it is refused in plenty of real
       situations (no user activation, insecure origin, older Safari), so the
       old selection trick is the fallback rather than the error message. */
    var byHand = function (text) {
      var ta = doc.createElement("textarea");
      ta.value = text;
      ta.setAttribute("readonly", "");
      ta.style.cssText = "position:fixed;top:0;left:-9999px;opacity:0";
      doc.body.appendChild(ta);
      ta.select();
      ta.setSelectionRange(0, text.length);
      var ok = false;
      try { ok = doc.execCommand("copy"); } catch (e) { ok = false; }
      doc.body.removeChild(ta);
      return ok;
    };

    var copyBtn = mine.querySelector("[data-mine-copy]");
    if (copyBtn) {
      copyBtn.addEventListener("click", function () {
        var text = asText();
        var done = function () { if (said) said.textContent = "Copied."; };
        var failed = function () { if (said) said.textContent = "Couldn't copy — select the list by hand."; };
        var tryHand = function () { if (byHand(text)) done(); else failed(); };

        if (navigator.clipboard && navigator.clipboard.writeText) {
          try {
            navigator.clipboard.writeText(text).then(done, tryHand);
          } catch (e) { tryHand(); }
        } else {
          tryHand();
        }
      });
    }

    var clearBtn = mine.querySelector("[data-mine-clear]");
    if (clearBtn) {
      clearBtn.addEventListener("click", function () {
        chosen = {};
        save();
        restring();
      });
    }

    restring();
  }

  reseat();
  reband();
  recount();
})();
