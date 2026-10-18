import { el, icon, clamp, isPhone, reduceMotion } from '../util.js';
import { animate, fly, geom, onScreen, EASE, SPRING, settle } from '../anim.js';
import { drag } from '../gesture.js';
import { yearHref, eventHref } from '../views/base.js';
import * as store from '../store.js';

/**
 * The photo viewer. A print lifts off the page and lands in the middle of the screen;
 * swipe or use the arrows to move through the set, turn it over to read the back.
 */
export class Viewer {
  constructor(app) {
    this.app = app;
    this.isOpen = false;
  }

  open(list, index, origin) {
    if (this.isOpen) this.close({ instant: true });
    if (!list?.length || index < 0) return;
    this.list = list;
    this.index = index;
    this.isOpen = true;
    this.closing = false;
    this.prevFocus = document.activeElement;
    this.build();
    this.app.overlays.append(this.node);
    this.app.lockScroll('viewer', true);
    this.pushHistory();

    const photo = this.photo;
    this.cur = this.slide(photo);
    this.track.append(this.cur.slide);
    this.fill(photo, true);

    const from = origin && geom(origin);
    const to = geom(this.cur.card);
    this.origin = origin && onScreen(from, 0) ? origin : null;
    animate(this.bg, [{ opacity: 0 }, { opacity: 1 }], { duration: 480, easing: EASE });
    animate(this.info, [{ opacity: 0, transform: isPhone() ? 'translateY(18px)' : 'translateX(18px)' }, { opacity: 1, transform: 'none' }], { duration: 700, delay: 160, easing: EASE });
    if (this.origin && to) {
      this.cur.card.style.visibility = 'hidden';
      this.origin.style.visibility = 'hidden';
      fly(this.app.flights, [{
        from, to: { ...to, border: to.border }, src: photo.thumb, hi: photo.src, lqip: photo.lqip,
        onLand: () => { if (this.cur) this.cur.card.style.visibility = ''; },
      }], { duration: 760 });
    } else {
      animate(this.cur.card, [{ opacity: 0, transform: 'scale(0.92)' }, { opacity: 1, transform: 'none' }], { duration: 700, easing: SPRING });
    }
    requestAnimationFrame(() => this.node.classList.add('is-open'));
    this.closeBtn.focus({ preventScroll: true });
    this.preload();
  }

  get photo() { return this.list[this.index]; }

