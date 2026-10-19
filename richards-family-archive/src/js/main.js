import { $, el, isPhone, onPhoneChange, debounce, wait, reduceMotion } from './util.js';
import { fly, geom, onScreen, landAll, animate, EASE } from './anim.js';
import { renderTopbar, closeMenu, toast } from './chrome.js';
import { hideTip } from './print.js';
import { hudIn, hudOut } from './hud.js';
import { revealNow, isShown, yearHref, photoHref } from './views/base.js';
import { HomeDesk } from './views/home-desk.js';
import { HomeMob, DecadeMob } from './views/phone.js';
import { DecadeDesk } from './views/decade-desk.js';
import { YearView } from './views/year.js';
import { MovieView } from './views/movie.js';
import { FavoritesView } from './views/favorites.js';
import { Closer } from './overlays/closer.js';
import { Story } from './overlays/story.js';
import { Search } from './overlays/search.js';
import { initSmoothScroll, setSmooth, scrollToY } from './scroll.js';
import { initTilt, initMagnetic, resetTilt } from './motion.js';
import * as store from './store.js';

const app = {
  el: $('#app'),
  stage: $('#stage'),
  topbar: $('#topbar'),
  overlays: $('#overlays'),
  flights: $('#flights'),
  sampleTag: $('#sampleTag'),
  hud: null,
  view: null,
  route: null,
  from: null,
  direction: 0,
  opts: {},
};

/* ---------- Routes: #/  #/1970s  #/1970s/1976  #/1970s/1976/<film or event>  #/favorites ---------- */
const HOME = { name: 'home', key: '/', depth: 0 };

