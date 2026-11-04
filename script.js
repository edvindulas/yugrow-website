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

// Contact form: sends the lead to Web3Forms (emails it to hello@yugrowagency.com),
// then goes to the thank-you page. If the service can't be reached, visitors get a
// one-tap "send by email" link with everything they typed, so no lead is ever lost.
const form = document.getElementById('leadForm');
const note = document.getElementById('formNote');
const btn = form.querySelector('button[type="submit"]');
let sending = false;

function thankYouUrl() {
  const lang = document.documentElement.lang;
  return 'thank-you.html' + (lang && lang !== 'en' ? '?lang=' + lang : '');
}

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
    if (window.track) window.track('generate_lead', { form: 'contact', interest }, go);
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

// Logo always scrolls back to the very top (and closes the mobile menu)
document.querySelectorAll('a.logo').forEach(a => a.addEventListener('click', e => {
  e.preventDefault();
  nav.classList.remove('open');
  toggle.setAttribute('aria-expanded', 'false');
  window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
  history.replaceState(null, '', location.pathname + location.search);
}));
