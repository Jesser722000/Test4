import { el, icon, clamp, seeded, reduceMotion } from '../util.js';
import { animate, EASE, SPRING } from '../anim.js';
import { rollNumber, revealWords } from '../motion.js';
import * as store from '../store.js';

const PHOTO_MS = 5200;
const TITLE_MS = 2600;

/**
 * Play a year (or a whole decade) as a slideshow: one print at a time, slowly drifting closer,
 * with its date and caption. Tap the right side for the next one, the left for the one before,
 * hold to pause, swipe down (or Esc) to stop.
 */
export class Story {
  constructor(app) {
    this.app = app;
    this.isOpen = false;
  }

  /** photos: in order. opts: { title, years: true to put a title card before each year, end: closing line } */
  open(photos, { title = '', years = false, end = null } = {}) {
    if (this.isOpen || !photos?.length) return;
    this.slides = [];
    let year = null;
    for (const p of photos) {
      if (years && p.year !== year) {
        this.slides.push({ kind: 'year', year: p.year, prev: year });
        year = p.year;
      }
      this.slides.push({ kind: 'photo', photo: p });
    }
    this.title = title;
    this.endText = end || `That was ${title}.`;
    this.index = -1;
    this.isOpen = true;
    this.paused = false;
    this.prevFocus = document.activeElement;
    this.build();
    this.app.overlays.append(this.node);
    this.app.lockScroll('story', true);
    this.app.el.classList.add('has-story');
    this.app.view?.pauseMedia?.();
    this.pushHistory();
    animate(this.node, [{ opacity: 0 }, { opacity: 1 }], { duration: 420, easing: EASE });
    animate(this.top, [{ opacity: 0, transform: 'translateY(-12px)' }, { opacity: 1, transform: 'none' }], { duration: 700, delay: 200, easing: EASE });
    this.show(0, 1);
    this.closeBtn.focus({ preventScroll: true });
  }

  build() {
    const n = this.slides.length;
    this.segs = n <= 40;
    this.bars = el('div', { class: `st-bars${this.segs ? '' : ' is-one'}`, 'aria-hidden': 'true' },
      this.segs ? this.slides.map(() => el('i', null, el('b'))) : el('i', null, el('b')));
    this.closeBtn = el('button', { class: 'st-close', type: 'button', 'aria-label': 'Stop the slideshow' }, icon('close', 22));
    this.pauseBtn = el('button', { class: 'st-pause', type: 'button', 'aria-label': 'Pause' }, icon('pause', 18));
    this.pauseBtn.addEventListener('click', () => { if (this.endCard) this.show(0, 1); else this.setPaused(!this.paused); });
    this.top = el('div', { class: 'st-top' }, this.bars,
      el('div', { class: 'st-head' }, el('p', { class: 'st-title' }, this.title), this.pauseBtn, this.closeBtn));
    this.glow = el('div', { class: 'st-glow', 'aria-hidden': 'true' });
    this.stage = el('div', { class: 'st-stage', 'aria-live': 'polite' });
    this.capDate = el('p', { class: 'st-date' });
    this.capTitle = el('h2', { class: 'st-cap-title' });
    this.capPlace = el('p', { class: 'st-place' });
    this.caption = el('div', { class: 'st-caption' }, this.capDate, this.capTitle, this.capPlace);
    this.hint = el('p', { class: 'st-hint', 'aria-hidden': 'true' }, icon('pause', 14), 'Paused');
    this.node = el('div', { class: 'story', role: 'dialog', 'aria-modal': 'true', 'aria-label': `${this.title}, slideshow`, 'data-lenis-prevent': '' },
      this.glow, this.stage, this.caption, this.top, this.hint);

    this.closeBtn.addEventListener('click', () => this.requestClose());
    this.onKey = (e) => this.key(e);
    document.addEventListener('keydown', this.onKey, true);
    this.onVis = () => { if (document.hidden) this.setPaused(true); };
    document.addEventListener('visibilitychange', this.onVis);

    // Tap left or right to step; hold to pause; swipe down to stop.
    let down = null;
    this.node.addEventListener('pointerdown', (e) => {
      if (e.target.closest('button') || (e.pointerType === 'mouse' && e.button !== 0)) return;
      down = { x: e.clientX, y: e.clientY, t: performance.now(), id: e.pointerId, held: false };
      clearTimeout(this.holdT);
      this.holdT = setTimeout(() => { if (down) { down.held = true; this.hold(true); } }, 230);
    });
    this.node.addEventListener('pointermove', (e) => {
      if (!down || e.pointerId !== down.id) return;
      const dy = e.clientY - down.y;
      if (Math.abs(e.clientX - down.x) > 12 || Math.abs(dy) > 12) clearTimeout(this.holdT);
      if (dy > 0 && dy > Math.abs(e.clientX - down.x)) {
        this.node.style.transform = `translateY(${dy * 0.6}px) scale(${clamp(1 - dy / 1600, 0.86, 1)})`;
        this.node.style.opacity = String(clamp(1 - dy / 600, 0.3, 1));
      }
    });
    const up = (e) => {
      if (!down || e.pointerId !== down.id) return;
      clearTimeout(this.holdT);
      const d = down;
      down = null;
      const dx = e.clientX - d.x, dy = e.clientY - d.y;
      const dragged = this.node.style.transform;
      this.node.style.transform = '';
      this.node.style.opacity = '';
      if (d.held) { this.hold(false); return; }
      if (e.type === 'pointercancel') return;
      if (dy > 90 && dy > Math.abs(dx)) { this.requestClose(); return; }
      if (dragged) animate(this.node, [{ transform: dragged }, { transform: 'none' }], { duration: 420, easing: SPRING });
      if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) { this.step(dx < 0 ? 1 : -1); return; }
      if (Math.hypot(dx, dy) < 12) this.step(e.clientX < innerWidth * 0.32 ? -1 : 1);
    };
    this.node.addEventListener('pointerup', up);
    this.node.addEventListener('pointercancel', up);
    this.node.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  step(delta) {
    const i = this.index + delta;
    if (i < 0) { this.show(0, -1); return; }
    if (i >= this.slides.length) { this.end(); return; }
    this.show(i, delta);
  }

