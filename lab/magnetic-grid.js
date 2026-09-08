/* =============================================================================
   Lab.magneticGrid  ·  "Magnetic / gooey field"
   -----------------------------------------------------------------------------
   A grid of dots connected by fine lines. The cursor is a gravity well: nearby
   dots slide toward it and swell, the mesh stretching like liquid metal, then
   spring back when you move away.

   Standalone: no dependencies. Vanilla Canvas 2D.
   Usage:   Lab.magneticGrid(canvasEl, { gap, range, pull, color });
   Returns: { reset, resize, destroy }

   KNOBS (opts):
     gap        px between dots              (default 34)
     range      px cursor influence radius   (default 160)
     pull       0..1 attraction strength     (default 0.42)
     color      lit dot + glow color         (default '#2136E0')
     restColor  idle dot color               (default 'rgba(19,19,22,0.32)')
     lineColor  mesh line color              (default 'rgba(19,19,22,0.10)')
     lines      draw connecting mesh         (default true)
     glow       lit dot shadow blur px       (default 14)
     restSize   idle dot radius              (default 1.6)
     hotSize    extra radius at cursor       (default 5.2)
     eventTarget element to track pointer on (default the canvas) -> pass a
                container when the canvas is a pointer-events:none background.
   Perf: auto-pauses off-screen; honors prefers-reduced-motion (static grid).
   ============================================================================= */
window.Lab = window.Lab || {};
window.Lab.magneticGrid = function (canvas, opts) {
  opts = opts || {};
  var ctx = canvas.getContext("2d");
  var dpr = Math.min(2, Math.max(1, window.devicePixelRatio || 1));
  var reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

  var GAP = opts.gap || 34;
  var RANGE = opts.range || 160;
  var PULL = opts.pull == null ? 0.42 : opts.pull;
  var COLOR = opts.color || "#2136E0";
  var REST = opts.restColor || "rgba(19,19,22,0.32)";
  var LINE = opts.lineColor || "rgba(19,19,22,0.10)";
  var LINES = opts.lines !== false;
  var GLOW = opts.glow == null ? 14 : opts.glow;
  var RSIZE = opts.restSize || 1.6;
  var HSIZE = opts.hotSize == null ? 5.2 : opts.hotSize;
  var target = opts.eventTarget || canvas;

  var W = 0, H = 0, cols = 0, rows = 0, dots = [];

  function build() {
    var r = canvas.getBoundingClientRect();
    W = r.width; H = r.height;
    canvas.width = W * dpr; canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    cols = Math.ceil(W / GAP) + 1;
    rows = Math.ceil(H / GAP) + 1;
    var ox = (W - (cols - 1) * GAP) / 2, oy = (H - (rows - 1) * GAP) / 2;
    dots.length = 0;
    for (var j = 0; j < rows; j++)
      for (var i = 0; i < cols; i++) {
        var bx = ox + i * GAP, by = oy + j * GAP;
        dots.push({ bx: bx, by: by, x: bx, y: by, vx: 0, vy: 0, s: RSIZE });
      }
  }

  var mx = -1e5, my = -1e5;
  function move(e) { var r = canvas.getBoundingClientRect(); mx = e.clientX - r.left; my = e.clientY - r.top; }
  function leave() { mx = my = -1e5; }
  target.addEventListener("pointermove", move);
  target.addEventListener("pointerleave", leave);

  function idx(i, j) { return j * cols + i; }

  function step() {
    ctx.clearRect(0, 0, W, H);
    // update
    for (var k = 0; k < dots.length; k++) {
      var d = dots[k];
      var dxp = mx - d.bx, dyp = my - d.by, dist = Math.hypot(dxp, dyp);
      var infl = dist < RANGE ? (1 - dist / RANGE) : 0;
      infl = infl * infl;                              // ease
      var tx = d.bx + dxp * infl * PULL;
      var ty = d.by + dyp * infl * PULL;
      d.vx = (d.vx + (tx - d.x) * 0.2) * 0.78;
      d.vy = (d.vy + (ty - d.y) * 0.2) * 0.78;
      d.x += d.vx; d.y += d.vy;
      d.s = RSIZE + infl * HSIZE;
      d.infl = infl;
    }
    // lines
    if (LINES) {
      ctx.strokeStyle = LINE;
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (var j = 0; j < rows; j++) for (var i = 0; i < cols; i++) {
        var a = dots[idx(i, j)];
        if (i < cols - 1) { var b = dots[idx(i + 1, j)]; ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); }
        if (j < rows - 1) { var c = dots[idx(i, j + 1)]; ctx.moveTo(a.x, a.y); ctx.lineTo(c.x, c.y); }
      }
      ctx.stroke();
    }
    // dots
    for (var m = 0; m < dots.length; m++) {
      var p = dots[m];
      var lit = p.infl || 0;
      ctx.fillStyle = lit > 0.02 ? COLOR : REST;
      if (lit > 0.02) { ctx.shadowColor = COLOR; ctx.shadowBlur = lit * GLOW; }
      ctx.beginPath(); ctx.arc(p.x, p.y, p.s, 0, 7); ctx.fill();
      ctx.shadowBlur = 0;
    }
  }

  build();
  var raf = 0, vis = true, io;
  function loop() { if (vis) step(); raf = requestAnimationFrame(loop); }
  if (reduce) { step(); }
  else {
    if ("IntersectionObserver" in window) {
      io = new IntersectionObserver(function (es) { vis = es[0].isIntersecting; }, { threshold: 0.02 });
      io.observe(canvas);
    }
    raf = requestAnimationFrame(loop);
  }
  function onResize() { build(); if (reduce) step(); }
  window.addEventListener("resize", onResize);

  return {
    reset: onResize, resize: onResize,
    destroy: function () {
      cancelAnimationFrame(raf); if (io) io.disconnect();
      window.removeEventListener("resize", onResize);
      target.removeEventListener("pointermove", move);
      target.removeEventListener("pointerleave", leave);
    }
  };
};
