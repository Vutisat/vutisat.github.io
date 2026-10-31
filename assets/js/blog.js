/* The Notebook — blog.html (the row of memo books) and post.html (one open)
   Posts are Markdown files in posts/, listed in blog-posts.js. No build
   step: the index draws itself from the list, and the reader fetches the
   Markdown and renders it with the small converter below. */
(function () {
  "use strict";
  var MONTHS = "January February March April May June July August September October November December".split(" ");
  var COVERS = ["kraft", "blue", "red", "green"];
  function esc(t) {
    return String(t == null ? "" : t).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function stamp(d) {
    var p = String(d || "").split("-");
    if (p.length < 3) return esc(d || "");
    return +p[2] + " " + MONTHS[+p[1] - 1].slice(0, 3).toUpperCase() + " " + p[0];
  }
  function longDate(d) {
    var p = String(d || "").split("-");
    return p.length < 3 ? esc(d || "") : +p[2] + " " + MONTHS[+p[1] - 1] + " " + p[0];
  }
  var posts = (window.POSTS || []).filter(function (p) { return p && /^[a-z0-9-]+$/i.test(p.slug || "") && p.title; })
    .sort(function (a, b) { return String(b.date).localeCompare(String(a.date)); });
  var listed = posts.filter(function (p) { return !p.draft; });
  function cover(p) { return COVERS.indexOf(p.cover) >= 0 ? p.cover : "kraft"; }

  /* ---- index: the row of memo books ------------------------------------ */
  var books = document.getElementById("books");
  if (books) {
    if (!listed.length) {
      books.innerHTML = '<p class="nojs">No entries yet. Add one to blog-posts.js.</p>';
    } else {
      books.innerHTML = '<ol class="row">' + listed.map(function (p, i) {
        return '<li class="row__item" style="--i:' + i + '"><a class="book book--' + cover(p) + '" href="post.html?p=' + encodeURIComponent(p.slug) + '">' +
          '<span class="book__title">' + esc(p.title) + '</span>' +
          '<span class="book__stamp">' + stamp(p.date) + '<small>' + esc(p.place || "") + '</small></span>' +
          '</a><p class="row__summary">' + esc(p.summary || "") + '</p></li>';
      }).join("") + '</ol>';
    }
  }

  /* ---- reader: one memo book, open ------------------------------------- */
  var entry = document.getElementById("entry");
  if (!entry) return;
  var page = entry.querySelector(".open__page"), coverEl = entry.querySelector(".open__cover");
  var slug = new URLSearchParams(location.search).get("p") || "";
  var post = posts.filter(function (p) { return p.slug === slug; })[0];
  if (!post) {
    page.innerHTML = '<h1 class="open__title">This page is blank</h1><p>There\'s no entry called &ldquo;' + esc(slug) + '&rdquo;. <a href="blog.html">See all entries</a>.</p>';
    return;
  }
  document.title = post.title + " · The Notebook";
  var md = document.querySelector('meta[name="description"]');
  if (md && post.summary) md.setAttribute("content", post.summary);
  coverEl.className = "open__cover book book--" + cover(post);
  coverEl.innerHTML = '<span class="book__title">' + esc(post.title) + '</span>' +
    '<span class="book__stamp">' + stamp(post.date) + '<small>' + esc(post.place || "") + '</small></span>';

  var head = '<header class="open__head"><p class="open__stamp"><time datetime="' + esc(post.date) + '">' + longDate(post.date) + '</time>' +
    (post.place ? '<span>' + esc(post.place) + '</span>' : "") + '</p><h1 class="open__title">' + esc(post.title) + '</h1></header>';

  fetch("posts/" + encodeURIComponent(post.slug) + ".md", { cache: "no-cache" })
    .then(function (r) { if (!r.ok) throw new Error(r.status); return r.text(); })
    .then(function (text) { page.innerHTML = head + '<div class="prose">' + markdown(text) + '</div>'; })
    .catch(function () {
      page.innerHTML = head + '<p class="open__error">Couldn\'t open posts/' + esc(post.slug) + '.md. If you\'re reading this from a file on your computer, run a local server (python3 -m http.server) and try again.</p>';
    });

  /* next and previous books */
  var i = posts.indexOf(post), newer = listed[listed.indexOf(post) - 1], older = listed[listed.indexOf(post) + 1];
  var flip = document.getElementById("flip");
  if (flip && listed.indexOf(post) >= 0) {
    flip.innerHTML = (older ? '<a class="flip__link" href="post.html?p=' + encodeURIComponent(older.slug) + '">Older entry: <cite>' + esc(older.title) + '</cite></a>' : "<span></span>") +
      (newer ? '<a class="flip__link flip__link--newer" href="post.html?p=' + encodeURIComponent(newer.slug) + '">Newer entry: <cite>' + esc(newer.title) + '</cite></a>' : "");
  }

  /* ---- a small Markdown converter -------------------------------------
     Paragraphs, #-### headings, - and 1. lists, > quotes, ``` code, ---,
     **bold**, *italic*, `code`, [links](url), ![images](url), and
     {{note: ...}} margin notes. Raw HTML is escaped, never trusted. */
  function inline(s) {
    var notes = [];
    s = s.replace(/\{\{note:\s*([\s\S]*?)\}\}/g, function (_, n) { notes.push(n); return "\u0000" + (notes.length - 1) + "\u0000"; });
    s = esc(s);
    var codes = [];
    s = s.replace(/`([^`]+)`/g, function (_, c) { codes.push(c); return "\u0001" + (codes.length - 1) + "\u0001"; });
    s = s.replace(/!\[([^\]]*)\]\(([^)\s]+)\)/g, function (_, alt, src) {
      return /^(https?:|assets\/|posts\/|\/)/.test(src) ? '<img src="' + src + '" alt="' + alt + '" loading="lazy">' : alt;
    });
    s = s.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, function (_, t, href) {
      return /^(https?:|mailto:|#|[a-z0-9-]+\.html|\/)/i.test(href) ? '<a href="' + href + '">' + t + "</a>" : t;
    });
    s = s.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>").replace(/(^|[^*])\*([^*]+)\*/g, "$1<em>$2</em>");
    s = s.replace(/\u0001(\d+)\u0001/g, function (_, n) { return "<code>" + codes[+n] + "</code>"; });
    s = s.replace(/\u0000(\d+)\u0000/g, function (_, n) {
      return '<span class="note-mark" aria-hidden="true">*</span><span class="note" role="note">' + inline(notes[+n]) + "</span>";
    });
    return s;
  }
  function markdown(text) {
    var lines = String(text).replace(/\r\n?/g, "\n").split("\n"), out = [], i = 0;
    while (i < lines.length) {
      var l = lines[i];
      if (/^```/.test(l)) {
        var code = []; i++;
        while (i < lines.length && !/^```/.test(lines[i])) code.push(lines[i++]);
        i++; out.push("<pre><code>" + esc(code.join("\n")) + "</code></pre>"); continue;
      }
      if (/^\s*$/.test(l)) { i++; continue; }
      var h = /^(#{1,3})\s+(.*)$/.exec(l);
      if (h) { var lv = h[1].length + 1; out.push("<h" + lv + ">" + inline(h[2]) + "</h" + lv + ">"); i++; continue; }
      if (/^(-{3,}|\*{3,})\s*$/.test(l)) { out.push("<hr>"); i++; continue; }
      if (/^>\s?/.test(l)) {
        var q = [];
        while (i < lines.length && /^>\s?/.test(lines[i])) q.push(lines[i++].replace(/^>\s?/, ""));
        out.push("<blockquote><p>" + inline(q.join(" ")) + "</p></blockquote>"); continue;
      }
      if (/^\s*[-*]\s+/.test(l) || /^\s*\d+\.\s+/.test(l)) {
        var ordered = /^\s*\d+\./.test(l), items = [];
        while (i < lines.length && (ordered ? /^\s*\d+\.\s+/ : /^\s*[-*]\s+/).test(lines[i])) items.push(lines[i++].replace(/^\s*([-*]|\d+\.)\s+/, ""));
        var tag = ordered ? "ol" : "ul";
        out.push("<" + tag + ">" + items.map(function (it) { return "<li>" + inline(it) + "</li>"; }).join("") + "</" + tag + ">"); continue;
      }
      var para = [];
      while (i < lines.length && !/^\s*$/.test(lines[i]) && !/^(#{1,3}\s|```|>|\s*[-*]\s|\s*\d+\.\s|-{3,}\s*$)/.test(lines[i])) para.push(lines[i++]);
      if (!para.length) { para.push(lines[i++]); }
      var html = inline(para.join(" "));
      out.push(/^<img [^>]+>$/.test(html) ? '<figure>' + html + '</figure>' : "<p>" + html + "</p>");
    }
    return out.join("\n");
  }
})();
