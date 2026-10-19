import { el, icon, clamp, isPhone, canHover, reduceMotion } from '../util.js';
import { animate, tick, Spring, Follow, geom, onScreen, EASE } from '../anim.js';
import { drag } from '../gesture.js';
import { yearHref, photoHref, revealNow } from '../views/base.js';
import { resetTilt, burst } from '../motion.js';
import { hideTip } from '../print.js';
import * as store from '../store.js';

// Springs for a print in your hand: position and size settle without a bounce, rotation wobbles a little.
const POS = { stiffness: 230, damping: 27 };
const ROT = { stiffness: 190, damping: 19 };
const FADE = { stiffness: 260, damping: 34 };
const LEAN = 4;
const shortScreen = () => innerHeight < 521 && innerWidth > innerHeight;

/** One print held up close: its paper, its back for turning over, and the springs that move it. */
class Card {
  constructor(photo) {
    this.photo = photo;
    this.img = el('img', { alt: photo.title ? `${photo.title}, ${photo.date}` : '', decoding: 'sync', draggable: 'false' });
    this.zoom = el('div', { class: 'closer-zoom', style: { backgroundImage: photo.lqip ? `url("${photo.lqip}")` : null } }, this.img);
    const back = el('div', { class: 'closer-face closer-back', 'aria-hidden': 'true' },
      el('p', { class: 'hand' }, photo.back || photo.title),
      el('span', { class: 'stamp' }, stampFor(photo)),
      el('span', { class: 'paper' }, photo.bw ? 'VELOX · PHOTOGRAPHIC PAPER' : 'KODAK · THIS PAPER MANUFACTURED BY KODAK'));
    this.flipper = el('div', { class: 'closer-flip' }, el('div', { class: 'closer-face closer-front' }, this.zoom), back);
    this.node = el('div', { class: `closer-card${photo.bw ? ' is-bw' : ''}`, dataset: { pid: photo.id, rot: '0' } },
      this.flipper, el('i', { class: 'closer-glare', 'aria-hidden': 'true' }));
    this.x = new Spring(0, { ...POS, precision: 0.05 });
    this.y = new Spring(0, { ...POS, precision: 0.05 });
    this.w = new Spring(1, { ...POS, precision: 0.05 });
    this.h = new Spring(1, { ...POS, precision: 0.05 });
    this.r = new Spring(0, { ...ROT, precision: 0.004 });
    this.o = new Spring(1, { ...FADE, precision: 0.002 });
    this.springs = [this.x, this.y, this.w, this.h, this.r, this.o];
    this.zs = { s: 1, x: 0, y: 0 };
    this.img.src = photo.thumb;
    const hi = new Image();
    hi.src = photo.src;
    hi.decode().then(() => { if (this.node.isConnected) this.img.src = photo.src; }, () => {});
  }

  size(rest) {
    this.rest = rest;
    this.node.style.width = `${rest.w.toFixed(1)}px`;
    this.node.style.height = `${rest.h.toFixed(1)}px`;
    this.node.style.setProperty('--b', `${rest.b.toFixed(1)}px`);
  }

  place(g) {
    this.x.snap(g.cx); this.y.snap(g.cy); this.w.snap(g.w); this.h.snap(g.h); this.r.snap(g.r || 0); this.o.snap(g.o ?? 1);
  }

  aim(g) {
    this.x.target = g.cx; this.y.target = g.cy; this.w.target = g.w; this.h.target = g.h; this.r.target = g.r || 0;
    if (g.o != null) this.o.target = g.o;
  }

  step(dt) {
    let m = false;
    for (const s of this.springs) m = s.step(dt) || m;
    return m;
  }

  render(lean) {
    const R = this.rest;
    let t = `translate3d(${(this.x.value - R.w / 2).toFixed(2)}px, ${(this.y.value - R.h / 2).toFixed(2)}px, 0)`;
    if (lean) t += ` perspective(1600px) rotateX(${lean.rx.toFixed(2)}deg) rotateY(${lean.ry.toFixed(2)}deg)`;
    t += ` rotate(${this.r.value.toFixed(3)}deg) scale(${(this.w.value / R.w).toFixed(4)}, ${(this.h.value / R.h).toFixed(4)})`;
    this.node.style.transform = t;
    const o = clamp(this.o.value, 0, 1);
    this.node.style.opacity = o > 0.999 ? '' : o.toFixed(3);
    this.node.dataset.rot = this.r.value.toFixed(2);
  }
}

