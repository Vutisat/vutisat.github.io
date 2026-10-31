/* Uses — uses.html
   Hangs every item from uses-data.js on the pegboard: a hook, the painted
   outline (the shadow board), and the tool over it. Picking a tool (hover,
   focus or tap) writes its note on the index card clipped to its zone. */
(function () {
  "use strict";
  var board = document.getElementById("board");
  var zones = (window.USES || []).filter(function (z) { return z && z.name; });
  if (!board) return;
  function esc(t) {
    return String(t == null ? "" : t).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  /* silhouettes, 100x100, painted flat like a real shadow board */
  var SHAPES = {
    laptop: "M18 22h64a4 4 0 0 1 4 4v38H14V26a4 4 0 0 1 4-4zM6 68h88l-7 10H13z",
    monitor: "M8 12h84a4 4 0 0 1 4 4v50a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4V16a4 4 0 0 1 4-4zM44 70h12v14H44zM28 84h44v6H28z",
    keyboard: "M4 34h92a4 4 0 0 1 4 4v24a4 4 0 0 1-4 4H4a4 4 0 0 1-4-4V38a4 4 0 0 1 4-4z",
    mouse: "M50 10c14 0 24 10 24 26v28c0 16-10 26-24 26S26 80 26 64V36c0-16 10-26 24-26z",
    headphones: "M16 58v-8a34 34 0 0 1 68 0v8h-8v-8a26 26 0 0 0-52 0v8zM10 56h18v34H10a6 6 0 0 1-6-6V62a6 6 0 0 1 6-6zM72 56h18a6 6 0 0 1 6 6v22a6 6 0 0 1-6 6H72z",
    lamp: "M20 86h44v6H20zM36 86l8-40 30-22 6 7-28 21-8 34zM62 8h22l8 24H56z",
    mug: "M14 22h54v48a16 16 0 0 1-16 16H30a16 16 0 0 1-16-16zM68 32h8a13 13 0 0 1 0 26h-8v-9h8a4 4 0 0 0 0-8h-8z",
    kettle: "M26 42h44l8 44H18zM38 30h20v12H38zM44 22h8v8h-8zM70 52c10-2 14-16 24-24l3 4c-9 9-12 24-25 27z",
    grinder: "M36 6h28v10H36zM26 16h48l-6 22H32zM28 38h44v50H28zM64 20h22v6H64z",
    notebook: "M24 8h50a6 6 0 0 1 6 6v72a6 6 0 0 1-6 6H24zM14 16h10v8H14zM14 36h10v8H14zM14 56h10v8H14zM14 76h10v8H14z",
    pen: "M45 4h10v66l-5 16-5-16z",
    backpack: "M34 16a16 16 0 0 1 32 0v4h6a10 10 0 0 1 10 10v56a8 8 0 0 1-8 8H26a8 8 0 0 1-8-8V30a10 10 0 0 1 10-10h6zm8 4h16v-4a8 8 0 0 0-16 0z",
    phone: "M32 6h36a6 6 0 0 1 6 6v76a6 6 0 0 1-6 6H32a6 6 0 0 1-6-6V12a6 6 0 0 1 6-6z",
    editor: "M10 14h80a6 6 0 0 1 6 6v60a6 6 0 0 1-6 6H10a6 6 0 0 1-6-6V20a6 6 0 0 1 6-6zm2 16v48h76V30zm6 8h34v6H18zm8 12h40v6H26zm0 12h28v6H26zm-8 12h22v6H18z",
    terminal: "M10 14h80a6 6 0 0 1 6 6v60a6 6 0 0 1-6 6H10a6 6 0 0 1-6-6V20a6 6 0 0 1 6-6zm2 16v48h76V30zm8 12l5-5 15 13-15 13-5-5 9-8zm26 16h24v7H46z",
    notes: "M20 14h60a6 6 0 0 1 6 6v68a6 6 0 0 1-6 6H20a6 6 0 0 1-6-6V20a6 6 0 0 1 6-6zM26 4h6v18h-6zM40 4h6v18h-6zM54 4h6v18h-6zM68 4h6v18h-6zM24 36h52v5H24zm0 14h52v5H24zm0 14h38v5H24z",
    calendar: "M12 18h76a6 6 0 0 1 6 6v62a6 6 0 0 1-6 6H12a6 6 0 0 1-6-6V24a6 6 0 0 1 6-6zM26 8h8v18h-8zM66 8h8v18h-8zM14 38v46h72V38zm8 8h12v10H22zm22 0h12v10H44zm22 0h12v10H66zM22 66h12v10H22zm22 0h12v10H44z"
  };
  var SELF_HUNG = { backpack: 1, notes: 1, calendar: 1, grinder: 1 };
  var COLOURS = ["blue", "red", "yellow", "green"];

  board.innerHTML = zones.map(function (z) {
    var c = COLOURS.indexOf(z.colour) >= 0 ? z.colour : "blue";
    var items = (z.items || []).map(function (it) {
      var d = SHAPES[it.shape] || SHAPES.notes;
      return '<li class="hang' + (it.out ? " is-out" : "") + (SELF_HUNG[it.shape] ? " hang--self" : "") + '">' +
        '<button type="button" class="tool" data-name="' + esc(it.name) + '" data-note="' + esc(it.note || "") + '" data-out="' + (it.out ? 1 : 0) + '" aria-describedby="card-' + esc(z.name.replace(/\W+/g, "")) + '">' +
        '<span class="hook" aria-hidden="true"></span>' +
        '<svg class="tool__art" viewBox="0 0 100 100" aria-hidden="true">' +
        '<path class="tool__outline" d="' + d + '" fill-rule="evenodd"/>' +
        (it.out ? "" : '<g class="tool__body"><path d="' + d + '" fill-rule="evenodd"/></g>') +
        '</svg>' +
        '<span class="tape">' + (it.out ? "Out: " : "") + esc(it.name) + '</span>' +
        '</button></li>';
    }).join("");
    var cid = "card-" + esc(z.name.replace(/\W+/g, ""));
    return '<section class="zone zone--' + c + (z.wide ? " zone--wide" : "") + '" aria-label="' + esc(z.name) + '">' +
      '<h2 class="tape tape--zone">' + esc(z.name) + '</h2>' +
      '<ul class="hangs">' + items + '</ul>' +
      '<p class="card" id="' + cid + '" aria-live="polite"><span class="card__hint">Pick something off the board.</span></p>' +
      '</section>';
  }).join("");

  function show(btn) {
    var zone = btn.closest(".zone"), card = zone && zone.querySelector(".card");
    if (!card) return;
    zone.querySelectorAll(".tool.is-picked").forEach(function (t) { t.classList.remove("is-picked"); });
    btn.classList.add("is-picked");
    card.innerHTML = '<b class="card__name">' + esc(btn.getAttribute("data-name")) + '</b>' +
      '<span class="card__note">' + esc(btn.getAttribute("data-note")) + '</span>';
  }
  /* every card opens on a real note: the tool that's out, or the first one */
  board.querySelectorAll(".zone").forEach(function (z) {
    var first = z.querySelector('.tool[data-out="1"]') || z.querySelector(".tool");
    if (first) show(first);
  });
  board.addEventListener("pointerover", function (e) { var b = e.target.closest(".tool"); if (b) show(b); });
  board.addEventListener("focusin", function (e) { var b = e.target.closest(".tool"); if (b) show(b); });
  board.addEventListener("click", function (e) { var b = e.target.closest(".tool"); if (b) show(b); });

  var sample = document.getElementById("sample");
  if (sample) sample.hidden = !!window.USES_ARE_REAL;
})();