  /** Bring in slide i: the old print fades back as the new one settles in and starts to drift. */
  show(i, dir = 1) {
    const s = this.slides[i];
    this.index = i;
    if (this.endCard) {
      this.endCard.remove();
      this.endCard = null;
      this.setPaused(false);
    }
    const old = this.slideNode;
    const node = s.kind === 'year' ? this.yearSlide(s) : this.photoSlide(s.photo);
    this.slideNode = node;
    this.stage.append(node);
    if (old) {
      old.style.pointerEvents = 'none';
      animate(old, [{ opacity: 1, transform: 'none' }, { opacity: 0, transform: `scale(${dir > 0 ? 0.97 : 1.03})` }], { duration: 700, easing: EASE })
        .finished.then(() => old.remove(), () => old.remove());
    }
    animate(node, [{ opacity: 0, transform: `scale(${dir > 0 ? 1.05 : 0.96})` }, { opacity: 1, transform: 'none' }], { duration: 950, easing: EASE });
    this.paintCaption(s);
    this.paintBars();
    this.run(s);
    this.preload(i + 1);
  }

  photoSlide(p) {
    // The print is sized by the stylesheet from its shape, so it still fits when the phone turns.
    const img = el('img', { src: p.src, alt: p.title ? `${p.title}, ${p.date}` : '', decoding: 'async', draggable: 'false' });
    const done = () => img.classList.add('is-in');
    img.addEventListener('load', done, { once: true });
    img.addEventListener('error', done, { once: true });
    if (img.complete && img.naturalWidth) done();
    const print = el('div', { class: `st-print${p.bw ? ' is-bw' : ''}`, style: { '--a': (p.w / p.h).toFixed(4) } },
      el('div', { class: 'st-img', style: { backgroundImage: p.lqip ? `url("${p.lqip}")` : null } }, img));
    const node = el('figure', { class: 'st-slide' }, print);
    node._print = print;
    this.glowTo(p);
    return node;
  }

