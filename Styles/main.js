/* ============================================
   PORTFOLIO JS – POB VUTISALCHAVAKUL
   ============================================ */

// ---------- NAV SCROLL EFFECT ----------
const nav = document.getElementById('nav');
if (nav) {
  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 40);
  }, { passive: true });
}

// ---------- MOBILE MENU ----------
const toggle = document.getElementById('navToggle');
const links  = document.getElementById('navLinks');
if (toggle && links) {
  toggle.addEventListener('click', () => {
    toggle.classList.toggle('open');
    links.classList.toggle('open');
  });
  links.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => {
      toggle.classList.remove('open');
      links.classList.remove('open');
    });
  });
}

// ---------- REVEAL ON SCROLL ----------
const revealEls = document.querySelectorAll('.reveal');
const io = new IntersectionObserver(
  (entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('is-visible');
        io.unobserve(e.target);
      }
    });
  },
  { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
);
revealEls.forEach(el => io.observe(el));

// Immediately reveal hero elements (above fold)
document.querySelectorAll('.hero .reveal').forEach(el => {
  el.classList.add('is-visible');
});

// ---------- TYPING EFFECT ----------
const titleEl = document.getElementById('heroTitle');
const titles  = [
  'Technology Leader',
  'Staff Software Engineer',
  'Passionate Learner',
  'Agentic Systems Architect',
];
let tIdx = 0, cIdx = 0, deleting = false;
const MIN_WAIT = 80, DEL_WAIT = 45, PAUSE = 2200;

function type() {
  const current = titles[tIdx];
  if (deleting) {
    titleEl.textContent = current.slice(0, --cIdx);
    if (cIdx === 0) {
      deleting = false;
      tIdx = (tIdx + 1) % titles.length;
      setTimeout(type, 400);
      return;
    }
    setTimeout(type, DEL_WAIT);
  } else {
    titleEl.textContent = current.slice(0, ++cIdx);
    if (cIdx === current.length) {
      deleting = true;
      setTimeout(type, PAUSE);
      return;
    }
    setTimeout(type, MIN_WAIT + Math.random() * 40);
  }
}
setTimeout(type, 1000);

// ---------- SECRET MENU (click logo 5x) ----------
(function () {
  const logo   = document.getElementById('navLogo');
  const secret = document.getElementById('navSecret');
  if (!logo || !secret) return;

  const REQUIRED = 5;
  const RESET_MS = 1500;
  let clicks = 0, timer = null;

  logo.addEventListener('click', (e) => {
    // only intercept when building up the combo, not a normal nav click
    if (secret.classList.contains('is-open')) {
      secret.classList.remove('is-open');
      clicks = 0;
      return;
    }

    clicks++;
    clearTimeout(timer);

    logo.classList.remove('unlocking');
    void logo.offsetWidth; // reflow to restart animation
    logo.classList.add('unlocking');

    if (clicks >= REQUIRED) {
      e.preventDefault();
      clicks = 0;
      secret.classList.add('is-open');
    } else {
      timer = setTimeout(() => { clicks = 0; }, RESET_MS);
    }
  });

  // close when clicking outside
  document.addEventListener('click', (e) => {
    if (!logo.contains(e.target) && !secret.contains(e.target)) {
      secret.classList.remove('is-open');
    }
  });
})();