/**
 * Bring a photo closer. The print lifts off the page and comes toward you while the page stays
 * where it is, softly veiled behind it. Arrows or a swipe move through the prints on the page;
 * clicking it, clicking beside it, scrolling, Esc or Back put it down again, right where it was.
 */
export class Closer {
  constructor(app) {
    this.app = app;
    this.isOpen = false;
    this.cards = [];
    this.lent = new Set();
    this.files = new Map();
    this.lean = { rx: new Follow(0, 0.16), ry: new Follow(0, 0.16) };
  }

  get photo() { return this.list?.[this.index]; }

  open(list, index, origin) {
    if (!list?.length || index < 0 || index >= list.length) return;
    // Start exactly where the print is now, hover lift and all.
    const tilted = origin?.classList.contains('is-tilt');
    const from = origin && geom(origin, tilted ? parseFloat(origin.style.getPropertyValue('--r')) || 0 : undefined);
    // A photo still on its way back lands at once.
    if (this.isOpen) this.finish();
    hideTip();
    this.list = list;
    this.index = index;
    this.isOpen = true;
    this.closing = false;
    this.going = null;
    this.prevFocus = document.activeElement;
    this.build();
    this.app.overlays.append(this.node);
    this.app.lockScroll('closer', true);
    this.app.el.classList.add('has-closer');
    this.pushHistory();
    this.fill(true);
    this.measure();

    const card = this.addCard(this.photo);
    card.home = origin?.isConnected ? origin : this.homeFor(this.photo);
    this.cur = card;
    this.placeChrome();
    const R = card.rest;
    // One frame at full size first, nearly invisible, so the browser draws it sharp for the whole flight.
    card.place({ ...R, r: 0, o: 0.001 });
    card.render(null);
    card.node.classList.add('is-moving');
    requestAnimationFrame(() => {
      if (this.cur !== card || this.closing) return;
      if (from && onScreen(from, 0) && !reduceMotion()) card.place(from);
      else card.place({ cx: R.cx, cy: R.cy + 24, w: R.w * 0.92, h: R.h * 0.92, r: 0, o: 0 });
      card.aim({ ...R, r: 0, o: 1 });
      card.started = true;
      this.lend(card.home);
      resetTilt();
      this.run();
      this.node.classList.add('is-open');
    });
    this.closeBtn.focus({ preventScroll: true });
    this.preload();
  }

  build() {
    this.veil = el('div', { class: 'closer-veil' });
    this.stage = el('div', { class: 'closer-stage' });
    this.prevBtn = el('button', { class: 'closer-nav prev', type: 'button', 'aria-label': 'Previous photo' }, icon('chevLeft', 26));
    this.nextBtn = el('button', { class: 'closer-nav next', type: 'button', 'aria-label': 'Next photo' }, icon('chevRight', 26));
    this.closeBtn = el('button', { class: 'closer-close', type: 'button', 'aria-label': 'Put the photo back' }, icon('close', 22));
    this.kicker = el('p', { class: 'cl-kicker' });
    this.count = el('span', { class: 'cl-count' });
    this.title = el('h2', { class: 'cl-title', id: 'closer-title' });
    this.meta = el('p', { class: 'cl-meta' });
    this.favBtn = el('button', { class: 'cl-act', type: 'button', 'aria-pressed': 'false' });
    this.flipBtn = el('button', { class: 'cl-act', type: 'button' });
    this.shareBtn = navigator.share ? el('button', { class: 'cl-act cl-share', type: 'button' }, icon('share', 20), el('span', null, 'Share')) : null;
    this.yearLink = el('a', { class: 'cl-act cl-year' });
    this.body = el('div', { class: 'cl-body' }, el('div', { class: 'cl-top' }, this.kicker, this.count), this.title, this.meta);
    this.caption = el('div', { class: 'closer-caption' },
      el('span', { class: 'cl-handle', 'aria-hidden': 'true' }), this.body,
      el('div', { class: 'cl-actions' }, this.favBtn, this.flipBtn, this.shareBtn, this.yearLink));
    this.node = el('div', { class: 'closer', role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'closer-title', 'data-lenis-prevent': '' },
      this.veil, this.stage, this.caption, this.prevBtn, this.nextBtn, this.closeBtn);

    this.prevBtn.addEventListener('click', () => this.go(-1));
    this.nextBtn.addEventListener('click', () => this.go(1));
    this.closeBtn.addEventListener('click', () => this.requestClose());
    this.favBtn.addEventListener('click', () => this.toggleFav());
    this.flipBtn.addEventListener('click', () => this.flip());
    this.shareBtn?.addEventListener('click', () => this.share());
    this.yearLink.addEventListener('click', (e) => {
      e.preventDefault();
      this.app.go(this.yearLink.getAttribute('href'), { fromCloser: true });
    });
    this.onKey = (e) => this.key(e);
    document.addEventListener('keydown', this.onKey, true);
    this.offDrag = drag(this.node, {
      onStart: (e) => this.dragStart(e),
      onMove: (m) => this.dragMove(m),
      onEnd: (m) => this.dragEnd(m),
      onPinch: (p) => this.pinch(p),
      onPinchEnd: () => this.pinchEnd(),
    }, { threshold: 5, filter: (e) => !e.target.closest('button, a') });
    this.node.addEventListener('wheel', (e) => this.wheel(e), { passive: false });
    if (canHover() && !reduceMotion()) this.node.addEventListener('pointermove', (e) => this.leanTo(e), { passive: true });
    this.onResize = () => this.relayout();
    window.addEventListener('resize', this.onResize);
  }

