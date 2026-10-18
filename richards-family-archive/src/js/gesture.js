/**
 * Pointer drag with velocity, tap detection, and two-finger pinch.
 * handlers: onStart(e), onMove({dx, dy, x, y, e}), onEnd({vx, vy, dx, dy, tap, e}), onPinch({scale, cx, cy}), onPinchEnd()
 */
export function drag(node, h, { threshold = 6, capture = true, filter } = {}) {
  const pts = new Map();
  let start = null;
  let moved = false;
  let samples = [];
  let pinch0 = null;

  const down = (e) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    if (filter && !filter(e)) return;
    pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pts.size === 1) {
      start = { x: e.clientX, y: e.clientY, t: performance.now(), id: e.pointerId };
      moved = false;
      samples = [{ x: e.clientX, y: e.clientY, t: start.t }];
      h.onStart?.(e);
    } else if (pts.size === 2 && h.onPinch) {
      const [a, b] = [...pts.values()];
      pinch0 = { d: Math.hypot(a.x - b.x, a.y - b.y), cx: (a.x + b.x) / 2, cy: (a.y + b.y) / 2 };
      moved = true;
    }
  };
  const move = (e) => {
    if (!pts.has(e.pointerId) || !start) return;
    pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pinch0 && pts.size >= 2) {
      const [a, b] = [...pts.values()];
      const d = Math.hypot(a.x - b.x, a.y - b.y);
      h.onPinch({ scale: d / pinch0.d, cx: (a.x + b.x) / 2, cy: (a.y + b.y) / 2, e });
      return;
    }
    if (e.pointerId !== start.id) return;
    const dx = e.clientX - start.x, dy = e.clientY - start.y;
    if (!moved && Math.hypot(dx, dy) < threshold) return;
    if (!moved) {
      moved = true;
      if (capture) { try { node.setPointerCapture(e.pointerId); } catch { /* not capturable */ } }
    }
    const t = performance.now();
    samples.push({ x: e.clientX, y: e.clientY, t });
    while (samples.length > 2 && t - samples[0].t > 100) samples.shift();
    h.onMove?.({ dx, dy, x: e.clientX, y: e.clientY, e });
  };
  const up = (e) => {
    if (!pts.has(e.pointerId)) return;
    pts.delete(e.pointerId);
    if (pinch0) {
      if (pts.size < 2) { pinch0 = null; h.onPinchEnd?.(); }
      if (pts.size) return;
    }
    if (!start || e.pointerId !== start.id) { if (!pts.size) start = null; return; }
    const t = performance.now();
    const s0 = samples[0] || { x: e.clientX, y: e.clientY, t };
    const dt = Math.max(16, t - s0.t);
    const vx = ((e.clientX - s0.x) / dt) * 1000;
    const vy = ((e.clientY - s0.y) / dt) * 1000;
    const dx = e.clientX - start.x, dy = e.clientY - start.y;
    const tap = !moved && t - start.t < 600;
    start = null;
    h.onEnd?.({ vx, vy, dx, dy, tap, e, cancelled: e.type === 'pointercancel' });
  };
  node.addEventListener('pointerdown', down);
  window.addEventListener('pointermove', move, { passive: true });
  window.addEventListener('pointerup', up);
  window.addEventListener('pointercancel', up);
  return () => {
    node.removeEventListener('pointerdown', down);
    window.removeEventListener('pointermove', move);
    window.removeEventListener('pointerup', up);
    window.removeEventListener('pointercancel', up);
  };
}
