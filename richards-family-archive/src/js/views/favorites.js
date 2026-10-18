import { YearView } from './year.js';
import { filmCard, decadeHref } from './base.js';
import { el, icon, plural, seeded } from '../util.js';
import { makePrint, attachTip } from '../print.js';
import { revealWords, countUp } from '../motion.js';
import * as store from '../store.js';

/** The photos and films this browser has hearted. */
export class FavoritesView extends YearView {
  constructor(app, route) {
    super(app, route);
    this.el.classList.add('fav-view');
  }

  mount() {
    const ids = store.favorites();
    const photos = ids.map(store.photo).filter(Boolean);
    const order = new Map(store.allPhotos().map((p, i) => [p.id, i]));
    photos.sort((a, b) => order.get(a.id) - order.get(b.id));
    const movies = ids.map(store.movie).filter(Boolean);

    this.el.append(el('header', { class: 'yv-head' },
      el('div', null,
        el('p', { class: 'eyebrow yv-eyebrow' }, 'Saved on this device'),
        el('h1', null, 'Favorites'),
        el('p', null, photos.length || movies.length ? 'The moments you keep coming back to.' : 'Nothing saved yet.')),
      el('div', { class: 'yv-stats' },
        el('span', null, plural(photos.length, 'photo')),
        movies.length ? el('span', null, plural(movies.length, 'home movie')) : null)));

    this.list = photos;
    this.grids = [];
    this.prints = new Map();
    this.films = new Map();

    if (!photos.length && !movies.length) {
      const busiest = store.decades().reduce((a, d) => (store.photosInDecade(d).length > store.photosInDecade(a).length ? d : a));
      this.el.append(el('div', { class: 'fav-empty' },
        el('span', { class: 'fav-heart', 'aria-hidden': 'true' }, icon('heart', 40, 1.2)),
        el('p', null, 'Tap the heart on any photo or film and it will wait for you here.'),
        el('div', { class: 'fav-links' },
          el('a', { class: 'chip', href: decadeHref(busiest) }, `Start with the ${busiest}s`, icon('arrowRight', 16)),
          el('button', { class: 'chip', type: 'button', onclick: () => this.app.surprise() }, icon('shuffle', 16), 'Surprise me'))));
    } else {
      const rand = seeded('favorites');
      const grid = el('div', { class: 'yv-grid' });
      const items = [];
      for (const m of movies) {
        const card = filmCard(m);
        grid.append(card);
        this.films.set(m.id, card);
        items.push({ a: 16 / 8.2, full: true, node: card });
      }
      for (const p of photos) {
        const r = (rand() - 0.5) * 2.6;
        const node = makePrint(p, { r, size: 's', tag: 'button' });
        grid.append(node);
        this.prints.set(p.id, node);
        items.push({ a: p.w / p.h, node, photo: p, r });
      }
      const sec = el('section', { class: 'yv-event' }, grid);
      this.el.append(sec);
      this.grids.push({ grid, items, sec });
      this.layout();
      this.reveal([...grid.children]);
    }

    this.on(this.el, 'click', (e) => {
      const p = e.target.closest('.print');
      if (!p) return;
      this.app.openViewer(this.list, this.list.findIndex((x) => x.id === p.dataset.pid), p);
    });
    this.later(attachTip(this.el, (n) => {
      const ph = store.photo(n.dataset.pid);
      return ph && { kicker: ph.date, title: ph.title };
    }));
    // Un-hearting from the viewer takes the photo off this page once the viewer closes.
    this.later(store.onFavChange(() => { this.dirty = true; }));
  }

  textIn() {
    revealWords(this.el.querySelector('.yv-head h1'), { delay: 120 });
    this.el.querySelectorAll('.yv-stats span').forEach((s, i) => countUp(s, { delay: 250 + i * 120 }));
  }

  headingsRise() {}

  onViewerClosed() {
    if (this.dirty) { this.dirty = false; this.app.rerender(); }
  }

  onResize() {
    const W = this.grids[0]?.grid.clientWidth;
    if (W && Math.abs(W - this.W) > 1) this.layout();
  }

  topbar() { return { crumbs: [{ label: 'All years', href: '#/' }, { label: 'Favorites' }], barOnScroll: true }; }
  initialScroll() { return 0; }
  update() { return false; }
  keydown() { return false; }
}
