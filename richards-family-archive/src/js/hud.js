import { el, icon, clamp, plural } from './util.js';
import { animate, EASE } from './anim.js';
import * as store from './store.js';

/* Floating controls that sit above the views (pill bars, the dock, the timeline, the zoomer).
   They live outside the view so a pill bar shared by two pages can stay put and just slide its thumb. */

/** Bottom pill bar. items: [{ value, label, href }] */
export class Pillbar {
  constructor({ items, active, label = 'Years', onHover, onPick, prev, next }) {
    this.onHover = onHover;
    this.onPick = onPick;
    this.node = el('nav', { class: 'pillbar', 'aria-label': label });
    this.thumb = el('span', { class: 'thumb', 'aria-hidden': 'true' });
    this.node.append(this.thumb);
    if (prev !== undefined) {
      this.prevBtn = el('a', { class: 'arrow', 'aria-label': 'Previous year' }, icon('chevLeft', 20));
      this.node.append(this.prevBtn);
    }
    this.pills = items.map((it) => {
      const a = el('a', { class: 'pill', href: it.href, dataset: { value: String(it.value) } }, it.label);
      a.addEventListener('pointerenter', () => this.onHover?.(it.value));
      a.addEventListener('focus', () => this.onHover?.(it.value));
      a.addEventListener('click', (e) => { if (this.onPick) { e.preventDefault(); this.onPick(it.value, e); } });
      this.node.append(a);
      return a;
    });
    if (next !== undefined) {
      this.nextBtn = el('a', { class: 'arrow', 'aria-label': 'Next year' }, icon('chevRight', 20));
      this.node.append(this.nextBtn);
    }
    this.node.addEventListener('pointerleave', () => this.onHover?.(null));
    this.setArrows(prev, next);
    this.active = active ?? null;
    requestAnimationFrame(() => this.setActive(this.active, true));
  }

  setArrows(prev, next) {
    for (const [btn, href] of [[this.prevBtn, prev], [this.nextBtn, next]]) {
      if (!btn) continue;
      if (href) { btn.href = href; btn.removeAttribute('aria-disabled'); btn.classList.remove('is-off'); }
      else { btn.removeAttribute('href'); btn.setAttribute('aria-disabled', 'true'); btn.classList.add('is-off'); }
    }
  }

  setActive(value, instant = false) {
    this.active = value;
    const pill = this.pills.find((p) => p.dataset.value === String(value));
    this.pills.forEach((p) => {
      const on = p === pill;
      p.classList.toggle('is-on', on);
      if (on) p.setAttribute('aria-current', 'true'); else p.removeAttribute('aria-current');
    });
    if (!pill) { this.thumb.style.opacity = '0'; return; }
    if (instant) this.thumb.style.transition = 'none';
    this.thumb.style.opacity = '1';
    this.thumb.style.width = `${pill.offsetWidth}px`;
    this.thumb.style.transform = `translateX(${pill.offsetLeft}px)`;
    if (instant) { void this.thumb.offsetWidth; this.thumb.style.transition = ''; }
    if (this.node.scrollWidth > this.node.clientWidth + 2) {
      const left = pill.offsetLeft - (this.node.clientWidth - pill.offsetWidth) / 2;
      this.node.scrollTo({ left, behavior: instant ? 'auto' : 'smooth' });
    }
  }

  setHandlers({ onHover, onPick }) { this.onHover = onHover; this.onPick = onPick; }
}

/** Phone dock: arrows plus a rail of pills that follows the page as it scrolls. */
export class Dock {
  constructor({ items, label, onPick }) {
    this.items = items;
    this.onPick = onPick;
    this.node = el('nav', { class: 'dock', 'aria-label': label });
    this.prev = el('button', { class: 'arrow', type: 'button', 'aria-label': 'Previous' }, icon('chevLeft', 20));
    this.next = el('button', { class: 'arrow', type: 'button', 'aria-label': 'Next' }, icon('chevRight', 20));
    this.rail = el('div', { class: 'dock-rail' });
    this.thumb = el('span', { class: 'thumb', 'aria-hidden': 'true' });
    this.rail.append(this.thumb, el('span', { class: 'pad', 'aria-hidden': 'true' }));
    this.pills = items.map((it, i) => {
      const b = el('button', { class: 'pill', type: 'button', dataset: { i: String(i) } }, it.label);
      b.addEventListener('click', () => this.pick(i));
      this.rail.append(b);
      return b;
    });
    this.rail.append(el('span', { class: 'pad', 'aria-hidden': 'true' }));
    this.prev.addEventListener('click', () => this.pick(Math.max(0, this.index - 1)));
    this.next.addEventListener('click', () => this.pick(Math.min(items.length - 1, this.index + 1)));
    this.node.append(this.prev, this.rail, this.next);
    this.index = -1;
    requestAnimationFrame(() => this.setIndex(Math.max(0, this.index), true));
  }

