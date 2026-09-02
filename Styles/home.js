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
