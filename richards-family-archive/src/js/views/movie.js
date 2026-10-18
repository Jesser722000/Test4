import { View, yearHref, eventHref } from './base.js';
import { el, icon, fmtTime, clamp } from '../util.js';
import { tick, EASE, SPRING } from '../anim.js';
import { makePrint, attachTip, sharpen } from '../print.js';
import { revealWords } from '../motion.js';
import * as store from '../store.js';

/** Parse WebVTT text into cues. */
function parseVtt(text) {
  const cues = [];
  const t = (s) => { const p = s.trim().split(':').map(parseFloat); return p.length === 3 ? p[0] * 3600 + p[1] * 60 + p[2] : p[0] * 60 + p[1]; };
  for (const block of text.replace(/\r/g, '').split(/\n\n+/)) {
    const lines = block.split('\n');
    const i = lines.findIndex((l) => l.includes('-->'));
    if (i < 0) continue;
    const [a, b] = lines[i].split('-->');
    cues.push({ start: t(a), end: t(b.split(' ').filter(Boolean)[0]), text: lines.slice(i + 1).join('\n') });
  }
  return cues;
}

/** A home movie in an 8mm film frame, with chapters and the photos taken the same day. */
export class MovieView extends View {
  constructor(app, route) { super(app, route, 'movie-view'); }

