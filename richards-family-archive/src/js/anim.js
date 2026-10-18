import { reduceMotion, clamp } from './util.js';

export const EASE = 'cubic-bezier(0.16, 1, 0.3, 1)';
export const EASE_IO = 'cubic-bezier(0.65, 0, 0.35, 1)';
export const EASE_IN = 'cubic-bezier(0.55, 0, 1, 0.45)';

/** A spring curve as a CSS linear() easing, falling back to an expo-out bezier. */
export const SPRING = (() => {
  try {
    if (!CSS.supports('animation-timing-function', 'linear(0, 1)')) return EASE;
  } catch { return EASE; }
  const stiffness = 170, damping = 20, mass = 1, steps = 60, dur = 1;
  const w0 = Math.sqrt(stiffness / mass);
  const zeta = damping / (2 * Math.sqrt(stiffness * mass));
  const pts = [];
  for (let i = 0; i <= steps; i++) {
    const t = (i / steps) * dur * 1.1;
    let x;
    if (zeta < 1) {
      const wd = w0 * Math.sqrt(1 - zeta * zeta);
      x = 1 - Math.exp(-zeta * w0 * t) * (Math.cos(wd * t) + (zeta * w0 / wd) * Math.sin(wd * t));
    } else {
      x = 1 - Math.exp(-w0 * t) * (1 + w0 * t);
    }
    pts.push(+x.toFixed(4));
  }
  pts[pts.length - 1] = 1;
  return `linear(${pts.join(', ')})`;
})();

export function animate(node, keyframes, opts = {}) {
  if (!node || !node.animate) return { finished: Promise.resolve(), cancel() {} };
  const o = { duration: 600, easing: EASE, fill: 'both', ...opts };
  if (reduceMotion()) { o.duration = Math.min(o.duration, 120); o.delay = 0; }
  const a = node.animate(keyframes, o);
  a.finished.catch(() => {});
  return a;
}

export const settle = (anims) => Promise.all(anims.map((a) => a.finished.catch(() => {})));

/** Commit an animation's end state as inline style and drop the animation. */
export function commit(anim) {
  try { anim.commitStyles?.(); } catch { /* element detached */ }
  anim.cancel();
}

/* ---------- Ticker: one rAF loop shared by everything that moves ---------- */
const tickers = new Set();
let rafId = 0;
let last = 0;
function loop(t) {
  const dt = Math.min(0.05, (t - (last || t)) / 1000);
  last = t;
  for (const fn of [...tickers]) {
    if (fn(dt, t) === false) tickers.delete(fn);
  }
  rafId = tickers.size ? requestAnimationFrame(loop) : 0;
  if (!rafId) last = 0;
}
export function tick(fn) {
  tickers.add(fn);
  if (!rafId) rafId = requestAnimationFrame(loop);
  return () => tickers.delete(fn);
}

/** Critically damped follower: value eases toward target, frame-rate independent. */
export class Follow {
  constructor(value, halfLife = 0.12) { this.value = value; this.target = value; this.halfLife = halfLife; }
  step(dt) {
    const k = 1 - Math.pow(0.5, dt / Math.max(0.001, this.halfLife));
    this.value += (this.target - this.value) * k;
    if (Math.abs(this.target - this.value) < 0.001) this.value = this.target;
    return this.value !== this.target;
  }
  snap(v = this.target) { this.value = this.target = v; }
}

/* ---------- Print geometry for shared-element flights ---------- */
/** Screen-space centre, unrotated size and rotation of a print, from its bounding box. */
export function geom(node) {
  if (!node || !node.isConnected) return null;
  const b = node.getBoundingClientRect();
  if (!b.width || !b.height) return null;
  const ow = node.offsetWidth || b.width;
  const oh = node.offsetHeight || b.height;
  const r = parseFloat(node.dataset.rot || getComputedStyle(node).getPropertyValue('--r')) || 0;
  const rad = Math.abs(r * Math.PI / 180);
  const a = ow / oh;
  const h = b.height / (Math.sin(rad) * a + Math.cos(rad));
  const w = h * a;
  const k = w / ow;
  const bv = node.style.getPropertyValue('--b');
  return { cx: b.left + b.width / 2, cy: b.top + b.height / 2, w, h, r, border: bv ? parseFloat(bv) * k : 0, k };
}

export function onScreen(g, margin = 80) {
  return !!g && g.cx > -margin && g.cy > -margin && g.cx < innerWidth + margin && g.cy < innerHeight + margin;
}

/**
 * Fly copies of prints from their old places to their new ones.
 * pairs: [{ from, to, src, hi, lqip, order, onLand }]. Each copy calls onLand and disappears
 * the moment it arrives, so the real print can take its place in the same frame.
 */
export function fly(layer, pairs, { duration = 820, stagger = 18, easing = SPRING } = {}) {
  if (!pairs.length) return Promise.resolve();
  const anims = pairs.map((p, i) => {
    const { from, to } = p;
    const n = document.createElement('div');
    n.className = 'flight';
    n.style.width = `${to.w}px`;
    n.style.height = `${to.h}px`;
    n.style.left = `${to.cx - to.w / 2}px`;
    n.style.top = `${to.cy - to.h / 2}px`;
    n.style.padding = `${clamp(to.border || 0, 0, 28)}px`;
    if (!to.border) n.classList.add('is-bare');
    const inner = document.createElement('div');
    inner.className = 'flight-inner';
    if (p.lqip) inner.style.backgroundImage = `url("${p.lqip}")`;
    const img = document.createElement('img');
    img.alt = '';
    img.decoding = 'sync';
    img.src = p.src;
    inner.append(img);
    if (p.hi && p.hi !== p.src) {
      const hi = new Image();
      hi.className = 'hi';
      hi.alt = '';
      hi.decoding = 'async';
      hi.onload = () => hi.classList.add('is-in');
      hi.src = p.hi;
      inner.append(hi);
    }
    n.append(inner);
    layer.append(n);
    const s = from.w / to.w;
    const sy = from.h / to.h;
    const order = p.order ?? i;
    const a = animate(n, [
      { transform: `translate(${from.cx - to.cx}px, ${from.cy - to.cy}px) rotate(${from.r}deg) scale(${s}, ${sy})` },
      { transform: `translate(0px, 0px) rotate(${to.r}deg) scale(1, 1)` },
    ], { duration: p.duration || duration, delay: Math.min(order * stagger, 320), easing: p.easing || easing });
    const done = () => { p.onLand?.(); n.remove(); };
    a.finished.then(done, done);
    return a;
  });
  return settle(anims);
}

/** Cancel every flight in a layer at once (used when a transition is interrupted). */
export function landAll(layer) {
  for (const a of layer.getAnimations({ subtree: true })) a.finish();
}
