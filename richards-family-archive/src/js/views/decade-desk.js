import { View, yearHref, decadeHref, playChip } from './base.js';
import { el, icon, clamp, plural, reduceMotion } from '../util.js';
import { SPRING, EASE } from '../anim.js';
import { makePrint, attachTip, sharpen } from '../print.js';
import { decadeLayout, ghostLayout } from '../layout.js';
import { Camera } from '../camera.js';
import { drag } from '../gesture.js';
import { Pillbar, Zoomer } from '../hud.js';
import { revealWords, countUp } from '../motion.js';
import * as store from '../store.js';

/** Desktop decade: a table you can drag and zoom, one cluster of prints per year. */
export class DecadeDesk extends View {
  constructor(app, route) { super(app, route, 'decade-desk is-fixed'); }
  get fixed() { return true; }

  mount() {
    const d = this.route.decade;
    const L = (this.L = decadeLayout(d));
    this.table = el('div', { class: 'table' });
    this.prints = new Map();
    this.clusters = new Map();

    const nPhotos = store.photosInDecade(d).length;
    const nMovies = store.moviesInDecade(d).length;
    this.titleEl = el('div', { class: 'decade-title', style: { left: `${L.title.x}px`, top: `${L.title.y}px` } },
      el('h1', null, `The ${d}s.`),
      el('p', null, store.tagline(d)),
      el('p', { class: 'stats' }, `${plural(nPhotos, 'photo')}${nMovies ? ` · ${plural(nMovies, 'home movie')}` : ''}`),
      playChip(`Play the ${d}s`, () => this.app.play(store.photosInDecade(d), { title: `the ${d}s`, years: true })));
    this.table.append(this.titleEl);

    for (const c of L.clusters) {
      const node = el('div', { class: 'cluster', style: { left: `${c.x}px`, top: `${c.y}px`, width: `${c.w}px`, height: `${c.h}px` }, dataset: { year: String(c.year) } });
      const label = el('a', { class: 'cluster-year', href: yearHref(c.year), tabindex: '-1', style: { left: `${c.prints[0]?.x + 34 || 34}px` } }, String(c.year),
        c.movie ? el('span', { class: 'cluster-film', title: 'Has a home movie' }, icon('film', 18)) : null);
      node.append(label);
      c.prints.forEach((pr, i) => {
        const p = makePrint(pr.photo, { w: pr.w, h: pr.h, x: pr.x, y: pr.y, r: pr.r, z: pr.lead ? 3 : 4 + i, size: pr.lead ? 'l' : 's', eager: true });
        if (pr.lead) p.classList.add('lead');
        node.append(p);
        this.prints.set(pr.photo.id, p);
      });
      const explore = el('a', { class: 'cluster-explore', href: yearHref(c.year), style: { left: `${c.w / 2}px`, top: `${c.h + 44}px` } },
        el('span', { class: 'yr' }, String(c.year)),
        el('span', { class: 'go' }, `Explore ${c.year}`, icon('arrowRight', 22)));
      node.append(explore);
      node.addEventListener('pointerenter', () => this.select(c.year));
      this.table.append(node);
      this.clusters.set(c.year, { ...c, node });
    }

    // Neighbouring decades fade in at the edges.
    const decs = store.decades();
    const i = decs.indexOf(d);
    this.ghosts = [];
    for (const [side, nd] of [[-1, decs[i - 1]], [1, decs[i + 1]]]) {
      if (nd == null) continue;
      const g = ghostLayout(nd, side, L);
      const a = el('a', { class: `ghost ghost-${side < 0 ? 'l' : 'r'}`, href: decadeHref(nd), 'aria-label': `The ${nd}s` });
      for (const pr of g.prints) a.append(makePrint(pr.photo, { w: pr.w, h: pr.h, x: pr.x, y: pr.y, r: pr.r, lift: false }));
      a.append(el('span', { class: 'ghost-label', style: { left: `${g.label.x}px`, top: `${g.label.y}px` } }, `${nd}s`));
      this.table.append(a);
      this.ghosts.push(a);
    }
    this.el.append(this.table);

    this.cam = new Camera(this.table, { min: 0.18, max: 2.2, onChange: (c) => this.zoomer?.set(c.s) });
    // Zoomed in close, small prints swap their thumbnails for the large scans.
    this.cam.onSettle = (c) => { for (const p of this.prints.values()) sharpen(p, p.offsetWidth * c.s); };
    this.cam.setWorld(L.w, L.h);
    this.insets();
    this.cam.fit(undefined, { immediate: true });
    this.home = { x: this.cam.x, y: this.cam.y, s: this.cam.s };

    // Year pills, shared with the year pages of this decade.
    const years = store.yearsInDecade(d);
    this.pills = this.app.useHud('pills', `decade-${d}`, () => new Pillbar({
      items: years.map((y) => ({ value: y, label: String(y), href: yearHref(y) })),
      active: null,
      label: `Years in the ${d}s`,
    }));
    this.pills.setHandlers({ onHover: (y) => { if (y != null) this.select(y, { reveal: true }); }, onPick: null });
    this.zoomer = this.app.useHud('zoomer', 'decade', () => new Zoomer({
      onZoom: (f) => this.zoomBy(f),
      onFit: () => this.fitAll(),
      onFull: () => this.app.toggleFullscreen(),
    }));
    this.zoomer.set(this.cam.s);

    const pick = this.app.take('focusYear');
    const from = this.app.from;
    const fromYear = from && store.decadeOf(from.year || 0) === d ? from.year : null;
    const busiest = years.reduce((a, y) => (store.photosInYear(y).length > store.photosInYear(a).length ? y : a), years[0]);
    this.select(years.includes(pick) ? pick : fromYear || busiest, { instant: true });

    this.gestures();
    this.later(attachTip(this.table, (p) => {
      const ph = store.photo(p.dataset.pid);
      if (!ph || p.closest('.ghost')) return null;
      return { kicker: ph.date, title: ph.title };
    }, { above: true }));
  }

