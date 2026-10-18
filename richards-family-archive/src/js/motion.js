import { el, clamp, canHover, reduceMotion } from './util.js';
import { animate, tick, Follow, SPRING, EASE } from './anim.js';

/* ---------- Prints tilt toward the pointer, with light sliding across the paper ---------- */
const TILT = 9;
let tilt = null;

export function initTilt() {
  if (!canHover() || reduceMotion()) return;
  const springing = new Set();
  let cur = null;
  let stop = null;

  const state = (node) => ({
    node,
    base: parseFloat(node.dataset.rot) || 0,
    rect: node.getBoundingClientRect(),
    lift: new Follow(0, 0.09),
    rx: new Follow(0, 0.11),
    ry: new Follow(0, 0.11),
    gx: 50,
    gy: 50,
  });

  const apply = (s) => {
    const l = s.lift.value;
    const st = s.node.style;
    st.setProperty('--s', (1 + 0.06 * l).toFixed(4));
    st.setProperty('--r', `${(s.base * (1 - l)).toFixed(3)}deg`);
    st.setProperty('--rx', `${s.rx.value.toFixed(3)}deg`);
    st.setProperty('--ry', `${s.ry.value.toFixed(3)}deg`);
    st.setProperty('--gx', `${s.gx.toFixed(1)}%`);
    st.setProperty('--gy', `${s.gy.toFixed(1)}%`);
    st.setProperty('--glare', l.toFixed(3));
  };

  // Back at rest: hand the print back to its stylesheet.
  const settle = (s) => {
    const st = s.node.style;
    s.node.classList.remove('is-tilt');
    st.setProperty('--r', `${s.base}deg`);
    for (const p of ['--s', '--rx', '--ry', '--gx', '--gy', '--glare']) st.removeProperty(p);
  };

  const run = () => {
    if (stop) return;
    stop = tick((dt) => {
      let moving = false;
      if (cur) {
        cur.lift.step(dt); cur.rx.step(dt); cur.ry.step(dt);
        apply(cur);
        moving = true;
      }
      for (const s of springing) {
        const a = s.lift.step(dt), b = s.rx.step(dt), c = s.ry.step(dt);
        if (a || b || c) { apply(s); moving = true; } else { settle(s); springing.delete(s); }
      }
      if (!moving) { stop = null; return false; }
      return true;
    });
  };

  const release = () => {
    if (!cur) return;
    cur.lift.target = cur.rx.target = cur.ry.target = 0;
    springing.add(cur);
    cur = null;
    run();
  };

  const grab = (node) => {
    let s = [...springing].find((x) => x.node === node);
    if (s) { springing.delete(s); s.rect = node.getBoundingClientRect(); } else s = state(node);
    node.classList.add('is-tilt');
    s.lift.target = 1;
    apply(s);
    cur = s;
    run();
  };

  document.addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse') return;
    const node = e.target.closest?.('.print.liftable');
    if (node !== cur?.node) {
      release();
      if (node && !node.closest('.is-leaving') && node.style.visibility !== 'hidden') grab(node);
    }
    if (!cur) return;
    const r = cur.rect;
    const nx = clamp((e.clientX - r.left) / r.width, 0, 1);
    const ny = clamp((e.clientY - r.top) / r.height, 0, 1);
    cur.ry.target = (nx - 0.5) * 2 * TILT;
    cur.rx.target = -(ny - 0.5) * 2 * TILT;
    cur.gx = nx * 100;
    cur.gy = ny * 100;
    run();
  }, { passive: true });
  document.documentElement.addEventListener('pointerleave', release);
  window.addEventListener('blur', release);

  tilt = {
    // Before a print flies to another page, put every tilted print straight back.
    reset() {
      if (cur) { springing.add(cur); cur = null; }
      for (const s of springing) settle(s);
      springing.clear();
    },
  };
}

export const resetTilt = () => tilt?.reset();

/* ---------- Round buttons lean toward the pointer ---------- */
const MAGNETIC = '.icon-btn, .big-play, .viewer-close, .viewer-nav, .mv-close, .zoomer button, .dock .arrow, .avatar, .fc-play, .c-btn';

export function initMagnetic() {
  if (!canHover() || reduceMotion()) return;
  const live = new Map();
  let stop = null;
  const run = () => {
    if (stop) return;
    stop = tick((dt) => {
      for (const [node, m] of live) {
        const a = m.x.step(dt), b = m.y.step(dt);
        node.style.translate = `${m.x.value.toFixed(2)}px ${m.y.value.toFixed(2)}px`;
        if (!a && !b && !m.on) { node.style.translate = ''; live.delete(node); }
      }
      if (!live.size) { stop = null; return false; }
      return true;
    });
  };
  let hovered = null;
  document.addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse') return;
    const node = e.target.closest?.(MAGNETIC);
    if (hovered && hovered !== node) { const m = live.get(hovered); if (m) { m.on = false; m.x.target = m.y.target = 0; } }
    hovered = node;
    if (!node) { run(); return; }
    let m = live.get(node);
    if (!m) { m = { x: new Follow(0, 0.12), y: new Follow(0, 0.12), on: true }; live.set(node, m); }
    m.on = true;
    const r = node.getBoundingClientRect();
    const dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2);
    const cap = Math.min(10, Math.max(r.width, r.height) * 0.16);
    m.x.target = clamp(dx * 0.28, -cap, cap);
    m.y.target = clamp(dy * 0.28, -cap, cap);
    run();
  }, { passive: true });
}

