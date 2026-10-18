import { tick } from './anim.js';
import { clamp, reduceMotion } from './util.js';

/** Pan and zoom for a large "table" of prints, eased toward its targets every frame. */
export class Camera {
  constructor(world, { min = 0.25, max = 1.6, onChange } = {}) {
    this.world = world;
    this.min = min;
    this.max = max;
    this.onChange = onChange;
    this.x = this.tx = 0;
    this.y = this.ty = 0;
    this.s = this.ts = 1;
    this.vx = this.vy = 0;
    this.halfLife = 0.11;
    this.bounds = { w: 1000, h: 800 };
    this.insets = { top: 0, right: 0, bottom: 0, left: 0 };
    this.stop = null;
    this.alive = true;
    this.isMoving = false;
  }

  /** Promote the world to its own layer only while it moves, so it re-rasterises sharp at rest. */
  moving(on) {
    clearTimeout(this.mt);
    if (on) {
      if (!this.isMoving) { this.isMoving = true; this.world.classList.add('is-moving'); }
    } else {
      this.mt = setTimeout(() => { this.isMoving = false; this.world.classList.remove('is-moving'); }, 180);
    }
  }

  setWorld(w, h) { this.bounds = { w, h }; }
  setInsets(i) { this.insets = { ...this.insets, ...i }; }

  view() {
    const { top, right, bottom, left } = this.insets;
    return { x: left, y: top, w: innerWidth - left - right, h: innerHeight - top - bottom };
  }

  /** Scale and offset that fit a world rectangle in the visible area. */
  fitFor(rect = { x: 0, y: 0, w: this.bounds.w, h: this.bounds.h }, cover = false) {
    const v = this.view();
    const sx = v.w / rect.w, sy = v.h / rect.h;
    const s = clamp(cover ? Math.max(sx, sy) : Math.min(sx, sy), this.min, this.max);
    return { s, x: v.x + (v.w - rect.w * s) / 2 - rect.x * s, y: v.y + (v.h - rect.h * s) / 2 - rect.y * s };
  }

  fit(rect, opts = {}) {
    const f = this.fitFor(rect, opts.cover);
    this.to(f.x, f.y, f.s, opts);
    return f;
  }

  centerOn(wx, wy, s = this.ts, opts = {}) {
    const v = this.view();
    this.to(v.x + v.w / 2 - wx * s, v.y + v.h / 2 - wy * s, s, opts);
  }

  to(x, y, s, { immediate = false } = {}) {
    this.tx = x; this.ty = y; this.ts = s;
    this.vx = this.vy = 0;
    this.clampTargets();
    if (immediate || reduceMotion()) { this.x = this.tx; this.y = this.ty; this.s = this.ts; this.apply(); }
    else this.run();
  }

  zoomAt(sx, sy, factor) {
    const ns = clamp(this.ts * factor, this.min, this.max);
    const k = ns / this.ts;
    this.tx = sx - (sx - this.tx) * k;
    this.ty = sy - (sy - this.ty) * k;
    this.ts = ns;
    this.clampTargets();
    this.run();
  }

  panBy(dx, dy) {
    this.tx += dx; this.ty += dy;
    this.vx = this.vy = 0;
    this.clampTargets();
    this.x = this.tx; this.y = this.ty;
    if (!this.stop) { this.moving(true); this.apply(); this.moving(false); }
  }

  fling(vx, vy) {
    if (reduceMotion()) return;
    this.vx = clamp(vx, -4000, 4000);
    this.vy = clamp(vy, -4000, 4000);
    this.run();
  }

  clampTargets() {
    const v = this.view();
    const ww = this.bounds.w * this.ts, wh = this.bounds.h * this.ts;
    const slackX = Math.max(v.w * 0.45, (v.w - ww) / 2 + 40);
    const slackY = Math.max(v.h * 0.45, (v.h - wh) / 2 + 40);
    this.tx = clamp(this.tx, v.x + v.w - ww - slackX, v.x + slackX);
    this.ty = clamp(this.ty, v.y + v.h - wh - slackY, v.y + slackY);
  }

  run() {
    if (this.stop) return;
    this.moving(true);
    this.stop = tick((dt) => {
      if (!this.alive) return false;
      if (this.vx || this.vy) {
        this.tx += this.vx * dt; this.ty += this.vy * dt;
        const f = Math.pow(0.04, dt);
        this.vx *= f; this.vy *= f;
        if (Math.hypot(this.vx, this.vy) < 8) this.vx = this.vy = 0;
        this.clampTargets();
      }
      const k = 1 - Math.pow(0.5, dt / this.halfLife);
      this.x += (this.tx - this.x) * k;
      this.y += (this.ty - this.y) * k;
      this.s += (this.ts - this.s) * k;
      const done = !this.vx && !this.vy && Math.abs(this.tx - this.x) < 0.3 && Math.abs(this.ty - this.y) < 0.3 && Math.abs(this.ts - this.s) < 0.0005;
      if (done) { this.x = this.tx; this.y = this.ty; this.s = this.ts; }
      this.apply();
      if (done) { this.stop = null; this.moving(false); this.onSettle?.(this); return false; }
      return true;
    });
  }

  apply() {
    this.world.style.transform = `translate3d(${this.x.toFixed(2)}px, ${this.y.toFixed(2)}px, 0) scale(${this.s.toFixed(5)})`;
    this.onChange?.(this);
  }

  toScreen(wx, wy) { return { x: this.x + wx * this.s, y: this.y + wy * this.s }; }
  toWorld(sx, sy) { return { x: (sx - this.x) / this.s, y: (sy - this.y) / this.s }; }

  destroy() { this.alive = false; clearTimeout(this.mt); this.stop?.(); this.stop = null; }
}