  build() {
    this.bg = el('div', { class: 'viewer-bg' });
    this.track = el('div', { class: 'viewer-track' });
    this.prevBtn = el('button', { class: 'viewer-nav prev', type: 'button', 'aria-label': 'Previous photo' }, icon('chevLeft', 26));
    this.nextBtn = el('button', { class: 'viewer-nav next', type: 'button', 'aria-label': 'Next photo' }, icon('chevRight', 26));
    this.closeBtn = el('button', { class: 'viewer-close', type: 'button', 'aria-label': 'Close' }, icon('close', 22));
    this.stage = el('div', { class: 'viewer-stage' }, this.track, this.prevBtn, this.nextBtn);
    this.date = el('p', { class: 'vi-date' });
    this.title = el('h2', { id: 'viewer-title' });
    this.place = el('p', { class: 'vi-place' });
    this.favBtn = el('button', { class: 'chip', type: 'button', 'aria-pressed': 'false' });
    this.flipBtn = el('button', { class: 'chip', type: 'button' }, icon('flip', 17), 'Turn it over');
    this.yearLink = el('a', { class: 'chip' });
    this.eventLink = el('a', { class: 'chip' });
    this.note = el('p', { class: 'vi-note' });
    this.count = el('p', { class: 'viewer-count' });
    this.dots = el('div', { class: 'viewer-strip', 'aria-hidden': 'true' });
    this.infoBody = el('div', { class: 'vi-body' }, this.date, this.title, this.place,
      el('div', { class: 'vi-row' }, this.favBtn, this.flipBtn),
      el('div', { class: 'vi-row' }, this.yearLink, this.eventLink),
      this.note);
    this.info = el('aside', { class: 'viewer-info' }, this.infoBody, this.count);
    this.node = el('div', { class: 'viewer', role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'viewer-title' },
      this.bg, this.stage, this.info, this.closeBtn, this.dots);

    this.prevBtn.addEventListener('click', () => this.go(-1));
    this.nextBtn.addEventListener('click', () => this.go(1));
    this.closeBtn.addEventListener('click', () => this.requestClose());
    this.bg.addEventListener('click', () => this.requestClose());
    this.stage.addEventListener('click', (e) => {
      if (this.suppressClick) { this.suppressClick = false; return; }
      if (e.target === this.stage || e.target.classList.contains('viewer-slide')) this.requestClose();
    });
    this.favBtn.addEventListener('click', () => {
      const on = store.toggleFav(this.photo.id);
      this.paintFav();
      animate(this.favBtn.querySelector('svg'), [{ transform: 'scale(1)' }, { transform: 'scale(1.45)' }, { transform: 'scale(1)' }], { duration: 460, easing: EASE });
      this.app.toast(on ? 'Saved to favorites' : 'Removed from favorites');
    });
    this.flipBtn.addEventListener('click', () => this.flip());
    for (const a of [this.yearLink, this.eventLink]) {
      a.addEventListener('click', (e) => {
        e.preventDefault();
        this.app.go(a.getAttribute('href'), { fromViewer: true });
      });
    }
    this.onKey = (e) => this.key(e);
    document.addEventListener('keydown', this.onKey, true);
    this.offDrag = drag(this.stage, {
      onStart: () => this.dragStart(),
      onMove: (m) => this.dragMove(m),
      onEnd: (m) => this.dragEnd(m),
      onPinch: (p) => this.pinch(p),
      onPinchEnd: () => this.pinchEnd(),
    }, { threshold: 4, filter: (e) => !e.target.closest('button') });
    this.onResize = () => this.layout(this.cur);
    window.addEventListener('resize', this.onResize);
  }

  /** One photo, sized to fit the stage, with its back for flipping. */
  slide(photo) {
    const img = el('img', { alt: photo.title ? `${photo.title}, ${photo.date}` : '', decoding: 'async', draggable: 'false' });
    const zoom = el('div', { class: 'viewer-zoom', style: { backgroundImage: photo.lqip ? `url("${photo.lqip}")` : null } }, img);
    const front = el('div', { class: 'viewer-face viewer-front' }, zoom);
    const back = el('div', { class: 'viewer-face viewer-back', 'aria-hidden': 'true' },
      el('p', { class: 'hand' }, photo.back || photo.title),
      el('span', { class: 'stamp' }, stampFor(photo)),
      el('span', { class: 'paper' }, photo.bw ? 'VELOX · PHOTOGRAPHIC PAPER' : 'KODAK · THIS PAPER MANUFACTURED BY KODAK'));
    const flip = el('div', { class: 'viewer-flip' }, front, back);
    const card = el('div', { class: `viewer-card${photo.bw ? ' is-bw' : ''}`, dataset: { pid: photo.id, rot: '0' } }, flip);
    const slide = el('div', { class: 'viewer-slide' }, card);
    const s = { photo, slide, card, flip, img, zoom, z: { s: 1, x: 0, y: 0 } };
    this.layout(s);
    const thumb = new Image();
    thumb.src = photo.thumb;
    img.src = photo.thumb;
    const hi = new Image();
    hi.decoding = 'async';
    hi.onload = () => { if (s.img.isConnected || this.cur === s) img.src = photo.src; };
    hi.src = photo.src;
    return s;
  }

