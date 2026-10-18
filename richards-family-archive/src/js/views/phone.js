import { View, yearHref, decadeHref, filmCard } from './base.js';
import { el, icon, clamp, plural, seeded, reduceMotion } from '../util.js';
import { SPRING, EASE } from '../anim.js';
import { makePrint } from '../print.js';
import { heroLayout, streamLayout, yearCollage, pickDecade, heroIds } from '../layout.js';
import { Dock, hudIn } from '../hud.js';
import * as store from '../store.js';

const smooth = (t) => t * t * (3 - 2 * t);

/**
 * Scroll-spy shared by the phone pages: each section gets a focus value (0..1) by how close it
 * is to the middle of the screen, and the dock follows the most focused one. A section's
 * apply(f) styles the few elements that react to it; writing them directly rather than through
 * an inherited CSS variable keeps scrolling from restyling every print in the section.
 */
function spy(view, sections, dock) {
  let raf = 0;
  let lock = null;
  const update = () => {
    raf = 0;
    if (!view.alive) return;
    const vh = innerHeight;
    let best = -1, bestF = -1;
    const rects = sections.map((s) => s.node.getBoundingClientRect());
    sections.forEach((s, i) => {
      const r = rects[i];
      const c = s.center ? r.top + r.height / 2 : r.top + Math.min(r.height, vh) * 0.42;
      const f = smooth(clamp(1 - Math.abs(c - vh * 0.46) / (vh * (s.center ? 0.5 : 0.62)), 0, 1));
      // Sections far off screen keep their last value; there is nothing to see there.
      if (s.apply && Math.abs((s.f ?? -1) - f) > 0.004 && r.bottom > -vh && r.top < vh * 2) { s.f = f; s.apply(f); }
      if (f > bestF) { bestF = f; best = i; }
    });
    if (lock) {
      if (Math.abs(window.scrollY - lock.y) < 4 || performance.now() > lock.until) lock = null;
      else return;
    }
    if (best >= 0 && bestF > 0.05) dock.setIndex(best);
    view.onSpy?.(best, bestF);
  };
  const onScroll = () => { if (!raf) raf = requestAnimationFrame(update); };
  view.on(window, 'scroll', onScroll, { passive: true });
  view.later(() => cancelAnimationFrame(raf));
  dock.onPick = (_, i) => {
    const s = sections[i];
    const r = s.node.getBoundingClientRect();
    const y = Math.max(0, r.top + window.scrollY - (s.center ? innerHeight * 0.46 - r.height / 2 : s.offset ?? 76));
    lock = { y, until: performance.now() + 1400 };
    window.scrollTo({ top: y, behavior: reduceMotion() ? 'auto' : 'smooth' });
  };
  return update;
}

/** Phone home: a collage hero with the title, then each decade's collage with its name beneath. */
export class HomeMob extends View {
  constructor(app, route) { super(app, route, 'home-mob'); }