  /* ---------- Layout: where a print rests when it is held up ---------- */
  measure() {
    this.topH = this.app.topbar?.offsetHeight || 72;
    this.sheetH = isPhone() && !shortScreen() ? this.caption.offsetHeight : 0;
  }

  restFor(photo) {
    const vw = innerWidth, vh = innerHeight;
    const a = photo.w / photo.h;
    const fit = (bw, bh) => {
      let b = Math.min(22, 0.034 * Math.min(bw, bh));
      let w = bw, h = (bw - 2 * b) / a + 2 * b;
      if (h > bh) { h = bh; w = (bh - 2 * b) * a + 2 * b; }
      b = Math.min(22, 0.034 * Math.min(w, h));
      return { w, h, b };
    };
    if (shortScreen()) {
      // A phone on its side (or a very short window): details beside the photo.
      const side = Math.min(320, vw * 0.36);
      const f = fit(vw - side - 72, vh - 40);
      const cx = 30 + (vw - side - 72) / 2;
      return { ...f, cx, cy: vh / 2, cap: { left: vw - side - 26, top: Math.max(20, vh / 2 - 100), width: side, side: true } };
    }
    if (isPhone()) {
      // Between the top bar and the sheet of details.
      const top = this.topH + 4, bottom = this.sheetH + 16;
      const f = fit(vw - 28, Math.max(160, vh - top - bottom));
      return { ...f, cx: vw / 2, cy: top + (vh - top - bottom) / 2, cap: null };
    }
    // Desktop: big enough to see, small enough that the page is still there around it.
    const capH = 124, gap = 24, top = Math.max(84, this.topH + 10), bottom = 36;
    const f = fit(Math.min(vw - 2 * Math.max(116, vw * 0.12), 1100), Math.min(vh - top - bottom - capH - gap, vh * 0.66, 820));
    const groupTop = top + Math.max(0, (vh - top - bottom - (f.h + gap + capH)) / 2);
    const width = Math.max(f.w, Math.min(520, vw - 60));
    return { ...f, cx: vw / 2, cy: groupTop + f.h / 2, cap: { left: (vw - width) / 2, top: groupTop + f.h + gap, width } };
  }

  addCard(photo) {
    const c = new Card(photo);
    c.size(this.restFor(photo));
    this.stage.append(c.node);
    this.cards.push(c);
    return c;
  }

  relayout() {
    if (!this.isOpen || this.closing) return;
    this.measure();
    const c = this.cur;
    if (!c) return;
    c.size(this.restFor(c.photo));
    c.place({ ...c.rest, r: 0, o: 1 });
    this.placeChrome();
    this.run();
  }

  /** Details under the print (or beside it), arrows level with it. */
  placeChrome() {
    const R = this.cur?.rest;
    if (!R) return;
    this.node.style.setProperty('--ny', `${R.cy.toFixed(0)}px`);
    const cap = R.cap;
    this.node.classList.toggle('is-side', !!cap?.side);
    this.node.style.setProperty('--side', cap?.side ? `${(innerWidth - cap.left + 6).toFixed(0)}px` : '0px');
    if (!cap) { this.caption.removeAttribute('style'); return; }
    Object.assign(this.caption.style, { left: `${cap.left}px`, top: `${cap.top}px`, width: `${cap.width}px` });
  }

