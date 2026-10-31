/* Recipes from Home — recipes.html
   Stocks the shelf and prints a label for each recipe in recipes-data.js.
   Every recipe gets the same four stages, at the same scale. */
(function () {
  "use strict";
  var recipes = (window.RECIPES || []).filter(function (r) { return r && r.id && (r.en || r.th); });
  var row = document.getElementById("shelf-row"), plates = document.getElementById("plates");
  function esc(t) {
    return String(t == null ? "" : t).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  var COLOURS = ["red", "green", "gold", "blue", "black"];
  function colour(r) { return COLOURS.indexOf(r.colour) >= 0 ? r.colour : "red"; }
  function heat(n) {
    n = Math.max(0, Math.min(3, +n || 0));
    var s = '<span class="heat" aria-label="' + (n ? n + " of 3 chillies hot" : "not spicy") + '">';
    for (var i = 0; i < 3; i++) s += '<svg class="heat__c' + (i < n ? " is-on" : "") + '" aria-hidden="true"><use href="#chilli"/></svg>';
    return s + "</span>";
  }
  var STAGES = [
    ["gather", "Gather", "เตรียม"],
    ["prepare", "Prepare", "หั่น โขลก"],
    ["cook", "Cook", "ปรุง"],
    ["serve", "Serve", "เสิร์ฟ"]
  ];

  if (row) {
    row.innerHTML = recipes.map(function (r, i) {
      return '<li class="tin" style="--i:' + i + '"><a class="label label--' + colour(r) + ' label--tin" href="#' + esc(r.id) + '">' +
        '<span class="label__th" lang="th">' + esc(r.th) + '</span>' +
        '<span class="label__en">' + esc(r.en) + '</span>' +
        '<span class="label__meta">' + heat(r.heat) + '<span>' + esc(r.time) + '</span></span></a></li>';
    }).join("");
  }

  if (plates) {
    plates.innerHTML = recipes.map(function (r) {
      var stages = STAGES.map(function (st, i) {
        var items = (r[st[0]] || []);
        var tag = st[0] === "gather" ? "ul" : "ol";
        return '<div class="stage"><h3 class="stage__h"><span class="stage__n">' + (i + 1) + '</span>' +
          '<span class="stage__en">' + st[1] + '</span><span class="stage__th" lang="th">' + st[2] + '</span></h3>' +
          '<' + tag + ' class="stage__list">' + items.map(function (x) { return "<li>" + esc(x) + "</li>"; }).join("") + '</' + tag + '></div>';
      }).join("");
      return '<article class="plate" id="' + esc(r.id) + '" aria-labelledby="h-' + esc(r.id) + '">' +
        '<header class="label label--' + colour(r) + ' label--plate">' +
        '<h2 id="h-' + esc(r.id) + '" class="label__name"><span class="label__th" lang="th">' + esc(r.th) + '</span>' +
        '<span class="label__en">' + esc(r.en) + '</span></h2>' +
        '<p class="label__meta">' + heat(r.heat) + '<span>Serves ' + esc(r.serves) + '</span><span>' + esc(r.time) + '</span></p>' +
        '</header>' +
        '<div class="stages label--' + colour(r) + '">' + stages + '</div>' +
        (r.note ? '<p class="plate__note">' + esc(r.note) + '</p>' : "") +
        '<a class="plate__back" href="#shelf">Back to the shelf</a>' +
        '</article>';
    }).join("");
  }

  var sample = document.getElementById("sample");
  if (sample) sample.hidden = !!window.RECIPES_ARE_REAL;
})();