  pick(i) {
    this.setIndex(i);
    this.onPick?.(this.items[i].value, i);
  }

  setIndex(i, instant = false) {
    i = clamp(i, 0, this.items.length - 1);
    if (i === this.index && !instant) return;
    this.index = i;
    const pill = this.pills[i];
    this.pills.forEach((p, k) => {
      p.classList.toggle('is-on', k === i);
      if (k === i) p.setAttribute('aria-current', 'true'); else p.removeAttribute('aria-current');
    });
    this.prev.disabled = i === 0;
    this.next.disabled = i === this.items.length - 1;
    if (instant) this.thumb.style.transition = 'none';
    this.thumb.style.width = `${pill.offsetWidth}px`;
    this.thumb.style.transform = `translateX(${pill.offsetLeft}px)`;
    if (instant) { void this.thumb.offsetWidth; this.thumb.style.transition = ''; }
    const left = pill.offsetLeft - (this.rail.clientWidth - pill.offsetWidth) / 2;
    this.rail.scrollTo({ left, behavior: instant ? 'auto' : 'smooth' });
  }

  setValue(v, instant) {
    const i = this.items.findIndex((it) => it.value === v);
    if (i >= 0) this.setIndex(i, instant);
  }
}

/**
 * Home timeline: one stop per decade plus "now". Sliding along it picks out a single year,
 * snapping to years that actually have photos.
 */
export class Timeline {
  constructor({ onHover, onPick, featured }) {
    this.onHover = onHover;
    this.onPick = onPick;
    const decs = store.decades();
    const years = store.allYears();
    const last = years[years.length - 1];
    this.stops = decs.map((d) => ({ value: d, label: String(d), decade: d }));
    if (last > decs[decs.length - 1] + 1) this.stops.push({ value: last, label: String(last), decade: store.decadeOf(last), now: true });
    this.years = years;
    this.featured = featured;

    this.node = el('div', { class: 'timeline' });
    this.line = el('span', { class: 'tl-line', 'aria-hidden': 'true' }, el('i'));
    this.tick = el('span', { class: 'tl-tick', 'aria-hidden': 'true' });
    this.hint = el('span', { class: 'tl-hint', 'aria-hidden': 'true' });
    this.track = el('div', { class: 'tl-track', role: 'group', 'aria-label': 'Choose a year' }, this.line, this.tick, this.hint);
    this.btns = this.stops.map((s) => {
      const b = el('button', { class: 'tl-stop', type: 'button', dataset: { value: String(s.value) }, 'aria-label': s.now ? `${s.value}, this year` : `The ${s.decade}s` },
        el('span', { class: 'dot', 'aria-hidden': 'true' }), s.label);
      b.addEventListener('focus', () => this.preview(s.now ? s.value : this.firstYear(s.decade), true));
      b.addEventListener('blur', () => this.preview(null));
      b.addEventListener('click', (e) => {
        if (e.detail === 0) this.onPick?.(s.now ? s.value : this.firstYear(s.decade), true); // keyboard
      });
      return b;
    });
    this.track.append(...this.btns);
    this.node.append(el('span', { class: 'eyebrow' }, 'Choose a year'), this.track);

    this.track.addEventListener('pointermove', (e) => { if (e.pointerType === 'mouse' || this.down) this.fromPointer(e); });
    this.track.addEventListener('pointerleave', () => { if (!this.down) this.preview(null); });
    this.track.addEventListener('pointerdown', (e) => {
      this.down = true;
      try { this.track.setPointerCapture(e.pointerId); } catch { /* ignore */ }
      this.fromPointer(e);
    });
    const end = (e) => {
      if (!this.down) return;
      this.down = false;
      const y = this.fromPointer(e);
      if (e.type === 'pointerup' && y) this.onPick?.(y, false);
      else this.preview(null);
    };
    this.track.addEventListener('pointerup', end);
    this.track.addEventListener('pointercancel', end);
    this.current = null;
    requestAnimationFrame(() => this.preview(null));
  }

  firstYear(decade) {
    const ys = store.yearsInDecade(decade);
    return ys.find((y) => y === this.featured) || ys[0];
  }

  /** x positions of every stop's dot, relative to the track. */
  positions() {
    const t = this.track.getBoundingClientRect();
    return this.btns.map((b) => {
      const r = b.querySelector('.dot').getBoundingClientRect();
      return r.left + r.width / 2 - t.left;
    });
  }