  yearSlide(s) {
    const num = el('p', { class: 'st-year' }, String(s.year));
    const sum = el('p', { class: 'st-sum' }, store.yearSummary(s.year));
    const node = el('figure', { class: 'st-slide st-slide-year' }, num, sum);
    requestAnimationFrame(() => {
      rollNumber(num, s.year, s.prev ?? Math.floor(s.year / 10) * 10, { delay: 120 });
      if (sum.textContent) revealWords(sum, { delay: 380, stagger: 45, duration: 1000 });
    });
    this.glow.querySelectorAll('img').forEach((n) => n.classList.remove('is-on'));
    return node;
  }

  /** The photo's colours, blurred, fill the screen behind it. */
  glowTo(p) {
    const img = el('img', { alt: '', src: p.lqip || p.thumb, decoding: 'async' });
    this.glow.append(img);
    requestAnimationFrame(() => img.classList.add('is-on'));
    [...this.glow.children].filter((n) => n !== img).forEach((n) => {
      n.classList.remove('is-on');
      setTimeout(() => n.remove(), 1200);
    });
  }

  paintCaption(s) {
    const p = s.kind === 'photo' ? s.photo : null;
    const ev = p?.event ? store.event(p.event) : null;
    const fill = () => {
      this.capDate.textContent = p ? p.date : '';
      this.capTitle.textContent = p ? p.title : '';
      this.capPlace.textContent = p ? [p.place, ev?.title].filter(Boolean).join(' · ') : '';
      this.caption.hidden = !p;
    };
    if (this.caption.hidden || !p) { fill(); if (p) animate(this.caption, [{ opacity: 0, transform: 'translateY(10px)' }, { opacity: 1, transform: 'none' }], { duration: 700, delay: 250, easing: EASE, fill: 'backwards' }); return; }
    animate(this.caption, [{ opacity: 1 }, { opacity: 0, transform: 'translateY(-6px)' }], { duration: 180, easing: 'ease-in' }).finished.then(() => {
      if (!this.isOpen) return;
      fill();
      animate(this.caption, [{ opacity: 0, transform: 'translateY(10px)' }, { opacity: 1, transform: 'none' }], { duration: 600, easing: EASE });
    });
  }

  paintBars() {
    const n = this.slides.length;
    if (this.segs) {
      [...this.bars.children].forEach((seg, k) => {
        const b = seg.firstChild;
        b.getAnimations().forEach((a) => a.cancel());
        b.style.transform = `scaleX(${k < this.index ? 1 : 0})`;
      });
    } else {
      const b = this.bars.firstChild.firstChild;
      b.getAnimations().forEach((a) => a.cancel());
      b.style.transform = `scaleX(${this.index / n})`;
    }
  }

  /** The slide's clock is its progress bar; the drift runs alongside, and both pause together. */
  run(s) {
    const ms = s.kind === 'year' ? TITLE_MS : PHOTO_MS;
    const n = this.slides.length;
    const bar = this.segs ? this.bars.children[this.index].firstChild : this.bars.firstChild.firstChild;
    const from = this.segs ? 0 : this.index / n, to = this.segs ? 1 : (this.index + 1) / n;
    this.clock = bar.animate([{ transform: `scaleX(${from})` }, { transform: `scaleX(${to})` }], { duration: ms, easing: 'linear', fill: 'forwards' });
    const i = this.index;
    this.clock.onfinish = () => { if (this.isOpen && this.index === i && !this.paused) this.step(1); };
    this.drift = null;
    const print = this.slideNode._print;
    if (print && !reduceMotion()) {
      const r = seeded(`story-${s.photo.id}`);
      const dx = (r() - 0.5) * 3, dy = (r() - 0.5) * 2.4;
      this.drift = print.animate([
        { transform: 'scale(1) translate(0, 0)' },
        { transform: `scale(1.075) translate(${dx.toFixed(2)}%, ${dy.toFixed(2)}%)` },
      ], { duration: ms + 1400, easing: 'cubic-bezier(0.3, 0.1, 0.4, 1)', fill: 'forwards' });
    }
    if (this.paused) { this.clock.pause(); this.drift?.pause(); }
  }

