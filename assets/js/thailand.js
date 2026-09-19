/* =============================================================================
   พวงมาลัย — thailand.html
   Five behaviours, each guarding its own elements so the page degrades cleanly:
     1. the cord strings itself to your eye line as you scroll
     2. each bud cinches onto the cord when it arrives
     3. the knot index marks the tier you are reading
     4. the full / short garland switch, which also re-seats the run heads
     5. the year marks itself where today actually falls
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

  /* --- 5. where the year is right now ------------------------------------ */

  /* The season chart is already complete and readable without this. All this
     does is point at the row you are standing in, from the same four windows
     the chart draws — so the page can never disagree with itself. */
  var season = doc.querySelector(".season");
  if (season) {
    var MONTHS = ["January", "February", "March", "April", "May", "June",
                  "July", "August", "September", "October", "November", "December"];

    var ANDAMAN = [11, 12, 1, 2, 3, 4];
    var GULF    = [6, 7, 8, 9];
    var HAZE    = [2, 3, 4];

    var now = new Date().getMonth() + 1;
    var holds = function (list) { return list.indexOf(now) !== -1; };

    season.style.setProperty("--now", String(now));
    season.setAttribute("data-now", String(now));

    var letters = season.querySelectorAll(".season__months li");
    if (letters[now - 1]) letters[now - 1].classList.add("is-now");

    var line = doc.querySelector("[data-nowline]");
    if (line) {
      var lede = doc.createElement("span");
      lede.className = "lede";
      lede.textContent = "As of today";

      var month = doc.createElement("b");
      month.textContent = MONTHS[now - 1];

      line.appendChild(lede);
      line.appendChild(doc.createTextNode("It is "));
      line.appendChild(month);
      line.appendChild(doc.createTextNode(
        " \u2014 " +
        (holds(ANDAMAN) ? "the Andaman coast is in its window"
                        : "the Andaman coast is in its wet half") + ", " +
        (holds(GULF) ? "the Gulf side is in its window"
                     : "the Gulf side is off-season") + ", and " +
        (holds(HAZE) ? "the north is in burning season, so check the AQI before you book it."
                     : "the north is clear of haze.")
      ));
      line.hidden = false;
    }
  }

  reseat();
  reband();
  recount();
})();
