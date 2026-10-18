import { View, yearHref, filmCard } from './base.js';
import { el, icon, plural, seeded, isPhone, clamp, reduceMotion } from '../util.js';
import { SPRING } from '../anim.js';
import { makePrint, attachTip, setPrintBox } from '../print.js';
import { justify } from '../layout.js';
import { Pillbar } from '../hud.js';
import * as store from '../store.js';

/** A year: its events in order, each a justified spread of prints, home movies first. */
export class YearView extends View {
  constructor(app, route) { super(app, route, 'year-view'); }

  mount() {
    const y = this.route.year;
    const d = store.decadeOf(y);
    const photos = store.photosInYear(y);
    const movies = store.moviesInYear(y);
    const groups = store.yearGroups(y);

    this.el.append(el('header', { class: 'yv-head' },
      el('div', null,
        el('p', { class: 'eyebrow yv-eyebrow' }, el('a', { href: `#/${d}s` }, `The ${d}s`)),
        el('h1', null, String(y)),
        el('p', null, store.yearSummary(y))),
      el('div', { class: 'yv-stats' },
        el('span', null, plural(photos.length, 'photo')),
        movies.length ? el('span', null, plural(movies.length, 'home movie')) : null,
        groups.some((g) => g.event) ? el('span', null, plural(groups.filter((g) => g.event).length, 'event')) : null)));

    this.list = [];
    this.grids = [];
    this.prints = new Map();
    this.films = new Map();
    const rand = seeded(`year-${y}`);
    for (const g of groups) {
      const ev = g.event;
      const head = el('header', { class: 'yv-event-head' },
        el('div', null,
          el('h2', null, ev ? ev.title : (groups.length > 1 ? `More from ${y}` : `${y}`)),
          ev?.description ? el('p', null, ev.description) : null),
        el('div', { class: 'meta' },
          ev ? el('span', null, ev.date) : null,
          ev?.place ? el('span', null, ev.place) : null,
          el('span', null, plural(g.photos.length, 'photo'))));
      const grid = el('div', { class: 'yv-grid' });
      const items = [];
      for (const m of g.movies) {
        const card = filmCard(m);
        grid.append(card);
        this.films.set(m.id, card);
        items.push({ a: 16 / 8.2, full: true, node: card });
      }
      for (const p of g.photos) {
        const r = (rand() - 0.5) * 2.6;
        const node = makePrint(p, { r, size: 's', tag: 'button' });
        grid.append(node);
        this.prints.set(p.id, node);
        this.list.push(p);
        items.push({ a: p.w / p.h, node, photo: p, r });
      }
      const sec = el('section', { class: 'yv-event', id: ev ? `e-${ev.id}` : 'e-more', dataset: { event: ev?.id || '' } }, head, grid);
      this.el.append(sec);
      this.grids.push({ grid, items, sec });
    }

    const all = store.allYears();
    const i = all.indexOf(y);
    this.prevYear = all[i - 1];
    this.nextYear = all[i + 1];
    this.el.append(el('nav', { class: 'yv-next', 'aria-label': 'Other years' },
      this.prevYear ? el('a', { href: yearHref(this.prevYear), class: 'yv-prev' }, icon('arrowLeft', 20), el('span', null, el('small', null, 'Earlier'), String(this.prevYear))) : el('span'),
      this.nextYear ? el('a', { href: yearHref(this.nextYear), class: 'yv-after' }, el('span', null, el('small', null, 'Later'), String(this.nextYear)), icon('arrowRight', 20)) : el('span')));

    this.layout();

    const years = store.yearsInDecade(d);
    this.pills = this.app.useHud('pills', `decade-${d}`, () => new Pillbar({
      items: years.map((yy) => ({ value: yy, label: String(yy), href: yearHref(yy) })),
      active: y,
      label: `Years in the ${d}s`,
    }));
    this.pills.setHandlers({ onHover: null, onPick: null });
    this.pills.setActive(y);

    this.on(this.el, 'click', (e) => {
      const p = e.target.closest('.print');
      if (!p) return;
      this.app.openViewer(this.list, this.list.findIndex((x) => x.id === p.dataset.pid), p);
    });
    this.later(attachTip(this.el, (n) => {
      if (n.classList.contains('film-card')) return null;
      const ph = store.photo(n.dataset.pid);
      return ph && { kicker: ph.date, title: ph.title };
    }));
    this.reveal([...this.el.querySelectorAll('.yv-grid .print, .yv-grid .film-card')]);
  }

  layout() {
    const phone = isPhone();
    const W = this.grids[0]?.grid.clientWidth || Math.min(innerWidth - 56, 1384);
    this.W = W;
    const rowH = phone ? clamp(W * 0.42, 130, 190) : clamp(innerWidth * 0.19, 210, 320);
    const gap = phone ? 12 : 26;
    for (const g of this.grids) {
      const res = justify(g.items, W, rowH, gap);
      for (const it of res.items) {
        if (it.photo) setPrintBox(it.node, { x: it.x, y: it.y, w: it.w, h: it.h, r: it.r * (phone ? 0.6 : 1) });
        else Object.assign(it.node.style, { left: `${it.x}px`, top: `${it.y}px`, width: `${it.w}px`, height: `${it.h}px` });
      }
      g.grid.style.height = `${res.h}px`;
    }
  }

  onResize() {
    const W = this.grids[0]?.grid.clientWidth;
    if (W && Math.abs(W - this.W) > 1) this.layout();
    this.pills.setActive(this.route.year, true);
  }

  topbar() {
    const d = store.decadeOf(this.route.year);
    return { crumbs: [{ label: 'All years', href: '#/' }, { label: `${d}s`, href: `#/${d}s` }, { label: String(this.route.year) }], barOnScroll: true };
  }

  shared() {
    const m = new Map();
    for (const [id, n] of this.prints) m.set(`p:${id}`, n);
    for (const [id, n] of this.films) m.set(`m:${id}`, n);
    return m;
  }

  initialScroll() {
    if (!this.route.event) return 0;
    const sec = this.el.querySelector(`#e-${CSS.escape(this.route.event)}`);
    return sec ? Math.max(0, sec.offsetTop - 96) : 0;
  }

  update(route) {
    if (route.year !== this.route.year) return false;
    this.route = route;
    const top = this.initialScroll();
    window.scrollTo({ top, behavior: reduceMotion() ? 'auto' : 'smooth' });
    return true;
  }

  keydown(e) {
    if (e.key === 'ArrowLeft' && this.prevYear) { this.app.go(yearHref(this.prevYear)); return true; }
    if (e.key === 'ArrowRight' && this.nextYear) { this.app.go(yearHref(this.nextYear)); return true; }
    return false;
  }

  enter(ctx) {
    if (ctx.dir !== 1 && ctx.dir !== -1) return super.enter(ctx);
    // Into a year from its decade: the head rises, prints already on screen settle in around the ones in flight.
    const head = this.el.querySelector('.yv-head');
    const anims = [this.anim(head, [{ opacity: 0, transform: 'translateY(28px)' }, { opacity: 1, transform: 'none' }], { duration: 1000, delay: 140, easing: SPRING, fill: 'backwards' })];
    for (const h of this.el.querySelectorAll('.yv-event-head')) {
      anims.push(this.anim(h, [{ opacity: 0, transform: 'translateY(18px)' }, { opacity: 1, transform: 'none' }], { duration: 900, delay: 260, easing: SPRING, fill: 'backwards' }));
    }
    return Promise.all(anims.map((a) => a.finished.catch(() => {})));
  }
}
