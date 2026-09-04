/* pobv.dev homepage - no dependencies, guards every feature.
   Motion is IntersectionObserver-driven (no scroll listeners). Honors reduced-motion. */
(function () {
  "use strict";
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---- scroll reveals ---- */
  var reveals = document.querySelectorAll(".reveal");
  if (reveals.length) {
    if (reduce || !("IntersectionObserver" in window)) {
      reveals.forEach(function (el) { el.classList.add("in"); });
    } else {
      var ro = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) { e.target.classList.add("in"); ro.unobserve(e.target); }
        });
      }, { threshold: 0.16, rootMargin: "0px 0px -8% 0px" });
      reveals.forEach(function (el) { ro.observe(el); });
    }
  }

  /* ---- nav: add shadow/border once the hero is scrolled past ---- */
  var nav = document.querySelector(".nav");
  var hero = document.querySelector(".hero");
  if (nav && hero && "IntersectionObserver" in window) {
    var no = new IntersectionObserver(function (entries) {
      nav.classList.toggle("stuck", !entries[0].isIntersecting);
    }, { rootMargin: "-64px 0px 0px 0px" });
    no.observe(hero);
  }

  /* ---- count-up metrics ---- */
  var nums = document.querySelectorAll("[data-count]");
  function easeOut(t) { return 1 - Math.pow(1 - t, 3); }
  function run(el) {
    var target = parseFloat(el.getAttribute("data-count"));
    var decimals = parseInt(el.getAttribute("data-dec") || "0", 10);
    var prefix = el.getAttribute("data-prefix") || "";
    if (reduce) { el.textContent = prefix + target.toFixed(decimals); return; }
    var dur = 1500, start = null;
    function step(ts) {
      if (start === null) start = ts;
      var p = Math.min((ts - start) / dur, 1);
      el.textContent = prefix + (target * easeOut(p)).toFixed(decimals);
      if (p < 1) requestAnimationFrame(step);
      else el.textContent = prefix + target.toFixed(decimals);
    }
    requestAnimationFrame(step);
  }
  if (nums.length) {
    if (!("IntersectionObserver" in window)) {
      nums.forEach(run);
    } else {
      var mo = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) { run(e.target); mo.unobserve(e.target); }
        });
      }, { threshold: 0.6 });
      nums.forEach(function (el) { mo.observe(el); });
    }
  }

  /* ---- easter egg: click the name 5× to reveal the off-the-clock menu ---- */
  var brand = document.getElementById("brand");
  var egg = document.getElementById("egg");
  if (brand && egg) {
    var taps = 0, tapTimer = null, eggOpen = false;

    function openEgg() {
      egg.hidden = false;
      requestAnimationFrame(function () { egg.classList.add("is-open"); });
      eggOpen = true;
    }
    function closeEgg() {
      egg.classList.remove("is-open");
      eggOpen = false;
      var done = function () { if (!eggOpen) egg.hidden = true; egg.removeEventListener("transitionend", done); };
      if (reduce) { egg.hidden = true; } else { egg.addEventListener("transitionend", done); }
    }

    brand.addEventListener("click", function (e) {
      // let the menu's own links work; only the brand toggles the counter
      taps++;
      clearTimeout(tapTimer);
      tapTimer = setTimeout(function () { taps = 0; }, 700);

      if (taps >= 5) {
        e.preventDefault();          // swallow the jump-to-top on the reveal tap
        taps = 0;
        clearTimeout(tapTimer);
        eggOpen ? closeEgg() : openEgg();
      }
    });

    // dismiss on outside click or Escape
    document.addEventListener("click", function (e) {
      if (eggOpen && !egg.contains(e.target) && e.target !== brand && !brand.contains(e.target)) closeEgg();
    });
    document.addEventListener("keydown", function (e) {
      if (eggOpen && e.key === "Escape") closeEgg();
    });
  }

  /* ---- hero headline: staggered line rise (transform only) ---- */
  if (!reduce) {
    var lines = document.querySelectorAll(".hero h1 .l > span");
    lines.forEach(function (span, i) {
      span.style.transform = "translateY(105%)";
      span.style.transition = "transform .9s cubic-bezier(.16,1,.3,1)";
      span.style.transitionDelay = (0.15 + i * 0.09) + "s";
    });
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        lines.forEach(function (span) { span.style.transform = "translateY(0)"; });
      });
    });
  }
})();
