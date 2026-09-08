/* =============================================================================
   Lab.flowField  ·  "Flowing silk / streamlines"
   -----------------------------------------------------------------------------
   Thousands of particles advect along a value-noise flow field, leaving fading
   trails so the motion reads as flowing silk / wind. The cursor repels nearby
   particles so the stream parts around your hand.

   Standalone: no dependencies, no build step. Vanilla Canvas 2D.
   Usage:   Lab.flowField(canvasEl, { count, scale, speed, color });
   Returns: { reset, resize, destroy }

   KNOBS (opts):
     count  particle count            (default 1100)   // raise for denser silk
     scale  noise zoom                 (default 0.0016) // smaller = broader swirls
     speed  px/sec travel              (default 46)
     color  stroke color              (default '#2136E0' brand blue)
     fade   paper color for trails    (default '#FAFAF7')
   Perf: auto-pauses when scrolled off-screen; honors prefers-reduced-motion.
   ============================================================================= */
window.Lab = window.Lab || {};
window.Lab.flowField = function (canvas, opts) {
  opts = opts || {};
  var ctx = canvas.getContext("2d");
  var dpr = Math.min(2, Math.max(1, window.devicePixelRatio || 1));
  var reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

  var COUNT = opts.count || 1100;
  var SCALE = opts.scale || 0.0016;
  var SPEED = opts.speed || 46;
  var COLOR = opts.color || "#2136E0";
  var PAPER = opts.fade || "#FAFAF7";

  var W = 0, H = 0, ps = [];

  function fitClear() {
    var r = canvas.getBoundingClientRect();
    W = r.width; H = r.height;
    canvas.width = W * dpr; canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = PAPER; ctx.fillRect(0, 0, W, H);
  }
  function seed() {
    ps.length = 0;
    for (var i = 0; i < COUNT; i++)
      ps.push({ x: Math.random() * W, y: Math.random() * H, px: 0, py: 0, life: Math.random() * 220 });
  }

  /* value noise ------------------------------------------------------------ */
  function hash(x, y) { var n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453; return n - Math.floor(n); }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function noise(x, y) {
    var xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
    var u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
    return lerp(lerp(hash(xi, yi), hash(xi + 1, yi), u),
                lerp(hash(xi, yi + 1), hash(xi + 1, yi + 1), u), v);
  }

  /* pointer ---------------------------------------------------------------- */
  var mx = -1e5, my = -1e5;
  function move(e) { var r = canvas.getBoundingClientRect(); mx = e.clientX - r.left; my = e.clientY - r.top; }
  function leave() { mx = my = -1e5; }
  canvas.addEventListener("pointermove", move);
  canvas.addEventListener("pointerleave", leave);

  var t = 0;
  function step(dt) {
    t += dt;
    ctx.fillStyle = "rgba(250,250,247,0.055)";       // fade previous frame -> trails
    ctx.fillRect(0, 0, W, H);
    ctx.lineWidth = 1;
    ctx.strokeStyle = "rgba(33,54,224,0.30)";
    ctx.beginPath();
    for (var i = 0; i < ps.length; i++) {
      var p = ps[i];
      var ang = noise(p.x * SCALE, p.y * SCALE + t * 0.05) * 6.2832 * 2;
      var vx = Math.cos(ang), vy = Math.sin(ang);
      var dx = p.x - mx, dy = p.y - my, d2 = dx * dx + dy * dy;
      if (d2 < 14000) { var d = Math.sqrt(d2) || 1, f = (1 - d / 118) * 3.2; vx += dx / d * f; vy += dy / d * f; }
      p.px = p.x; p.py = p.y;
      p.x += vx * SPEED * dt; p.y += vy * SPEED * dt; p.life -= dt * 60;
      if (p.x < 0 || p.x > W || p.y < 0 || p.y > H || p.life < 0) {
        p.x = Math.random() * W; p.y = Math.random() * H; p.life = 120 + Math.random() * 160;
        continue;
      }
      ctx.moveTo(p.px, p.py); ctx.lineTo(p.x, p.y);
    }
    ctx.stroke();
  }

  function staticDraw() {                              // reduced-motion: one still field
    for (var n = 0; n < 60; n++) step(1 / 60);
  }

  /* run loop (visible only) ------------------------------------------------ */
  fitClear(); seed();
  var raf = 0, vis = true, last = performance.now(), io;
  function loop(now) { var dt = Math.min(0.05, (now - last) / 1000); last = now; if (vis) step(dt); raf = requestAnimationFrame(loop); }
  if (reduce) { staticDraw(); }
  else {
    if ("IntersectionObserver" in window) {
      io = new IntersectionObserver(function (es) { vis = es[0].isIntersecting; }, { threshold: 0.02 });
      io.observe(canvas);
    }
    raf = requestAnimationFrame(loop);
  }
  function onResize() { fitClear(); seed(); if (reduce) staticDraw(); }
  window.addEventListener("resize", onResize);

  return {
    reset: onResize,
    resize: onResize,
    destroy: function () {
      cancelAnimationFrame(raf); if (io) io.disconnect();
      window.removeEventListener("resize", onResize);
      canvas.removeEventListener("pointermove", move);
      canvas.removeEventListener("pointerleave", leave);
    }
  };
};
