import { el, icon, debounce, plural, fmtTime } from '../util.js';
import { animate, EASE } from '../anim.js';
import { yearHref, decadeHref, eventHref, movieHref } from '../views/base.js';
import { openAbout } from '../chrome.js';
import * as store from '../store.js';

const SUGGEST = ['lake', 'birthday', 'snow', 'wedding', 'camping', 'beach', 'dog', '1976'];

/** Full-screen search across decades, years, events, films and every photo's caption. */
export class Search {
  constructor(app) {
    this.app = app;
    this.isOpen = false;
  }

  open(initial = '') {
    if (this.isOpen) { this.input.focus(); return; }
    this.isOpen = true;
    this.prevFocus = document.activeElement;
    this.input = el('input', {
      type: 'search', placeholder: 'Search names, places, years…', autocomplete: 'off', autocapitalize: 'off', spellcheck: 'false',
      enterkeyhint: 'search', 'aria-label': 'Search the archive', 'aria-controls': 'search-results',
    });
    this.input.value = initial;
    this.results = el('div', { class: 'search-inner', id: 'search-results', 'aria-live': 'polite' });
    this.closeBtn = el('button', { class: 'icon-btn', type: 'button', 'aria-label': 'Close search' }, icon('close', 24));
    this.node = el('div', { class: 'search', role: 'dialog', 'aria-modal': 'true', 'aria-label': 'Search' },
      el('div', { class: 'search-head' },
        el('label', { class: 'search-field' }, icon('search', 28, 1.4), this.input),
        this.closeBtn),
      el('div', { class: 'search-body', 'data-lenis-prevent': '' }, this.results));
    this.app.overlays.append(this.node);
    this.app.lockScroll('search', true);

    this.closeBtn.addEventListener('click', () => this.close());
    this.input.addEventListener('input', debounce(() => this.render(this.input.value), 70));
    this.node.addEventListener('keydown', (e) => this.key(e));
    this.node.addEventListener('click', (e) => this.click(e));
    animate(this.node, [{ opacity: 0 }, { opacity: 1 }], { duration: 320, easing: EASE });
    animate(this.node.querySelector('.search-head'), [{ opacity: 0, transform: 'translateY(-14px)' }, { opacity: 1, transform: 'none' }], { duration: 600, easing: EASE });
    this.render(initial);
    requestAnimationFrame(() => this.input.focus({ preventScroll: true }));
  }

  render(q) {
    const query = q.trim();
    const r = store.search(query);
    const groups = [];
    if (!r) {
      groups.push(group('Try', el('div', { class: 'sr-chips' }, SUGGEST.map((s) => el('button', { class: 'chip', type: 'button', dataset: { q: s } }, s)))));
      groups.push(group('Decades', el('div', { class: 'sr-chips' }, store.decades().map((d) => el('a', { class: 'chip', href: decadeHref(d) }, `${d}s`, el('small', null, String(store.photosInDecade(d).length)))))));
      const ms = store.allMovies();
      if (ms.length) groups.push(group('Home movies', el('div', { class: 'sr-list' }, ms.map(movieItem))));
      groups.push(group('More', el('div', { class: 'sr-chips' },
        el('a', { class: 'chip', href: '#/favorites' }, icon('heart', 16), 'Favorites', el('small', null, String(store.favorites().length))),
        el('button', { class: 'chip', type: 'button', dataset: { act: 'surprise' } }, icon('shuffle', 16), 'Surprise me'),
        el('button', { class: 'chip', type: 'button', dataset: { act: 'about' } }, icon('info', 16), 'About this archive'))));
    } else {
      if (r.decades.length) groups.push(group('Decades', el('div', { class: 'sr-chips' }, r.decades.map((d) => el('a', { class: 'chip', href: decadeHref(d) }, `${d}s`)))));
      if (r.years.length) groups.push(group('Years', el('div', { class: 'sr-chips' }, r.years.slice(0, 16).map((y) => el('a', { class: 'chip', href: yearHref(y) }, String(y), el('small', null, String(store.photosInYear(y).length)))))));
      if (r.movies.length) groups.push(group('Home movies', el('div', { class: 'sr-list' }, r.movies.map(movieItem))));
      if (r.events.length) groups.push(group('Events', el('div', { class: 'sr-list' }, r.events.map(eventItem))));
      if (r.photos.length) {
        this.photoHits = r.photos;
        groups.push(group(plural(r.photos.length, 'photo'), el('div', { class: 'sr-photos' }, r.photos.slice(0, 60).map((p, i) => {
          const b = el('button', { type: 'button', dataset: { i: String(i), pid: p.id, rot: '0' }, style: { '--b': '4px' }, 'aria-label': `${p.title}, ${p.date}` },
            el('img', { src: p.thumb, alt: '', loading: 'lazy', decoding: 'async', style: { backgroundImage: p.lqip ? `url("${p.lqip}")` : null } }));
          return b;
        }))));
      }
      if (!groups.length) {
        groups.push(el('p', { class: 'sr-empty' }, `Nothing matches “${query}”. Try `,
          el('button', { type: 'button', dataset: { q: 'lake' } }, 'lake'), ' or ',
          el('button', { type: 'button', dataset: { q: '1976' } }, '1976'), '.'));
      }
    }
    this.results.replaceChildren(...groups);
    groups.forEach((g, i) => animate(g, [{ opacity: 0, transform: 'translateY(12px)' }, { opacity: 1, transform: 'none' }], { duration: 520, delay: i * 45, easing: EASE, fill: 'backwards' }));
  }

