// Mobile menu
const toggle = document.getElementById('navToggle');
const nav = document.getElementById('nav');
toggle.addEventListener('click', () => {
  const open = nav.classList.toggle('open');
  toggle.setAttribute('aria-expanded', open);
});
nav.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
  nav.classList.remove('open');
  toggle.setAttribute('aria-expanded', 'false');
}));

// Footer year
document.getElementById('year').textContent = new Date().getFullYear();

// Animated number counters
const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Background video: show the still image instead for visitors who prefer reduced motion
const heroVideo = document.getElementById('heroVideo');
if (heroVideo && reduce) { heroVideo.removeAttribute('autoplay'); heroVideo.pause(); }
function runCounter(el) {
  const target = parseFloat(el.dataset.count);
  const decimals = parseInt(el.dataset.decimals || '0', 10);
  if (reduce) { el.textContent = target.toFixed(decimals); return; }
  const start = performance.now();
  const dur = 1400;
  const tick = now => {
    const p = Math.min((now - start) / dur, 1);
    const eased = 1 - Math.pow(1 - p, 3);
    el.textContent = (target * eased).toFixed(decimals);
    if (p < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

// Reveal-on-scroll + counters
const revealTargets = document.querySelectorAll('.section-head, .card, .case, .quote, .steps li, .panel, .ai-list li, .faq details, .form, .stat, .founder, .pillars li');
revealTargets.forEach(el => el.classList.add('reveal'));

if ('IntersectionObserver' in window) {
  const io = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('in');
      entry.target.querySelectorAll?.('[data-count]').forEach(runCounter);
      if (entry.target.dataset.count) runCounter(entry.target);
      io.unobserve(entry.target);
    });
  }, { threshold: 0.15 });
  revealTargets.forEach(el => io.observe(el));
  document.querySelectorAll('.hero-card [data-count]').forEach(el => io.observe(el));
} else {
  revealTargets.forEach(el => el.classList.add('in'));
  document.querySelectorAll('[data-count]').forEach(runCounter);
}

// Contact form: a regular form post to FormSubmit, which then redirects to the thank-you page.
// (A normal post works everywhere, unlike background requests that some iPhone privacy
// settings and in-app browsers block.)
const form = document.getElementById('leadForm');
const note = document.getElementById('formNote');
const btn = form.querySelector('button[type="submit"]');
let sending = false;
form.addEventListener('submit', e => {
  e.preventDefault();
  if (sending) return;
  sending = true;
  const lang = document.documentElement.lang;
  document.getElementById('formNext').value =
    'https://yugrowagency.com/thank-you.html' + (lang && lang !== 'en' ? '?lang=' + lang : '');
  // Spam check that never drops a real lead: if the hidden field was filled, flag the email subject
  const hp = document.getElementById('hpCheck');
  if (hp.value) document.getElementById('formSubject').value = '[Check: possible spam] New lead from yugrowagency.com';
  hp.disabled = true; // never sent
  btn.disabled = true;
  btn.textContent = t('js.sending');
  const send = () => HTMLFormElement.prototype.submit.call(form);
  if (window.track) window.track('generate_lead', { form: 'contact', interest: form.interest.value }, send);
  else send();
});
// If the visitor comes back with the browser's Back button, reset the button
window.addEventListener('pageshow', () => {
  sending = false;
  btn.disabled = false;
  btn.textContent = t('form.submit');
  document.getElementById('hpCheck').disabled = false;
});

// Logo always scrolls back to the very top (and closes the mobile menu)
document.querySelectorAll('a.logo').forEach(a => a.addEventListener('click', e => {
  e.preventDefault();
  nav.classList.remove('open');
  toggle.setAttribute('aria-expanded', 'false');
  window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
  history.replaceState(null, '', location.pathname + location.search);
}));
