import { el, icon, fmtTime } from '../util.js';
import { animate, EASE } from '../anim.js';
import * as store from '../store.js';

/**
 * A page of the archive. The router mounts it, asks it which prints it shares with the
 * page before (so those can fly across), then runs enter/leave together.
 * dir: 0 first load, 1 going deeper, -1 coming back out, 2 / -2 sideways to the next / previous.
 */
export class View {
  constructor(app, route, cls) {
    this.app = app;
    this.route = route;
    this.el = el('section', { class: `view ${cls}` });
    this.cleanups = [];
    this.anims = [];
    this.alive = true;
  }

  get fixed() { return false; }
  mount() {}
  topbar() { return {}; }
  /** key ('p:<photo id>' or 'm:<movie id>') -> element, for prints that can fly to the next page. */
  shared() { return new Map(); }
  /** Same page, new details (an event anchor, say). Return true when handled. */
  update() { return false; }
  onResize() {}

  /** The photos that have a print on this page, in the order the closer moves through them. */
  photoList() {
    const ids = new Set([...this.shared().keys()].filter((k) => k.startsWith('p:')).map((k) => k.slice(2)));
    return store.allPhotos().filter((p) => ids.has(p.id));
  }

  /** The print a photo goes back to when it is put down. */
  printFor(id) { return this.shared().get(`p:${id}`) || null; }

  on(target, type, fn, opts) {
    target.addEventListener(type, fn, opts);
    this.cleanups.push(() => target.removeEventListener(type, fn, opts));
  }

  later(fn) { if (typeof fn === 'function') this.cleanups.push(fn); }

  anim(node, keyframes, opts) {
    const a = animate(node, keyframes, opts);
    this.anims.push(a);
    a.finished.then(() => { const i = this.anims.indexOf(a); if (i >= 0) this.anims.splice(i, 1); }, () => {});
    return a;
  }

  /** The default entrance: the whole page drifts in, in the direction of travel. */
  enter({ dir }) {
    this.origin();
    const from = {
      0: { opacity: 0, transform: 'scale(1.01)' },
      1: { opacity: 0, transform: 'scale(0.965)' },
      [-1]: { opacity: 0, transform: 'scale(1.035)' },
      2: { opacity: 0, transform: 'translateX(6vw)' },
      [-2]: { opacity: 0, transform: 'translateX(-6vw)' },
    }[dir] || { opacity: 0 };
    const a = this.anim(this.el, [from, { opacity: 1, transform: 'none' }], { duration: dir ? 760 : 900, delay: dir === 1 ? 60 : 0, easing: EASE, fill: 'backwards' });
    return a.finished.catch(() => {});
  }

  leave({ dir }) {
    const to = {
      1: { opacity: 0, transform: 'scale(1.06)' },
      [-1]: { opacity: 0, transform: 'scale(0.95)' },
      2: { opacity: 0, transform: 'translateX(-6vw)' },
      [-2]: { opacity: 0, transform: 'translateX(6vw)' },
    }[dir] || { opacity: 0 };
    const a = this.anim(this.el, [{ opacity: 1, transform: 'none' }, to], { duration: 560, easing: 'cubic-bezier(0.4, 0, 0.2, 1)' });
    return a.finished.catch(() => {});
  }

  /** Scale around the middle of the screen, wherever the page is scrolled. */
  origin() {
    if (this.fixed) return;
    // A page in the flow starts at the top of the stage, so the scroll offset the router set is enough.
    // (Reading window.scrollY here would force a layout in the middle of the transition.)
    const top = this.el.classList.contains('is-leaving') ? -parseFloat(this.el.style.top || 0) : this.app.scrollTop ?? window.scrollY;
    this.el.style.transformOrigin = `50% ${top + (this.app.viewH ?? innerHeight) / 2}px`;
  }

  /** Pin the page where it is so the next one can take over the scroll position. */
  freeze() {
    const y = window.scrollY;
    this.el.classList.add('is-leaving');
    if (!this.fixed) this.el.style.top = `${-y}px`;
    this.origin();
  }

  /** Jump every running animation of this page to its end. */
  finish() {
    for (const a of [...this.anims]) { try { a.finish(); } catch { /* not finishable */ } }
  }