  yearAt(x) {
    const xs = this.positions();
    const vs = this.stops.map((s) => s.value);
    let raw;
    if (x <= xs[0]) raw = vs[0];
    else if (x >= xs[xs.length - 1]) raw = vs[vs.length - 1];
    else {
      let i = 0;
      while (i < xs.length - 2 && x > xs[i + 1]) i++;
      raw = vs[i] + ((x - xs[i]) / (xs[i + 1] - xs[i])) * (vs[i + 1] - vs[i]);
    }
    let best = this.years[0];
    for (const y of this.years) if (Math.abs(y - raw) < Math.abs(best - raw)) best = y;
    return best;
  }

  xOf(year) {
    const xs = this.positions();
    const vs = this.stops.map((s) => s.value);
    if (year <= vs[0]) return xs[0];
    for (let i = 0; i < vs.length - 1; i++) {
      if (year <= vs[i + 1]) return xs[i] + ((year - vs[i]) / (vs[i + 1] - vs[i])) * (xs[i + 1] - xs[i]);
    }
    return xs[xs.length - 1];
  }

  fromPointer(e) {
    const t = this.track.getBoundingClientRect();
    const y = this.yearAt(e.clientX - t.left);
    this.preview(y);
    return y;
  }

  /** Show a year on the track (or the featured decade when year is null). */
  preview(year, fromKeyboard = false) {
    const y = year ?? this.featured;
    const decade = store.decadeOf(y);
    const xs = this.positions();
    const x = this.xOf(y);
    const lineLeft = xs[0];
    this.line.style.left = `${lineLeft}px`;
    this.line.style.width = `${xs[xs.length - 1] - lineLeft}px`;
    this.line.firstChild.style.setProperty('--fill', `${Math.max(0, x - lineLeft)}px`);
    this.tick.style.transform = `translateX(${x}px)`;
    let stopIndex = this.stops.findIndex((s) => s.now && s.value === y);
    if (stopIndex < 0) stopIndex = this.stops.findIndex((s) => !s.now && s.decade === decade);
    this.btns.forEach((b, i) => b.classList.toggle('is-on', i === stopIndex));
    const active = year != null;
    this.track.classList.toggle('is-scrubbing', active && !fromKeyboard);
    if (active) {
      const n = store.photosInYear(y).length;
      const m = store.moviesInYear(y).length;
      this.hint.replaceChildren(el('b', null, String(y)), ` ${plural(n, 'photo')}${m ? ` · ${plural(m, 'film')}` : ''}`);
      this.hint.style.transform = `translateX(${x}px) translateX(-50%)`;
      this.hint.classList.add('is-on');
    } else this.hint.classList.remove('is-on');
    if (this.current !== (year ?? null)) {
      this.current = year ?? null;
      this.onHover?.(year == null ? null : decade, year);
    }
  }
}

/** Zoom control for the decade table: − 65% + | fullscreen */
export class Zoomer {
  constructor({ onZoom, onFit, onFull }) {
    this.out = el('output', { 'aria-live': 'off' }, '100%');
    this.full = el('button', { type: 'button', 'aria-label': 'Full screen', title: 'Full screen  F' }, icon('expand', 20));
    this.node = el('div', { class: 'zoomer', role: 'group', 'aria-label': 'Zoom' },
      el('button', { type: 'button', 'aria-label': 'Zoom out', title: 'Zoom out  −', onclick: () => onZoom(1 / 1.25) }, icon('minus', 20)),
      el('button', { type: 'button', class: 'zoom-val', 'aria-label': 'Fit everything on screen', title: 'Fit  0', onclick: () => onFit() }, this.out),
      el('button', { type: 'button', 'aria-label': 'Zoom in', title: 'Zoom in  +', onclick: () => onZoom(1.25) }, icon('plus', 20)),
      el('span', { class: 'sep', 'aria-hidden': 'true' }),
      this.full);
    this.full.addEventListener('click', () => onFull());
    this.onFs = () => {
      const on = !!document.fullscreenElement;
      this.full.replaceChildren(icon(on ? 'shrink' : 'expand', 20));
      this.full.setAttribute('aria-label', on ? 'Exit full screen' : 'Full screen');
    };
    document.addEventListener('fullscreenchange', this.onFs);
    if (!document.documentElement.requestFullscreen) this.full.hidden = true;
  }

  set(scale) { this.out.textContent = `${Math.round(scale * 100)}%`; }
  destroy() { document.removeEventListener('fullscreenchange', this.onFs); }
}

/** Fade a floating control in from just below its resting place. */
export function hudIn(node, delay = 0) {
  return animate(node, [{ opacity: 0, translate: '0 18px' }, { opacity: 1, translate: '0 0' }], { duration: 700, delay, easing: EASE });
}

export function hudOut(node) {
  return animate(node, [{ opacity: 1, translate: '0 0' }, { opacity: 0, translate: '0 14px' }], { duration: 320, easing: 'ease-in' });
}
