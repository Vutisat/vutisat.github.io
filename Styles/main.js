/* ============================================
   PORTFOLIO JS – POB VUTISALCHAVAKUL
   ============================================ */

// Enable JS-gated animations — must happen before any reveal logic
document.documentElement.classList.remove('no-js');
document.documentElement.classList.add('js-loaded');

// ---------- NAV SCROLL EFFECT ----------
const nav = document.getElementById('nav');
window.addEventListener('scroll', () => {
  nav.classList.toggle('scrolled', window.scrollY > 40);
}, { passive: true });

// ---------- MOBILE MENU ----------
const toggle = document.getElementById('navToggle');
const links  = document.getElementById('navLinks');
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
  'Senior Software Engineer',
  'Technology Leader',
  'Passionate Learner',
  'Full-Stack Engineer',
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