  /* ---------- Motion ---------- */
  run() {
    if (this.stop) return;
    for (const c of this.cards) c.node.classList.add('is-moving');
    this.stop = tick((dt) => this.frame(dt));
  }

  frame(dt) {
    if (!this.isOpen) { this.stop = null; return false; }
    const now = performance.now();
    const c = this.cur;
    const g = this.going;
    if (g && !g.fade) {
      // Follow the print home even while the page scrolls under it.
      const t = g.home?.isConnected ? geom(g.home) : null;
      if (t) c.aim(t);
      else this.fadeOut(c);
    }
    const lean = canHover() && !reduceMotion();
    let moving = lean && !!(this.lean.rx.step(dt) | this.lean.ry.step(dt));
    for (const k of [...this.cards]) {
      const m = k.step(dt);
      k.render(k === c && lean ? { rx: this.lean.rx.value, ry: this.lean.ry.value } : null);
      if (k.leaving && (!m || k.o.value < 0.01)) {
        k.node.remove();
        this.cards.splice(this.cards.indexOf(k), 1);
        continue;
      }
      moving = moving || m;
    }
    if (g) {
      const arrived = g.fade ? c.o.value < 0.02 : !moving && now > (c.flipUntil || 0);
      if (arrived || now - g.t0 > 1600) { this.finish(); return false; }
      return true;
    }
    if (!moving) {
      // At rest: let the browser draw the print sharp at its full size.
      for (const k of this.cards) k.node.classList.remove('is-moving');
      this.stop = null;
      return false;
    }
    return true;
  }

  /** Lean the held print toward the pointer, a few degrees, with the light following. */
  leanTo(e) {
    if (e.pointerType !== 'mouse' || this.closing || this.drag) return;
    const c = this.cur;
    if (!c) return;
    const R = c.rest;
    const nx = (e.clientX - (R.cx - R.w / 2)) / R.w;
    const ny = (e.clientY - (R.cy - R.h / 2)) / R.h;
    const inside = nx >= 0 && nx <= 1 && ny >= 0 && ny <= 1;
    this.lean.ry.target = inside ? (nx - 0.5) * 2 * LEAN : 0;
    this.lean.rx.target = inside ? -(ny - 0.5) * 2 * LEAN : 0;
    c.node.style.setProperty('--gx', `${(clamp(nx, 0, 1) * 100).toFixed(1)}%`);
    c.node.style.setProperty('--gy', `${(clamp(ny, 0, 1) * 100).toFixed(1)}%`);
    c.node.classList.toggle('is-lit', inside);
    this.run();
  }

  /* ---------- The prints on the page: hidden while they are in your hand ---------- */
  homeFor(photo) {
    const v = this.app.view;
    if (!v) return null;
    const n = v.printFor ? v.printFor(photo.id) : v.shared().get(`p:${photo.id}`);
    return n?.isConnected ? n : null;
  }

