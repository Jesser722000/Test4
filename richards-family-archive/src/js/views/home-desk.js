import { View } from './base.js';
import { el, canHover, seeded, reduceMotion } from '../util.js';
import { tick, Follow, SPRING, EASE } from '../anim.js';
import { makePrint, attachTip } from '../print.js';
import { homeLayout, HOME_W, HOME_H } from '../layout.js';
import { Camera } from '../camera.js';
import { Timeline, hudIn } from '../hud.js';
import * as store from '../store.js';

const HERO_AT = { x: 812, y: 452 };
const DEPTH = [5, 11, 19];

/** Desktop home: every decade laid out on one dark table around the title, with a timeline below. */
export class HomeDesk extends View {
  constructor(app, route) { super(app, route, 'home-desk is-fixed'); }
  get fixed() { return true; }

  mount() {
    const L = homeLayout();
    this.table = el('div', { class: 'table' });
    this.layers = DEPTH.map((_, i) => el('div', { class: 'layer', dataset: { depth: String(i) } }));
    // Each depth has a twin above all three, moving exactly with it, where a hovered print is lifted
    // so it can grow over prints from any depth.
    this.tops = DEPTH.map((_, i) => el('div', { class: 'layer layer-top', dataset: { depth: String(i) } }));
    this.table.append(...this.layers, ...this.tops);
    this.prints = new Map();
    this.byDecade = new Map();
    this.stacks = this.layers.map(() => []);
    for (const it of [...L.items].sort((a, b) => a.z - b.z)) {
      const p = makePrint(it.photo, { w: it.w, h: it.h, x: it.x, y: it.y, r: it.r, eager: true });
      p.dataset.decade = String(it.decade);
      p.dataset.layer = String(it.layer);
      this.layers[it.layer].append(p);
      this.stacks[it.layer].push(p);
      this.prints.set(it.photo.id, p);
      if (!this.byDecade.has(it.decade)) this.byDecade.set(it.decade, []);
      this.byDecade.get(it.decade).push(p);
    }
    this.on(this.table, 'print:lift', (e) => this.raise(e.target));
    this.on(this.table, 'print:rest', (e) => this.lower(e.target));
    this.labels = L.labels.map((l) => {
      const a = el('a', { class: 'decade-label', href: `#/${l.decade}s`, style: { left: `${l.x}px`, top: `${l.y}px` }, dataset: { decade: String(l.decade) } }, `${l.decade}s`);
      a.addEventListener('pointerenter', () => this.focus(l.decade));
      a.addEventListener('pointerleave', () => this.focus(null));
      a.addEventListener('focus', () => this.focus(l.decade));
      a.addEventListener('blur', () => this.focus(null));
      return a;
    });
    this.table.append(...this.labels);

    const A = store.archive;
    this.title = el('h1', { class: 'hero-title' });
    this.words = A.headline.split(' ').map((w, i) => {
      const s = el('span', { class: 'w' }, w);
      if (i) this.title.append(' ');
      this.title.append(s);
      return s;
    });
    this.sub = el('p', { class: 'hero-sub' }, A.subtitle);
    this.rule = el('span', { class: 'gold-rule', 'aria-hidden': 'true' });
    this.hero = el('div', { class: 'hero-copy' }, this.title, this.sub, this.rule);
    this.shift = el('div', { class: 'hero-shift' }, this.hero);
    this.el.append(this.table, this.shift);

    this.cam = new Camera(this.table, { min: 0.2, max: 3, onChange: () => this.place() });
    this.cam.setWorld(HOME_W, HOME_H);
    this.fit();

    // The featured year glows on the timeline when nothing is hovered (the 1970s, in the sample).
    const busiest = store.decades().reduce((a, d) => (store.photosInDecade(d).length > store.photosInDecade(a).length ? d : a));
    const featured = store.yearsInDecade(busiest).reduce((a, y) => (store.photosInYear(y).length > store.photosInYear(a).length ? y : a));
    this.timeline = this.app.useHud('timeline', 'home', () => new Timeline({ featured }));
    this.timeline.onHover = (decade, year) => this.focus(decade, year);
    this.timeline.onPick = (year, keyboard) => this.app.go(`#/${store.decadeOf(year)}s`, { focusYear: year, keyboard });

    this.on(this.el, 'click', (e) => {
      const p = e.target.closest('.print');
      if (p) this.app.openPhoto(p);
    });
    this.later(attachTip(this.el, (p) => {
      const ph = store.photo(p.dataset.pid);
      return ph && { kicker: ph.date, title: ph.title };
    }));

    if (canHover() && !reduceMotion()) this.parallax();
  }