  click(e) {
    const act = e.target.closest('[data-act]')?.dataset.act;
    if (act === 'surprise') { this.close({ quick: true }); this.app.surprise(); return; }
    if (act === 'about') { this.close({ quick: true }); openAbout(this.app); return; }
    const qb = e.target.closest('[data-q]');
    if (qb) { this.input.value = qb.dataset.q; this.render(qb.dataset.q); this.input.focus(); return; }
    const pb = e.target.closest('.sr-photos button');
    if (pb) {
      const list = this.photoHits || [];
      this.app.openViewer(list, +pb.dataset.i, pb);
      this.close({ quick: true });
      return;
    }
    const a = e.target.closest('a[href]');
    if (a) {
      e.preventDefault();
      this.close({ quick: true });
      this.app.go(a.getAttribute('href'));
    }
  }

  key(e) {
    if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); this.close(); return; }
    const items = [...this.results.querySelectorAll('a[href], .sr-photos button, .sr-chips button')];
    if (e.key === 'Enter' && e.target === this.input) {
      e.preventDefault();
      items[0]?.click();
      return;
    }
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      const i = items.indexOf(document.activeElement);
      const n = e.key === 'ArrowDown' ? (i < 0 ? 0 : Math.min(items.length - 1, i + 1)) : i <= 0 ? -1 : i - 1;
      e.preventDefault();
      if (n < 0) this.input.focus();
      else items[n]?.focus();
    }
  }

  close({ quick = false } = {}) {
    if (!this.isOpen) return;
    this.isOpen = false;
    const n = this.node;
    this.app.lockScroll('search', false);
    animate(n, [{ opacity: 1 }, { opacity: 0 }], { duration: quick ? 220 : 300, easing: 'ease-out' }).finished.then(() => n.remove());
    if (!quick && this.prevFocus?.isConnected) this.prevFocus.focus?.({ preventScroll: true });
  }
}

function group(title, body) {
  return el('section', { class: 'sr-group' }, el('h3', { class: 'eyebrow' }, title), body);
}

function movieItem(m) {
  return el('a', { class: 'sr-item', href: movieHref(m) },
    el('img', { src: m.poster, alt: '', loading: 'lazy' }),
    el('span', null, el('strong', null, m.title), el('span', null, `${m.date} · ${m.format || 'Film'} · ${fmtTime(m.duration)}`)),
    el('em', null, 'Film'));
}

function eventItem(ev) {
  const first = store.allPhotos().find((p) => p.event === ev.id);
  return el('a', { class: 'sr-item', href: eventHref(ev) },
    first ? el('img', { src: first.thumb, alt: '', loading: 'lazy' }) : el('span'),
    el('span', null, el('strong', null, ev.title), el('span', null, `${ev.date}${ev.place ? ` · ${ev.place}` : ''}`)),
    el('em', null, String(ev.year)));
}
