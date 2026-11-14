// YU/GROW language switcher.
// English lives in the pages themselves. Other languages live in /i18n/<lang>.json and are
// only downloaded when a visitor picks that language. Edit the text, keep the keys.
// Any key missing from a language falls back to English.
(function () {
  const T = {
 "en": {
  "gp.t": "You made it!",
  "gp.d": "Your free growth plan is one form away.",
  "gp.d2": "Your free growth plan is one click away.",
  "js.error2": "We couldn't send your request automatically.",
  "js.mailto": "Send it by email instead →",
  "js.sending": "Sending…",
  "js.thanks": "Thanks! We will be in touch within one business day.",
  "js.error": "Something went wrong. Please email hello@yugrowagency.com."
 }
};
  const LANGS = ["en", "bs", "de", "es"];
  const VERSION = (document.currentScript && document.currentScript.src.split("v=")[1]) || "";

  // Capture the English text straight from the page so it never needs duplicating here.
  document.querySelectorAll('[data-i18n]').forEach(el => {
    if (!(el.dataset.i18n in T.en)) T.en[el.dataset.i18n] = el.innerHTML;
  });
  const page = document.body.dataset.page || 'home';
  const md = document.querySelector('meta[name="description"]');
  T.en['meta.' + page + '.title'] = document.title;
  if (md) T.en['meta.' + page + '.desc'] = md.getAttribute('content');

  let current = 'en';
  const t = key => (T[current] && T[current][key]) || T.en[key] || key;

  // fetch a language's translations on demand, then apply them
  const loading = {};
  function load(lang) {
    if (T[lang]) return Promise.resolve();
    if (!loading[lang]) loading[lang] = fetch('/preview/i18n/' + lang + '.json?v=' + VERSION)
      .then(r => r.json()).then(d => { T[lang] = d; }).catch(() => {});
    return loading[lang];
  }
  let wanted = 'en';
  function setLang(lang) {
    if (!LANGS.includes(lang)) lang = 'en';
    wanted = lang;
    if (T[lang]) return apply(lang);
    load(lang).then(() => { if (wanted === lang) apply(T[lang] ? lang : 'en'); });
  }

  function apply(lang) {
    if (!T[lang]) lang = 'en';
    current = lang;
    document.documentElement.lang = lang;
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const v = t(el.dataset.i18n);
      if (el.innerHTML !== v) el.innerHTML = v;
    });
    document.title = t('meta.' + page + '.title');
    if (md) md.setAttribute('content', t('meta.' + page + '.desc'));
    const y = document.getElementById('year');
    if (y) y.textContent = new Date().getFullYear();
    document.getElementById('langCurrent').textContent = lang.toUpperCase();
    const arrow = document.querySelector('.gp-arrow');
    if (arrow) { const l = t(document.getElementById('leadForm') ? 'gp.d' : 'gp.d2'); arrow.setAttribute('aria-label', l); arrow.title = l; }
    document.querySelectorAll('[data-lang]').forEach(b => b.setAttribute('aria-checked', String(b.dataset.lang === lang)));
  }

  function initialLang() {
    const fromUrl = new URLSearchParams(location.search).get('lang');
    if (LANGS.includes(fromUrl)) return fromUrl;
    try { const saved = localStorage.getItem('yugrow-lang'); if (LANGS.includes(saved)) return saved; } catch (e) {}
    for (const l of navigator.languages || [navigator.language || 'en']) {
      const code = l.slice(0, 2).toLowerCase();
      if (code === 'hr' || code === 'sr') return 'bs';
      if (LANGS.includes(code)) return code;
    }
    return 'en';
  }

  // Dropdown
  const wrap = document.getElementById('lang');
  const btn = document.getElementById('langBtn');
  const close = () => { wrap.classList.remove('open'); btn.setAttribute('aria-expanded', 'false'); };
  btn.addEventListener('click', e => {
    e.stopPropagation();
    const open = wrap.classList.toggle('open');
    btn.setAttribute('aria-expanded', String(open));
  });
  wrap.querySelectorAll('[data-lang]').forEach(b => b.addEventListener('click', () => {
    setLang(b.dataset.lang);
    if (window.track) window.track('language_change', { language: b.dataset.lang });
    try { localStorage.setItem('yugrow-lang', b.dataset.lang); } catch (e) {}
    close();
    btn.focus();
  }));
  document.addEventListener('click', e => { if (!wrap.contains(e.target)) close(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });

  window.t = t;
  apply('en');
  const first = initialLang();
  if (first !== 'en') setLang(first);
})();
