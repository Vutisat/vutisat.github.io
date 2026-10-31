/* The Swatch Book — home.html
   Sews the running stitch along each rounded seam. The stitch raster used on
   straight edges cannot bend around a corner, so here each stitch is the same
   drawing (an SVG symbol) placed one by one along the seam's path, turned to
   follow it. Without this script the dashed path underneath stays visible. */
(function () {
  "use strict";
  var NS = "http://www.w3.org/2000/svg";
  var PERIOD = 22;   /* px from one stitch to the next */
  var LENGTH = 15;   /* px drawn length of one stitch */

  function sew(svg) {
    var path = svg.querySelector(".seam__thread");
    if (!path || !path.getTotalLength) return;
    var total = path.getTotalLength();
    if (!total) return;
    var old = svg.querySelector(".seam__stitches");
    if (old) old.remove();
    var g = document.createElementNS(NS, "g");
    g.setAttribute("class", "seam__stitches");
    var id = svg.getAttribute("data-stitch") || "stitch-light";
    /* smaller seams (the swatches) can ask for a finer stitch */
    var period = +svg.getAttribute("data-period") || PERIOD, len = +svg.getAttribute("data-length") || LENGTH;
    var n = Math.max(4, Math.round(total / period));
    for (var i = 0; i < n; i++) {
      var d = (i + 0.5) * total / n;
      var p = path.getPointAtLength(d);
      var q = path.getPointAtLength(Math.min(total, d + 1));
      var a = Math.atan2(q.y - p.y, q.x - p.x) * 180 / Math.PI;
      var use = document.createElementNS(NS, "use");
      use.setAttribute("href", "#" + id);
      use.setAttribute("width", len);
      use.setAttribute("height", len / 2);
      use.setAttribute("transform", "translate(" + p.x.toFixed(1) + " " + p.y.toFixed(1) + ") rotate(" + a.toFixed(1) + ") translate(" + (-len / 2) + " " + (-len / 4) + ")");
      g.appendChild(use);
    }
    svg.appendChild(g);
    svg.classList.add("is-sewn");
  }

  var seams = document.querySelectorAll("svg.seam");
  if (!seams.length) return;
  function all() { seams.forEach(sew); }
  all();
  if ("ResizeObserver" in window) {
    var t;
    var ro = new ResizeObserver(function () { clearTimeout(t); t = setTimeout(all, 120); });
    seams.forEach(function (s) { ro.observe(s); });
  }
})();

/* A living room: the cover swings on its yarn, swatches settle onto their
   ledges, the meadow grows, and the light follows the visitor's clock. Everything here guards its own
   elements; reduced motion keeps the room still. */
(function () {
  "use strict";
  var root = document.documentElement;
  var still = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  root.classList.add("js");

  /* ---- the light follows the visitor's clock --------------------------- */
  var h = new Date().getHours();
  root.setAttribute("data-time", h >= 5 && h < 10 ? "morning" : h < 16 ? "day" : h < 20 ? "evening" : "night");

  if (still) {
    document.querySelectorAll(".shelf, .meadow").forEach(function (el) { el.classList.add("is-in"); });
    return;
  }

  /* ---- swatches settle as each shelf comes into view; the meadow waits
     until most of it is on screen, then every flower springs up at once --- */
  document.querySelectorAll(".shelf").forEach(function (shelf) {
    shelf.querySelectorAll(".swatch").forEach(function (sw, i) { sw.style.setProperty("--i", i); });
  });
  function reveal(selector, threshold) {
    var els = document.querySelectorAll(selector);
    if (!("IntersectionObserver" in window)) {
      els.forEach(function (el) { el.classList.add("is-in"); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); }
      });
    }, { threshold: threshold });
    els.forEach(function (el) { io.observe(el); });
  }
  reveal(".shelf", 0.25);
  reveal(".meadow", 0.6);

  /* ---- the cover rocks on its yarn when you scroll past ---------------- */
  /* not on touch screens: re-rotating the whole cover every scroll frame
     makes phones re-draw it, and they fall behind (half-drawn photo) */
  var coarse = window.matchMedia && window.matchMedia("(pointer: coarse)").matches;
  var cover = document.querySelector(".intro");
  if (cover && !coarse) {
    var lastY = window.scrollY, angle = 0, vel = 0, raf = 0;
    function step() {
      /* a damped spring pulling the panel back to hanging straight */
      vel += -angle * 0.05; vel *= 0.84; angle += vel;
      cover.style.rotate = angle.toFixed(3) + "deg";
      if (Math.abs(angle) > 0.01 || Math.abs(vel) > 0.01) raf = requestAnimationFrame(step);
      else { cover.style.rotate = ""; raf = 0; }
    }
    window.addEventListener("scroll", function () {
      var y = window.scrollY, dy = y - lastY; lastY = y;
      if (y > window.innerHeight * 1.2) return;   /* only while it's near view */
      vel += Math.max(-0.12, Math.min(0.12, dy * 0.004));
      if (!raf) raf = requestAnimationFrame(step);
    }, { passive: true });
  }
})();