  mount() {
    const m = (this.m = this.route.movie);
    const ev = m.event ? store.event(m.event) : null;
    this.ev = ev;

    const v = (this.video = el('video', { preload: 'metadata', playsinline: true, 'webkit-playsinline': true, poster: m.poster, 'aria-label': m.title }));
    v.append(el('source', { src: m.src, type: 'video/mp4' }));
    if (m.webm) v.append(el('source', { src: m.webm, type: 'video/webm' }));
    if (m.captions) v.append(el('track', { kind: 'captions', src: m.captions, srclang: 'en', label: 'English' }));
    this.poster = el('img', { class: 'poster', src: m.poster, alt: '', draggable: 'false' });
    this.cc = el('div', { class: 'cc', 'aria-live': 'polite' });
    this.bigPlay = el('button', { class: 'big-play', type: 'button', 'aria-label': 'Play the film' }, icon('play', 36));

    this.playBtn = el('button', { class: 'c-btn', type: 'button', 'aria-label': 'Play' }, icon('play', 22));
    this.timeNow = el('span', { class: 'now' }, '00:00');
    this.timeDur = el('span', { class: 'dur' }, fmtTime(m.duration));
    const time = el('time', null, this.timeNow, el('span', { class: 'slash' }, ' / '), this.timeDur);
    this.buf = el('span', { class: 'buf' });
    this.fill = el('span', { class: 'fill' });
    this.knob = el('span', { class: 'knob' });
    this.peek = el('span', { class: 'peek' });
    const rail = el('span', { class: 'rail' }, this.buf, this.fill);
    (m.chapters || []).forEach((c, i) => { if (i) rail.append(el('span', { class: 'mark', style: { left: `${(c.start / m.duration) * 100}%` } })); });
    this.scrub = el('div', { class: 'scrub', role: 'slider', tabindex: '0', 'aria-label': 'Seek', 'aria-valuemin': '0', 'aria-valuemax': String(Math.round(m.duration)), 'aria-valuenow': '0', 'aria-valuetext': '0 seconds' }, rail, this.knob, this.peek);
    this.muteBtn = el('button', { class: 'c-btn', type: 'button', 'aria-label': 'Mute' }, icon('volume', 22));
    this.volume = el('input', { type: 'range', min: '0', max: '1', step: '0.01', value: '0.9', 'aria-label': 'Volume' });
    this.ccBtn = el('button', { class: 'c-btn cc-btn is-on', type: 'button', 'aria-label': 'Captions', 'aria-pressed': 'true' }, icon('cc', 22));
    this.fsBtn = el('button', { class: 'c-btn', type: 'button', 'aria-label': 'Full screen' }, icon('expand', 20));
    this.controls = el('div', { class: 'controls' }, this.playBtn, time, this.scrub, el('div', { class: 'vol' }, this.muteBtn, this.volume), this.ccBtn, this.fsBtn);

    this.gate = el('div', { class: 'gate', dataset: { mid: m.id } }, v, this.poster,
      el('div', { class: 'fx fx-vignette', 'aria-hidden': 'true' }), el('div', { class: 'fx fx-flicker', 'aria-hidden': 'true' }),
      this.cc, this.bigPlay, this.controls);
    const holes = (side) => el('span', { class: `holes ${side}`, 'aria-hidden': 'true' });
    this.film = el('div', { class: 'film' }, holes('l'), this.gate, holes('r'));

    // Side panel
    this.chapterBar = el('span', { class: 'chapter-bar', 'aria-hidden': 'true' });
    this.chapterBtns = (m.chapters || []).map((c, i) => {
      const b = el('button', { class: 'chapter', type: 'button', dataset: { i: String(i) } },
        el('img', { src: c.thumb || m.poster, alt: '', loading: 'lazy', decoding: 'async', draggable: 'false' }),
        el('span', null, el('strong', null, c.title), el('time', null, fmtTime(c.start))),
        el('span', { class: 'num' }, String(i + 1).padStart(2, '0')));
      b.addEventListener('click', () => { this.seek(c.start); this.play(); });
      return b;
    });
    const chapters = m.chapters?.length ? el('div', { class: 'mv-chapters' },
      el('header', null, el('span', { class: 'eyebrow' }, 'Chapters'), el('span', { class: 'eyebrow' }, String(m.chapters.length))),
      el('div', { class: 'chapter-list' }, this.chapterBar, this.chapterBtns)) : null;
    this.side = el('aside', { class: 'mv-side' },
      el('button', { class: 'mv-close', type: 'button', 'aria-label': 'Close the film', onclick: () => this.app.up() }, icon('close', 22)),
      el('h1', null, m.title),
      el('p', { class: 'mv-meta' }, el('span', null, m.date), el('i'), el('span', null, m.label || m.format || 'Home movie')),
      el('p', { class: 'mv-desc' }, m.description),
      chapters);

    // Photos from the same day
    this.prints = new Map();
    const photos = (m.photos || []).map(store.photo).filter(Boolean);
    this.photos = photos;
    const row = el('div', { class: 'row' });
    photos.forEach((p) => {
      const n = makePrint(p, { r: 0, tag: 'button' });
      n.classList.add('static');
      row.append(n);
      this.prints.set(p.id, n);
    });
    const strip = photos.length ? el('section', { class: 'mv-strip' },
      el('header', null, el('span', { class: 'eyebrow' }, 'Photos from this day'), el('span', { class: 'eyebrow' }, String(photos.length))),
      row) : null;

    this.el.append(el('div', { class: 'mv-grid' }, this.film, this.side), strip);

    this.cues = m.cues || null;
    if (!this.cues && m.captions) {
      fetch(m.captions).then((r) => (r.ok ? r.text() : '')).then((t) => { if (t && this.alive) this.cues = parseVtt(t); }).catch(() => {});
    }
    this.captionsOn = true;
    this.wire();
    this.later(attachTip(row, (n) => {
      const ph = store.photo(n.dataset.pid);
      return ph && { kicker: ph.date, title: ph.title };
    }));
  }

