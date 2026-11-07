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
    '<path class="gp-track"/><path class="gp-line"/><g class="gp-nodes"></g><circle class="gp-spark" r="6"/>';
  main.prepend(svg);
  const track = svg.querySelector('.gp-track');
  const line = svg.querySelector('.gp-line');
  const nodesG = svg.querySelector('.gp-nodes');
  const spark = svg.querySelector('.gp-spark');
  let total = 0, samples = [], nodes = [], reachedEnd = false, curLen = 0, targetLen = 0, lineRAF = 0;

  // The journey ends at the interest form: when the line arrives, a glowing frame draws itself around it
  const formEl = document.getElementById('leadForm');
  let goal = null;
  const frame = document.createElementNS(NS, 'rect');
  frame.setAttribute('class', 'gp-frame');
  frame.setAttribute('pathLength', '1');
  svg.appendChild(frame);

  function buildPath() {
    // the growth path + arrow appear on the homepage only
    if (document.body.dataset.page !== 'home') { svg.style.display = 'none'; total = 0; return; }
    const sections = [...main.children].filter(el => el.tagName === 'SECTION');
    if (sections.length < 2) { svg.style.display = 'none'; return; }
    const W = main.clientWidth, H = main.scrollHeight;
    const container = Math.min(1180, W - 32);
    const gutter = (W - container) / 2;
    const inset = gutter > 90 ? gutter * 0.45 : Math.max(9, gutter * 0.5);
    const X = [inset, W - inset];
    svg.setAttribute('width', W); svg.setAttribute('height', H);
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`); svg.style.height = H + 'px';
    const mainTop = main.getBoundingClientRect().top + scrollY;

    // where the journey ends: level with the top of the form
    goal = null;
    let goalSection = null;
    if (formEl && formEl.offsetParent !== null) {
      // measure the form's resting position (ignores the slide-in animation's temporary offset)
      let x = 0, y = 0, el = formEl;
      while (el && el !== main) { x += el.offsetLeft; y += el.offsetTop; el = el.offsetParent; }
      goal = { x, y, w: formEl.offsetWidth, h: formEl.offsetHeight };
      goalSection = sections.find(sec => sec.contains(formEl));
    }

    const first = sections[0];
    // The Contact page is the destination itself (form at the very top): no journey needed there
    if (goalSection === first) { svg.style.display = 'none'; total = 0; return; }
    svg.style.display = '';
    const goalFirst = false;
    let side = goalFirst ? goalSide : 0;
    let y0 = goalFirst ? Math.max(first.offsetTop + 20, goal.y - 220) : first.offsetTop + Math.min(first.offsetHeight * 0.6, 420);
    let d = `M ${X[side]} ${y0}`;
    nodes = [{ x: X[side], y: y0 }];
    for (const sec of goalFirst ? [] : sections.slice(1)) {
      const b = sec.offsetTop;
      // arrive at the goal's section on the side nearest the goal, so the line never cuts through text
      const next = 0;   // stay on the left side (no zig-zag)
      // cross only inside the empty padding between two sections, so the line never runs through text
      const prevSec = sections[sections.indexOf(sec) - 1];
      const padAbove = parseFloat(getComputedStyle(prevSec).paddingBottom) || 40;
      const padBelow = parseFloat(getComputedStyle(sec).paddingTop) || 40;
      const y1 = b - Math.max(12, padAbove * 0.8);
      let y2 = b + Math.max(12, padBelow * 0.7);
      const ym = (y1 + y2) / 2;
      if (next !== side) d += ` L ${X[side]} ${y1} C ${X[side]} ${ym}, ${X[next]} ${ym}, ${X[next]} ${y2}`;
      else d += ` L ${X[side]} ${y2}`;
      nodes.push({ x: X[next], y: y2 });
      side = next;
      if (sec === goalSection) break;
    }
    const lastY = nodes[nodes.length - 1].y;
    if (goal) {
      // straight down the left side until we're level with the top of the form
      d += ` L ${X[0]} ${Math.max(lastY + 1, goal.y + 26)}`;
      const pad = 7;
      frame.style.display = '';
      frame.setAttribute('x', goal.x - pad); frame.setAttribute('y', goal.y - pad);
      frame.setAttribute('width', goal.w + pad * 2); frame.setAttribute('height', goal.h + pad * 2);
      frame.setAttribute('rx', 26);
    } else {
      const last = sections[sections.length - 1];
      d += ` L ${X[0]} ${last.offsetTop + last.offsetHeight - 60}`;
      frame.style.display = 'none';
    }
    track.setAttribute('d', d); line.setAttribute('d', d);
    total = line.getTotalLength();
    line.style.strokeDasharray = total;
    samples = [];
    for (let l = 0; l <= total; l += 12) samples.push([l, line.getPointAtLength(l).y]);
    samples.push([total, line.getPointAtLength(total).y]);
    nodesG.innerHTML = nodes.map(n => `<circle class="gp-node" cx="${n.x}" cy="${n.y}" r="6"/>`).join('');
    curLen = Math.min(curLen, total); drawLine(curLen);
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
      targetLen = p > 0.995 ? total : lengthAtY(target);
      if (reduce) { curLen = targetLen; drawLine(curLen); }
      else if (!lineRAF) lineRAF = requestAnimationFrame(stepLine);
    }
    parallax();
  }
  function drawLine(len) {
    line.style.strokeDashoffset = total - len;
    const pt = line.getPointAtLength(len);
    spark.setAttribute('cx', pt.x); spark.setAttribute('cy', pt.y);
    spark.style.opacity = len > 1 && len < total - 1 ? 1 : 0;
    nodesG.querySelectorAll('.gp-node').forEach((c, i) => c.classList.toggle('lit', nodes[i].y <= pt.y + 1));
    const done = !!goal && len >= total - 2;
    frame.classList.toggle('lit', done);
    if (formEl) formEl.classList.toggle('journey-lit', done);
    if (done && !reachedEnd) { reachedEnd = true; if (window.track) window.track('journey_complete', { page: document.body.dataset.page }); }
  }
  function stepLine() {
    lineRAF = 0;
    const diff = targetLen - curLen;
    curLen = Math.abs(diff) < 0.6 ? targetLen : curLen + diff * 0.12;
    drawLine(curLen);
    if (curLen !== targetLen) lineRAF = requestAnimationFrame(stepLine);
  }

  /* ---------- gentle parallax on headings + floating shapes ---------- */
  const driftEls = [...document.querySelectorAll('.section-head h2, .page-title, .problem h2, .ai-band h2, .about-story h2, .cta h2, .mission-statement')];
  function parallax() {
    if (reduce) return;
    floaterEls.forEach(el => { el.style.transform = `translate3d(0, ${(scrollY * el.dataset.speed).toFixed(1)}px, 0)`; });
    const vh = innerHeight;
    driftEls.forEach(el => {
      const r = el.getBoundingClientRect();
      if (r.bottom < -100 || r.top > vh + 100) return;
      const off = (r.top + r.height / 2 - vh / 2) / vh;      // -0.5 … 0.5 across the screen
      el.style.translate = `0 ${(off * 28).toFixed(1)}px`;
    });
  }

  const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } };
  addEventListener('scroll', onScroll, { passive: true });
  let rt;
  addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(() => { buildPath(); update(); }, 150); });
  addEventListener('load', () => { buildPath(); update(); });
  // rebuild once fonts/images settle and whenever the layout height changes (e.g. FAQ opened, language switched)
  if ('ResizeObserver' in window) new ResizeObserver(() => { clearTimeout(rt); rt = setTimeout(() => { buildPath(); update(); }, 100); }).observe(main);
  buildPath(); update();

  /* ---------- more motion ---------- */
  // platforms ticker: duplicate the list so it can scroll seamlessly
  const plat = document.querySelector('.platforms');
  if (plat && !reduce) {
    plat.innerHTML += plat.innerHTML.replace(/<li>/g, '<li aria-hidden="true">');
    plat.classList.add('ticker');
  }
  // testimonial stars pop in one by one
  document.querySelectorAll('.stars').forEach(st => {
    st.innerHTML = [...st.textContent.trim()].map((c, i) => `<i style="--i:${i}">${c}</i>`).join('');
  });
  // results numbers count up when they come into view (e.g. +186%, −52%, 4.6x)
  const counters = [...document.querySelectorAll('.case-num')].map(el => {
    const m = el.textContent.trim().match(/^([^\d]*)([\d.]+)(.*)$/);
    return m ? { el, pre: m[1], num: parseFloat(m[2]), dec: (m[2].split('.')[1] || '').length, post: m[3] } : null;
  }).filter(Boolean);
  const playIO = 'IntersectionObserver' in window ? new IntersectionObserver(entries => entries.forEach(en => {
    if (!en.isIntersecting) return;
    en.target.classList.add('play');
    const c = counters.find(c => c.el === en.target);
    if (c && !reduce) {
      const t0 = performance.now();
      const tick = now => { const k = Math.min(1, (now - t0) / 2600), e = 1 - Math.pow(1 - k, 3);
        c.el.textContent = c.pre + (c.num * e).toFixed(c.dec) + c.post; if (k < 1) requestAnimationFrame(tick); };
      requestAnimationFrame(tick);
    }
    playIO.unobserve(en.target);
  }), { threshold: 0.6, rootMargin: '0px 0px -15% 0px' }) : null;
  if (playIO) document.querySelectorAll('.case-num, .journey, .stars').forEach(el => playIO.observe(el));
  else document.querySelectorAll('.journey, .stars').forEach(el => el.classList.add('play'));

  // orange buttons lean gently toward the cursor (desktop)
  if (finePointer && !reduce) document.querySelectorAll('.btn-orange').forEach(btn => {
    btn.addEventListener('pointermove', e => {
      const r = btn.getBoundingClientRect();
      btn.style.translate = `${((e.clientX - r.left) / r.width - 0.5) * 10}px ${((e.clientY - r.top) / r.height - 0.5) * 8}px`;
    });
    btn.addEventListener('pointerleave', () => { btn.style.translate = ''; });
  });

  /* ---------- directional, staggered reveals ---------- */
  document.querySelectorAll('.reveal').forEach(el => {
    if (el.matches('.panel, .founder:nth-child(even), .form')) el.classList.add('from-right');
    else if (el.matches('.steps li, .ai-list li, .founder:nth-child(odd)')) el.classList.add('from-left');
    else if (el.matches('.case, .quote, .stat, .card')) el.classList.add('zoom');
    const sibs = el.parentElement ? [...el.parentElement.children].filter(s => s.classList.contains('reveal')) : [];
    const i = sibs.indexOf(el);
    if (i > 0) el.style.transitionDelay = Math.min(i, 5) * 150 + 'ms';
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
