import { el, icon, isPhone, plural } from './util.js';
import { animate, EASE } from './anim.js';
import { burst } from './motion.js';
import * as store from './store.js';

/* ---------- Top bar ---------- */
export function renderTopbar(app, cfg = {}) {
  const bar = app.topbar;
  const left = el('div', { class: 'tb-left' });
  const center = el('div', { class: 'tb-center' });
  const right = el('div', { class: 'tb-right' });
  const crumbs = cfg.crumbs || [];

  if (crumbs.length && isPhone()) {
    const up = crumbs[crumbs.length - 2];
    left.append(el('button', { class: 'icon-btn back-btn', type: 'button', 'aria-label': `Back to ${up ? up.label : 'all years'}`, onclick: () => app.up() }, icon('chevLeft', 24)));
  }
  left.append(el('a', { class: 'wordmark', href: '#/', 'aria-label': `${store.archive.family} family archive, all years` }, store.archive.family));
  if (cfg.explore && !isPhone()) {
    const btn = el('button', { class: 'explore-btn', type: 'button', 'aria-haspopup': 'true', 'aria-expanded': 'false' }, 'Explore', icon('chevDown', 18));
    btn.addEventListener('click', () => toggleMenu(app, btn));
    left.append(el('span', { class: 'tb-divider', 'aria-hidden': 'true' }), btn);
  }
  if (crumbs.length) {
    const nav = el('nav', { class: 'crumbs', 'aria-label': 'Breadcrumb' });
    crumbs.forEach((c, i) => {
      const last = i === crumbs.length - 1;
      const mid = i > 0 && i < crumbs.length - 1 && crumbs.length > 2;
      if (i) nav.append(el('span', { class: `sep${mid || (i === crumbs.length - 1 && crumbs.length > 2) ? ' sep-mid' : ''}`, 'aria-hidden': 'true' }, '/'));
      nav.append(last
        ? el('span', { class: 'here', 'aria-current': 'page' }, c.label)
        : el('a', { href: c.href, class: mid ? 'crumb-mid' : null }, c.label));
    });
    if (cfg.crumbsCenter && !isPhone()) center.append(nav);
    else {
      if (!isPhone()) left.append(el('span', { style: { width: '14px' } }));
      left.append(nav);
    }
  }

  if (cfg.searchSep && !isPhone()) right.append(el('span', { class: 'tb-sep', 'aria-hidden': 'true' }));
  right.append(el('button', { class: 'icon-btn', type: 'button', 'aria-label': 'Search the archive', title: 'Search  /', onclick: () => app.openSearch() }, icon('search', 24)));
  if (cfg.fav) {
    const on = store.isFav(cfg.fav);
    const heart = el('button', { class: `icon-btn${on ? ' is-on' : ''}`, type: 'button', 'aria-pressed': String(on), 'aria-label': on ? 'Remove from favorites' : 'Add to favorites' }, icon(on ? 'heartFill' : 'heart', 22));
    heart.addEventListener('click', () => {
      const now = store.toggleFav(cfg.fav);
      heart.classList.toggle('is-on', now);
      heart.setAttribute('aria-pressed', String(now));
      heart.setAttribute('aria-label', now ? 'Remove from favorites' : 'Add to favorites');
      heart.replaceChildren(icon(now ? 'heartFill' : 'heart', 22));
      animate(heart, [{ transform: 'scale(1)' }, { transform: 'scale(1.25)' }, { transform: 'scale(1)' }], { duration: 420 });
      if (now) burst(heart);
      app.toast(now ? 'Saved to favorites' : 'Removed from favorites');
    });
    right.append(el('span', { class: 'tb-sep', 'aria-hidden': 'true' }), heart);
  }
  if (cfg.avatar) {
    right.append(el('button', { class: 'avatar', type: 'button', 'aria-label': 'About this archive', onclick: () => openAbout(app) }, store.archive.family[0]));
  }
  bar.classList.toggle('has-back', !!crumbs.length);
  bar.replaceChildren(left, center, right);
}

