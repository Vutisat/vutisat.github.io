/* =============================================================================
   Lab.physicsType  ·  "Physics type"
   -----------------------------------------------------------------------------
   Each letter of a word is a rigid body with gravity. Grab one and fling it;
   they tumble, collide (circle approximation), and settle into a pile. Call
   reset() to drop them again.

   Standalone: no dependencies. Vanilla Canvas 2D.
   Usage:   var h = Lab.physicsType(canvasEl, { text, size, color });  h.reset();
   Returns: { reset, resize, destroy }

   KNOBS (opts):
     text   string to drop            (default 'POB VUTISAT') // spaces skipped
     size   glyph px (auto-fits down)  (default 88)
     color  glyph fill                 (default '#131316' ink)
     accent every Nth glyph in accent  (default 3) -> brand blue
   Perf: honors prefers-reduced-motion (letters rest in a row, no simulation).
   ============================================================================= */
window.Lab = window.Lab || {};
window.Lab.physicsType = function (canvas, opts) {
  opts = opts || {};
  var ctx = canvas.getContext("2d");
  var dpr = Math.min(2, Math.max(1, window.devicePixelRatio || 1));
  var reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

  var TEXT = (opts.text || "POB VUTISAT").replace(/\s+/g, "");
  var SIZE = opts.size || 88;
  var INK = opts.color || "#131316";
  var ACCENT = "#2136E0";
  var EVERY = opts.accent || 3;

  var G = 1500, REST = 0.32, FRICT = 0.86, FLOORPAD = 6;
  var W = 0, H = 0, letters = [];

  function measure() {
    ctx.font = "800 " + SIZE + "px 'Hanken', system-ui, sans-serif";
  }
  function build() {
    var r = canvas.getBoundingClientRect();
    W = r.width; H = r.height;
    canvas.width = W * dpr; canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    // shrink glyphs on narrow canvases so the word fits comfortably
    SIZE = Math.min(opts.size || 88, Math.max(40, W / (TEXT.length * 0.72)));
    measure();
    letters.length = 0;
    for (var i = 0; i < TEXT.length; i++) {
      var w = ctx.measureText(TEXT[i]).width;
      var rad = Math.max(w, SIZE) * 0.46;
      letters.push({
        ch: TEXT[i], w: w, r: rad,
        x: 0, y: 0, vx: 0, vy: 0, a: 0, va: 0,
        accent: (i % EVERY === EVERY - 1)
      });
    }
    drop();
  }
  function drop() {
    for (var i = 0; i < letters.length; i++) {
      var L = letters[i];
      L.x = W * (0.12 + 0.76 * (i + 0.5) / letters.length) + (Math.random() - 0.5) * 20;
      L.y = -L.r - Math.random() * H * 0.6;
      L.vx = (Math.random() - 0.5) * 120;
      L.vy = Math.random() * 60;
      L.a = (Math.random() - 0.5) * 1.2;
      L.va = (Math.random() - 0.5) * 4;
    }
  }

  /* pointer: grab nearest letter, drag, release to throw -------------------- */
  var held = null, gx = 0, gy = 0, plx = 0, ply = 0, pt = 0;
  function pos(e) { var r = canvas.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; }
  function down(e) {
    var p = pos(e), best = null, bd = 1e9;
    for (var i = 0; i < letters.length; i++) {
      var L = letters[i], d = Math.hypot(L.x - p.x, L.y - p.y);
      if (d < L.r + 10 && d < bd) { bd = d; best = L; }
    }
    if (best) { held = best; gx = p.x - best.x; gy = p.y - best.y; plx = p.x; ply = p.y; pt = performance.now(); canvas.setPointerCapture && canvas.setPointerCapture(e.pointerId); }
  }
  function drag(e) {
    if (!held) return;
    var p = pos(e); held.x = p.x - gx; held.y = p.y - gy;
    var now = performance.now(), dt = Math.max(8, now - pt) / 1000;
    held.vx = (p.x - plx) / dt; held.vy = (p.y - ply) / dt;
    plx = p.x; ply = p.y; pt = now;
  }
  function up() { held = null; }
  canvas.addEventListener("pointerdown", down);
  canvas.addEventListener("pointermove", drag);
  canvas.addEventListener("pointerup", up);
  canvas.addEventListener("pointercancel", up);
  canvas.style.touchAction = "none";

  var CAP = 2600;
  function cap(L) { if (L.vx > CAP) L.vx = CAP; else if (L.vx < -CAP) L.vx = -CAP; if (L.vy > CAP) L.vy = CAP; else if (L.vy < -CAP) L.vy = -CAP; }
  function step(dt) {
    var floor = H - FLOORPAD;
    for (var i = 0; i < letters.length; i++) {
      var L = letters[i];
      if (L === held) continue;
      L.vy += G * dt;
      L.vx *= 0.99; L.va *= 0.98;                       // air drag / spin decay
      cap(L);
      L.x += L.vx * dt; L.y += L.vy * dt; L.a += L.va * dt;
      if (L.y + L.r > floor) { L.y = floor - L.r; if (L.vy > 0) L.vy *= -REST; L.vx *= FRICT; L.va *= 0.85; }
      if (L.y - L.r < 0)     { L.y = L.r;         if (L.vy < 0) L.vy *= -REST; } // ceiling: nothing escapes the top
      if (L.x - L.r < 0)     { L.x = L.r;         if (L.vx < 0) L.vx *= -REST; }
      if (L.x + L.r > W)     { L.x = W - L.r;     if (L.vx > 0) L.vx *= -REST; }
    }
    // pairwise circle collisions: soft positional separation + energy-safe velocity exchange
    for (var a = 0; a < letters.length; a++) for (var b = a + 1; b < letters.length; b++) {
      var A = letters[a], B = letters[b];
      var dx = B.x - A.x, dy = B.y - A.y, dist = Math.hypot(dx, dy) || 0.01, min = A.r + B.r;
      if (dist < min) {
        var nx = dx / dist, ny = dy / dist, corr = (min - dist) * 0.5;
        var aFix = A === held ? 0 : (B === held ? 1 : 0.5);
        var bFix = B === held ? 0 : (A === held ? 1 : 0.5);
        A.x -= nx * corr * aFix; A.y -= ny * corr * aFix;
        B.x += nx * corr * bFix; B.y += ny * corr * bFix;
        var vn = (B.vx - A.vx) * nx + (B.vy - A.vy) * ny;
        if (vn < 0) {                                    // approaching only -> no restitution, no energy gain
          var j = -vn / 2;
          if (A !== held) { A.vx -= j * nx; A.vy -= j * ny; }
          if (B !== held) { B.vx += j * nx; B.vy += j * ny; }
        }
      }
    }
    draw();
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    measure();
    for (var i = 0; i < letters.length; i++) {
      var L = letters[i];
      ctx.save();
      ctx.translate(L.x, L.y); ctx.rotate(L.a);
      ctx.fillStyle = L.accent ? ACCENT : INK;
      ctx.fillText(L.ch, 0, SIZE * 0.04);
      ctx.restore();
    }
    // floor hairline
    ctx.strokeStyle = "rgba(19,19,22,0.14)"; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(0, H - FLOORPAD + 0.5); ctx.lineTo(W, H - FLOORPAD + 0.5); ctx.stroke();
  }

  build();
  var raf = 0, vis = true, io, last = performance.now();
  function loop(now) { var dt = Math.min(0.033, (now - last) / 1000); last = now; if (vis) step(dt); raf = requestAnimationFrame(loop); }
  function restRow() {                                  // reduced-motion: settled row, no sim
    var floor = H - FLOORPAD;
    for (var i = 0; i < letters.length; i++) { var L = letters[i]; L.x = W * (0.12 + 0.76 * (i + 0.5) / letters.length); L.y = floor - L.r; L.a = 0; }
    draw();
  }
  if (reduce) { restRow(); }
  else {
    if ("IntersectionObserver" in window) {
      io = new IntersectionObserver(function (es) { vis = es[0].isIntersecting; }, { threshold: 0.02 });
      io.observe(canvas);
    }
    raf = requestAnimationFrame(loop);
  }
  function onResize() { build(); if (reduce) restRow(); }
  window.addEventListener("resize", onResize);

  return {
    reset: function () { if (reduce) { restRow(); return; } drop(); },
    resize: onResize,
    destroy: function () {
      cancelAnimationFrame(raf); if (io) io.disconnect();
      window.removeEventListener("resize", onResize);
      canvas.removeEventListener("pointerdown", down);
      canvas.removeEventListener("pointermove", drag);
      canvas.removeEventListener("pointerup", up);
      canvas.removeEventListener("pointercancel", up);
    }
  };
};