  lend(n, fade = false) {
    if (!n) return;
    this.lent.add(n);
    n.getAnimations?.().forEach((a) => { if (a.id === 'closer-lend') a.cancel(); });
    if (!fade || reduceMotion()) { n.style.visibility = 'hidden'; return; }
    const a = n.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 240, easing: 'ease-out', fill: 'forwards' });
    a.id = 'closer-lend';
    a.finished.then(() => { if (this.lent.has(n)) n.style.visibility = 'hidden'; a.cancel(); }, () => {});
  }

  unlend(n, fade = false) {
    if (!n) return;
    this.lent.delete(n);
    n.getAnimations?.().forEach((a) => { if (a.id === 'closer-lend') a.cancel(); });
    n.style.visibility = '';
    if (fade && !reduceMotion()) {
      const a = n.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 480, easing: EASE });
      a.id = 'closer-lend';
    }
  }

  /* ---------- Details ---------- */
  fill(first = false) {
    const p = this.photo;
    const ev = p.event ? store.event(p.event) : null;
    const apply = () => {
      this.kicker.textContent = p.date;
      this.count.textContent = this.list.length > 1 ? `${this.index + 1} / ${this.list.length}` : '';
      this.title.textContent = p.title;
      this.meta.textContent = [p.place, ev?.title].filter(Boolean).join(' · ');
      this.meta.hidden = !this.meta.textContent;
      const here = this.app.route?.name === 'year' && this.app.route.year === p.year;
      this.yearLink.hidden = here;
      this.yearLink.href = yearHref(p.year);
      this.yearLink.replaceChildren(icon('grid', 20), el('span', null, `All of ${p.year}`));
      this.paintFav();
      this.paintFlip();
      this.prevBtn.disabled = this.index === 0;
      this.nextBtn.disabled = this.index === this.list.length - 1;
      if (this.shareBtn) this.prefetchFile(p);
    };
    this.placeChrome();
    if (first) { apply(); return; }
    animate(this.body, [{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'translateY(-6px)' }], { duration: 130, easing: 'ease-in' }).finished.then(() => {
      if (!this.isOpen || this.photo !== p) return;
      apply();
      animate(this.body, [{ opacity: 0, transform: 'translateY(8px)' }, { opacity: 1, transform: 'none' }], { duration: 420, easing: EASE });
    });
  }

  paintFav() {
    const on = store.isFav(this.photo.id);
    this.favBtn.classList.toggle('is-on', on);
    this.favBtn.setAttribute('aria-pressed', String(on));
    this.favBtn.replaceChildren(icon(on ? 'heartFill' : 'heart', 20), el('span', null, on ? 'Saved' : 'Save'));
  }

  paintFlip() {
    const on = !!this.cur?.node.classList.contains('is-flipped');
    this.flipBtn.replaceChildren(icon('flip', 20), el('span', null, on ? 'Turn back' : 'Turn over'));
  }

  toggleFav() {
    const on = store.toggleFav(this.photo.id);
    this.paintFav();
    const svg = this.favBtn.querySelector('svg');
    if (on) burst(svg);
    animate(svg, [{ transform: 'scale(1)' }, { transform: 'scale(1.45)' }, { transform: 'scale(1)' }], { duration: 460, easing: EASE });
    this.app.toast(on ? 'Saved to favorites' : 'Removed from favorites');
  }

  flip() {
    const c = this.cur;
    if (!c || this.closing) return;
    this.unzoom(c);
    c.node.classList.toggle('is-flipped');
    this.paintFlip();
  }

  /** Send the photo itself (or a link to it) to Messages, Mail, AirDrop... */
  share() {
    const p = this.photo;
    const text = `${p.title}, ${p.date}`;
    const url = new URL(photoHref(p), location.href).href;
    const file = this.files.get(p.id);
    const data = file && navigator.canShare?.({ files: [file] }) ? { files: [file], title: p.title, text } : { title: p.title, text, url };
    navigator.share(data).catch(() => {});
  }

  /** Have the photo's file ready before the button is pressed: Safari only shares straight from a tap. */
  prefetchFile(p) {
    if (!navigator.canShare || this.files.has(p.id)) return;
    this.files.set(p.id, null);
    fetch(p.src).then((r) => r.blob()).then((b) => {
      const name = `${(p.title || p.id).replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '-').toLowerCase() || p.id}.${(b.type.split('/')[1] || 'webp')}`;
      const f = new File([b], name, { type: b.type || 'image/webp' });
      if (navigator.canShare({ files: [f] })) this.files.set(p.id, f);
    }).catch(() => {});
  }

  preload() {
    for (const k of [this.index + 1, this.index - 1, this.index + 2]) {
      const p = this.list[k];
      if (p) { const i = new Image(); i.decoding = 'async'; i.src = p.src; }
    }
  }

  /* ---------- Moving through the prints ---------- */
  go(delta, { vx = 0 } = {}) {
    if (!this.isOpen || this.closing) return;
    const old = this.cur;
    const next = this.index + delta;
    if (next < 0 || next >= this.list.length) {
      // Nothing further that way: a little nudge and back.
      old.x.v += -delta * 700 + vx * 0.4;
      old.aim({ ...old.rest, r: 0 });
      this.run();
      return;
    }
    this.unzoom(old, false);
    const W = innerWidth;
    const R0 = old.rest;
    old.leaving = true;
    old.node.classList.remove('is-lit');
    old.aim({ cx: R0.cx - delta * W * 0.6, cy: R0.cy + 26, w: R0.w * 0.86, h: R0.h * 0.86, r: -delta * 9, o: 0 });
    if (vx) old.x.v = vx;
    this.unlend(old.home, true);

    this.index = next;
    const c = this.addCard(this.photo);
    const R = c.rest;
    c.home = this.homeFor(this.photo);
    c.place({ cx: R.cx + delta * W * 0.5, cy: R.cy + 22, w: R.w * 0.9, h: R.h * 0.9, r: delta * 8, o: 0 });
    c.aim({ ...R, r: 0, o: 1 });
    c.started = true;
    if (vx) c.x.v = vx * 0.6;
    if (reduceMotion()) { c.place({ ...R, r: 0, o: 1 }); old.place({ ...R0, o: 0 }); }
    this.lend(c.home, true);
    this.cur = c;
    this.fill();
    this.preload();
    this.run();
  }

  /* ---------- Gestures: swipe to move through, down to put back, pinch or double-tap to zoom ---------- */
  dragStart(e) {
    const c = this.cur;
    this.drag = c && c.started && !this.closing ? { axis: null, zs: { ...c.zs }, sheet: !!e.target.closest?.('.closer-caption') } : null;
  }

  dragMove({ dx, dy }) {
    const d = this.drag, c = this.cur;
    if (!d || !c || this.closing) return;
    if (c.zs.s > 1.01) { this.setZoom(c, c.zs.s, d.zs.x + dx, d.zs.y + dy); return; }
    if (!d.axis) {
      d.axis = Math.abs(dx) > Math.abs(dy) * 1.1 && !d.sheet ? 'x' : 'y';
      this.lean.rx.snap(0);
      this.lean.ry.snap(0);
    }
    const R = c.rest;
    if (d.axis === 'x') {
      const edge = (dx > 0 && this.index === 0) || (dx < 0 && this.index === this.list.length - 1);
      const x = edge ? dx * 0.3 : dx;
      c.place({ ...R, cx: R.cx + x, r: (x / innerWidth) * 9 });
    } else {
      // Pulled down, the print follows the finger and shrinks a little, ready to drop back in its place.
      const y = dy > 0 ? dy : dy * 0.2;
      const k = clamp(1 - Math.max(0, y) / (innerHeight * 1.5), 0.62, 1);
      c.place({ cx: R.cx + (d.sheet ? 0 : dx * 0.7), cy: R.cy + y, w: R.w * k, h: R.h * k, r: (d.sheet ? 0 : dx / innerWidth) * 6 });
      const f = clamp(1 - Math.max(0, y) / 360, 0, 1);
      this.veil.style.opacity = (0.25 + 0.75 * f).toFixed(3);
      this.caption.style.opacity = f.toFixed(3);
    }
    c.render(null);
  }

  dragEnd({ vx, vy, tap, e }) {
    const d = this.drag, c = this.cur;
    this.drag = null;
    if (!c || this.closing) return;
    if (tap) { this.tap(e); return; }
    if (!d) return;
    if (c.zs.s > 1.01) { this.clampZoom(c); return; }
    // The browser still fires a click after a drag; let it land on nothing.
    this.swallowClick();
    const R = c.rest;
    if (d.axis === 'x') {
      const dx = c.x.value - R.cx;
      const dir = dx < -innerWidth * 0.16 || vx < -480 ? 1 : dx > innerWidth * 0.16 || vx > 480 ? -1 : 0;
      if (dir && this.list[this.index + dir]) { this.go(dir, { vx }); return; }
      c.x.v = vx;
    } else if (d.axis === 'y') {
      if (c.y.value - R.cy > 110 || vy > 650) { this.requestClose({ vx, vy }); return; }
      c.x.v = vx; c.y.v = vy;
      this.veil.style.opacity = '';
      this.caption.style.opacity = '';
    }
    c.aim({ ...R, r: 0, o: 1 });
    this.run();
  }

  swallowClick() {
    const stop = (ev) => { ev.stopPropagation(); ev.preventDefault(); };
    window.addEventListener('click', stop, { capture: true, once: true });
    setTimeout(() => window.removeEventListener('click', stop, { capture: true }), 60);
  }

  /** A click on the print, or beside it, puts it back. On a touch screen two quick taps zoom instead. */
  tap(e) {
    if (e.target.closest?.('.closer-caption')) return;
    const onCard = !!e.target.closest?.('.closer-card');
    if (!onCard || e.pointerType === 'mouse') { this.requestClose(); return; }
    const now = performance.now();
    const t = this.lastTap;
    clearTimeout(this.tapTimer);
    if (t && now - t.t < 300 && Math.hypot(e.clientX - t.x, e.clientY - t.y) < 34) {
      this.lastTap = null;
      this.toggleZoom(e.clientX, e.clientY);
      return;
    }
    this.lastTap = { t: now, x: e.clientX, y: e.clientY };
    this.tapTimer = setTimeout(() => {
      this.lastTap = null;
      if (this.cur && this.cur.zs.s <= 1.01) this.requestClose();
    }, 300);
  }

  /** Scrolling puts the photo back and carries on scrolling the page; a pinch on a trackpad zooms. */
  wheel(e) {
    e.preventDefault();
    if (this.closing || !this.cur) return;
    if (e.ctrlKey) {
      const c = this.cur;
      if (c.node.classList.contains('is-flipped')) return;
      const r = c.zoom.getBoundingClientRect();
      const k = clamp(c.zs.s * Math.exp(-e.deltaY * 0.01), 1, 4);
      const ox = e.clientX - r.left, oy = e.clientY - r.top;
      const f = k / c.zs.s;
      this.setZoom(c, k, ox - (ox - c.zs.x) * f, oy - (oy - c.zs.y) * f);
      clearTimeout(this.wheelT);
      this.wheelT = setTimeout(() => this.clampZoom(c), 140);
      return;
    }
    if (Math.abs(e.deltaY) + Math.abs(e.deltaX) < 3) return;
    this.requestClose({ scroll: true });
  }

  pinch({ scale, cx, cy }) {
    const c = this.cur;
    if (!c || c.node.classList.contains('is-flipped')) return;
    if (!this.pz) {
      this.pz = { s: c.zs.s, x: c.zs.x, y: c.zs.y, cx, cy };
      c.place({ ...c.rest, r: 0, o: 1 });
      c.render(null);
      this.veil.style.opacity = '';
      this.caption.style.opacity = '';
    }
    const p = this.pz;
    const ns = clamp(p.s * scale, 1, 4);
    const r = c.zoom.getBoundingClientRect();
    const ox = p.cx - r.left, oy = p.cy - r.top;
    const k = ns / p.s;
    this.setZoom(c, ns, ox - (ox - p.x) * k + (cx - p.cx), oy - (oy - p.y) * k + (cy - p.cy));
    this.drag = null;
  }

  pinchEnd() { this.pz = null; if (this.cur) this.clampZoom(this.cur); }

  toggleZoom(x, y) {
    const c = this.cur;
    if (!c || c.node.classList.contains('is-flipped')) return;
    if (c.zs.s > 1.01) { this.unzoom(c); return; }
    const r = c.zoom.getBoundingClientRect();
    const k = 2.5;
    const ox = x - r.left, oy = y - r.top;
    this.setZoom(c, k, ox - ox * k, oy - oy * k, true);
    this.clampZoom(c);
  }

  setZoom(c, k, x, y, animated = false) {
    c.img.style.transition = animated ? 'transform 0.55s cubic-bezier(0.16, 1, 0.3, 1)' : 'none';
    c.zs = { s: k, x, y };
    c.img.style.transform = `translate(${x}px, ${y}px) scale(${k})`;
    this.node.classList.toggle('is-zoomed', k > 1.01);
  }

  clampZoom(c) {
    const r = c.zoom.getBoundingClientRect();
    const k = c.zs.s;
    if (k <= 1.01) { this.unzoom(c); return; }
    const x = clamp(c.zs.x, r.width - r.width * k, 0), y = clamp(c.zs.y, r.height - r.height * k, 0);
    c.img.style.transition = 'transform 0.45s cubic-bezier(0.16, 1, 0.3, 1)';
    c.zs = { s: k, x, y };
    c.img.style.transform = `translate(${x}px, ${y}px) scale(${k})`;
  }

  unzoom(c, animated = true) {
    if (!c) return;
    c.img.style.transition = animated ? 'transform 0.5s cubic-bezier(0.16, 1, 0.3, 1)' : 'none';
    c.zs = { s: 1, x: 0, y: 0 };
    c.img.style.transform = '';
    this.node?.classList.remove('is-zoomed');
  }

  key(e) {
    if (!this.isOpen || this.closing) return;
    const k = e.key;
    let used = true;
    if (k === 'Escape') this.requestClose();
    else if (k === 'ArrowRight') this.go(1);
    else if (k === 'ArrowLeft') this.go(-1);
    else if (k === 'f' || k === 'F') this.flip();
    else if (k === 'h' || k === 'H') this.toggleFav();
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

  /* ---------- History: Back (or the phone's back swipe) puts the photo down ---------- */
  pushHistory() {
    this.pushed = false;
    try {
      history.pushState({ ...(history.state || {}), closer: true }, '');
      this.pushed = true;
    } catch { /* sandboxed: no history entry */ }
  }

  requestClose(opts) {
    if (!this.isOpen || this.closing) return;
    // Start moving at once; the history entry is tidied up alongside.
    const popping = this.pushed && history.state?.closer;
    this.pushed = false;
    this.close(opts);
    if (popping) history.back();
  }

  /** Called by the router on popstate. */
  onPop() {
    if (this.isOpen && !this.closing) { this.pushed = false; this.close(); }
  }

  close({ instant = false, vx = 0, vy = 0, scroll = false } = {}) {
    if (!this.isOpen || this.closing) return;
    clearTimeout(this.tapTimer);
    this.closing = true;
    this.drag = null;
    const c = this.cur;
    this.node.classList.remove('is-open');
    this.node.classList.add('is-closing');
    this.app.el.classList.remove('has-closer');
    this.app.lockScroll('closer', false);
    if (instant || !c || !c.started) { this.finish(); return; }
    this.veil.style.opacity = '';
    this.caption.style.opacity = '';
    this.unzoom(c, false);
    c.node.classList.remove('is-lit');
    this.lean.rx.target = this.lean.ry.target = 0;
    if (c.node.classList.contains('is-flipped')) {
      c.node.classList.add('is-unflipping');
      c.node.classList.remove('is-flipped');
      c.flipUntil = performance.now() + 470;
    }
    for (const k of this.cards) if (k !== c) k.aim({ ...k.rest, cx: k.x.target, o: 0 });
    const home = c.home?.isConnected ? c.home : this.homeFor(c.photo);
    c.home = home;
    this.going = { t0: performance.now(), home, fade: false };
    c.x.v += vx;
    c.y.v += vy;
    if (home) revealNow(home);
    if (!home || reduceMotion() || (scroll && !onScreen(geom(home), 0)) || !this.bringHome(home, scroll)) this.fadeOut(c);
    else this.lend(home);
    this.run();
  }

  /** Make sure the print's place on the page is on screen, so the photo can land in it. */
  bringHome(home, scroll) {
    const r = home.getBoundingClientRect();
    const top = this.topH, bottom = innerHeight;
    const seen = r.bottom > top + r.height * 0.35 && r.top < bottom - r.height * 0.35 && r.right > 0 && r.left < innerWidth;
    if (seen || scroll) return true;
    const v = this.app.view;
    if (v?.fixed) return v.bringIntoView?.(home) ?? false;
    home.scrollIntoView({ block: 'center', inline: 'center', behavior: 'smooth' });
    return true;
  }

  fadeOut(c) {
    if (this.going) this.going.fade = true;
    const R = c.rest;
    c.aim({ cx: c.x.target, cy: c.y.target + 30, w: R.w * 0.88, h: R.h * 0.88, r: 0, o: 0 });
  }

  /** Landed (or faded): the print on the page shows again in the same frame the photo goes. */
  finish() {
    const node = this.node;
    for (const n of [...this.lent]) this.unlend(n);
    this.stop?.();
    this.stop = null;
    node?.remove();
    this.teardown();
    this.app.closerClosed();
  }

  /** The router is taking this photo to another page: the card flies there, the rest fades. */
  handoff() {
    if (!this.isOpen) return;
    this.closing = true;
    this.pushed = false;
    const node = this.node;
    for (const c of this.cards) c.node.style.visibility = 'hidden';
    for (const n of [...this.lent]) this.unlend(n);
    this.stop?.();
    this.stop = null;
    node.style.pointerEvents = 'none';
    node.classList.remove('is-open');
    this.app.el.classList.remove('has-closer');
    this.app.lockScroll('closer', false);
    animate(node, [{ opacity: 1 }, { opacity: 0 }], { duration: 380, easing: EASE }).finished.then(() => node.remove(), () => node.remove());
    this.teardown();
  }

  teardown() {
    this.isOpen = false;
    this.closing = false;
    this.going = null;
    document.removeEventListener('keydown', this.onKey, true);
    window.removeEventListener('resize', this.onResize);
    this.offDrag?.();
    this.offDrag = null;
    this.app.lockScroll('closer', false);
    this.app.el.classList.remove('has-closer');
    if (this.prevFocus?.isConnected) this.prevFocus.focus?.({ preventScroll: true });
    this.cards = [];
    this.cur = null;
    this.lean.rx.snap(0);
    this.lean.ry.snap(0);
  }

  /** The print in your hand, for the router to fly into the next page. */
  card() { return this.isOpen && !this.closing ? this.cur?.node : null; }
}

function stampFor(p) {
  const m = /([A-Za-z]+)\s+(\d{4})/.exec(p.date || '');
  if (m) return `${m[1].slice(0, 3).toUpperCase()} ${m[2]}`;
  return String(p.year);
}