  layout(s) {
    if (!s) return;
    const phone = isPhone();
    const vw = this.stage.clientWidth || innerWidth - (phone ? 0 : 380);
    const vh = this.stage.clientHeight || innerHeight;
    const padX = phone ? 14 : 84, padT = phone ? 74 : 92, padB = phone ? 18 : 92;
    const aw = Math.max(120, vw - padX * 2), ah = Math.max(120, vh - padT - padB);
    const a = s.photo.w / s.photo.h;
    const b = clamp(Math.min(aw, ah) * 0.03, 6, 16);
    let w = aw, h = (aw - 2 * b) / a + 2 * b;
    if (h > ah) { h = ah; w = (ah - 2 * b) * a + 2 * b; }
    Object.assign(s.card.style, { width: `${Math.round(w)}px`, height: `${Math.round(h)}px` });
    s.card.style.setProperty('--b', `${b.toFixed(1)}px`);
    s.slide.style.paddingTop = `${padT}px`;
    s.slide.style.paddingBottom = `${padB}px`;
  }

  fill(p, first = false) {
    const ev = p.event ? store.event(p.event) : null;
    const apply = () => {
      this.date.textContent = p.date;
      this.title.textContent = p.title;
      this.place.textContent = p.place || '';
      this.place.hidden = !p.place;
      this.yearLink.href = yearHref(p.year);
      this.yearLink.replaceChildren(icon('calendar', 16), `All of ${p.year}`);
      if (ev) {
        this.eventLink.hidden = false;
        this.eventLink.href = eventHref(ev);
        this.eventLink.replaceChildren(icon('grid', 16), ev.title);
      } else this.eventLink.hidden = true;
      this.note.textContent = p.back ? `On the back: “${p.back}”` : '';
      this.note.hidden = !p.back;
      this.flipBtn.hidden = false;
      this.count.textContent = `${this.index + 1} of ${this.list.length}`;
      this.paintFav();
      this.prevBtn.disabled = this.index === 0;
      this.nextBtn.disabled = this.index === this.list.length - 1;
      this.paintDots();
    };
    if (first) { apply(); return; }
    animate(this.infoBody, [{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'translateY(-6px)' }], { duration: 140, easing: 'ease-in' }).finished.then(() => {
      if (!this.isOpen) return;
      apply();
      animate(this.infoBody, [{ opacity: 0, transform: 'translateY(8px)' }, { opacity: 1, transform: 'none' }], { duration: 420, easing: EASE });
    });
  }

  paintFav() {
    const on = store.isFav(this.photo.id);
    this.favBtn.classList.toggle('is-on', on);
    this.favBtn.setAttribute('aria-pressed', String(on));
    this.favBtn.replaceChildren(icon(on ? 'heartFill' : 'heart', 17), on ? 'Saved' : 'Save');
  }

  paintDots() {
    const n = this.list.length;
    if (n > 24 || n < 2) { this.dots.hidden = true; return; }
    this.dots.hidden = false;
    if (this.dots.childElementCount !== n) this.dots.replaceChildren(...Array.from({ length: n }, () => el('i')));
    [...this.dots.children].forEach((d, i) => d.classList.toggle('is-on', i === this.index));
  }

  preload() {
    for (const k of [this.index + 1, this.index - 1, this.index + 2]) {
      const p = this.list[k];
      if (p) { const i = new Image(); i.decoding = 'async'; i.src = p.src; }
    }
  }

  /** Move through the set: the old print is tossed aside as the next one slides in. */
  go(delta, fromX = 0) {
    const next = this.index + delta;
    if (!this.isOpen || this.closing) return;
    const old = this.cur;
    if (next < 0 || next >= this.list.length) {
      animate(old.slide, [{ transform: `translateX(${fromX}px)` }, { transform: `translateX(${-delta * 26}px)` }, { transform: 'none' }], { duration: 480, easing: EASE });
      return;
    }
    this.unzoom(old, false);
    this.index = next;
    const s = this.slide(this.photo);
    this.cur = s;
    this.track.append(s.slide);
    const W = this.stage.clientWidth || innerWidth;
    const reduce = reduceMotion();
    const out = animate(old.slide, [
      { transform: `translateX(${fromX}px) rotate(${(fromX / W) * 8}deg)`, opacity: 1 },
      { transform: `translateX(${-delta * W * 0.55}px) rotate(${-delta * 7}deg) scale(0.92)`, opacity: 0 },
    ], { duration: reduce ? 120 : 560, easing: EASE });
    out.finished.then(() => old.slide.remove(), () => old.slide.remove());
    animate(s.slide, [
      { transform: `translateX(${delta * W * 0.5}px) rotate(${delta * 6}deg) scale(0.94)`, opacity: 0 },
      { transform: 'none', opacity: 1 },
    ], { duration: reduce ? 120 : 760, easing: SPRING });
    this.fill(this.photo);
    this.preload();
  }

