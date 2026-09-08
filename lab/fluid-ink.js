/* =============================================================================
   Lab.fluidInk  ·  "Fluid ink"
   -----------------------------------------------------------------------------
   A real fluid simulation (Jos Stam, "Stable Fluids") on a coarse grid. Drag
   the cursor to inject velocity + dye; luminous blue ink swirls, advects, and
   slowly fades back to paper. The grid is rendered small and scaled up with
   smoothing, which gives the soft inky diffusion for free.

   Standalone: no dependencies. Vanilla Canvas 2D + typed arrays.
   Usage:   Lab.fluidInk(canvasEl, { n, dt, fade, ink });
   Returns: { splash, reset, resize, destroy }

   KNOBS (opts):
     n     grid resolution            (default 64)     // 48 cheaper, 96 richer/heavier
     dt    sim timestep               (default 0.14)
     fade  dye persistence 0..1       (default 0.985)   // higher = ink lingers
     force cursor velocity gain       (default 0.9)
     amt   dye injected per move      (default 90)
     ink   ink color                  (default [33,54,224] brand blue)
     paper background color           (default [250,250,247])
   Perf: solver is O(n^2 * iters); auto-pauses off-screen; reduced-motion draws
         a single seeded splash and stops.
   ============================================================================= */
window.Lab = window.Lab || {};
window.Lab.fluidInk = function (canvas, opts) {
  opts = opts || {};
  var ctx = canvas.getContext("2d");
  var dpr = Math.min(2, Math.max(1, window.devicePixelRatio || 1));
  var reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

  var N = opts.n || 64;
  var DT = opts.dt || 0.14;
  var FADE = opts.fade || 0.985;
  var FORCE = opts.force || 0.9;
  var AMT = opts.amt || 90;
  var INK = opts.ink || [33, 54, 224];
  var PAPER = opts.paper || [250, 250, 247];
  var ITER = 4, VISC = 0.00001, DIFF = 0.00001;

  var sz = (N + 2) * (N + 2);
  var u = new Float32Array(sz), v = new Float32Array(sz), u0 = new Float32Array(sz), v0 = new Float32Array(sz);
  var dens = new Float32Array(sz), dens0 = new Float32Array(sz);
  var W = 0, H = 0;

  function IX(i, j) { return i + (N + 2) * j; }

  function set_bnd(b, x) {
    for (var i = 1; i <= N; i++) {
      x[IX(0, i)]     = b === 1 ? -x[IX(1, i)] : x[IX(1, i)];
      x[IX(N + 1, i)] = b === 1 ? -x[IX(N, i)] : x[IX(N, i)];
      x[IX(i, 0)]     = b === 2 ? -x[IX(i, 1)] : x[IX(i, 1)];
      x[IX(i, N + 1)] = b === 2 ? -x[IX(i, N)] : x[IX(i, N)];
    }
    x[IX(0, 0)]         = 0.5 * (x[IX(1, 0)] + x[IX(0, 1)]);
    x[IX(0, N + 1)]     = 0.5 * (x[IX(1, N + 1)] + x[IX(0, N)]);
    x[IX(N + 1, 0)]     = 0.5 * (x[IX(N, 0)] + x[IX(N + 1, 1)]);
    x[IX(N + 1, N + 1)] = 0.5 * (x[IX(N, N + 1)] + x[IX(N + 1, N)]);
  }
  function lin_solve(b, x, x0, a, c) {
    for (var k = 0; k < ITER; k++) {
      for (var j = 1; j <= N; j++) for (var i = 1; i <= N; i++)
        x[IX(i, j)] = (x0[IX(i, j)] + a * (x[IX(i - 1, j)] + x[IX(i + 1, j)] + x[IX(i, j - 1)] + x[IX(i, j + 1)])) / c;
      set_bnd(b, x);
    }
  }
  function diffuse(b, x, x0, d) { var a = DT * d * N * N; lin_solve(b, x, x0, a, 1 + 4 * a); }
  function advect(b, d, d0, uu, vv) {
    var dt0 = DT * N;
    for (var j = 1; j <= N; j++) for (var i = 1; i <= N; i++) {
      var x = i - dt0 * uu[IX(i, j)], y = j - dt0 * vv[IX(i, j)];
      if (x < 0.5) x = 0.5; if (x > N + 0.5) x = N + 0.5; var i0 = Math.floor(x), i1 = i0 + 1;
      if (y < 0.5) y = 0.5; if (y > N + 0.5) y = N + 0.5; var j0 = Math.floor(y), j1 = j0 + 1;
      var s1 = x - i0, s0 = 1 - s1, t1 = y - j0, t0 = 1 - t1;
      d[IX(i, j)] = s0 * (t0 * d0[IX(i0, j0)] + t1 * d0[IX(i0, j1)]) + s1 * (t0 * d0[IX(i1, j0)] + t1 * d0[IX(i1, j1)]);
    }
    set_bnd(b, d);
  }
  function project(uu, vv, p, div) {
    for (var j = 1; j <= N; j++) for (var i = 1; i <= N; i++) {
      div[IX(i, j)] = -0.5 * (uu[IX(i + 1, j)] - uu[IX(i - 1, j)] + vv[IX(i, j + 1)] - vv[IX(i, j - 1)]) / N;
      p[IX(i, j)] = 0;
    }
    set_bnd(0, div); set_bnd(0, p); lin_solve(0, p, div, 1, 4);
    for (var j2 = 1; j2 <= N; j2++) for (var i2 = 1; i2 <= N; i2++) {
      uu[IX(i2, j2)] -= 0.5 * N * (p[IX(i2 + 1, j2)] - p[IX(i2 - 1, j2)]);
      vv[IX(i2, j2)] -= 0.5 * N * (p[IX(i2, j2 + 1)] - p[IX(i2, j2 - 1)]);
    }
    set_bnd(1, uu); set_bnd(2, vv);
  }
  function addSource(x, s) { for (var i = 0; i < sz; i++) x[i] += DT * s[i]; }
  var tmp;
  function vel_step() {
    addSource(u, u0); addSource(v, v0);
    tmp = u0; u0 = u; u = tmp; diffuse(1, u, u0, VISC);
    tmp = v0; v0 = v; v = tmp; diffuse(2, v, v0, VISC);
    project(u, v, u0, v0);
    tmp = u0; u0 = u; u = tmp; tmp = v0; v0 = v; v = tmp;
    advect(1, u, u0, u0, v0); advect(2, v, v0, u0, v0);
    project(u, v, u0, v0);
  }
  function dens_step() {
    addSource(dens, dens0);
    tmp = dens0; dens0 = dens; dens = tmp; diffuse(0, dens, dens0, DIFF);
    tmp = dens0; dens0 = dens; dens = tmp; advect(0, dens, dens0, u, v);
  }

  /* offscreen render target (interior N x N, scaled up smoothed) ------------ */
  var off = document.createElement("canvas"); off.width = N; off.height = N;
  var octx = off.getContext("2d");
  var img = octx.createImageData(N, N);

  function fit() {
    var r = canvas.getBoundingClientRect();
    W = r.width; H = r.height;
    canvas.width = W * dpr; canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.imageSmoothingEnabled = true;
  }

  function render() {
    var data = img.data;
    for (var j = 1; j <= N; j++) for (var i = 1; i <= N; i++) {
      var d = dens[IX(i, j)];
      var t = 1 - Math.exp(-d * 2.6); if (t < 0) t = 0; if (t > 1) t = 1;
      var o = ((j - 1) * N + (i - 1)) * 4;
      data[o]     = PAPER[0] + (INK[0] - PAPER[0]) * t;
      data[o + 1] = PAPER[1] + (INK[1] - PAPER[1]) * t;
      data[o + 2] = PAPER[2] + (INK[2] - PAPER[2]) * t;
      data[o + 3] = 255;
    }
    octx.putImageData(img, 0, 0);
    ctx.drawImage(off, 0, 0, N, N, 0, 0, W, H);
  }

  function step() {
    for (var i = 0; i < sz; i++) { u0[i] = 0; v0[i] = 0; dens0[i] = 0; }
    applyForces();
    vel_step(); dens_step();
    for (var k = 0; k < sz; k++) dens[k] *= FADE;
    render();
  }

  /* pointer ---------------------------------------------------------------- */
  var pmx = null, pmy = null, cmx = null, cmy = null, down = false;
  function toCell(px, py) { return { i: Math.min(N, Math.max(1, Math.floor(px / W * N) + 1)), j: Math.min(N, Math.max(1, Math.floor(py / H * N) + 1)) }; }
  function move(e) { var r = canvas.getBoundingClientRect(); cmx = e.clientX - r.left; cmy = e.clientY - r.top; }
  function leave() { cmx = cmy = pmx = pmy = null; }
  canvas.addEventListener("pointermove", move);
  canvas.addEventListener("pointerdown", function (e) { down = true; move(e); });
  window.addEventListener("pointerup", function () { down = false; });
  canvas.addEventListener("pointerleave", leave);

  function applyForces() {
    if (cmx == null) { return; }
    if (pmx == null) { pmx = cmx; pmy = cmy; }
    var c = toCell(cmx, cmy);
    var dx = (cmx - pmx), dy = (cmy - pmy);
    // brush 3x3
    for (var bj = -1; bj <= 1; bj++) for (var bi = -1; bi <= 1; bi++) {
      var i = c.i + bi, j = c.j + bj; if (i < 1 || i > N || j < 1 || j > N) continue;
      var fall = bi === 0 && bj === 0 ? 1 : 0.5;
      dens0[IX(i, j)] += AMT * fall;
      u0[IX(i, j)] += dx * FORCE;
      v0[IX(i, j)] += dy * FORCE;
    }
    pmx = cmx; pmy = cmy;
  }

  function seedSplash() {
    // a few dye blobs + swirl, for reduced-motion / initial life
    function blob(ci, cj, amt, vx, vy) {
      for (var bj = -3; bj <= 3; bj++) for (var bi = -3; bi <= 3; bi++) {
        var i = ci + bi, j = cj + bj; if (i < 1 || i > N || j < 1 || j > N) continue;
        var f = Math.max(0, 1 - Math.hypot(bi, bj) / 4);
        dens[IX(i, j)] += amt * f; u[IX(i, j)] += vx * f; v[IX(i, j)] += vy * f;
      }
    }
    blob(N * 0.35 | 0, N * 0.45 | 0, 1.6, 2.5, -1.0);
    blob(N * 0.62 | 0, N * 0.55 | 0, 1.4, -2.0, 1.2);
    for (var s = 0; s < 24; s++) { vel_step(); dens_step(); for (var k = 0; k < sz; k++) dens[k] *= FADE; }
    render();
  }

  fit();
  var raf = 0, vis = true, io;
  function loop() { if (vis) step(); raf = requestAnimationFrame(loop); }
  if (reduce) { seedSplash(); }
  else {
    seedSplash();
    if ("IntersectionObserver" in window) {
      io = new IntersectionObserver(function (es) { vis = es[0].isIntersecting; }, { threshold: 0.02 });
      io.observe(canvas);
    }
    raf = requestAnimationFrame(loop);
  }
  function onResize() { fit(); render(); }
  window.addEventListener("resize", onResize);

  return {
    splash: seedSplash, reset: function () { for (var i = 0; i < sz; i++) { dens[i] = u[i] = v[i] = 0; } seedSplash(); },
    resize: onResize,
    destroy: function () {
      cancelAnimationFrame(raf); if (io) io.disconnect();
      window.removeEventListener("resize", onResize);
      canvas.removeEventListener("pointermove", move);
      canvas.removeEventListener("pointerleave", leave);
    }
  };
};
