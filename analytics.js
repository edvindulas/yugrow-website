// Google Analytics 4 with a cookie consent banner (GDPR-friendly).
// Analytics only loads after the visitor clicks "Accept".
//
// TO TURN ON: replace G-XXXXXXXXXX below with your Measurement ID
// (Google Analytics > Admin > Data streams > your web stream).
(function () {
  const GA_ID = 'G-PYGB77Z40G';
  const KEY = 'yugrow-consent';
  const enabled = /^G-[A-Z0-9]{6,}$/.test(GA_ID) && GA_ID !== 'G-XXXXXXXXXX';

  let loaded = false;
  window.dataLayer = window.dataLayer || [];
  function gtag() { dataLayer.push(arguments); }

  function load() {
    if (loaded || !enabled) return;
    loaded = true;
    const s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_ID;
    document.head.appendChild(s);
    gtag('js', new Date());
    gtag('config', GA_ID, { anonymize_ip: true });
  }

  // Send a custom event (no-op until the visitor has accepted).
  // Optional callback runs once the event is sent (or right away if analytics is off).
  window.track = function (name, params, done) {
    if (!loaded) { if (done) done(); return; }
    let called = false;
    const finish = () => { if (!called) { called = true; if (done) done(); } };
    gtag('event', name, Object.assign({}, params, { event_callback: finish }));
    if (done) setTimeout(finish, 1200); // never hold the visitor up for long
  };

  const banner = document.getElementById('consent');
  const settings = document.getElementById('cookieSettings');
  if (!enabled || !banner) return;

  const get = () => { try { return localStorage.getItem(KEY); } catch (e) { return null; } };
  const set = v => { try { localStorage.setItem(KEY, v); } catch (e) {} };
  const show = () => { banner.hidden = false; };
  const hide = () => { banner.hidden = true; };

  settings.hidden = false;
  settings.addEventListener('click', show);
  document.getElementById('consentAccept').addEventListener('click', () => { set('granted'); hide(); load(); });
  document.getElementById('consentDecline').addEventListener('click', () => {
    set('denied'); hide();
    if (loaded) location.reload(); // stop tracking immediately if they change their mind
  });

  const choice = get();
  if (choice === 'granted') load();
  else if (choice !== 'denied') show();

  // Key conversions: CTA clicks (form submissions and language changes are sent from script.js / i18n.js)
  document.querySelectorAll('a[href="#contact"]').forEach(a => a.addEventListener('click', () =>
    window.track('cta_click', { cta_location: a.closest('header') ? 'header' : a.closest('.hero') ? 'hero' : 'other' })));
  document.querySelectorAll('a[href^="mailto:"]').forEach(a => a.addEventListener('click', () => window.track('email_click')));
})();
