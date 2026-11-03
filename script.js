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
const revealTargets = document.querySelectorAll('.section-head, .card, .case, .quote, .steps li, .panel, .ai-list li, .faq details, .form, .stat');
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

// Contact form: emails each lead via FormSubmit (formsubmit.co) without leaving the page.
const form = document.getElementById('leadForm');
const note = document.getElementById('formNote');
form.addEventListener('submit', async e => {
  e.preventDefault();
  const btn = form.querySelector('button');
  btn.disabled = true;
  btn.textContent = t('js.sending');
  try {
    const res = await fetch(form.action, { method: 'POST', body: new FormData(form), headers: { Accept: 'application/json' } });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || String(data.success) !== 'true') throw new Error(data.message);
    form.reset();
    note.textContent = t('js.thanks');
    note.classList.add('ok');
  } catch {
    note.textContent = t('js.error');
  } finally {
    btn.disabled = false;
    btn.textContent = t('form.submit');
  }
});

// Logo always scrolls back to the very top (and closes the mobile menu)
document.querySelectorAll('a.logo').forEach(a => a.addEventListener('click', e => {
  e.preventDefault();
  nav.classList.remove('open');
  toggle.setAttribute('aria-expanded', 'false');
  window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
  history.replaceState(null, '', location.pathname + location.search);
}));