  /** Fade prints up as they scroll into view. */
  reveal(nodes) {
    if (!this.io) {
      this.io = new IntersectionObserver((entries) => {
        let i = 0;
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          this.io.unobserve(e.target);
          e.target.style.setProperty('--d', `${Math.min(i++ * 70, 420)}ms`);
          e.target.classList.add('is-in');
        }
      }, { rootMargin: '0px 0px -6% 0px', threshold: 0.06 });
      this.later(() => this.io.disconnect());
    }
    for (const n of nodes) {
      if (n.classList.contains('is-in')) continue;
      n.classList.add('rv');
      this.io.observe(n);
    }
  }

  destroy() {
    this.alive = false;
    for (const f of this.cleanups.splice(0)) { try { f(); } catch (e) { console.error(e); } }
    for (const a of this.anims.splice(0)) a.cancel();
    this.el.remove();
  }
}

/**
 * Show a print at once, skipping its scroll-in animation (it is about to be flown to).
 * The no-transition class lands in the same style change as is-in and is lifted two frames later,
 * so there is no need to force a layout here; callers measure all their prints in one go afterwards.
 */
export function revealNow(node) {
  if (!node.classList.contains('rv') || node.classList.contains('is-in')) return;
  node.classList.add('is-in', 'no-tr');
  requestAnimationFrame(() => requestAnimationFrame(() => node.classList.remove('no-tr')));
}

export function isShown(node) {
  return !!node && node.isConnected && (!node.classList.contains('rv') || node.classList.contains('is-in')) && node.style.visibility !== 'hidden';
}

export const yearHref = (y) => `#/${Math.floor(y / 10) * 10}s/${y}`;
export const decadeHref = (d) => `#/${d}s`;
export const movieHref = (m) => `#/${Math.floor(m.year / 10) * 10}s/${m.year}/${m.id}`;
export const eventHref = (e) => `#/${Math.floor(e.year / 10) * 10}s/${e.year}/${e.id}`;
export const photoHref = (p) => `#/${Math.floor(p.year / 10) * 10}s/${p.year}/${p.id}`;

/** "Play 1976": a pill that starts the slideshow. */
export function playChip(label, onPlay) {
  return el('button', { class: 'chip play-chip', type: 'button', onclick: (e) => onPlay(e.currentTarget) },
    el('span', { class: 'pc-dot', 'aria-hidden': 'true' }, icon('play', 12)), label);
}

export function filmCard(movie, { w, h, x, y } = {}) {
  const holes = (side) => el('span', { class: `sprockets ${side}`, 'aria-hidden': 'true' }, Array.from({ length: 7 }, () => el('i')));
  const img = el('img', { src: movie.poster, alt: '', loading: 'lazy', decoding: 'async', draggable: 'false' });
  return el('a', {
    class: 'film-card',
    href: movieHref(movie),
    dataset: { mid: movie.id, rot: '0' },
    style: { width: w != null ? `${w}px` : null, height: h != null ? `${h}px` : null, left: x != null ? `${x}px` : null, top: y != null ? `${y}px` : null },
    'aria-label': `Play the home movie: ${movie.title}, ${movie.date}`,
  }, img, holes('l'), holes('r'),
  el('span', { class: 'fc-copy' },
    el('span', { class: 'fc-text' }, el('small', null, `Home movie · ${movie.format || 'Film'} · ${fmtTime(movie.duration)}`), el('strong', null, movie.title)),
    el('span', { class: 'fc-play', 'aria-hidden': 'true' }, playIcon())));
}

function playIcon() {
  const s = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  s.setAttribute('viewBox', '0 0 24 24');
  s.setAttribute('width', '22');
  s.setAttribute('height', '22');
  s.setAttribute('aria-hidden', 'true');
  const p = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  p.setAttribute('d', 'M8 5.5v13a.6.6 0 0 0 .9.5l10.4-6.5a.6.6 0 0 0 0-1L8.9 5a.6.6 0 0 0-.9.5Z');
  p.setAttribute('fill', 'currentColor');
  s.append(p);
  return s;
}