  wire() {
    const v = this.video;
    v.volume = 0.9;
    const on = (t, e, f) => this.on(t, e, f);
    on(this.bigPlay, 'click', () => this.play());
    on(this.playBtn, 'click', () => this.toggle());
    on(this.gate, 'click', (e) => {
      if (e.target === v || e.target === this.poster || e.target.classList.contains('fx')) this.toggle();
    });
    on(this.gate, 'dblclick', (e) => { if (!e.target.closest('.controls')) this.fullscreen(); });
    on(v, 'play', () => { this.el.classList.add('is-playing', 'is-started'); this.setPlayIcon(); this.run(); this.idle(); });
    on(v, 'pause', () => { this.el.classList.remove('is-playing'); this.setPlayIcon(); this.wake(); });
    on(v, 'ended', () => { this.el.classList.remove('is-playing'); this.setPlayIcon(); this.wake(); });
    on(v, 'playing', () => this.poster.classList.add('is-gone'));
    on(v, 'loadedmetadata', () => { if (v.duration && Number.isFinite(v.duration)) this.timeDur.textContent = fmtTime(v.duration); this.paint(); });
    on(v, 'progress', () => this.paintBuffer());
    on(v, 'timeupdate', () => { if (v.paused) this.paint(); });
    on(v, 'seeked', () => this.paint());
    on(v, 'volumechange', () => {
      const muted = v.muted || v.volume === 0;
      this.muteBtn.replaceChildren(icon(muted ? 'mute' : 'volume', 22));
      this.muteBtn.setAttribute('aria-label', muted ? 'Unmute' : 'Mute');
      if (!v.muted) this.volume.value = String(v.volume);
    });
    on(this.muteBtn, 'click', () => { v.muted = !v.muted; });
    on(this.volume, 'input', () => { v.volume = +this.volume.value; v.muted = v.volume === 0; });
    on(this.ccBtn, 'click', () => this.toggleCaptions());
    on(this.fsBtn, 'click', () => this.fullscreen());
    on(document, 'fullscreenchange', () => {
      const fs = document.fullscreenElement === this.film;
      this.film.classList.toggle('is-fs', fs);
      this.fsBtn.replaceChildren(icon(fs ? 'shrink' : 'expand', 20));
    });

    // Scrubbing
    const pos = (e) => {
      const r = this.scrub.getBoundingClientRect();
      return clamp((e.clientX - r.left) / r.width, 0, 1);
    };
    const dur = () => (Number.isFinite(v.duration) && v.duration) || this.m.duration;
    let dragging = false, wasPlaying = false;
    on(this.scrub, 'pointerdown', (e) => {
      dragging = true;
      wasPlaying = !v.paused;
      v.pause();
      this.scrub.classList.add('is-drag');
      try { this.scrub.setPointerCapture(e.pointerId); } catch { /* ignore */ }
      this.seek(pos(e) * dur(), true);
      this.showPeek(pos(e));
    });
    on(this.scrub, 'pointermove', (e) => {
      this.showPeek(pos(e));
      if (dragging) this.seek(pos(e) * dur(), true);
    });
    const end = () => {
      if (!dragging) return;
      dragging = false;
      this.scrub.classList.remove('is-drag');
      if (wasPlaying) this.play();
    };
    on(this.scrub, 'pointerup', end);
    on(this.scrub, 'pointercancel', end);
    on(this.scrub, 'keydown', (e) => {
      const step = { ArrowLeft: -5, ArrowRight: 5, ArrowDown: -5, ArrowUp: 5, PageDown: -15, PageUp: 15 }[e.key];
      if (step) { e.preventDefault(); e.stopPropagation(); this.seek(v.currentTime + step); }
      if (e.key === 'Home') { e.preventDefault(); this.seek(0); }
      if (e.key === 'End') { e.preventDefault(); this.seek(dur() - 0.5); }
    });

    // Controls hide while the film plays and the pointer rests.
    on(this.gate, 'pointermove', () => this.wake());
    on(this.gate, 'pointerleave', () => { if (!v.paused) this.el.classList.add('is-idle'); });
    this.chapterIndex = -1;
    requestAnimationFrame(() => {
      this.paint();
      for (const n of this.prints.values()) sharpen(n, n.offsetWidth);
    });
  }

  setPlayIcon() {
    const playing = !this.video.paused;
    this.playBtn.replaceChildren(icon(playing ? 'pause' : 'play', 22));
    this.playBtn.setAttribute('aria-label', playing ? 'Pause' : 'Play');
  }

  play() {
    const p = this.video.play();
    if (p?.catch) p.catch(() => {});
  }

  toggle() { if (this.video.paused) this.play(); else this.video.pause(); }

  seek(t, fast = false) {
    const v = this.video;
    const d = (Number.isFinite(v.duration) && v.duration) || this.m.duration;
    t = clamp(t, 0, d - 0.05);
    if (fast && v.fastSeek) v.fastSeek(t);
    else v.currentTime = t;
    this.paint(t);
  }

  wake() {
    this.el.classList.remove('is-idle');
    clearTimeout(this.idleT);
    if (!this.video.paused) this.idle();
  }