/* ---------- Explore menu ---------- */
let menuNode = null;
function toggleMenu(app, btn) {
  if (menuNode) { closeMenu(); return; }
  btn.setAttribute('aria-expanded', 'true');
  const decs = el('div', { class: 'menu-decades' }, store.decades().map((d) =>
    el('a', { href: `#/${d}s`, onclick: () => closeMenu() }, `${d}s`, el('span', null, plural(store.photosInDecade(d).length, 'photo')))));
  const movies = store.allMovies();
  const links = el('div', { class: 'menu-links' },
    movies.length ? el('a', { href: `#/${store.decadeOf(movies[0].year)}s/${movies[0].year}/${movies[0].id}`, onclick: () => closeMenu() }, icon('film', 20), 'Home movies', el('small', null, String(movies.length))) : null,
    el('a', { href: '#/favorites', onclick: () => closeMenu() }, icon('heart', 20), 'Favorites', el('small', null, String(store.favorites().length))),
    el('button', { type: 'button', onclick: () => { closeMenu(); app.surprise(); } }, icon('shuffle', 20), 'Surprise me'),
    el('button', { type: 'button', onclick: () => { closeMenu(); openAbout(app); } }, icon('info', 20), 'About this archive'),
  );
  menuNode = el('div', { class: 'menu', role: 'menu' },
    el('div', null, el('h4', { class: 'eyebrow' }, 'Decades'), decs),
    el('div', null, el('h4', { class: 'eyebrow' }, 'Collections'), links));
  document.body.append(menuNode);
  const b = btn.getBoundingClientRect();
  if (!isPhone()) menuNode.style.left = `${Math.max(16, b.left - 22)}px`;
  animate(menuNode, [{ opacity: 0, transform: 'translateY(-8px) scale(0.98)' }, { opacity: 1, transform: 'none' }], { duration: 380 });
  setTimeout(() => {
    document.addEventListener('pointerdown', outside, true);
    document.addEventListener('keydown', esc, true);
  });
  function outside(e) { if (!menuNode?.contains(e.target) && !btn.contains(e.target)) closeMenu(); }
  function esc(e) { if (e.key === 'Escape') { closeMenu(); btn.focus(); } }
  menuNode._cleanup = () => {
    document.removeEventListener('pointerdown', outside, true);
    document.removeEventListener('keydown', esc, true);
    btn.setAttribute('aria-expanded', 'false');
  };
  menuNode.querySelector('a, button')?.focus({ preventScroll: true });
}

export function closeMenu() {
  if (!menuNode) return;
  const n = menuNode;
  menuNode = null;
  n._cleanup?.();
  animate(n, [{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'translateY(-6px) scale(0.985)' }], { duration: 220 }).finished.then(() => n.remove());
}

/* ---------- About panel ---------- */
export function openAbout(app) {
  const close = () => {
    animate(bg, [{ opacity: 1 }, { opacity: 0 }], { duration: 300 });
    animate(panel, [{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'translateY(14px) scale(0.98)' }], { duration: 300 })
      .finished.then(() => wrap.remove());
    document.removeEventListener('keydown', esc);
    prev?.focus?.({ preventScroll: true });
  };
  const esc = (e) => { if (e.key === 'Escape') close(); };
  const prev = document.activeElement;
  const bg = el('div', { class: 'panel-bg', onclick: close });
  const panel = el('div', { class: 'panel', role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'about-title' },
    el('button', { class: 'icon-btn', type: 'button', 'aria-label': 'Close', onclick: close }, icon('close', 22)),
    el('p', { class: 'eyebrow', style: { margin: '0' } }, 'About this archive'),
    el('h2', { id: 'about-title' }, `The ${store.archive.family} family archive`),
    el('p', null, `${plural(store.allPhotos().length, 'photograph')} and ${plural(store.allMovies().length, 'home movie')}, from the ${store.decades()[0]}s to today. A private place for the whole family to look back, find themselves, and fill in the story.`),
    store.archive.sample ? el('p', null, 'The pictures here are sample imagery standing in for the real scans. They will be replaced as the albums are digitized.') : null,
    el('p', { style: { color: 'var(--ink-3)', fontSize: '15px', marginBottom: '0' } }, 'Tip: press / to search, and use the arrow keys to move between photos.'));
  const wrap = el('div', { class: 'panel-wrap' }, bg, panel);
  app.overlays.append(wrap);
  animate(bg, [{ opacity: 0 }, { opacity: 1 }], { duration: 400 });
  animate(panel, [{ opacity: 0, transform: 'translateY(18px) scale(0.98)' }, { opacity: 1, transform: 'none' }], { duration: 560, easing: EASE });
  document.addEventListener('keydown', esc);
  panel.querySelector('button').focus({ preventScroll: true });
}

/* ---------- Toast ---------- */
let toastNode = null, toastTimer = 0;
export function toast(msg) {
  if (!toastNode) { toastNode = el('div', { class: 'toast', role: 'status', 'aria-live': 'polite' }); document.body.append(toastNode); }
  toastNode.textContent = msg;
  requestAnimationFrame(() => toastNode.classList.add('is-on'));
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastNode.classList.remove('is-on'), 1800);
}