  flip() {
    const c = this.cur?.card;
    if (!c) return;
    this.unzoom(this.cur);
    const on = !c.classList.contains('is-flipped');
    c.classList.toggle('is-flipped', on);
    this.flipBtn.replaceChildren(icon('flip', 17), on ? 'Turn it back' : 'Turn it over');
  }

  /* ---------- Gestures: swipe sideways to move, down to close, pinch or double-tap to zoom ---------- */
  dragStart() {
    this.drag = { axis: null, z: { ...this.cur.z } };
  }

  dragMove({ dx, dy }) {
    const d = this.drag;
    if (!d || this.closing) return;
    const s = this.cur;
    if (s.z.s > 1.01) {
      this.setZoom(s, s.z.s, d.z.x + dx, d.z.y + dy);
      return;
    }
    if (!d.axis) d.axis = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
    if (d.axis === 'x') {
      const atEdge = (dx > 0 && this.index === 0) || (dx < 0 && this.index === this.list.length - 1);
      const x = atEdge ? dx * 0.3 : dx;
      s.slide.style.transform = `translateX(${x}px) rotate(${(x / innerWidth) * 8}deg)`;
      d.x = x;
    } else if (dy > 0 || isPhone()) {
      const y = dy > 0 ? dy : dy * 0.25;
      const k = clamp(1 - Math.abs(y) / 900, 0.7, 1);
      s.slide.style.transform = `translateY(${y}px) scale(${k})`;
      this.bg.style.opacity = String(clamp(1 - Math.abs(y) / 500, 0.2, 1));
      d.y = y;
    }
  }

  dragEnd({ vx, vy, tap, e }) {
    const d = this.drag;
    this.drag = null;
    if (tap) {
      // Double tap (or double click) on the photo zooms in and out.
      const now = performance.now();
      const t = this.lastTap;
      if (t && now - t.t < 320 && Math.hypot(e.clientX - t.x, e.clientY - t.y) < 30 && e.target.closest('.viewer-card')) {
        this.lastTap = null;
        this.toggleZoom(e.clientX, e.clientY);
      } else this.lastTap = { t: now, x: e.clientX, y: e.clientY };
      return;
    }
    if (!d) return;
    // The browser still fires a click after a drag; it must not close the viewer.
    this.suppressClick = true;
    setTimeout(() => { this.suppressClick = false; }, 60);
    const s = this.cur;
    if (s.z.s > 1.01) { this.clampZoom(s); return; }
    if (d.axis === 'x' && d.x != null) {
      const W = this.stage.clientWidth || innerWidth;
      const dir = d.x < -W * 0.18 || vx < -500 ? 1 : d.x > W * 0.18 || vx > 500 ? -1 : 0;
      s.slide.style.transform = '';
      if (dir) this.go(dir, d.x);
      else animate(s.slide, [{ transform: `translateX(${d.x}px) rotate(${(d.x / W) * 8}deg)` }, { transform: 'none' }], { duration: 520, easing: SPRING });
    } else if (d.axis === 'y' && d.y != null) {
      if (d.y > 130 || vy > 700) { this.requestClose(); return; }
      const from = s.slide.style.transform;
      s.slide.style.transform = '';
      animate(s.slide, [{ transform: from }, { transform: 'none' }], { duration: 520, easing: SPRING });
      animate(this.bg, [{ opacity: this.bg.style.opacity || 1 }, { opacity: 1 }], { duration: 400 });
      this.bg.style.opacity = '';
    }
  }

