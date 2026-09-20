/* =============================================================================
   พวงมาลัย — thailand.html
   Five behaviours, each guarding its own elements so the page degrades cleanly:
     1. the cord strings itself to your eye line as you scroll
     2. each bud cinches onto the cord when it arrives
     3. the knot index marks the tier you are reading
     4. the full / short garland switch, which also re-seats the run heads
     5. the month you pick, and every verdict that follows from it
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

    var pickMonth = function (m, remember) {
      picked = m;
      if (remember) keep("thai-month", String(m));
      answer(m);
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

  reseat();
  reband();
  recount();
})();