  topbar() { return { explore: true, sample: true, searchSep: true }; }

  shared() {
    const m = new Map();
    for (const [id, n] of this.prints) m.set(`p:${id}`, n);
    return m;
  }

  /** Move a print to its depth's twin layer, above every other print on the table. */
  raise(p) {
    const i = +p.dataset.layer;
    if (p.parentNode === this.tops[i]) return;
    this.tops[i].append(p);
  }

  /** Put it back in its own layer, in its old place in the pile. */
  lower(p) {
    const i = +p.dataset.layer;
    const layer = this.layers[i];
    if (!layer || p.parentNode === layer) return;
    const pile = this.stacks[i];
    const next = pile.slice(pile.indexOf(p) + 1).find((n) => n.parentNode === layer);
    layer.insertBefore(p, next || null);
  }

  /** Fit the table to the window, filling it a little past the edges like the real thing. */
  fit() {
    const vw = innerWidth, vh = innerHeight;
    const contain = Math.min(vw / HOME_W, vh / HOME_H);
    const cover = Math.max(vw / HOME_W, vh / HOME_H);
    const s = Math.min(cover, contain * 1.12);
    const over = HOME_H * s - vh;
    // Keep the top row of decade names clear of the top bar on short windows.
    const y = Math.max(over > 0 ? -over * 0.12 : -over / 2, 64 - 54 * s);
    this.cam.to((vw - HOME_W * s) / 2, y, s, { immediate: true });
  }

  place() {
    const p = this.cam.toScreen(HERO_AT.x, HERO_AT.y);
    this.hero.style.left = `${p.x}px`;
    this.hero.style.top = `${p.y}px`;
    this.hero.style.setProperty('--k', this.cam.s.toFixed(4));
  }

  onResize() {
    this.fit();
    this.timeline.preview(null);
  }

  /** The three layers lean with the pointer by different amounts (their slow idle drift is pure CSS). */
  parallax() {
    const fx = new Follow(0, 0.35), fy = new Follow(0, 0.35);
    let running = false;
    let stop = null;
    this.later(() => stop?.());
    const loop = (dt) => {
      if (!this.alive) return false;
      const a = fx.step(dt), b = fy.step(dt);
      this.layers.forEach((l, i) => {
        l.style.transform = this.tops[i].style.transform = `translate3d(${(-fx.value * DEPTH[i]).toFixed(2)}px, ${(-fy.value * DEPTH[i]).toFixed(2)}px, 0)`;
      });
      this.shift.style.transform = `translate3d(${(fx.value * 6).toFixed(2)}px, ${(fy.value * 5).toFixed(2)}px, 0)`;
      running = a || b;
      return running;
    };
    this.on(window, 'pointermove', (e) => {
      if (e.pointerType !== 'mouse') return;
      fx.target = (e.clientX / innerWidth - 0.5) * 2;
      fy.target = (e.clientY / innerHeight - 0.5) * 2;
      if (!running) { running = true; stop = tick(loop); }
    }, { passive: true });
  }

  /** Light up one decade (and one year in it) and let the rest of the table fall back. */
  focus(decade, year = null) {
    if (this.focused === decade && this.focusedYear === year) return;
    this.focused = decade;
    this.focusedYear = year;
    for (const [d, list] of this.byDecade) {
      // The picked decade's prints lift one after another, left to right, like a wave.
      const order = [...list].sort((a, b) => parseFloat(a.style.left) - parseFloat(b.style.left));
      order.forEach((p, i) => {
        const inDecade = decade != null && d === decade;
        p.classList.toggle('is-dim', decade != null && !inDecade);
        p.classList.toggle('is-focus', inDecade && year != null && store.photo(p.dataset.pid)?.year === year);
        p.style.setProperty('--wd', `${inDecade ? i * 22 : 0}ms`);
        p.classList.toggle('is-lift', inDecade);
      });
    }
    for (const l of this.labels) {
      l.classList.toggle('is-dim', decade != null && +l.dataset.decade !== decade);
      l.classList.toggle('is-on', +l.dataset.decade === decade);
    }
    this.el.classList.toggle('is-focusing', decade != null);
  }