function parse(hash) {
  const parts = (hash || '').replace(/^#\/?/, '').split('/').filter(Boolean).map((s) => { try { return decodeURIComponent(s); } catch { return s; } });
  if (!parts.length) return HOME;
  if (parts[0] === 'favorites') return { name: 'favorites', key: '/favorites', depth: 2 };
  const m = /^(\d{4})s$/.exec(parts[0]);
  const decade = m ? +m[1] : null;
  if (!decade || !store.decades().includes(decade)) return HOME;
  const dRoute = { name: 'decade', decade, key: `/${decade}s`, depth: 1 };
  if (parts.length === 1) return dRoute;
  const year = +parts[1];
  if (!year || store.decadeOf(year) !== decade || !store.allYears().includes(year)) return dRoute;
  const yRoute = { name: 'year', decade, year, key: `/${decade}s/${year}`, depth: 2 };
  if (parts.length === 2) return yRoute;
  const mv = store.movie(parts[2]);
  if (mv && mv.year === year) return { name: 'movie', decade, year, movie: mv, key: `/${decade}s/${year}/${mv.id}`, depth: 3 };
  const ev = store.event(parts[2]);
  if (ev && ev.year === year) return { ...yRoute, event: ev.id };
  // A link to one photo opens its year and brings that photo closer.
  const ph = store.photo(parts[2]);
  if (ph && ph.year === year) return { ...yRoute, photo: ph.id };
  return yRoute;
}

const hashOf = (r) => `#${r.key}${r.event ? `/${r.event}` : ''}${r.photo ? `/${r.photo}` : ''}`;

function viewFor(route) {
  const phone = isPhone();
  switch (route.name) {
    case 'decade': return phone ? DecadeMob : DecadeDesk;
    case 'year': return YearView;
    case 'movie': return MovieView;
    case 'favorites': return FavoritesView;
    default: return phone ? HomeMob : HomeDesk;
  }
}

/** 1 deeper, -1 back out, 2 / -2 sideways (later / earlier), 0 nothing to compare with. */
function direction(a, b) {
  if (!a) return 0;
  if (a.depth !== b.depth) return b.depth > a.depth ? 1 : -1;
  if (a.name !== b.name) return 2;
  const av = a.year || a.decade || 0, bv = b.year || b.decade || 0;
  return bv >= av ? 2 : -2;
}

/* ---------- A small history stack, to know when a navigation is really "back" ---------- */
const stack = [];
function track(key) {
  if (stack.length >= 2 && stack[stack.length - 2] === key) { stack.pop(); return true; }
  if (stack[stack.length - 1] !== key) stack.push(key);
  return false;
}

/* ---------- Floating controls owned by the app, shared across pages ---------- */
const huds = new Map();
let hudUsed = new Set();
app.useHud = (kind, key, create) => {
  hudUsed.add(kind);
  const cur = huds.get(kind);
  if (cur && cur.key === key) return cur.api;
  if (cur) retireHud(cur);
  const api = create();
  app.hud.append(api.node);
  huds.set(kind, { key, api, fresh: true });
  return api;
};
function retireHud(h) {
  for (const [k, v] of huds) if (v === h) huds.delete(k);
  const n = h.api.node;
  n.style.pointerEvents = 'none';
  hudOut(n).finished.then(() => { h.api.destroy?.(); n.remove(); }, () => n.remove());
}
function reconcileHud(animateIn) {
  for (const [kind, h] of [...huds]) {
    if (!hudUsed.has(kind)) { retireHud(h); continue; }
    if (h.fresh) {
      h.fresh = false;
      if (animateIn) hudIn(h.api.node, 260);
    }
  }
}

/* ---------- Top bar: only the parts that change cross-fade ---------- */
function swapTopbar(cfg, animated) {
  const bar = app.topbar;
  const old = [...bar.children].map((c) => ({ html: c.outerHTML, node: c, rect: c.getBoundingClientRect() }));
  renderTopbar(app, cfg);
  bar.style.setProperty('--bar-solid', cfg.solid ? '1' : '0');
  if (!animated) return;
  [...bar.children].forEach((c, i) => {
    const o = old[i];
    if (o && o.html === c.outerHTML) return;
    if (o && o.node.childElementCount) {
      const ghost = o.node.cloneNode(true);
      ghost.setAttribute('aria-hidden', 'true');
      ghost.inert = true;
      Object.assign(ghost.style, { position: 'fixed', left: `${o.rect.left}px`, top: `${o.rect.top}px`, width: `${o.rect.width}px`, height: `${o.rect.height}px`, margin: '0', zIndex: '41', pointerEvents: 'none' });
      ghost.classList.add('tb-ghost');
      document.body.append(ghost);
      animate(ghost, [{ opacity: 1 }, { opacity: 0, transform: 'translateY(4px)' }], { duration: 260, easing: 'ease-in' }).finished.then(() => ghost.remove(), () => ghost.remove());
    }
    animate(c, [{ opacity: 0, transform: 'translateY(-6px)' }, { opacity: 1, transform: 'none' }], { duration: 560, delay: 120, easing: EASE, fill: 'backwards' });
  });
}

function updateBar() {
  const v = app.view;
  const scrolled = window.scrollY > 12;
  const on = v && !v.fixed && (scrolled || isPhone());
  app.topbar.style.setProperty('--bar-bg', on ? '1' : '0');
  app.topbar.classList.toggle('is-solid', !!on && scrolled && isPhone());
}

/* ---------- Page transitions ---------- */
let seq = 0;
let current = null;
const scrollMem = new Map();

function settleTransition() {
  if (!current) return;
  const { old, v } = current;
  current = null;
  landAll(app.flights);
  app.flights.replaceChildren();
  for (const n of v.shared().values()) n.style.visibility = '';
  v.finish();
  v.el.classList.remove('is-entering');
  old?.destroy();
}

async function show(route, { first = false, instant = false } = {}) {
  const token = ++seq;
  settleTransition();
  closeMenu();
  hideTip();
  resetTilt();
  const old = app.view;
  const back = track(route.key);
  if (route.photo) {
    // Open the photo once the page is up; the address goes back to the page itself.
    app.opts.openPhoto = route.photo;
    try { history.replaceState(history.state, '', `#${route.key}`); } catch { /* ignore */ }
    route = { ...route, photo: null };
    if (old && old.route.key === route.key) { openPending(old); return; }
  }

  if (old && !instant && old.route.key === route.key) {
    if (old.update(route)) { app.route = route; return; }
    if (old.route.event === route.event) return;
  }

  const dir = first || instant ? 0 : direction(old?.route, route);
  app.from = old?.route || null;
  app.direction = dir;
  app.route = route;

  // Prints on screen right now (and the photo open in the viewer) can fly to the next page.
  const sources = new Map();
  if (old && !instant) {
    for (const [k, n] of old.shared()) {
      if (!isShown(n)) continue;
      const g = geom(n);
      if (onScreen(g, 0)) sources.set(k, { g, n });
    }
  }
  if (app.closer.isOpen) {
    const card = app.closer.card();
    const g = card && geom(card);
    if (g && !instant) sources.set(`p:${app.closer.photo.id}`, { g, n: card });
    app.closer.handoff();
  }
  if (app.story.isOpen) app.story.close();
  if (app.search.isOpen) app.search.close({ quick: true });

  if (old) scrollMem.set(old.route.key, window.scrollY);
  app.viewH = innerHeight;
  if (old) old.freeze();

  hudUsed = new Set();
  const View = viewFor(route);
  const v = new View(app, route);
  v.el.classList.add('is-entering');
  app.stage.append(v.el);
  app.view = v;
  try { v.mount(); } catch (e) { console.error(e); }
  reconcileHud(!first && !instant);

  const cfg = v.topbar();
  swapTopbar(cfg, !first && !instant);
  app.sampleTag.hidden = !store.archive.sample;
  app.sampleTag.classList.toggle('is-low', !cfg.sample);
  app.el.dataset.view = route.name;

  const y = (back || dir < 0) && scrollMem.has(route.key) ? scrollMem.get(route.key) : (v.initialScroll?.() ?? 0);
  setSmooth(!v.fixed && locks.size === 0);
  scrollToY(y);
  app.scrollTop = y;
  v.afterScroll?.();
  updateBar();
  document.title = titleFor(route);

  if (instant) {
    old?.destroy();
    v.el.classList.remove('is-entering');
    return;
  }

  let pairs = [];
  if (!first && !reduceMotion()) {
    // All writes, then all reads: the new page is laid out once, not once per print.
    const targets = v.shared();
    for (const [k, s] of sources) {
      const t = targets.get(k);
      if (t) pairs.push({ k, s, t });
    }
    pairs.forEach((p) => revealNow(p.t));
    pairs.forEach((p) => { p.tg = geom(p.t); });
    pairs = pairs.filter((p) => onScreen(p.tg, 0));
  }
  pairs.sort((a, b) => a.tg.cy - b.tg.cy || a.tg.cx - b.tg.cx);
  const chosen = pairs.slice(0, 20);
  const flying = new Set(chosen.map((p) => p.k));
  for (const p of chosen) { p.s.n.style.visibility = 'hidden'; p.t.style.visibility = 'hidden'; }
  const lateral = dir === 2 || dir === -2;
  const flights = fly(app.flights, chosen.map((p, i) => {
    const [kind, id] = [p.k.slice(0, 1), p.k.slice(2)];
    const photo = kind === 'p' ? store.photo(id) : null;
    const movie = kind === 'm' ? store.movie(id) : null;
    return {
      from: p.s.g,
      to: p.tg,
      src: photo ? photo.thumb : movie.poster,
      hi: photo && p.tg.w > 380 ? photo.src : null,
      lqip: photo?.lqip,
      order: i,
      onLand: () => { p.t.style.visibility = ''; },
    };
  }), { duration: lateral ? 720 : 900, stagger: 24 });

  current = { old, v };
  const leaving = old ? old.leave({ dir, to: v, flying }) : Promise.resolve();
  const entering = v.enter({ dir, from: old, flying, first });
  await Promise.all([leaving, entering, flights]);
  if (token !== seq) return;
  current = null;
  old?.destroy();
  v.el.classList.remove('is-entering');
  if (!app.stage.contains(document.activeElement) && !app.overlays.contains(document.activeElement) && !first) {
    app.stage.focus({ preventScroll: true });
  }
  openPending(v);
}

function titleFor(r) {
  const f = store.archive.family;
  if (r.name === 'decade') return `The ${r.decade}s · ${f} Family Archive`;
  if (r.name === 'year') return `${r.year} · ${f} Family Archive`;
  if (r.name === 'movie') return `${r.movie.title} · ${f} Family Archive`;
  if (r.name === 'favorites') return `Favorites · ${f} Family Archive`;
  return `${f} Family Archive`;
}

/** After "Surprise me", a search or a link to one photo: bring the photo closer from its print on the page. */
function openPending(v) {
  const id = app.take('openPhoto');
  if (!id || v !== app.view) return;
  const n = v.printFor(id);
  const list = v.photoList();
  const i = list.findIndex((p) => p.id === id);
  if (!n || i < 0) return;
  const r = n.getBoundingClientRect();
  const visible = r.top > 80 && r.bottom < innerHeight - 90;
  const arrive = visible ? wait(120) : scrollToY(window.scrollY + r.top - innerHeight / 2 + r.height / 2, { smooth: true });
  arrive.then(() => { if (app.view === v) { revealNow(n); app.closer.open(list, i, n); } });
}

/* ---------- App API used by the pages ---------- */
app.go = (hash, opts = {}) => {
  app.opts = { ...app.opts, ...opts };
  const route = parse(hash);
  if (route.photo && app.view && app.route?.key === route.key) {
    // Already on the photo's page: just bring it closer.
    app.opts.openPhoto = route.photo;
    openPending(app.view);
    return;
  }
  if (opts.fromCloser && app.closer.isOpen && app.closer.pushed) {
    // Replace the closer's history entry so Back returns to the page under it.
    app.closer.pushed = false;
    try { history.replaceState(null, '', hashOf(route)); } catch { /* ignore */ }
    show(route);
    return;
  }
  if (location.hash === hash || (!location.hash && hash === '#/')) {
    show(route);
    return;
  }
  try { location.hash = hash; } catch { show(route); }
};

app.take = (key) => {
  const v = app.opts[key];
  delete app.opts[key];
  return v;
};

app.up = () => {
  const r = app.route;
  let parent = null;
  if (r.name === 'movie') parent = yearHref(r.year);
  else if (r.name === 'year') parent = `#/${r.decade}s`;
  else if (r.name === 'decade' || r.name === 'favorites') parent = '#/';
  if (!parent) return;
  const key = parse(parent).key;
  if (stack.length >= 2 && stack[stack.length - 2] === key) history.back();
  else app.go(parent);
};

app.rerender = () => { if (app.route) show(app.route, { instant: true }); };
app.scrollTo = scrollToY;
/** Bring a print's photo closer, moving through the other prints on the same page. */
app.openPhoto = (node) => {
  const v = app.view;
  if (!v || !node) return;
  const list = v.photoList();
  const i = list.findIndex((p) => p.id === node.dataset.pid);
  if (i >= 0) app.closer.open(list, i, node);
};
app.closerClosed = () => app.view?.onCloserClosed?.();
app.play = (photos, opts) => app.story.open(photos, opts);
app.openSearch = () => { closeMenu(); app.search.open(); };
app.toast = toast;

app.surprise = () => {
  const ps = store.allPhotos();
  app.go(photoHref(ps[Math.floor(Math.random() * ps.length)]));
};

const locks = new Set();
app.lockScroll = (owner, on) => {
  if (on) locks.add(owner); else locks.delete(owner);
  document.documentElement.classList.toggle('is-locked', locks.size > 0);
  setSmooth(locks.size === 0 && !app.view?.fixed);
};

app.toggleFullscreen = () => {
  if (document.fullscreenElement) document.exitFullscreen?.();
  else document.documentElement.requestFullscreen?.().catch(() => {});
};

/* ---------- Boot ---------- */
function boot() {
  try { history.scrollRestoration = 'manual'; } catch { /* ignore */ }
  initSmoothScroll();
  initTilt();
  initMagnetic();
  app.hud = el('div', { class: 'hud', id: 'hud' });
  app.stage.after(app.hud);
  app.closer = new Closer(app);
  app.story = new Story(app);
  app.search = new Search(app);

  window.addEventListener('hashchange', () => show(parse(location.hash)));
  window.addEventListener('popstate', (e) => {
    if (app.closer.isOpen && !e.state?.closer) app.closer.onPop();
    if (app.story.isOpen && !e.state?.story) app.story.onPop();
  });
  window.addEventListener('resize', debounce(() => app.view?.onResize?.(), 120));
  onPhoneChange(() => app.rerender());
  window.addEventListener('scroll', updateBar, { passive: true });
  document.addEventListener('keydown', (e) => {
    if (e.defaultPrevented || app.closer.isOpen || app.story.isOpen || app.search.isOpen || document.querySelector('.panel-wrap')) return;
    const t = e.target;
    const typing = t.closest?.('input, textarea, select, [contenteditable="true"]');
    if (!typing && (e.key === '/' || ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k'))) {
      e.preventDefault();
      app.openSearch();
      return;
    }
    if (typing || e.metaKey || e.ctrlKey || e.altKey) return;
    if ((e.key === 'Enter' || e.key === ' ') && t.closest?.('a, button, [role="slider"]')) return;
    if (app.view?.keydown?.(e)) e.preventDefault();
  });

  const route = parse(location.hash);
  if (location.hash && hashOf(route) !== location.hash) {
    try { history.replaceState(null, '', hashOf(route)); } catch { /* ignore */ }
  }
  const go = () => {
    app.el.classList.remove('is-booting');
    show(route, { first: true });
  };
  Promise.race([document.fonts?.ready || Promise.resolve(), wait(1000)]).then(go, go);
}

boot();
