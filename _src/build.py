#!/usr/bin/env python3
"""Builds the YU/GROW site from _src/ into the repository root (served by GitHub Pages).

    python3 _src/build.py

- _src/layout.html          shared page shell (head, header, footer, scripts)
- _src/partials/*.html      reusable pieces, included with {{> name}}
- _src/pages/*.html         one file per page; starts with a JSON block (title, description, path, url, ...)

It also writes sitemap.xml and stamps CSS/JS links with a content hash (?v=...)
so browsers always load fresh files after a change. Edit files in _src/, never the
generated .html files in the root (they are overwritten on every build).
"""
import datetime, hashlib, html, json, pathlib, re

SRC = pathlib.Path(__file__).resolve().parent
ROOT = SRC.parent

def read(p):
    return p.read_text(encoding='utf-8')

partials = {p.stem: read(p).rstrip('\n') for p in (SRC / 'partials').glob('*.html')}

def include(text):
    # partials may include other partials
    for _ in range(5):
        new = re.sub(r'\{\{> ([\w-]+)\}\}', lambda m: partials[m.group(1)], text)
        if new == text:
            break
        text = new
    return text

# Version tag = hash of the CSS/JS files, so it changes only when they change
h = hashlib.sha1()
for f in ['styles.css', 'script.js', 'i18n.js', 'analytics.js']:
    h.update((ROOT / f).read_bytes())
version = h.hexdigest()[:10]

layout = read(SRC / 'layout.html')
sitemap = []
for page_file in sorted((SRC / 'pages').glob('*.html')):
    raw = read(page_file)
    m = re.match(r'<!--(\{.*?\})-->\n', raw, re.S)
    meta = json.loads(m.group(1))
    content = include(raw[m.end():].rstrip('\n'))

    out = layout
    header = partials['header']
    # highlight the current page in the menu
    header = header.replace(f'data-nav="{meta["page"]}"', f'data-nav="{meta["page"]}" class="active" aria-current="page"')
    header = header.replace('class="active" aria-current="page" class="btn', 'aria-current="page" class="btn')
    out = out.replace('{{> header}}', header)
    out = include(out)
    values = {
        'title': html.escape(meta['title'], quote=True),
        'description': html.escape(meta['description'], quote=True),
        'url': meta['url'],
        'robots': meta.get('robots', 'index, follow'),
        'page': meta['page'],
        'body_class': f' class="{meta["body_class"]}"' if meta.get('body_class') else '',
        'head_extra': partials['jsonld'] + '\n' if meta.get('jsonld') else '',
        'v': version,
        'content': content,
    }
    for k, v in values.items():
        out = out.replace('{{' + k + '}}', v)
    leftover = re.findall(r'\{\{[^}]*\}\}', out)
    assert not leftover, f'{page_file.name}: unresolved {leftover}'

    target = ROOT / meta['path']
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(out, encoding='utf-8')
    if values['robots'].startswith('index'):
        sitemap.append(meta['url'])
    print('built', meta['path'])

# 404 page is standalone; just refresh its version tag
p404 = ROOT / '404.html'
p404.write_text(re.sub(r'\?v=[\w-]+', '?v=' + version, read(p404)), encoding='utf-8')

today = datetime.date.today().isoformat()
order = {u: i for i, u in enumerate(['https://yugrowagency.com/'])}
sitemap.sort(key=lambda u: (order.get(u, 1), u))
(ROOT / 'sitemap.xml').write_text(
    '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
    + ''.join(f'  <url>\n    <loc>{u}</loc>\n    <lastmod>{today}</lastmod>\n  </url>\n' for u in sitemap)
    + '</urlset>\n', encoding='utf-8')
print('sitemap:', len(sitemap), 'pages · version', version)
