# YU/GROW website

Static marketing site for YU/GROW, an AI-powered marketing agency based in Bosnia and Herzegovina.
Plain HTML, CSS and JavaScript. No build step needed.

## Files
- `index.html`: all page content (edit text here)
- `styles.css`: colors and layout (palette is at the top, under `:root`)
- `script.js`: mobile menu, number animations, contact form
- `i18n.js`: language switcher and the Bosnian, German and Spanish translations
- `analytics.js`: Google Analytics and the cookie consent banner
- `thank-you.html`: page visitors land on after submitting the contact form (hidden from Google)
- `assets/`: favicon and original logo

## Before launch, replace the placeholders
1. **Testimonials and results**: the names, quotes and case-study numbers are made up. Swap them for real ones as soon as you have them.
2. **Contact details**: `hello@yugrowagency.com` in `index.html`.
3. **Contact form**: create a free form at https://formspree.io, then replace `YOUR_FORM_ID` in `index.html` with your form ID. Until then the form tells visitors to email you.

## Host on GitHub Pages
1. Create a new repository on GitHub, e.g. `yugrow-website`.
2. Push this folder to it:
   ```bash
   git remote add origin https://github.com/YOUR-USERNAME/yugrow-website.git
   git push -u origin main
   ```
3. On GitHub, go to **Settings → Pages**, set **Source** to "Deploy from a branch", choose `main` and `/ (root)`, then save.
4. After a minute the site is live at `https://YOUR-USERNAME.github.io/yugrow-website/`.

### Custom domain (optional)
In **Settings → Pages → Custom domain**, enter your domain (e.g. `yugrowagency.com`). At your domain registrar, add the DNS records GitHub shows you, then turn on **Enforce HTTPS**.

## Languages
The site switches between English, Bosnian, German and Spanish from the globe button in the header.
- English text lives in `index.html`. Each translatable element has a `data-i18n="key"` attribute.
- Translations live in `i18n.js`, one block per language, using the same keys. Edit the text, keep the keys.
- If you change English text in `index.html`, update the same key in `i18n.js` so the other languages match.
- Link straight to a language with `?lang=bs`, `?lang=de` or `?lang=es`.
- First-time visitors get their browser's language automatically; their choice is remembered after that.

## Analytics (Google Analytics 4)
`analytics.js` loads GA4 only after a visitor accepts the cookie banner (GDPR-friendly).
- Measurement ID: `G-PYGB77Z40G` (set in `analytics.js`).
- Events sent: `generate_lead` (contact form submitted), `cta_click`, `email_click`, `language_change`.
- In GA4, mark `generate_lead` as a key event (Admin → Events) to track it as a conversion.

## Cache busting
Pages load `styles.css`, `script.js`, `i18n.js` and `analytics.js` with a `?v=` version tag, so browsers fetch fresh copies after a change.
When you edit any of those files, bump the tag in `index.html`, `thank-you.html` and `404.html` (e.g. `?v=20261103-2` → `?v=20261103-3`).
