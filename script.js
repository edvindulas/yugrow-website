const page = document.body.dataset.page || 'home';
const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Old one-page links (e.g. yugrowagency.com/#about) now live on their own pages
if (page === 'home') {
  const moved = { '#services': '/services/', '#process': '/how-it-works/', '#faq': '/how-it-works/#faq', '#results': '/results/', '#about': '/about/' };
  if (moved[location.hash]) location.replace(moved[location.hash] + location.search);
}

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

// Light / dark mode (choice remembered; dark is the default)
const themeBtn = document.getElementById('themeBtn');
function setTheme(theme, save) {
  document.documentElement.dataset.theme = theme;
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', theme === 'light' ? '#f4f6fc' : '#050b1a');
  if (themeBtn) themeBtn.setAttribute('aria-label', theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode');
  if (save) { try { localStorage.setItem('yugrow-theme', theme); } catch (e) {} }
}
setTheme(document.documentElement.dataset.theme === 'light' ? 'light' : 'dark', false);
if (themeBtn) themeBtn.addEventListener('click', () => {
  const next = document.documentElement.dataset.theme === 'light' ? 'dark' : 'light';
  setTheme(next, true);
  if (window.track) window.track('theme_change', { theme: next });
});

// Footer year
const year = document.getElementById('year');
if (year) year.textContent = new Date().getFullYear();

// Logo: on the homepage it smoothly scrolls back to the top; elsewhere it links home
if (page === 'home') {
  document.querySelectorAll('a.logo').forEach(a => a.addEventListener('click', e => {
    e.preventDefault();
    nav.classList.remove('open');
    toggle.setAttribute('aria-expanded', 'false');
    window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
    history.replaceState(null, '', location.pathname + location.search);
  }));
}

// Background video: show the still image instead for visitors who prefer reduced motion
const heroVideo = document.getElementById('heroVideo');
if (heroVideo && reduce) { heroVideo.removeAttribute('autoplay'); heroVideo.pause(); }
else if (heroVideo) {
  // Some phones block autoplay (e.g. iPhone Low Power Mode). Try to start it; if blocked, the still image stays.
  heroVideo.muted = true;
  const tryPlay = () => { const p = heroVideo.play(); if (p && p.catch) p.catch(() => {}); };
  tryPlay();
  document.addEventListener('touchstart', tryPlay, { once: true, passive: true });
  document.addEventListener('visibilitychange', () => { if (!document.hidden && heroVideo.paused) tryPlay(); });
}

// Animated number counters
function runCounter(el) {
  const target = parseFloat(el.dataset.count);
  const decimals = parseInt(el.dataset.decimals || '0', 10);
  if (reduce) { el.textContent = target.toFixed(decimals); return; }
  const start = performance.now();
  const dur = 2600;
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
  }, { threshold: 0.2, rootMargin: '0px 0px -18% 0px' });
  revealTargets.forEach(el => io.observe(el));
  document.querySelectorAll('.hero-card [data-count]').forEach(el => io.observe(el));
} else {
  revealTargets.forEach(el => el.classList.add('in'));
  document.querySelectorAll('[data-count]').forEach(runCounter);
}

// Contact form (homepage and contact page): sends the lead to Web3Forms, which emails it
// to hello@yugrowagency.com, then goes to the thank-you page. If the service can't be
// reached, visitors get a one-tap "send by email" link with everything they typed.
const form = document.getElementById('leadForm');
if (form) {
  const note = document.getElementById('formNote');
  const btn = form.querySelector('button[type="submit"]');
  let sending = false;

  const thankYouUrl = () => {
    const lang = document.documentElement.lang;
    return '/thank-you.html' + (lang && lang !== 'en' ? '?lang=' + lang : '');
  };

  form.addEventListener('submit', async e => {
    e.preventDefault();
    if (sending) return;
    sending = true;
    const fd = new FormData(form);
    const interest = form.interest.value;
    // Spam check that never drops a real lead: hidden field is never sent; if filled, the subject is flagged
    if (fd.get('hp_check')) fd.set('subject', '[Check: possible spam] New lead from yugrowagency.com');
    fd.delete('hp_check');
    fd.delete('redirect'); // only used if JavaScript is off
    fd.set('page', location.pathname);
    btn.disabled = true;
    btn.textContent = t('js.sending');
    note.classList.remove('ok');
    note.textContent = t('form.note');

    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 15000);
      const res = await fetch(form.action, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(Object.fromEntries(fd)),
        signal: controller.signal,
      });
      clearTimeout(timer);
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.success !== true) throw new Error(data.message || 'HTTP ' + res.status);
      note.textContent = t('js.thanks');
      note.classList.add('ok');
      const go = () => { location.href = thankYouUrl(); };
      if (window.track) window.track('generate_lead', { form: 'contact', interest, form_page: page }, go);
      else go();
    } catch (err) {
      const reason = err && err.name === 'AbortError' ? 'Timed out' : (err && err.message) || 'Network error';
      console.warn('Contact form failed:', reason);
      if (window.track) window.track('form_error', { reason: reason.slice(0, 100) });
      const lines = ['Name: ' + (fd.get('name') || ''), 'Email: ' + (fd.get('email') || ''), 'Phone: ' + (fd.get('phone') || ''),
        'Website: ' + (fd.get('website') || ''), 'Needs: ' + interest];
      const mail = document.createElement('a');
      mail.href = 'mailto:hello@yugrowagency.com?subject=' + encodeURIComponent('Free growth plan request') + '&body=' + encodeURIComponent(lines.join('\n'));
      mail.textContent = t('js.mailto');
      note.textContent = t('js.error2') + ' ';
      note.appendChild(mail);
      if (new URLSearchParams(location.search).has('debug')) {
        const d = document.createElement('small'); d.className = 'form-debug'; d.textContent = 'Details: ' + reason; note.appendChild(d);
      }
      sending = false;
      btn.disabled = false;
      btn.textContent = t('form.submit');
    }
  });

  // If the visitor comes back with the browser's Back button, reset the button
  window.addEventListener('pageshow', () => {
    sending = false;
    btn.disabled = false;
    btn.textContent = t('form.submit');
  });
}