  pinch({ scale, cx, cy }) {
    const s = this.cur;
    if (!s || s.card.classList.contains('is-flipped')) return;
    if (!this.pz) {
      this.pz = { s: s.z.s, x: s.z.x, y: s.z.y, cx, cy };
      s.slide.style.transform = '';
      this.bg.style.opacity = '';
    }
    const p = this.pz;
    const ns = clamp(p.s * scale, 1, 4);
    const r = s.zoom.getBoundingClientRect();
    const ox = p.cx - r.left, oy = p.cy - r.top;
    const k = ns / p.s;
    this.setZoom(s, ns, ox - (ox - p.x) * k + (cx - p.cx), oy - (oy - p.y) * k + (cy - p.cy));
    this.node.classList.add('is-zoomed');
    this.drag = null;
  }

  pinchEnd() { this.pz = null; this.clampZoom(this.cur); }

  toggleZoom(x, y) {
    const s = this.cur;
    if (!s || s.card.classList.contains('is-flipped')) return;
    if (s.z.s > 1.01) { this.unzoom(s); return; }
    const r = s.zoom.getBoundingClientRect();
    const k = 2.4;
    const ox = x - r.left, oy = y - r.top;
    this.setZoom(s, k, ox - ox * k, oy - oy * k, true);
    this.clampZoom(s);
    this.node.classList.add('is-zoomed');
  }

  setZoom(s, k, x, y, animated = false) {
    s.img.style.transition = animated ? 'transform 0.55s cubic-bezier(0.16, 1, 0.3, 1)' : 'none';
    s.z = { s: k, x, y };
    s.img.style.transform = `translate(${x}px, ${y}px) scale(${k})`;
  }

  clampZoom(s) {
    const r = s.zoom.getBoundingClientRect();
    const w = r.width, h = r.height;
    const k = s.z.s;
    if (k <= 1.01) { this.unzoom(s); return; }
    const x = clamp(s.z.x, w - w * k, 0), y = clamp(s.z.y, h - h * k, 0);
    s.img.style.transition = 'transform 0.45s cubic-bezier(0.16, 1, 0.3, 1)';
    s.z = { s: k, x, y };
    s.img.style.transform = `translate(${x}px, ${y}px) scale(${k})`;
  }

  unzoom(s, animated = true) {
    if (!s) return;
    s.img.style.transition = animated ? 'transform 0.5s cubic-bezier(0.16, 1, 0.3, 1)' : 'none';
    s.z = { s: 1, x: 0, y: 0 };
    s.img.style.transform = '';
    this.node.classList.remove('is-zoomed');
  }

  key(e) {
    if (!this.isOpen) return;
    const k = e.key;
    let used = true;
    if (k === 'Escape') this.requestClose();
    else if (k === 'ArrowRight') this.go(1);
    else if (k === 'ArrowLeft') this.go(-1);
    else if (k === 'f' || k === 'F') this.flip();
    else if (k === 'h' || k === 'H') this.favBtn.click();
    else if (k === 'Tab') { this.trap(e); used = false; }
    else used = false;
    if (used) { e.preventDefault(); e.stopPropagation(); }
  }

  trap(e) {
    const f = [...this.node.querySelectorAll('button:not([disabled]):not([hidden]), a[href]:not([hidden])')].filter((n) => n.offsetParent);
    if (!f.length) return;
    const i = f.indexOf(document.activeElement);
    if (e.shiftKey && i <= 0) { e.preventDefault(); f[f.length - 1].focus(); }
    else if (!e.shiftKey && i === f.length - 1) { e.preventDefault(); f[0].focus(); }
  }

  /* ---------- History: the phone's back gesture closes the viewer ---------- */
  pushHistory() {
    this.pushed = false;
    try {
      history.pushState({ ...(history.state || {}), viewer: true }, '');
      this.pushed = true;
    } catch { /* sandboxed: no history entry */ }
  }

