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
  /* the photo window printed on the label, like the dish shot on a packet;
     a recipe with no photo gets an emblem of its first Thai letter instead */
  function windowed(r, size) {
    if (r.photo) {
      return '<span class="label__photo label__photo--' + size + '"><img src="' + esc(r.photo) + '" alt="' + esc(size === "tin" ? "" : r.alt) +
        '" width="720" height="720" loading="lazy" decoding="async"></span>';
    }
    return '<span class="label__photo label__photo--' + size + ' label__photo--mark" aria-hidden="true"><span lang="th">' +
      esc((r.th || "").charAt(0)) + '</span></span>';
  }
  var STAGES = [
    ["gather", "Gather", "เตรียม"],
    ["prepare", "Prepare", "หั่น โขลก"],
    ["cook", "Cook", "ปรุง"],
    ["serve", "Serve", "เสิร์ฟ"]
  ];

  if (row) {
    row.innerHTML = recipes.map(function (r, i) {
      return '<li class="tin" style="--i:' + i + '"><a class="label label--' + colour(r) + ' label--tin" href="#' + esc(r.id) + '">' + windowed(r, "tin") +
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
        '<header class="label label--' + colour(r) + ' label--plate">' + windowed(r, "plate") +
        (r.photo ? '<span class="label__suggest">Serving suggestion · <span lang="th">ตัวอย่างการเสิร์ฟ</span></span>' : "") +
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

  /* every photo, credited */
  var credits = document.getElementById("credits");
  var shot = recipes.filter(function (r) { return r.photo && r.credit; });
  if (credits && shot.length) {
    credits.innerHTML = "Photos from Wikimedia Commons: " + shot.map(function (r) {
      var c = r.credit;
      return '<a href="' + esc(c.source) + '">' + esc(r.en) + '</a> by ' + esc(c.by) +
        (c.licenceUrl ? ' (<a href="' + esc(c.licenceUrl) + '">' + esc(c.licence) + '</a>)' : ' (' + esc(c.licence) + ')');
    }).join("; ") + ". Cropped to square.";
    credits.hidden = false;
  }

  var sample = document.getElementById("sample");
  if (sample) sample.hidden = !!window.RECIPES_ARE_REAL;
})();
