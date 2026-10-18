import Lenis from 'lenis';
import { canHover, reduceMotion } from './util.js';

/*
 * Smooth wheel scrolling for mouse and trackpad. Lenis eases the page's own scroll position,
 * so window.scrollY, sticky elements and keyboard scrolling all keep working. Touch screens keep
 * their native scrolling, which already feels right there.
 */
let lenis = null;
let paused = false;
let looping = false;

export function initSmoothScroll() {
  if (!canHover() || reduceMotion()) return;
  lenis = new Lenis({ lerp: 0.09, smoothWheel: true, syncTouch: false, autoRaf: false });
  window.addEventListener('wheel', wake, { passive: true });
}

/** Run Lenis's frame loop only while a scroll is easing, so an idle page really is idle. */
function wake() {
  if (looping || !lenis) return;
  looping = true;
  lenis.time = 0;
  let rest = 0;
  const step = (t) => {
    lenis.raf(t);
    rest = lenis.isScrolling === 'smooth' ? 0 : rest + 1;
    if (rest > 3) { looping = false; return; }
    requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

/** Pause smoothing (and wheel scrolling) for full-screen pages and open overlays. */
export function setSmooth(on) {
  paused = !on;
  if (!lenis) return;
  if (on) lenis.start();
  else lenis.stop();
}

/** Scroll the page to y, instantly or with the same easing as the wheel. Resolves when it arrives. */
export function scrollToY(y, { smooth = false } = {}) {
  if (lenis) {
    lenis.resize();
    if (!smooth || paused) {
      lenis.scrollTo(y, { immediate: true, force: true });
      return Promise.resolve();
    }
    return new Promise((resolve) => {
      const t = setTimeout(resolve, 1600);
      lenis.scrollTo(y, { force: true, onComplete: () => { clearTimeout(t); resolve(); } });
      wake();
    });
  }
  window.scrollTo({ top: y, behavior: smooth && !reduceMotion() ? 'smooth' : 'auto' });
  return smooth ? new Promise((r) => setTimeout(r, 650)) : Promise.resolve();
}