  requestClose() {
    if (!this.isOpen || this.closing) return;
    if (this.pushed && history.state?.viewer) {
      this.pushed = false;
      history.back();
      // popstate closes us; fall back in case it never arrives.
      this.fallback = setTimeout(() => this.close(), 400);
    } else this.close();
  }

  /** Called by the router on popstate. */
  onPop() {
    if (this.isOpen) { this.pushed = false; this.close(); }
  }

  close({ instant = false } = {}) {
    if (!this.isOpen || this.closing) return Promise.resolve();
    clearTimeout(this.fallback);
    this.closing = true;
    const s = this.cur;
    const node = this.node;
    const photo = this.photo;
    const finish = () => {
      node.remove();
      this.teardown();
      this.app.viewerClosed();
    };
    if (instant) { finish(); return Promise.resolve(); }

    // Fly back to the print on the page if it is there.
    const target = this.app.view?.shared().get(`p:${photo.id}`);
    const tg = target && geom(target);
    const flipped = s.card.classList.contains('is-flipped');
    const anims = [];
    anims.push(animate(this.bg, [{ opacity: getComputedStyle(this.bg).opacity }, { opacity: 0 }], { duration: 420, easing: EASE }));
    anims.push(animate(this.info, [{ opacity: 1 }, { opacity: 0 }], { duration: 220 }));
    for (const b of [this.prevBtn, this.nextBtn, this.closeBtn, this.dots]) b.style.opacity = '0';
    if (tg && onScreen(tg, 0) && !flipped) {
      const from = geom(s.card);
      s.slide.style.visibility = 'hidden';
      if (this.origin && this.origin !== target) this.origin.style.visibility = '';
      target.style.visibility = 'hidden';
      anims.push(fly(this.app.flights, [{
        from, to: tg, src: photo.thumb, lqip: photo.lqip,
        onLand: () => { target.style.visibility = ''; },
      }], { duration: 640 }));
    } else {
      if (this.origin) this.origin.style.visibility = '';
      anims.push(animate(s.slide, [{ opacity: 1, transform: s.slide.style.transform || 'none' }, { opacity: 0, transform: 'scale(0.9)' }], { duration: 380, easing: EASE }));
    }
    this.app.lockScroll('viewer', false);
    return settle(anims.map((a) => (a.finished ? a : { finished: a }))).then(finish);
  }

  /** The router is taking this photo to another page: let the card go and fade the rest. */
  handoff() {
    if (!this.isOpen) return;
    clearTimeout(this.fallback);
    this.closing = true;
    this.pushed = false;
    const node = this.node;
    if (this.cur) this.cur.card.style.visibility = 'hidden';
    if (this.origin) this.origin.style.visibility = '';
    node.style.pointerEvents = 'none';
    this.app.lockScroll('viewer', false);
    animate(node, [{ opacity: 1 }, { opacity: 0 }], { duration: 380, easing: EASE }).finished.then(() => { node.remove(); this.teardown(); }, () => { node.remove(); this.teardown(); });
  }

  teardown() {
    this.isOpen = false;
    this.closing = false;
    document.removeEventListener('keydown', this.onKey, true);
    window.removeEventListener('resize', this.onResize);
    this.offDrag?.();
    if (this.origin) this.origin.style.visibility = '';
    this.app.lockScroll('viewer', false);
    if (this.prevFocus?.isConnected) this.prevFocus.focus?.({ preventScroll: true });
    this.cur = null;
    this.origin = null;
  }

  /** The card on screen, for the router to fly into the next page. */
  card() { return this.isOpen && !this.closing ? this.cur?.card : null; }
}

function stampFor(p) {
  const m = /([A-Za-z]+)\s+(\d{4})/.exec(p.date || '');
  if (m) return `${m[1].slice(0, 3).toUpperCase()} ${m[2]}`;
  return String(p.year);
}