  mount() {
    const A = store.archive;
    const W = Math.min(innerWidth, 560);
    const H = Math.max(600, Math.round(innerHeight * 0.94));
    const off = (innerWidth - W) / 2;
    this.W = W;
    this.prints = new Map();
    const keep = (id, node) => {
      if (!this.prints.has(id)) this.prints.set(id, []);
      this.prints.get(id).push(node);
    };

    this.hero = el('div', { class: 'mob-hero', style: { height: `${H}px` } });
    this.heroItems = heroLayout(W, H).map((it) => {
      const p = makePrint(it.photo, { w: it.w, h: it.h, x: it.x + off, y: it.y, r: it.r, eager: true, lift: false });
      this.hero.append(p);
      keep(it.photo.id, p);
      return { node: p, depth: it.depth };
    });
    this.title = el('h1', { class: 'hero-title' });
    this.words = A.headline.split(' ').map((w, i) => {
      const s = el('span', { class: 'w' }, w);
      if (i) this.title.append(' ');
      this.title.append(s);
      return s;
    });
    this.sub = el('p', { class: 'hero-sub' }, A.subtitleMobile || A.subtitle);
    this.copy = el('div', { class: 'mob-hero-copy' }, this.title, this.sub);
    this.hero.append(this.copy);
    this.el.append(this.hero);

    // Sparse decades keep every photo, even ones already in the hero.
    const hero = heroIds();
    const decs = store.decades();
    this.sections = decs.map((d, i) => {
      const exclude = store.photosInDecade(d).length > 8 ? hero : [];
      const lay = streamLayout(pickDecade(d, 6, exclude), W, i);
      const collage = el('div', { class: 'mob-collage', style: { height: `${lay.h}px` } });
      for (const it of lay.items) {
        const p = makePrint(it.photo, { w: it.w, h: it.h, x: it.x + off, y: it.y, r: it.r, lift: false });
        collage.append(p);
        keep(it.photo.id, p);
      }
      const n = store.photosInDecade(d).length;
      const title = el('h2', { class: 'mob-decade-title' }, `${d}s`);
      const rule = el('span', { class: 'gold-rule', 'aria-hidden': 'true' });
      const name = el('a', { class: 'mob-decade-name', href: decadeHref(d) }, title, rule);
      const link = el('a', { class: 'mob-decade-link', href: decadeHref(d), 'aria-label': `Open the ${d}s, ${plural(n, 'photo')}` }, plural(n, 'photo'), icon('arrowRight', 16));
      const tag = el('p', { class: 'mob-tagline' }, store.tagline(d));
      const node = el('section', { class: 'mob-decade', id: `d-${d}`, 'aria-label': `The ${d}s` },
        collage, el('div', { class: 'mob-decade-head' }, name, link), tag);
      this.el.append(node);
      // In focus, the decade's name grows and slides to the middle under its photos.
      const sec = { node, value: d, center: true, name };
      sec.apply = (f) => {
        const S = 0.56 + 0.44 * f;
        const tx = f * (innerWidth / 2 - 22 - (S * sec.nameW) / 2);
        name.style.transform = `translate3d(${tx.toFixed(1)}px, 0, 0) scale(${S.toFixed(4)})`;
        title.style.opacity = (0.5 + 0.5 * f).toFixed(3);
        rule.style.opacity = f.toFixed(3);
        rule.style.transform = `scaleX(${f.toFixed(3)})`;
        link.style.opacity = (0.4 + 0.6 * f).toFixed(3);
        tag.style.opacity = (0.3 + 0.7 * f).toFixed(3);
      };
      return sec;
    });
    this.el.append(el('div', { class: 'mob-end' },
      el('span', { class: 'gold-rule', 'aria-hidden': 'true' }),
      el('p', null, `${plural(store.allPhotos().length, 'photo')} so far. More are added as the albums are scanned.`),
      el('div', { class: 'mob-end-links' },
        el('button', { class: 'chip', type: 'button', onclick: () => this.app.surprise() }, icon('shuffle', 18), 'Surprise me'),
        el('a', { class: 'chip', href: '#/favorites' }, icon('heart', 18), 'Favorites'))));

    this.dock = this.app.useHud('dock', 'decades', () => new Dock({
      items: decs.map((d) => ({ value: d, label: String(d) })),
      label: 'Decades',
    }));
    this.updateSpy = spy(this, this.sections, this.dock);

    this.on(this.el, 'click', (e) => {
      const p = e.target.closest('.print');
      if (!p) return;
      const list = store.allPhotos();
      this.app.openViewer(list, list.findIndex((x) => x.id === p.dataset.pid), p);
    });

    // Hero parallax: prints drift up at different speeds, the title sinks and fades.
    let raf = 0;
    const par = () => {
      raf = 0;
      const y = window.scrollY;
      if (y > H * 1.3) return;
      for (const it of this.heroItems) it.node.style.translate = `0 ${(-y * it.depth).toFixed(1)}px`;
      this.copy.style.translate = `0 ${(y * 0.3).toFixed(1)}px`;
      this.copy.style.opacity = String(clamp(1 - y / (H * 0.5), 0, 1));
    };
    this.on(window, 'scroll', () => { if (!raf) raf = requestAnimationFrame(par); }, { passive: true });
    this.later(() => cancelAnimationFrame(raf));
    this.parallax = par;
    this.reveal([...this.el.querySelectorAll('.mob-collage .print')]);
  }

  afterScroll() {
    for (const s of this.sections) s.nameW = s.name.offsetWidth;
    this.updateSpy();
    this.parallax();
  }

  topbar() { return { sample: true }; }

  /** A photo can be in the hero and in its decade; share whichever copy is on screen. */
  shared() {
    const m = new Map();
    for (const [id, nodes] of this.prints) {
      const seen = nodes.find((n) => { const r = n.getBoundingClientRect(); return r.bottom > 0 && r.top < innerHeight; });
      m.set(`p:${id}`, seen || nodes[nodes.length - 1]);
    }
    return m;
  }

  onResize() {
    if (Math.abs(Math.min(innerWidth, 560) - this.W) > 2) this.app.rerender();
  }

