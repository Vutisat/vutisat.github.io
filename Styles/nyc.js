/* ============================================================
   Pob's NYC Field Guide — behavior
   Live NYC clock · scroll-spy line index · cuisine filter · reveals
   No dependencies. Reduced-motion aware. Guards every feature.
   ============================================================ */
(function () {
  "use strict";
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- sticky bar shadow ---------- */
  var bar = document.getElementById("bar");
  if (bar) {
    var onScroll = function () { bar.classList.toggle("is-stuck", window.scrollY > 8); };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  /* ---------- reveal on view ---------- */
  var reveals = Array.prototype.slice.call(document.querySelectorAll(".rv"));
  if (reduce || !("IntersectionObserver" in window)) {
    reveals.forEach(function (el) { el.classList.add("is-in"); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); }
      });
    }, { rootMargin: "0px 0px -6% 0px", threshold: 0.1 });
    reveals.forEach(function (el) { io.observe(el); });
  }

  /* ---------- live New York clock ---------- */
  var clk = document.getElementById("nyClock");
  if (clk) {
    var fmt = null;
    try {
      fmt = new Intl.DateTimeFormat("en-US", {
        timeZone: "America/New_York", hour: "numeric", minute: "2-digit", hour12: true
      });
    } catch (err) { fmt = null; }
    var paint = function () {
      var t = fmt ? fmt.format(new Date()) : "";
      clk.textContent = t ? "New York · " + t : "New York";
    };
    paint();
    if (!reduce && fmt) setInterval(paint, 15000);
  }

  /* ---------- scroll-spy line index ---------- */
  var links = Array.prototype.slice.call(document.querySelectorAll("[data-spy]"));
  var sections = links
    .map(function (a) { return document.getElementById(a.getAttribute("data-spy")); })
    .filter(Boolean);

  if (sections.length && "IntersectionObserver" in window) {
    var setActive = function (id) {
      links.forEach(function (a) {
        a.classList.toggle("is-active", a.getAttribute("data-spy") === id);
      });
      // keep active chip in view on the mobile rail
      var onMobile = document.querySelector(".index--mobile a.is-active");
      if (onMobile && window.innerWidth <= 860) {
        onMobile.scrollIntoView({ inline: "center", block: "nearest" });
      }
    };
    var visible = {};
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        visible[e.target.id] = e.isIntersecting ? e.intersectionRatio : 0;
      });
      var bestId = null, best = 0;
      sections.forEach(function (s) {
        if ((visible[s.id] || 0) > best) { best = visible[s.id]; bestId = s.id; }
      });
      if (bestId) setActive(bestId);
    }, { rootMargin: "-45% 0px -45% 0px", threshold: [0, 0.25, 0.5, 1] });
    sections.forEach(function (s) { spy.observe(s); });
  }

  /* ---------- cuisine filter (Eat section) ---------- */
  var filterBar = document.getElementById("eatFilters");
  if (filterBar) {
    var dishes = Array.prototype.slice.call(document.querySelectorAll(".dish"));
    var empty = document.getElementById("eatEmpty");
    filterBar.addEventListener("click", function (e) {
      var btn = e.target.closest("button[data-filter]");
      if (!btn) return;
      var want = btn.getAttribute("data-filter");
      filterBar.querySelectorAll("button").forEach(function (b) {
        b.classList.toggle("is-on", b === btn);
        b.setAttribute("aria-pressed", b === btn ? "true" : "false");
      });
      var shown = 0;
      dishes.forEach(function (d) {
        var match = want === "all" || (" " + d.getAttribute("data-cuisine") + " ").indexOf(" " + want + " ") !== -1;
        d.classList.toggle("is-hidden", !match);
        if (match) shown++;
      });
      if (empty) empty.style.display = shown ? "none" : "block";
    });
  }
})();