  enter(ctx) {
    if (ctx.dir === 0) return this.intro();
    if (ctx.dir === -1) return this.gather(ctx);
    return super.enter(ctx);
  }

  /** First visit: the decades are dealt onto the table one after another, then the title rises. */
  intro() {
    const rand = seeded('intro');
    const decs = store.decades();
    const anims = [];
    for (const p of this.prints.values()) {
      const di = decs.indexOf(+p.dataset.decade);
      const r = +p.dataset.rot;
      const dx = (rand() - 0.5) * 70, dy = -50 - rand() * 50;
      anims.push(this.anim(p, [
        { opacity: 0, transform: `translate(${dx}px, ${dy}px) rotate(${r + (rand() - 0.5) * 18}deg) scale(1.16)` },
        { opacity: 1, transform: `translate(0px, 0px) rotate(${r}deg) scale(1)` },
      ], { duration: 1100, delay: 150 + di * 105 + rand() * 280, easing: SPRING, fill: 'backwards' }));
    }
    this.labels.forEach((l) => {
      const di = decs.indexOf(+l.dataset.decade);
      anims.push(this.anim(l, [{ opacity: 0, transform: 'translateY(14px)' }, { opacity: 1, transform: 'none' }], { duration: 900, delay: 520 + di * 105, easing: EASE, fill: 'backwards' }));
    });
    this.heroIn(620);
    hudIn(this.timeline.node, 1250);
    return Promise.all(anims.map((a) => a.finished.catch(() => {})));
  }

  heroIn(delay) {
    this.words.forEach((w, i) => {
      this.anim(w, [
        { opacity: 0, transform: 'translateY(0.35em)', filter: 'blur(12px)' },
        { opacity: 1, transform: 'none', filter: 'blur(0px)' },
      ], { duration: 1300, delay: delay + i * 110, easing: EASE, fill: 'backwards' });
    });
    this.anim(this.sub, [{ opacity: 0, transform: 'translateY(10px)' }, { opacity: 1, transform: 'none' }], { duration: 1000, delay: delay + 520, easing: EASE, fill: 'backwards' });
    this.anim(this.rule, [{ transform: 'scaleX(0)' }, { transform: 'scaleX(1)' }], { duration: 1100, delay: delay + 760, easing: EASE, fill: 'backwards' });
  }

  /** Coming back out of a decade: the rest of the table settles back around the prints flying home. */
  gather({ flying }) {
    const rand = seeded('gather');
    const anims = [];
    for (const [id, p] of this.prints) {
      if (flying.has(`p:${id}`)) continue;
      const r = +p.dataset.rot;
      anims.push(this.anim(p, [
        { opacity: 0, transform: `rotate(${r}deg) scale(0.86)` },
        { opacity: 1, transform: `rotate(${r}deg) scale(1)` },
      ], { duration: 900, delay: 40 + rand() * 300, easing: SPRING, fill: 'backwards' }));
    }
    this.labels.forEach((l, i) => anims.push(this.anim(l, [{ opacity: 0 }, { opacity: 1 }], { duration: 700, delay: 250 + i * 30, fill: 'backwards' })));
    anims.push(this.anim(this.hero, [{ opacity: 0, transform: 'translate(-50%, -50%) scale(0.96)' }, { opacity: 1, transform: 'translate(-50%, -50%) scale(1)' }], { duration: 900, delay: 200, easing: EASE, fill: 'backwards' }));
    return Promise.all(anims.map((a) => a.finished.catch(() => {})));
  }

  leave(ctx) {
    this.focus(null);
    return super.leave(ctx);
  }

  destroy() {
    this.cam.destroy();
    super.destroy();
  }
}
