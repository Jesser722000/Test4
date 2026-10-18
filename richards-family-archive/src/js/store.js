/* Indexes over window.ARCHIVE, plus favorites kept in this browser. */
const A = window.ARCHIVE || { photos: [], events: [], movies: [], decades: [], featured: {} };

export const archive = A;
export const decadeOf = (y) => Math.floor(y / 10) * 10;
export const decadeLabel = (d) => `${d}s`;

const MONTHS = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];
function monthOf(p) {
  const d = (p.date || '').toLowerCase();
  const i = MONTHS.findIndex((m) => d.includes(m));
  if (i >= 0) return i + 1;
  if (d.includes('spring')) return 4;
  if (d.includes('summer')) return 7;
  if (d.includes('fall') || d.includes('autumn')) return 10;
  if (d.includes('winter')) return 1;
  return 6.5;
}

const photos = A.photos.slice().sort((a, b) => a.year - b.year || monthOf(a) - monthOf(b) || a.id.localeCompare(b.id));
const byId = new Map(photos.map((p) => [p.id, p]));
const events = new Map(A.events.map((e) => [e.id, e]));
const movies = new Map((A.movies || []).map((m) => [m.id, m]));
const taglines = new Map(A.decades.map((d) => [d.decade, d.tagline]));


export const allPhotos = () => photos;
export const photo = (id) => byId.get(id);
export const event = (id) => events.get(id);
export const movie = (id) => movies.get(id);
export const allMovies = () => [...movies.values()];
export const tagline = (d) => taglines.get(d) || '';

export function decades() {
  const set = new Set(photos.map((p) => decadeOf(p.year)));
  A.decades.forEach((d) => set.add(d.decade));
  return [...set].sort((a, b) => a - b).filter((d) => photosInDecade(d).length);
}

export const photosInDecade = (d) => photos.filter((p) => decadeOf(p.year) === d);
export const photosInYear = (y) => photos.filter((p) => p.year === y);
export const moviesInYear = (y) => allMovies().filter((m) => m.year === y);
export const moviesInDecade = (d) => allMovies().filter((m) => decadeOf(m.year) === d);

export function yearsInDecade(d) {
  const set = new Set(photosInDecade(d).map((p) => p.year));
  moviesInDecade(d).forEach((m) => set.add(m.year));
  return [...set].sort((a, b) => a - b);
}

export function allYears() {
  const set = new Set(photos.map((p) => p.year));
  allMovies().forEach((m) => set.add(m.year));
  return [...set].sort((a, b) => a - b);
}

/** The prints that stand for a year in the decade view: hand-picked first, then the rest. */
export function featuredForYear(y, n = 3) {
  const picked = (A.featured?.[y] || []).map(photo).filter(Boolean);
  const rest = photosInYear(y).filter((p) => !picked.includes(p));
  return [...picked, ...rest].slice(0, n);
}

/** Photos and movies of a year, grouped by event; loose photos last. */
export function yearGroups(y) {
  const groups = [];
  const seen = new Map();
  for (const p of photosInYear(y)) {
    const key = p.event || '_more';
    if (!seen.has(key)) {
      const g = { event: p.event ? event(p.event) : null, photos: [], movies: [] };
      seen.set(key, g);
      groups.push(g);
    }
    seen.get(key).photos.push(p);
  }
  for (const m of moviesInYear(y)) {
    const key = m.event || '_more';
    if (!seen.has(key)) {
      const g = { event: m.event ? event(m.event) : null, photos: [], movies: [] };
      seen.set(key, g);
      groups.push(g);
    }
    seen.get(key).movies.push(m);
  }
  groups.sort((a, b) => (a.event ? 0 : 1) - (b.event ? 0 : 1));
  return groups;
}

export function yearSummary(y) {
  const groups = yearGroups(y).filter((g) => g.event);
  if (groups.length) return groups.map((g) => g.event.title).join(', ') + '.';
  const places = [...new Set(photosInYear(y).map((p) => p.place))].slice(0, 2);
  return places.length ? `${places.join(' and ')}.` : '';
}

/* ---------- Search ---------- */
const norm = (s) => String(s || '').toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '');

export function search(q) {
  const terms = norm(q).split(/\s+/).filter(Boolean);
  if (!terms.length) return null;
  const hit = (text) => terms.every((t) => text.includes(t));
  const decadeHits = decades().filter((d) => hit(norm(`${d}s ${String(d).slice(2)}s decade ${tagline(d)}`)));
  const yearHits = allYears().filter((y) => terms.some((t) => String(y).startsWith(t) && t.length >= 2));
  const eventHits = A.events.filter((e) => hit(norm(`${e.title} ${e.date} ${e.place} ${e.description} ${e.year}`)));
  const movieHits = allMovies().filter((m) => hit(norm(`${m.title} ${m.date} ${m.description} ${m.format} home movie film ${m.year}`)));
  const photoHits = photos.filter((p) => {
    const ev = p.event ? event(p.event) : null;
    return hit(norm(`${p.title} ${p.date} ${p.place} ${p.back || ''} ${p.year} ${decadeOf(p.year)}s ${ev ? ev.title : ''}`));
  });
  return { decades: decadeHits, years: yearHits, events: eventHits, movies: movieHits, photos: photoHits };
}

/* ---------- Favorites ---------- */
const FAV_KEY = 'richards-archive:favorites';
let favs = new Set();
try { favs = new Set(JSON.parse(localStorage.getItem(FAV_KEY) || '[]')); } catch { favs = new Set(); }
const favListeners = new Set();
export const isFav = (id) => favs.has(id);
export const favorites = () => [...favs];
export function toggleFav(id) {
  if (favs.has(id)) favs.delete(id); else favs.add(id);
  try { localStorage.setItem(FAV_KEY, JSON.stringify([...favs])); } catch { /* private mode: keep in memory */ }
  favListeners.forEach((fn) => fn());
  return favs.has(id);
}
export const onFavChange = (fn) => { favListeners.add(fn); return () => favListeners.delete(fn); };
