import { el, icon, canHover } from './util.js';

const DPR = Math.min(3, window.devicePixelRatio || 1);
/** Thumbnails are 560px on the long side; a print drawn wider than its thumbnail on this screen gets the large scan. */
const needsLarge = (w, p) => w * DPR > 560 * Math.min(1, p.w / p.h) * 1.08;

/**
 * A photo print: paper border, blurred preview while the image loads, then a soft fade in.
 * opts: { w, h (outer px), x, y (px, absolute), r (deg), border (px), size: 's'|'l', lift, z, label }
 */
export function makePrint(photo, opts = {}) {
  const { w, h, x, y, r = 0, lift = true, z, eager = false, play = false, tag = 'figure' } = opts;
  const size = opts.size || (w != null && needsLarge(w, photo) ? 'l' : 's');
  const border = opts.border ?? Math.max(3, Math.round(Math.min(w || 200, h || 200) * 0.034));
  const img = el('img', {
    alt: photo.title ? `${photo.title}, ${photo.date}` : '',
    decoding: 'async',
    loading: eager ? 'eager' : 'lazy',
    draggable: 'false',
  });
  const shell = el('div', { class: 'print-img', style: { backgroundImage: photo.lqip ? `url("${photo.lqip}")` : null, '--tone': photo.tone } }, img);
  const node = el(tag, {
    class: `print${lift ? ' liftable' : ''}${photo.bw ? ' is-bw' : ''}`,
    dataset: { pid: photo.id, rot: String(r) },
    style: {
      width: w != null ? `${w}px` : null,
      height: h != null ? `${h}px` : null,
      left: x != null ? `${x}px` : null,
      top: y != null ? `${y}px` : null,
      '--r': `${r}deg`,
      '--b': `${border}px`,
      zIndex: z != null ? String(z) : null,
    },
  }, shell);
  if (tag === 'button') node.setAttribute('type', 'button');
  if (play) node.append(el('span', { class: 'play' }, icon('play', 20)));
  const done = () => img.classList.add('is-in');
  img.addEventListener('load', done, { once: true });
  img.addEventListener('error', done, { once: true });
  img.src = size === 'l' ? photo.src : photo.thumb;
  img.dataset.size = size;
  if (img.complete && img.naturalWidth) img.classList.add('is-in', 'no-fade');
  node._photo = photo;
  return node;
}

/** Swap in the large scan once a print is laid out bigger than its thumbnail. */
export function sharpen(node, w) {
  const img = node.querySelector('.print-img img');
  const photo = node._photo;
  if (!img || !photo || img.dataset.size === 'l' || !needsLarge(w, photo)) return;
  img.dataset.size = 'l';
  const hi = new Image();
  hi.decoding = 'async';
  hi.onload = () => { img.src = photo.src; };
  hi.src = photo.src;
}

export function setPrintBox(node, { w, h, x, y, r }) {
  if (w != null) node.style.width = `${w}px`;
  if (h != null) node.style.height = `${h}px`;
  if (x != null) node.style.left = `${x}px`;
  if (y != null) node.style.top = `${y}px`;
  if (r != null) { node.style.setProperty('--r', `${r}deg`); node.dataset.rot = String(r); }
  if (w != null && h != null) node.style.setProperty('--b', `${Math.max(3, Math.round(Math.min(w, h) * 0.034))}px`);
  if (w != null) sharpen(node, w);
}

/* ---------- Hover caption that follows prints ---------- */
let tipNode = null;
export function attachTip(root, lookup, { above = false } = {}) {
  if (!canHover()) return () => {};
  if (!tipNode) {
    tipNode = el('div', { class: 'tip', role: 'presentation' });
    document.body.append(tipNode);
  }
  let current = null;
  const over = (e) => {
    const p = e.target.closest('.print, .film-card');
    if (!p || !root.contains(p)) return;
    const info = lookup(p);
    if (!info) return;
    current = p;
    tipNode.replaceChildren(el('small', null, info.kicker), info.title);
    place(p);
    tipNode.classList.add('is-on');
  };
  const out = (e) => {
    if (!current) return;
    const to = e.relatedTarget;
    if (to && current.contains(to)) return;
    current = null;
    tipNode.classList.remove('is-on');
  };
  const move = () => { if (current) place(current); };
  function place(p) {
    const b = p.getBoundingClientRect();
    tipNode.style.left = `${Math.max(90, Math.min(innerWidth - 90, b.left + b.width / 2))}px`;
    const below = Math.min(innerHeight - 70, b.bottom + 12);
    tipNode.style.top = `${above ? Math.max(70, b.top - 12 - tipNode.offsetHeight) : below}px`;
  }
  root.addEventListener('pointerover', over);
  root.addEventListener('pointerout', out);
  root.addEventListener('pointermove', move, { passive: true });
  return () => {
    root.removeEventListener('pointerover', over);
    root.removeEventListener('pointerout', out);
    root.removeEventListener('pointermove', move);
    hideTip();
  };
}
export function hideTip() { tipNode?.classList.remove('is-on'); }