  idle() {
    clearTimeout(this.idleT);
    this.idleT = setTimeout(() => { if (!this.video.paused && !this.scrub.classList.contains('is-drag')) this.el.classList.add('is-idle'); }, 2600);
  }

  toggleCaptions() {
    this.captionsOn = !this.captionsOn;
    this.ccBtn.classList.toggle('is-on', this.captionsOn);
    this.ccBtn.setAttribute('aria-pressed', String(this.captionsOn));
    this.paint();
  }

  fullscreen() {
    const v = this.video;
    if (document.fullscreenElement) { document.exitFullscreen?.(); return; }
    if (this.film.requestFullscreen) this.film.requestFullscreen().catch(() => {});
    else if (v.webkitEnterFullscreen) v.webkitEnterFullscreen();
  }

  showPeek(f) {
    const t = f * this.m.duration;
    const ch = [...(this.m.chapters || [])].reverse().find((c) => t >= c.start);
    this.peek.textContent = ch ? `${fmtTime(t)} · ${ch.title}` : fmtTime(t);
    this.peek.style.left = `${f * 100}%`;
  }

  /** Smooth progress while playing: timeupdate alone only fires a few times a second. */
  run() {
    if (this.running) return;
    this.running = true;
    if (!this.stopTick) this.later(() => this.stopTick?.());
    this.stopTick = tick(() => {
      if (!this.alive || this.video.paused) { this.running = false; return false; }
      this.paint();
      return true;
    });
  }

  paint(at) {
    const v = this.video;
    const d = (Number.isFinite(v.duration) && v.duration) || this.m.duration;
    const t = at ?? v.currentTime ?? 0;
    const f = clamp(t / d, 0, 1);
    this.fill.style.width = `${f * 100}%`;
    this.knob.style.left = `${f * 100}%`;
    const now = fmtTime(t);
    if (this.timeNow.textContent !== now) {
      this.timeNow.textContent = now;
      this.scrub.setAttribute('aria-valuenow', String(Math.round(t)));
      this.scrub.setAttribute('aria-valuetext', `${now} of ${fmtTime(d)}`);
    }
    // Chapter
    const chs = this.m.chapters || [];
    let ci = -1;
    chs.forEach((c, i) => { if (t >= c.start - 0.05) ci = i; });
    if (ci !== this.chapterIndex) this.setChapter(ci);
    // Captions
    const cue = this.captionsOn && this.cues ? this.cues.find((c) => t >= c.start && t < c.end) : null;
    const text = cue ? cue.text : '';
    if (this.cc.textContent !== text) {
      if (text) this.cc.textContent = text;
      this.cc.classList.toggle('is-on', !!text);
    }
  }

  paintBuffer() {
    const v = this.video;
    try {
      const b = v.buffered;
      if (b.length) this.buf.style.width = `${(b.end(b.length - 1) / ((Number.isFinite(v.duration) && v.duration) || this.m.duration)) * 100}%`;
    } catch { /* not ready */ }
  }

  setChapter(i) {
    this.chapterIndex = i;
    this.chapterBtns.forEach((b, k) => {
      b.classList.toggle('is-on', k === i);
      if (k === i) b.setAttribute('aria-current', 'true'); else b.removeAttribute('aria-current');
    });
    const b = this.chapterBtns[i];
    if (!b) { this.chapterBar.style.opacity = '0'; return; }
    this.chapterBar.style.opacity = '1';
    this.chapterBar.style.transform = `translateY(${b.offsetTop}px)`;
    this.chapterBar.style.height = `${b.offsetHeight}px`;
  }

  onResize() { this.setChapter(this.chapterIndex); }

  topbar() {
    const m = this.m;
    const crumbs = [{ label: 'All years', href: '#/' }, { label: String(m.year), href: yearHref(m.year) }];
    if (this.ev) crumbs.push({ label: this.ev.title, href: eventHref(this.ev) });
    crumbs.push({ label: 'Home movie' });
    return { crumbs, crumbsCenter: true, fav: m.id, avatar: true };
  }

  shared() {
    const m = new Map();
    m.set(`m:${this.m.id}`, this.gate);
    for (const [id, n] of this.prints) m.set(`p:${id}`, n);
    return m;
  }