/* ---------- A little burst of hearts when something is saved ---------- */
export function burst(from) {
  if (reduceMotion() || !from) return;
  const r = from.getBoundingClientRect();
  const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * Math.PI * 2 + Math.random() * 0.5;
    const d = 34 + Math.random() * 30;
    const n = el('span', { class: 'heart-bit', 'aria-hidden': 'true', style: { left: `${cx}px`, top: `${cy}px` } });
    document.body.append(n);
    animate(n, [
      { transform: 'translate(-50%, -50%) scale(0.4)', opacity: 1 },
      { transform: `translate(calc(-50% + ${Math.cos(a) * d}px), calc(-50% + ${Math.sin(a) * d}px)) scale(${0.7 + Math.random() * 0.6}) rotate(${(Math.random() - 0.5) * 60}deg)`, opacity: 0 },
    ], { duration: 700 + Math.random() * 250, easing: EASE, fill: 'forwards' }).finished.then(() => n.remove(), () => n.remove());
  }
}

/* ---------- Headings rise in word by word ---------- */
export function splitWords(node) {
  if (!node || node.dataset.split) return [];
  node.dataset.split = '1';
  const text = node.textContent;
  node.setAttribute('aria-label', text);
  node.textContent = '';
  return text.split(/(\s+)/).filter((t) => t.length).map((t) => {
    if (/^\s+$/.test(t)) { node.append(t); return null; }
    const inner = el('span', { class: 'wi' }, t);
    node.append(el('span', { class: 'wm', 'aria-hidden': 'true' }, inner));
    return inner;
  }).filter(Boolean);
}

export function revealWords(node, { delay = 0, stagger = 70, duration = 1100 } = {}) {
  const words = splitWords(node);
  return words.map((w, i) => animate(w, [
    { transform: 'translateY(105%) rotate(4deg)', opacity: 0 },
    { transform: 'none', opacity: 1 },
  ], { duration, delay: delay + i * stagger, easing: SPRING, fill: 'backwards' }));
}

/* ---------- Numbers roll like an odometer from one value to another ---------- */
export function rollNumber(node, to, from = null, { delay = 0 } = {}) {
  const target = String(to);
  const start = from == null ? target.replace(/\d/g, '0') : String(from).padStart(target.length, '0').slice(-target.length);
  node.setAttribute('aria-label', target);
  node.textContent = '';
  const strips = [];
  [...target].forEach((ch, i) => {
    if (!/\d/.test(ch)) { node.append(el('span', { 'aria-hidden': 'true' }, ch)); return; }
    const strip = el('span', { class: 'odo-strip' }, Array.from({ length: 10 }, (_, d) => el('span', null, String(d))));
    node.append(el('span', { class: 'odo-d', 'aria-hidden': 'true' }, strip));
    strips.push({ strip, from: +start[i], to: +ch, i });
  });
  if (reduceMotion()) {
    strips.forEach((s) => { s.strip.style.transform = `translateY(${-s.to * 10}%)`; });
    return;
  }
  let k = 0;
  for (const s of strips) {
    s.strip.style.transform = `translateY(${-s.to * 10}%)`;
    if (s.from === s.to) continue;
    animate(s.strip, [{ transform: `translateY(${-s.from * 10}%)` }, { transform: `translateY(${-s.to * 10}%)` }],
      { duration: 1200 + k * 120, delay: delay + k++ * 90, easing: SPRING, fill: 'backwards' });
  }
}

/* ---------- Counts tick up when a page opens ---------- */
export function countUp(node, { duration = 1100, delay = 0 } = {}) {
  const text = node.textContent;
  const m = /\d+/.exec(text);
  if (!m || reduceMotion()) return;
  const n = +m[0];
  if (n < 2) return;
  const before = text.slice(0, m.index), after = text.slice(m.index + m[0].length);
  const t0 = performance.now() + delay;
  node.textContent = `${before}0${after}`;
  const stop = tick(() => {
    const t = clamp((performance.now() - t0) / duration, 0, 1);
    const e = 1 - Math.pow(1 - t, 3);
    node.textContent = `${before}${Math.round(n * e)}${after}`;
    if (t >= 1 || !node.isConnected) { node.textContent = text; return false; }
    return true;
  });
  return stop;
}
