/* Selected Work — projects.html
   Highlights the project you're reading in the sticky nav, and runs the
   page's scroll-led motion: content rises in, media grows into place, stats
   count up to their exact printed value, the hero eases away, a progress
   line fills under the nav, and the Redsky diagram draws in, then keeps
   pulsing with data. Guards its own elements; reduced motion shows
   everything at once and still. */
(function () {
  "use strict";
  var root = document.documentElement;
  var still = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var $$ = function (sel) { return Array.prototype.slice.call(document.querySelectorAll(sel)); };
  var links = $$(".localnav__links a");
  var sections = links.map(function (a) { return document.querySelector(a.getAttribute("href")); }).filter(Boolean);
  if (!("IntersectionObserver" in window)) return;
  root.classList.add("js");

  if (sections.length) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        links.forEach(function (l) { l.removeAttribute("aria-current"); });
        var l = links[sections.indexOf(e.target)];
        if (l) l.setAttribute("aria-current", "true");
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    sections.forEach(function (s) { io.observe(s); });
  }

  if (still) return;

  /* ---- rise in: each group's children stagger ---- */
  var groups = [".hero__in", ".project__head", ".media", ".story", ".stats--row", ".gallery", ".close"];
  var rise = [];
  groups.forEach(function (g) {
    $$(g).forEach(function (parent) {
      Array.prototype.forEach.call(parent.children, function (el, i) {
        if (el.matches("img, .flow")) return; // these grow instead
        el.classList.add("rv");
        el.style.setProperty("--i", Math.min(i, 4));
        rise.push(el);
      });
    });
  });

  /* ---- stats count up, ending on the exact printed text ---- */
  function countUp(el) {
    var text = el.textContent, m = text.match(/^(\D*)(\d+)(.*)$/);
    if (!m) return;
    var to = parseInt(m[2], 10), t0 = null, dur = 1400;
    function step(t) {
      if (t0 === null) t0 = t;
      var p = Math.min((t - t0) / dur, 1), e = 1 - Math.pow(1 - p, 3);
      el.textContent = p < 1 ? m[1] + Math.round(to * e) + m[3] : text;
      if (p < 1) requestAnimationFrame(step);
    }
    el.textContent = m[1] + "0" + m[3];
    requestAnimationFrame(step);
  }

  /* ---- Redsky: data pulses ride copies of the drawn lines ---- */
  $$(".flow").forEach(function (svg) {
    var lines = svg.querySelector(".flow__lines");
    if (!lines) return;
    var pulses = lines.cloneNode(true);
    pulses.setAttribute("class", "flow__pulses");
    Array.prototype.forEach.call(pulses.children, function (p, i) { p.style.setProperty("--d", (i % 6) * 0.18 + "s"); });
    lines.parentNode.insertBefore(pulses, lines.nextSibling);
  });

  var ro = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (!e.isIntersecting) return;
      var el = e.target;
      el.classList.add("is-in");
      if (el.hasAttribute("data-count")) countUp(el);
      ro.unobserve(el);
    });
  }, { threshold: 0.15, rootMargin: "0px 0px -6% 0px" });
  rise.concat($$(".flow"), $$("[data-count]")).forEach(function (el) { ro.observe(el); });

  /* ---- scroll-linked: progress line, hero easing away, media growing ---- */
  var hero = document.querySelector(".hero__in");
  var media = $$(".media");
  var ticking = false;
  function frame() {
    ticking = false;
    var vh = window.innerHeight, max = root.scrollHeight - vh;
    root.style.setProperty("--read", max > 0 ? Math.min(window.scrollY / max, 1).toFixed(4) : 0);
    if (hero) hero.style.setProperty("--away", Math.min(window.scrollY / (vh * 0.8), 1).toFixed(3));
    media.forEach(function (m) {
      var top = m.getBoundingClientRect().top;
      m.style.setProperty("--grow", Math.max(0, Math.min((vh - top) / (vh * 0.75), 1)).toFixed(3));
    });
  }
  function onScroll() { if (!ticking) { ticking = true; requestAnimationFrame(frame); } }
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);
  frame();
})();