  keydown(e) {
    const v = this.video;
    const k = e.key;
    if (k === ' ' || k === 'k' || k === 'K') {
      if (e.target.closest?.('button, input, [role="slider"]') && k === ' ') return false;
      this.toggle(); this.wake(); return true;
    }
    if (k === 'ArrowLeft' || k === 'j' || k === 'J') { this.seek(v.currentTime - (k === 'ArrowLeft' ? 5 : 10)); this.wake(); return true; }
    if (k === 'ArrowRight' || k === 'l' || k === 'L') { this.seek(v.currentTime + (k === 'ArrowRight' ? 5 : 10)); this.wake(); return true; }
    if (k === 'm' || k === 'M') { v.muted = !v.muted; return true; }
    if (k === 'c' || k === 'C') { this.toggleCaptions(); return true; }
    if (k === 'f' || k === 'F') { this.fullscreen(); return true; }
    if (/^[0-9]$/.test(k)) { this.seek((+k / 10) * this.m.duration); return true; }
    if (k === 'Escape' && !document.fullscreenElement) { this.app.up(); return true; }
    return false;
  }

  enter(ctx) {
    revealWords(this.side.querySelector('h1'), { delay: 260, stagger: 80, duration: 1150 });
    if (ctx.dir !== 1) return super.enter(ctx);
    const anims = [];
    const flyingFilm = ctx.flying.has(`m:${this.m.id}`);
    // The frame and controls grow around the poster that flies in.
    anims.push(this.anim(this.film, [{ backgroundColor: 'rgba(42,33,23,0)', boxShadow: 'none' }, { backgroundColor: '#2a2117' }], { duration: 700, delay: flyingFilm ? 380 : 0, easing: EASE, fill: 'backwards' }));
    for (const h of this.film.querySelectorAll('.holes')) anims.push(this.anim(h, [{ opacity: 0 }, { opacity: 1 }], { duration: 700, delay: flyingFilm ? 480 : 100, fill: 'backwards' }));
    if (!flyingFilm) anims.push(this.anim(this.gate, [{ opacity: 0, transform: 'scale(0.96)' }, { opacity: 1, transform: 'none' }], { duration: 900, easing: SPRING, fill: 'backwards' }));
    anims.push(this.anim(this.controls, [{ opacity: 0, transform: 'translateY(12px)' }, { opacity: 1, transform: 'none' }], { duration: 700, delay: 600, easing: EASE, fill: 'backwards' }));
    anims.push(this.anim(this.bigPlay, [{ opacity: 0, transform: 'scale(0.7)' }, { opacity: 1, transform: 'none' }], { duration: 800, delay: 650, easing: SPRING, fill: 'backwards' }));
    [...this.side.children].filter((c) => c.tagName !== 'H1').forEach((c, i) => anims.push(this.anim(c, [{ opacity: 0, transform: 'translateX(24px)' }, { opacity: 1, transform: 'none' }], { duration: 900, delay: 220 + i * 70, easing: EASE, fill: 'backwards' })));
    const strip = this.el.querySelector('.mv-strip header');
    if (strip) anims.push(this.anim(strip, [{ opacity: 0 }, { opacity: 1 }], { duration: 700, delay: 500, fill: 'backwards' }));
    for (const [id, n] of this.prints) {
      if (ctx.flying.has(`p:${id}`)) continue;
      anims.push(this.anim(n, [{ opacity: 0, transform: 'translateY(30px)' }, { opacity: 1, transform: 'none' }], { duration: 900, delay: 400 + Math.random() * 200, easing: SPRING, fill: 'backwards' }));
    }
    return Promise.all(anims.map((a) => a.finished.catch(() => {})));
  }

  leave(ctx) {
    this.video.pause();
    return super.leave(ctx);
  }

  destroy() {
    clearTimeout(this.idleT);
    try { this.video.pause(); this.video.removeAttribute('src'); this.video.querySelectorAll('source').forEach((s) => s.remove()); this.video.load(); } catch { /* ignore */ }
    if (document.fullscreenElement === this.film) document.exitFullscreen?.();
    super.destroy();
  }
}