  enter(ctx) {
    if (ctx.dir !== 0) return super.enter(ctx);
    const rand = seeded('mob-intro');
    const anims = this.heroItems.map(({ node }, i) => {
      const r = +node.dataset.rot;
      return this.anim(node, [
        { opacity: 0, transform: `translate(${(rand() - 0.5) * 50}px, ${-40 - rand() * 40}px) rotate(${r + (rand() - 0.5) * 16}deg) scale(1.15)` },
        { opacity: 1, transform: `translate(0px, 0px) rotate(${r}deg) scale(1)` },
      ], { duration: 1050, delay: 120 + i * 70 + rand() * 120, easing: SPRING, fill: 'backwards' });
    });
    this.words.forEach((w, i) => this.anim(w, [
      { opacity: 0, transform: 'translateY(0.35em)', filter: 'blur(10px)' },
      { opacity: 1, transform: 'none', filter: 'blur(0px)' },
    ], { duration: 1200, delay: 650 + i * 110, easing: EASE, fill: 'backwards' }));
    this.anim(this.sub, [{ opacity: 0, transform: 'translateY(10px)' }, { opacity: 1, transform: 'none' }], { duration: 1000, delay: 1150, easing: EASE, fill: 'backwards' });
    hudIn(this.dock.node, 1300);
    return Promise.all(anims.map((a) => a.finished.catch(() => {})));
  }
}

/** Phone decade: the years of a decade stacked as little collages. */
export class DecadeMob extends View {
  constructor(app, route) { super(app, route, 'decade-mob'); }

  mount() {
    const d = this.route.decade;
    const W = Math.min(innerWidth, 560) - 24;
    this.W = W;
    this.prints = new Map();
    const years = store.yearsInDecade(d);
    const nPhotos = store.photosInDecade(d).length;
    const nMovies = store.moviesInDecade(d).length;
    this.head = el('header', { class: 'dm-head' },
      el('h1', null, `The ${d}s.`),
      el('p', null, store.tagline(d)),
      el('p', { class: 'dm-stats' }, `${plural(nPhotos, 'photo')}${nMovies ? ` · ${plural(nMovies, 'home movie')}` : ''} · ${plural(years.length, 'year')}`));
    this.el.append(this.head);

    this.sections = years.map((y) => {
      const photos = store.featuredForYear(y, 3);
      const lay = yearCollage(photos, W);
      const collage = el('a', { class: 'dm-collage', href: yearHref(y), style: { height: `${lay.h}px` }, 'aria-label': `Open ${y}` });
      for (const it of lay.items) {
        const p = makePrint(it.photo, { w: it.w, h: it.h, x: it.x + 12, y: it.y, r: it.r, lift: false });
        collage.append(p);
        this.prints.set(it.photo.id, p);
      }
      const n = store.photosInYear(y).length;
      const movie = store.moviesInYear(y)[0];
      const node = el('article', { class: 'dm-year', id: `y-${y}` },
        el('div', { class: 'dm-year-head' },
          el('h2', null, el('a', { href: yearHref(y) }, String(y))),
          el('a', { href: yearHref(y), class: 'dm-open' }, plural(n, 'photo'), icon('arrowRight', 16))),
        collage,
        movie ? filmCard(movie) : null,
        el('p', { class: 'dm-summary' }, store.yearSummary(y)));
      if (movie) node.querySelector('.film-card').classList.add('inline');
      this.el.append(node);
      return { node, value: y, offset: 70 };
    });

    const decs = store.decades();
    const i = decs.indexOf(d);
    const prev = decs[i - 1], next = decs[i + 1];
    this.el.append(el('nav', { class: 'dm-switch', 'aria-label': 'Other decades' },
      prev ? el('a', { href: decadeHref(prev) }, icon('arrowLeft', 16), `The ${prev}s`) : el('span'),
      next ? el('a', { href: decadeHref(next) }, `The ${next}s`, icon('arrowRight', 16)) : el('span')));

    this.dock = this.app.useHud('dock', `years-${d}`, () => new Dock({
      items: years.map((y) => ({ value: y, label: String(y) })),
      label: `Years in the ${d}s`,
    }));
    this.updateSpy = spy(this, this.sections, this.dock);
    this.reveal([...this.el.querySelectorAll('.dm-collage .print, .film-card')]);
  }

  /** Arriving from one of this decade's years, start with that year in view. */
  initialScroll() {
    const y = this.app.from?.year;
    const s = this.sections.find((x) => x.value === y);
    return s ? Math.max(0, s.node.offsetTop - 70) : 0;
  }

  afterScroll() { this.updateSpy(); }

  topbar() {
    return { crumbs: [{ label: 'All years', href: '#/' }, { label: `${this.route.decade}s` }] };
  }

  shared() {
    const m = new Map();
    for (const [id, n] of this.prints) m.set(`p:${id}`, n);
    for (const fc of this.el.querySelectorAll('.film-card')) m.set(`m:${fc.dataset.mid}`, fc);
    return m;
  }

  onResize() {
    if (Math.abs(Math.min(innerWidth, 560) - 24 - this.W) > 2) this.app.rerender();
  }
}