  topbar() {
    return { crumbs: [{ label: 'All years', href: '#/' }, { label: `${this.route.decade}s` }], sample: true };
  }

  shared() {
    const m = new Map();
    for (const [id, n] of this.prints) m.set(`p:${id}`, n);
    return m;
  }

  /** Pan the table so a print is on screen (for a photo being put back). */
  bringIntoView(node) {
    const b = node.getBoundingClientRect();
    const v = this.cam.view();
    if (b.left >= v.x && b.right <= v.x + v.w && b.top >= v.y && b.bottom <= v.y + v.h) return true;
    const w = this.cam.toWorld(b.left + b.width / 2, b.top + b.height / 2);
    this.cam.centerOn(w.x, w.y, Math.max(this.cam.ts, Math.min(1, this.home.s)));
    this.fitted = false;
    return true;
  }

  insets() {
    const side = Math.max(70, innerWidth * 0.05);
    this.cam.setInsets({ top: 70, bottom: 104, left: side, right: side });
  }

  fitAll() {
    this.cam.fit();
    this.fitted = true;
  }

  zoomBy(f) {
    this.cam.zoomAt(innerWidth / 2, innerHeight / 2, f);
    this.fitted = false;
  }

  onResize() {
    this.insets();
    if (this.fitted !== false) this.cam.fit(undefined, { immediate: true });
    else this.cam.clampTargets();
    this.pills.setActive(this.selected, true);
  }

  /** Highlight a year's cluster: it glows and offers "Explore 1976 →". */
  select(year, { instant = false, reveal = false } = {}) {
    if (!this.clusters.has(year)) return;
    if (this.selected !== year) {
      this.selected = year;
      for (const [y, c] of this.clusters) c.node.classList.toggle('is-on', y === year);
      this.pills.setActive(year, instant);
    }
    if (reveal) this.ensureVisible(year);
  }

  ensureVisible(year) {
    const c = this.clusters.get(year);
    const v = this.cam.view();
    const a = this.cam.toScreen(c.x, c.y);
    const b = this.cam.toScreen(c.x + c.w, c.y + c.h + 110);
    if (a.x >= v.x && b.x <= v.x + v.w && a.y >= v.y && b.y <= v.y + v.h) return;
    this.cam.centerOn(c.x + c.w / 2, c.y + c.h / 2 + 40, this.cam.ts);
    this.fitted = false;
  }

