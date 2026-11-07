// YU/GROW "adventure" effects: travelling sky, self-drawing growth path, parallax,
// card tilt and directional reveals. Pure CSS/JS, no libraries.
(function () {
  const root = document.documentElement;
  const main = document.querySelector('main');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;
  if (!main) return;

  /* ---------- floating parallax shapes ---------- */
  const floaters = document.createElement('div');
  floaters.className = 'floaters';
  floaters.setAttribute('aria-hidden', 'true');
  const shapes = [
    ['orb', 6, -4, 340, '#1a6dff', -0.10], ['orb', 22, 78, 300, '#7b5cff', 0.08], ['orb', 41, -6, 320, '#e04fb4', -0.06],
    ['orb', 60, 74, 360, '#7b5cff', 0.10], ['orb', 82, 10, 380, '#ff6a45', -0.08],
    ['slash', 14, 92, 0, '#1a6dff', -0.25], ['slash', 30, 4, 0, '#ff6a45', 0.2], ['slash', 52, 90, 0, '#7b5cff', -0.18],
    ['slash', 70, 6, 0, '#e04fb4', 0.22], ['slash', 90, 88, 0, '#ff6a45', -0.2],
  ];
  shapes.forEach(([type, top, left, size, color, speed]) => {
    const el = document.createElement('span');
    el.className = 'floater ' + type;
    el.style.top = top + '%';
    el.style.left = left + '%';
    if (type === 'orb') { el.style.width = el.style.height = size + 'px'; el.style.background = color; }
    else el.style.setProperty('--c', color);
    el.dataset.speed = speed;
    floaters.appendChild(el);
  });
  main.prepend(floaters);

  /* ---------- growth path ---------- */
  const NS = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('class', 'growth-path');
  svg.setAttribute('aria-hidden', 'true');
  svg.innerHTML = '<defs><linearGradient id="gpGrad" x1="0" y1="0" x2="0" y2="1">' +
    '<stop offset="0" stop-color="#1a6dff"/><stop offset=".45" stop-color="#7b5cff"/>' +
    '<stop offset=".7" stop-color="#e04fb4"/><stop offset="1" stop-color="#ff6a45"/></linearGradient></defs>' +
    '<path class="gp-track"/><path class="gp-line"/><g class="gp-nodes"></g><circle class="gp-spark" r="4"/>';
  main.prepend(svg);
  const track = svg.querySelector('.gp-track');
  const line = svg.querySelector('.gp-line');
  const nodesG = svg.querySelector('.gp-nodes');
  const spark = svg.querySelector('.gp-spark');
  let total = 0, samples = [], nodes = [];

  function buildPath() {
    const sections = [...main.children].filter(el => el.tagName === 'SECTION');
    if (sections.length < 2) { svg.style.display = 'none'; return; }
    const W = main.clientWidth, H = main.scrollHeight;
    const container = Math.min(1180, W - 32);
    const gutter = (W - container) / 2;
    const inset = gutter > 90 ? gutter * 0.45 : Math.max(8, gutter * 0.5);
    const X = [inset, W - inset];
    svg.setAttribute('width', W); svg.setAttribute('height', H);
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`); svg.style.height = H + 'px';

    const first = sections[0];
    let side = 0;
    let y0 = first.offsetTop + Math.min(first.offsetHeight * 0.6, 420);
    let d = `M ${X[side]} ${y0}`;
    nodes = [{ x: X[side], y: y0 }];
    sections.slice(1).forEach(sec => {
      const b = sec.offsetTop;
      const next = 1 - side;
      d += ` L ${X[side]} ${b - 60} C ${X[side]} ${b + 10}, ${X[next]} ${b + 10}, ${X[next]} ${b + 80}`;
      nodes.push({ x: X[next], y: b + 80 });
      side = next;
    });
    const last = sections[sections.length - 1];
    const yEnd = last.offsetTop + last.offsetHeight - 60;
    d += ` L ${X[side]} ${yEnd}`;
    track.setAttribute('d', d); line.setAttribute('d', d);
    total = line.getTotalLength();
    line.style.strokeDasharray = total;
    samples = [];
    for (let l = 0; l <= total; l += 12) samples.push([l, line.getPointAtLength(l).y]);
    samples.push([total, yEnd]);
    nodesG.innerHTML = nodes.map(n => `<circle class="gp-node" cx="${n.x}" cy="${n.y}" r="5"/>`).join('');
  }

  function lengthAtY(y) {
    let lo = 0, hi = samples.length - 1;
    if (!samples.length || y <= samples[0][1]) return 0;
    if (y >= samples[hi][1]) return total;
    while (lo < hi - 1) { const mid = (lo + hi) >> 1; if (samples[mid][1] <= y) lo = mid; else hi = mid; }
    return samples[lo][0];
  }

  /* ---------- scroll loop ---------- */
  const floaterEls = [...floaters.children];
  let ticking = false;
  function update() {
    ticking = false;
    const max = Math.max(1, document.documentElement.scrollHeight - innerHeight);
    const p = Math.min(1, Math.max(0, scrollY / max));
    root.style.setProperty('--p', p.toFixed(4));

    if (total) {
      const mainTop = main.getBoundingClientRect().top + scrollY;
      const target = reduce ? Infinity : scrollY + innerHeight * 0.62 - mainTop;
      const len = p > 0.995 ? total : lengthAtY(target);
      line.style.strokeDashoffset = total - len;
      const pt = line.getPointAtLength(len);
      spark.setAttribute('cx', pt.x); spark.setAttribute('cy', pt.y);
      spark.style.opacity = len > 0 && len < total ? 1 : 0;
      nodesG.querySelectorAll('.gp-node').forEach((c, i) => c.classList.toggle('lit', nodes[i].y <= target));
    }
    if (!reduce) floaterEls.forEach(el => { el.style.transform = `translate3d(0, ${(scrollY * el.dataset.speed).toFixed(1)}px, 0)`; });
  }
  const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } };
  addEventListener('scroll', onScroll, { passive: true });
  let rt;
  addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(() => { buildPath(); update(); }, 150); });
  addEventListener('load', () => { buildPath(); update(); });
  // rebuild once fonts/images settle and whenever the layout height changes (e.g. FAQ opened, language switched)
  if ('ResizeObserver' in window) new ResizeObserver(() => { clearTimeout(rt); rt = setTimeout(() => { buildPath(); update(); }, 100); }).observe(main);
  buildPath(); update();

  /* ---------- directional, staggered reveals ---------- */
  document.querySelectorAll('.reveal').forEach(el => {
    if (el.matches('.panel, .founder:nth-child(even), .form')) el.classList.add('from-right');
    else if (el.matches('.steps li, .ai-list li, .founder:nth-child(odd)')) el.classList.add('from-left');
    else if (el.matches('.case, .quote, .stat, .card')) el.classList.add('zoom');
    const sibs = el.parentElement ? [...el.parentElement.children].filter(s => s.classList.contains('reveal')) : [];
    const i = sibs.indexOf(el);
    if (i > 0) el.style.transitionDelay = Math.min(i, 5) * 90 + 'ms';
  });

  /* ---------- interactive: card tilt + cursor glow, hero spotlight ---------- */
  if (finePointer && !reduce) {
    document.querySelectorAll('.card, .case, .quote, .steps li, .founder').forEach(el => {
      el.classList.add('tilt');
      el.addEventListener('pointermove', e => {
        const r = el.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
        el.style.setProperty('--mx', x * 100 + '%'); el.style.setProperty('--my', y * 100 + '%');
        el.style.transitionDelay = '0ms';
        el.style.transform = `perspective(900px) rotateX(${(0.5 - y) * 6}deg) rotateY(${(x - 0.5) * 8}deg) translateY(-4px)`;
      });
      el.addEventListener('pointerleave', () => { el.style.transform = ''; });
    });
    const hero = document.querySelector('.hero');
    if (hero) hero.addEventListener('pointermove', e => {
      const r = hero.getBoundingClientRect();
      hero.style.setProperty('--sx', (e.clientX - r.left) + 'px');
      hero.style.setProperty('--sy', (e.clientY - r.top) + 'px');
    });
  }
})();
