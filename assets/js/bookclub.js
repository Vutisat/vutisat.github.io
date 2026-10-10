/* East of Eden Reading Club — page script.
   Month calendars, .ics downloads, kickoff countdown, scroll reveal.
   Vanilla, no dependencies. Every feature guards its own elements. */
(function () {
  'use strict';

  // One source of truth for the schedule. Times are UTC.
  // Zoom calls: Thursdays 7:30–8:45 pm America/New_York (EST until Mar 14, 2027).
  // Finale: Sat Apr 3, 6:30–9:30 pm EDT.
  var EVENTS = [
    { date: '2027-01-14', kind: 'zoom',   start: '20270115T003000Z', end: '20270115T011500Z',
      title: 'East of Eden club: Kickoff (Zoom)',
      desc: 'Meet everyone, go over ground rules, and start reading. Read chapters 1-11 by Jan 28.' },
    { date: '2027-01-28', kind: 'zoom',   start: '20270129T003000Z', end: '20270129T014500Z',
      title: 'East of Eden club: Part One (Zoom)',
      desc: 'Discuss chapters 1-11. Next up: chapters 12-22.' },
    { date: '2027-02-11', kind: 'zoom',   start: '20270212T003000Z', end: '20270212T014500Z',
      title: 'East of Eden club: Part Two (Zoom)',
      desc: 'Discuss chapters 12-22. Next up: chapters 23-33.' },
    { date: '2027-02-25', kind: 'zoom',   start: '20270226T003000Z', end: '20270226T014500Z',
      title: 'East of Eden club: Part Three (Zoom)',
      desc: 'Discuss chapters 23-33. Next up: chapters 34-44.' },
    { date: '2027-03-11', kind: 'zoom',   start: '20270312T003000Z', end: '20270312T014500Z',
      title: 'East of Eden club: Part Four, first half (Zoom)',
      desc: 'Discuss chapters 34-44. Then finish the book (chapters 45-55) before dinner on Apr 3.' },
    { date: '2027-04-03', kind: 'finale', start: '20270403T223000Z', end: '20270404T013000Z',
      title: 'East of Eden club: Finale dinner (NYC)',
      desc: 'In-person dinner in Manhattan. The whole book is fair game. Place to be decided together.' }
  ];
  var READ_START = '2027-01-14', READ_END = '2027-04-03';
  var URL = /^https?:$/.test(location.protocol) ? location.origin + location.pathname : 'https://pobv.dev/bookclub.html';

  /* ---------- .ics ---------- */
  function esc(s) { return s.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,'); }
  function vevent(e, i) {
    return [
      'BEGIN:VEVENT',
      'UID:eoe-club-2027-' + i + '@pobv.dev',
      'DTSTAMP:20261010T000000Z',
      'DTSTART:' + e.start,
      'DTEND:' + e.end,
      'SUMMARY:' + esc(e.title),
      'DESCRIPTION:' + esc(e.desc + ' Details: ' + URL),
      'LOCATION:' + (e.kind === 'finale' ? 'New York\\, NY (TBD)' : 'Zoom (link to follow)'),
      'URL:' + URL,
      'END:VEVENT'
    ].join('\r\n');
  }
  function download(list, name) {
    var body = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//pobv.dev//East of Eden Club//EN', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH']
      .concat(list.map(function (x) { return vevent(x.e, x.i); }))
      .concat(['END:VCALENDAR']).join('\r\n');
    var blob = new Blob([body], { type: 'text/calendar;charset=utf-8' });
    var a = document.createElement('a');
    a.href = URL_.createObjectURL(blob);
    a.download = name;
    document.body.appendChild(a);
    a.click();
    setTimeout(function () { URL_.revokeObjectURL(a.href); a.remove(); }, 500);
  }
  var URL_ = window.URL || window.webkitURL;
  document.querySelectorAll('[data-ics]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var v = btn.getAttribute('data-ics');
      if (v === 'all') {
        download(EVENTS.map(function (e, i) { return { e: e, i: i }; }), 'east-of-eden-club.ics');
      } else {
        var i = parseInt(v, 10);
        if (EVENTS[i]) download([{ e: EVENTS[i], i: i }], 'east-of-eden-club-' + EVENTS[i].date + '.ics');
      }
    });
  });

  /* ---------- month calendars ---------- */
  var months = document.getElementById('months');
  if (months) {
    var byDate = {};
    EVENTS.forEach(function (e) { byDate[e.date] = e; });
    var NAMES = ['January', 'February', 'March', 'April'];
    var pad = function (n) { return (n < 10 ? '0' : '') + n; };
    var html = '';
    for (var m = 0; m < 4; m++) {
      var first = new Date(2027, m, 1).getDay();
      var days = new Date(2027, m + 1, 0).getDate();
      var count = 0;
      var cells = '';
      ['S', 'M', 'T', 'W', 'T', 'F', 'S'].forEach(function (d) { cells += '<span class="month__dow" aria-hidden="true">' + d + '</span>'; });
      for (var b = 0; b < first; b++) cells += '<span class="day day--empty"></span>';
      for (var d = 1; d <= days; d++) {
        var iso = '2027-' + pad(m + 1) + '-' + pad(d);
        var e = byDate[iso];
        var cls = 'day';
        var label = NAMES[m] + ' ' + d;
        if (iso >= READ_START && iso <= READ_END) cls += ' day--read';
        if (e) { cls += ' day--' + e.kind; count++; label += ': ' + e.title.replace('East of Eden club: ', ''); }
        cells += '<span class="' + cls + '"' + (e ? ' title="' + label + '"' : '') + ' aria-label="' + label + '">' + d + '</span>';
      }
      html += '<div class="month"><h3>' + NAMES[m] + ' <small>' + count + (count === 1 ? ' meetup' : ' meetups') + '</small></h3>' +
              '<div class="month__grid">' + cells + '</div></div>';
    }
    months.innerHTML = html;
  }

  /* ---------- countdown ---------- */
  var cd = document.getElementById('countdown');
  if (cd) {
    var kick = new Date(2027, 0, 14);
    var today = new Date(); today.setHours(0, 0, 0, 0);
    var n = Math.round((kick - today) / 86400000);
    if (n > 1) { cd.innerHTML = '<b>' + n + '</b> days until we start reading.'; cd.hidden = false; }
    else if (n === 1) { cd.innerHTML = 'We start reading <b>tomorrow</b>.'; cd.hidden = false; }
    else if (n === 0) { cd.innerHTML = 'We start reading <b>tonight</b>.'; cd.hidden = false; }
  }

  /* ---------- reveal ---------- */
  var reveals = document.querySelectorAll('.reveal');
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce || !('IntersectionObserver' in window)) {
    reveals.forEach(function (el) { el.classList.add('in'); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } });
    }, { threshold: 0.15 });
    reveals.forEach(function (el) { io.observe(el); });
  }
})();