  gestures() {
    let last = null;
    let dragged = false;
    const stopDrag = drag(this.el, {
      onStart: () => { last = { dx: 0, dy: 0 }; dragged = false; this.cam.vx = this.cam.vy = 0; },
      onMove: ({ dx, dy }) => {
        if (!last) return;
        dragged = true;
        this.el.classList.add('is-dragging');
        this.cam.panBy(dx - last.dx, dy - last.dy);
        last = { dx, dy };
        this.fitted = false;
      },
      onEnd: ({ vx, vy, tap }) => {
        this.el.classList.remove('is-dragging');
        if (!tap && dragged) this.cam.fling(vx, vy);
        last = null;
        setTimeout(() => { dragged = false; }, 0);
      },
      onPinch: ({ scale, cx, cy }) => {
        if (!this.pinch) this.pinch = { s: this.cam.ts };
        const target = clamp(this.pinch.s * scale, this.cam.min, this.cam.max);
        this.cam.zoomAt(cx, cy, target / this.cam.ts);
        this.fitted = false;
        last = null;
      },
      onPinchEnd: () => { this.pinch = null; },
    }, { filter: (e) => !e.target.closest('a.cluster-explore') });
    this.later(stopDrag);

    // A drag that started on a print is not a click. A click on a print brings it closer;
    // the year's name and "Explore" open the whole year.
    this.on(this.el, 'click', (e) => {
      if (dragged) { e.preventDefault(); e.stopPropagation(); return; }
      const p = e.target.closest('.print');
      if (p && !p.closest('.ghost')) this.app.openPhoto(p);
    }, true);

    this.on(this.el, 'wheel', (e) => {
      e.preventDefault();
      const mouseWheel = e.deltaMode === 1 || (e.deltaX === 0 && Math.abs(e.deltaY) >= 50 && Number.isInteger(e.deltaY));
      if (e.ctrlKey || e.metaKey || mouseWheel) {
        const k = e.deltaMode === 1 ? 0.05 : e.ctrlKey ? 0.012 : 0.0022;
        this.cam.zoomAt(e.clientX, e.clientY, Math.exp(-e.deltaY * k));
      } else {
        this.cam.panBy(-e.deltaX, -e.deltaY);
      }
      this.fitted = false;
    }, { passive: false });
  }

  keydown(e) {
    const years = [...this.clusters.keys()];
    const i = years.indexOf(this.selected);
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { this.select(years[Math.min(years.length - 1, i + 1)], { reveal: true }); return true; }
    if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { this.select(years[Math.max(0, i - 1)], { reveal: true }); return true; }
    if (e.key === 'Enter') { this.app.go(yearHref(this.selected)); return true; }
    if (e.key === '+' || e.key === '=') { this.zoomBy(1.25); return true; }
    if (e.key === '-' || e.key === '_') { this.zoomBy(1 / 1.25); return true; }
    if (e.key === '0') { this.fitAll(); return true; }
    if (e.key === 'f' || e.key === 'F') { this.app.toggleFullscreen(); return true; }
    return false;
  }

  textIn() {
    const [h1, tag, stats, play] = this.titleEl.children;
    revealWords(h1, { delay: 150, stagger: 90, duration: 1200 });
    revealWords(tag, { delay: 420, stagger: 40, duration: 1000 });
    this.anim(stats, [{ opacity: 0 }, { opacity: 1 }], { duration: 800, delay: 700, fill: 'backwards' });
    countUp(stats, { delay: 700 });
    this.anim(play, [{ opacity: 0, transform: 'translateY(16px)' }, { opacity: 1, transform: 'none' }], { duration: 1000, delay: 900, easing: SPRING, fill: 'backwards' });
  }

  enter(ctx) {
    this.textIn();
    if (ctx.dir === 2 || ctx.dir === -2 || ctx.dir === 0) return super.enter(ctx);
    // Zooming in from the home table or back out of a year: everything not in flight settles in.
    const anims = [];
    const deeper = ctx.dir === 1;
    for (const [id, p] of this.prints) {
      if (ctx.flying.has(`p:${id}`)) continue;
      const r = +p.dataset.rot;
      anims.push(this.anim(p, [
        { opacity: 0, transform: `rotate(${r}deg) scale(${deeper ? 0.8 : 1.12})` },
        { opacity: 1, transform: `rotate(${r}deg) scale(1)` },
      ], { duration: 950, delay: 120 + Math.random() * 260, easing: SPRING, fill: 'backwards' }));
    }
    for (const c of this.clusters.values()) {
      anims.push(this.anim(c.node.querySelector('.cluster-year'), [{ opacity: 0, transform: 'translateY(10px)' }, { opacity: 1, transform: 'none' }], { duration: 800, delay: 350 + Math.random() * 200, easing: EASE, fill: 'backwards' }));
    }
    this.ghosts.forEach((g) => anims.push(this.anim(g, [{ opacity: 0 }, { opacity: 1 }], { duration: 1200, delay: 500, fill: 'backwards' })));
    return Promise.all(anims.map((a) => a.finished.catch(() => {})));
  }

  leave(ctx) {
    if (ctx.dir === 1) {
      // Into a year: the other clusters drift apart as we "lean in".
      const c = this.clusters.get(ctx.to?.route?.year);
      if (c && !reduceMotion()) {
        const p = this.cam.toScreen(c.x + c.w / 2, c.y + c.h / 2);
        this.el.style.transformOrigin = `${p.x}px ${p.y}px`;
      }
    }
    return super.leave(ctx);
  }

  destroy() {
    this.cam.destroy();
    super.destroy();
  }
}
