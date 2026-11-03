# YU/GROW website

Static marketing site for YU/GROW, an AI-powered marketing agency based in Bosnia and Herzegovina.
Plain HTML, CSS and JavaScript. No build step needed.

## Files
- `index.html`: all page content (edit text here)
- `styles.css`: colors and layout (palette is at the top, under `:root`)
- `script.js`: mobile menu, number animations, contact form
- `assets/`: favicon and original logo

## Before launch, replace the placeholders
1. **Testimonials and results**: the names, quotes and case-study numbers are made up. Swap them for real ones as soon as you have them.
2. **Contact details**: `hello@yugrowagency.com` and `+387 61 000 000` in `index.html`.
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