  hold(on) {
    if (on) { this.wasPaused = this.paused; this.setPaused(true, true); }
    else if (!this.wasPaused) this.setPaused(false);
  }

  setPaused(on, quiet = false) {
    if (!this.isOpen) return;
    this.paused = on;
    for (const a of [this.clock, this.drift]) { if (a) { if (on) a.pause(); else if (a.playState === 'paused') a.play(); } }
    this.node.classList.toggle('is-paused', on && !quiet);
    this.node.classList.toggle('is-holding', on && quiet);
    this.pauseBtn.replaceChildren(icon(on ? 'play' : 'pause', 18));
    this.pauseBtn.setAttribute('aria-label', on ? 'Play' : 'Pause');
  }

  preload(i) {
    for (const k of [i, i + 1]) {
      const s = this.slides[k];
      if (s?.kind === 'photo') { const im = new Image(); im.decoding = 'async'; im.src = s.photo.src; im.decode?.().catch(() => {}); }
    }
  }

  /** The last print: a quiet card to watch again or go back to the page. */
  end() {
    if (this.endCard) return;
    this.clock?.cancel();
    this.drift?.pause();
    this.caption.hidden = true;
    this.paused = true;
    this.pauseBtn.replaceChildren(icon('play', 18));
    const again = el('button', { class: 'chip', type: 'button' }, icon('play', 14), 'Watch again');
    const done = el('button', { class: 'chip', type: 'button' }, 'Done');
    again.addEventListener('click', () => this.show(0, 1));
    done.addEventListener('click', () => this.requestClose());
    this.endCard = el('div', { class: 'st-end' }, el('p', null, this.endText), el('div', { class: 'st-end-links' }, again, done));
    this.node.append(this.endCard);
    animate(this.endCard, [{ opacity: 0, transform: 'translate(-50%, 12px)' }, { opacity: 1, transform: 'translate(-50%, 0)' }], { duration: 700, easing: EASE });
    again.focus({ preventScroll: true });
  }

  key(e) {
    if (!this.isOpen) return;
    const k = e.key;
    let used = true;
    if (k === 'Escape') this.requestClose();
    else if (k === 'ArrowRight') this.step(1);
    else if (k === 'ArrowLeft') this.step(-1);
    else if (k === ' ' && !e.target.closest?.('button')) { if (this.endCard) this.show(0, 1); else this.setPaused(!this.paused); }
    else if (k === 'Tab') {
      const f = [...this.node.querySelectorAll('button')].filter((n) => n.offsetParent);
      const i = f.indexOf(document.activeElement);
      if (e.shiftKey && i <= 0) f[f.length - 1]?.focus(); else if (!e.shiftKey && i === f.length - 1) f[0]?.focus(); else used = false;
    } else used = false;
    if (used) { e.preventDefault(); e.stopPropagation(); }
  }

  pushHistory() {
    this.pushed = false;
    try { history.pushState({ ...(history.state || {}), story: true }, ''); this.pushed = true; } catch { /* sandboxed */ }
  }

  requestClose() {
    if (!this.isOpen) return;
    const popping = this.pushed && history.state?.story;
    this.pushed = false;
    this.close();
    if (popping) history.back();
  }

  onPop() { if (this.isOpen) { this.pushed = false; this.close(); } }

  close() {
    if (!this.isOpen) return;
    this.isOpen = false;
    clearTimeout(this.holdT);
    this.clock?.cancel();
    this.drift?.cancel();
    document.removeEventListener('keydown', this.onKey, true);
    document.removeEventListener('visibilitychange', this.onVis);
    this.app.lockScroll('story', false);
    this.app.el.classList.remove('has-story');
    const n = this.node;
    n.style.pointerEvents = 'none';
    animate(n, [{ opacity: 1, transform: n.style.transform || 'none' }, { opacity: 0, transform: 'scale(0.98)' }], { duration: 380, easing: EASE })
      .finished.then(() => n.remove(), () => n.remove());
    if (this.prevFocus?.isConnected) this.prevFocus.focus?.({ preventScroll: true });
  }
}
