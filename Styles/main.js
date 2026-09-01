/* ============================================================
   pobv.dev — behavior
   Command palette · running system diagram · reveals
   No dependencies. Reduced-motion aware.
   ============================================================ */
(function () {
  "use strict";
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- masthead stuck state ---------- */
  var masthead = document.getElementById("masthead");
  var onScroll = function () {
    if (masthead) masthead.classList.toggle("is-stuck", window.scrollY > 8);
  };
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  /* ---------- reveal on view ---------- */
  var reveals = Array.prototype.slice.call(document.querySelectorAll(".reveal"));
  if (reduce || !("IntersectionObserver" in window)) {
    reveals.forEach(function (el) { el.classList.add("is-in"); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); }
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.12 });
    reveals.forEach(function (el) { io.observe(el); });
  }

  /* ============================================================
     RUNNING SYSTEM DIAGRAM
     ============================================================ */
  var svg = document.getElementById("sysSvg");
  if (svg) {
    // packets ride real edge paths for honest routing
    var flows = [
      { el: "#p1", path: "#e-ab", dur: 2600, off: 0.0 },
      { el: "#p2", path: "#e-bd", dur: 1500, off: 0.4 },
      { el: "#p3", path: "#e-ac", dur: 2800, off: 0.6 },
      { el: "#p4", path: "#e-ae", dur: 2000, off: 0.15 } // hot path
    ].map(function (f) {
      return {
        dot: svg.querySelector(f.el),
        path: svg.querySelector(f.path),
        dur: f.dur,
        off: f.off
      };
    }).filter(function (f) { return f.dot && f.path; });

    function place(f, t) {
      var len = f.path.getTotalLength();
      var p = f.path.getPointAtLength(((t % 1) + 1) % 1 * len);
      f.dot.setAttribute("cx", p.x.toFixed(1));
      f.dot.setAttribute("cy", p.y.toFixed(1));
    }

    if (reduce) {
      // freeze packets at a readable point along each edge; no motion
      flows.forEach(function (f) { place(f, 0.5); });
    } else {
      var start = null;
      function tick(ts) {
        if (start === null) start = ts;
        var elapsed = ts - start;
        flows.forEach(function (f) {
          place(f, f.off + elapsed / f.dur);
        });
        raf = requestAnimationFrame(tick);
      }
      var raf = requestAnimationFrame(tick);
      // pause when tab hidden to save cycles
      document.addEventListener("visibilitychange", function () {
        if (document.hidden) { cancelAnimationFrame(raf); }
        else { start = null; raf = requestAnimationFrame(tick); }
      });
    }

    /* session clock — honest page-session timer, not production */
    var clockEl = document.getElementById("sysClock");
    if (clockEl && !reduce) {
      var t0 = Date.now();
      setInterval(function () {
        var s = Math.floor((Date.now() - t0) / 1000);
        var mm = String(Math.floor(s / 60)).padStart(2, "0");
        var ss = String(s % 60).padStart(2, "0");
        clockEl.textContent = "session · 00:" + mm + ":" + ss;
      }, 1000);
    }

    /* edge metric count-up as an entrance to the stated figure */
    var edgeMetric = document.getElementById("edgeMetric");
    if (edgeMetric && !reduce && "IntersectionObserver" in window) {
      var counted = false;
      var mio = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting && !counted) {
            counted = true;
            var from = 0, to = 10, t = 0, steps = 34;
            var iv = setInterval(function () {
              t++;
              var v = Math.round(from + (to - from) * (1 - Math.pow(1 - t / steps, 3)));
              edgeMetric.textContent = v + "M+/day";
              if (t >= steps) { clearInterval(iv); edgeMetric.textContent = "10M+/day"; }
            }, 26);
          }
        });
      }, { threshold: 0.5 });
      mio.observe(svg);
    }
  }

  /* ============================================================
     COMMAND PALETTE (⌘K)
     ============================================================ */
  var ic = {
    section: '<svg viewBox="0 0 24 24"><path d="M4 6h16M4 12h16M4 18h10"/></svg>',
    doc: '<svg viewBox="0 0 24 24"><path d="M14 3v5h5"/><path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/></svg>',
    globe: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18"/></svg>',
    mail: '<svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></svg>',
    pin: '<svg viewBox="0 0 24 24"><path d="M12 21s-7-6.3-7-11a7 7 0 0 1 14 0c0 4.7-7 11-7 11z"/><circle cx="12" cy="10" r="2.5"/></svg>',
    heart: '<svg viewBox="0 0 24 24"><path d="M20.8 5.6a5 5 0 0 0-7.1 0L12 7.3l-1.7-1.7a5 5 0 1 0-7.1 7.1l1.7 1.7L12 21l7.1-7.1 1.7-1.7a5 5 0 0 0 0-7.1z"/></svg>',
    link: '<svg viewBox="0 0 24 24"><path d="M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1"/><path d="M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1"/></svg>'
  };
  var ITEMS = [
    { g: "Sections", label: "Overview", sub: "Who I am", addr: "§1", href: "#overview", icon: ic.section, kw: "about bio story kindness" },
    { g: "Sections", label: "Changelog", sub: "Where I've worked", addr: "§2", href: "#changelog", icon: ic.section, kw: "experience work jobs history automox datasite target" },
    { g: "Sections", label: "Capabilities", sub: "What I work with", addr: "§3", href: "#capabilities", icon: ic.section, kw: "skills stack java kotlin kubernetes" },
    { g: "Sections", label: "Contact", sub: "Let's build something", addr: "§4", href: "#contact", icon: ic.mail, kw: "email hire reach out open to" },
    { g: "Pages", label: "Résumé (PDF)", sub: "Full history", addr: "/resume", href: "resume.pdf", ext: true, icon: ic.doc, kw: "cv download pdf" },
    { g: "Off the clock", label: "Life List", sub: "Things I want to do", addr: "/life", href: "life.html", icon: ic.heart, kw: "bucket personal goals" },
    { g: "Off the clock", label: "Thailand Recs", sub: "Where to go & eat", addr: "/thailand", href: "thailand.html", icon: ic.pin, kw: "travel food bangkok" },
    { g: "Off the clock", label: "NYC Recs", sub: "My New York", addr: "/nyc", href: "nyc.html", icon: ic.pin, kw: "travel food new york city" },
    { g: "Off the clock", label: "Singapore Itinerary", sub: "4-day plan", addr: "/singapore", href: "singapore.html", icon: ic.pin, kw: "travel food itinerary trip asia marina bay gardens" },
    { g: "Find me", label: "Email", sub: "PobVuti@gmail.com", addr: "mailto", href: "mailto:PobVuti@gmail.com", icon: ic.mail, kw: "contact hello" },
    { g: "Find me", label: "LinkedIn", sub: "in/vutisat", addr: "↗", href: "https://www.linkedin.com/in/vutisat/", ext: true, icon: ic.link, kw: "social" },
    { g: "Find me", label: "GitHub", sub: "@vutisat", addr: "↗", href: "https://www.github.com/vutisat", ext: true, icon: ic.link, kw: "social code" },
    { g: "Find me", label: "Twitter / X", sub: "@pob_v", addr: "↗", href: "https://twitter.com/pob_v", ext: true, icon: ic.link, kw: "social" }
  ];

  var cmdk = document.getElementById("cmdk");
  var input = document.getElementById("cmdkInput");
  var list = document.getElementById("cmdkList");
  var btn = document.getElementById("cmdkBtn");
  var activeIdx = 0, filtered = [];
  if (!cmdk || !input || !list) return; // no palette on sub-pages

  function render(q) {
    q = (q || "").trim().toLowerCase();
    filtered = ITEMS.filter(function (it) {
      if (!q) return true;
      return (it.label + " " + it.sub + " " + it.g + " " + it.kw + " " + it.addr).toLowerCase().indexOf(q) !== -1;
    });
    activeIdx = 0;
    if (!filtered.length) {
      list.innerHTML = '<div class="cmdk__empty">No matches — try “work”, “travel”, or “email”.</div>';
      return;
    }
    var html = "", lastG = null;
    filtered.forEach(function (it, i) {
      if (it.g !== lastG) { html += '<div class="cmdk__group">' + it.g + "</div>"; lastG = it.g; }
      html += '<div class="cmdk__item" role="option" data-i="' + i + '">' +
        '<span class="ico">' + it.icon + "</span>" +
        '<span class="txt"><b>' + it.label + "</b><small>" + it.sub + "</small></span>" +
        '<span class="addr">' + it.addr + "</span></div>";
    });
    list.innerHTML = html;
    markActive();
  }
  function markActive() {
    var nodes = list.querySelectorAll(".cmdk__item");
    nodes.forEach(function (n) {
      var on = +n.getAttribute("data-i") === activeIdx;
      n.classList.toggle("is-active", on);
      if (on) n.scrollIntoView({ block: "nearest" });
    });
  }
  function go(it) {
    if (!it) return;
    close();
    if (it.ext) { window.open(it.href, "_blank", "noopener"); }
    else if (it.href.charAt(0) === "#") {
      var t = document.querySelector(it.href);
      if (t) t.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
      history.replaceState(null, "", it.href);
    } else { window.location.href = it.href; }
  }
  function open() {
    render("");
    cmdk.classList.add("is-open");
    document.body.style.overflow = "hidden";
    input.value = "";
    setTimeout(function () { input.focus(); }, 20);
  }
  function close() {
    cmdk.classList.remove("is-open");
    document.body.style.overflow = "";
  }
  function isOpen() { return cmdk.classList.contains("is-open"); }

  if (btn) btn.addEventListener("click", open);
  cmdk.addEventListener("click", function (e) {
    if (e.target.hasAttribute("data-close")) close();
    var item = e.target.closest(".cmdk__item");
    if (item) go(filtered[+item.getAttribute("data-i")]);
  });
  input.addEventListener("input", function () { render(input.value); });

  document.addEventListener("keydown", function (e) {
    var meta = e.metaKey || e.ctrlKey;
    if (meta && (e.key === "k" || e.key === "K")) { e.preventDefault(); isOpen() ? close() : open(); return; }
    if (!isOpen()) {
      if (e.key === "/" && !/^(INPUT|TEXTAREA)$/.test(document.activeElement.tagName)) { e.preventDefault(); open(); }
      return;
    }
    if (e.key === "Escape") { e.preventDefault(); close(); }
    else if (e.key === "ArrowDown") { e.preventDefault(); activeIdx = Math.min(activeIdx + 1, filtered.length - 1); markActive(); }
    else if (e.key === "ArrowUp") { e.preventDefault(); activeIdx = Math.max(activeIdx - 1, 0); markActive(); }
    else if (e.key === "Enter") { e.preventDefault(); go(filtered[activeIdx]); }
  });
})();
