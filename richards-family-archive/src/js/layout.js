import { seeded, clamp } from './util.js';
import * as store from './store.js';

const aspect = (p) => p.w / p.h;
const BORDER = 0.034;

/** Outer print size for a photo fitted inside a box (border included). */
export function fitPrint(p, maxW, maxH) {
  const a = aspect(p);
  let w = maxW, h = w / a;
  if (h > maxH) { h = maxH; w = h * a; }
  return { w: Math.round(w), h: Math.round(h) };
}

/* ---------- Home table: every decade gets a patch of the table around the title ---------- */
export const HOME_W = 1600;
export const HOME_H = 1000;
export const HOME_TITLE = { x: 545, y: 318, w: 510, h: 272 };

const ZONES = {
  1940: { x: 18, y: 64, w: 300, h: 270, label: [30, 70] },
  1950: { x: 0, y: 338, w: 318, h: 582, label: [30, 350] },
  1960: { x: 318, y: 606, w: 268, h: 246, label: [336, 614] },
  1970: { x: 330, y: 50, w: 445, h: 262, label: [345, 62], spill: { x: 318, y: 312, w: 225, h: 296 } },
  1980: { x: 790, y: 44, w: 392, h: 270, label: [905, 54] },
  1990: { x: 592, y: 642, w: 466, h: 212, label: [604, 598] },
  2000: { x: 1190, y: 36, w: 410, h: 280, label: [1200, 140] },
  2010: { x: 1062, y: 330, w: 300, h: 560, label: [1200, 368] },
  2020: { x: 1362, y: 330, w: 238, h: 640, label: [1295, 630] },
};

export function pickDecade(d, max, exclude = []) {
  const all = store.photosInDecade(d).filter((p) => !exclude.includes(p.id));
  if (all.length <= max) return all;
  // One featured print per year first, then fill evenly across the decade.
  const picked = [];
  for (const y of store.yearsInDecade(d)) {
    const f = store.featuredForYear(y, 4).find((p) => !exclude.includes(p.id));
    if (f) picked.push(f);
  }
  if (picked.length >= max) return Array.from({ length: max }, (_, i) => picked[Math.floor((i * picked.length) / max)]);
  const rest = all.filter((p) => !picked.includes(p));
  const step = rest.length / Math.max(1, max - picked.length);
  for (let i = 0; picked.length < max && i < rest.length; i += step) picked.push(rest[Math.floor(i)]);
  return picked.slice(0, max).sort((a, b) => a.year - b.year);
}

export function homeLayout() {
  const rand = seeded('richards-home');
  const items = [];
  const labels = [];
  const decs = store.decades().filter((d) => ZONES[d]);
  const labelRects = decs.map((d) => ({ x: ZONES[d].label[0] - 8, y: ZONES[d].label[1] - 6, w: 124, h: 50 }));
  for (const d of decs) {
    const z = ZONES[d];
    const ps = pickDecade(d, d === 1970 ? 15 : d === 1960 ? 8 : 12);
    labels.push({ decade: d, x: z.label[0], y: z.label[1] });
    const areaTotal = z.w * z.h + (z.spill ? z.spill.w * z.spill.h : 0);
    const base = (areaTotal * 0.78) / ps.length;
    const cols = Math.max(1, Math.round(Math.sqrt(ps.length * (z.w / z.h))));
    const rows = Math.ceil(ps.length / cols);
    const boxes = ps.map((p, i) => {
      let cx, cy;
      if (z.spill && i >= Math.ceil(ps.length * 0.72)) {
        const k = i - Math.ceil(ps.length * 0.72);
        cx = z.spill.x + z.spill.w * (0.3 + 0.4 * (k % 2)) + (rand() - 0.5) * 30;
        cy = z.spill.y + z.spill.h * (0.25 + 0.5 * (Math.floor(k / 2) % 2)) + (rand() - 0.5) * 30;
      } else {
        const c = i % cols, r = Math.floor(i / cols);
        cx = z.x + (c + 0.5) * (z.w / cols) + (rand() - 0.5) * (z.w / cols) * 0.36;
        cy = z.y + (r + 0.5) * (z.h / rows) + (rand() - 0.5) * (z.h / rows) * 0.36;
      }
      const big = i === 0 || rand() < 0.18;
      // Few photos in a decade should not mean giant prints.
      const area = Math.min(base * (big ? 1.35 : 0.72 + rand() * 0.4), big ? 62000 : 46000);
      const a = aspect(p);
      const w = Math.sqrt(area * a), h = w / a;
      return { p, cx, cy, w, h, r: (rand() - 0.5) * 9, zone: z };
    });
    relax(boxes, [HOME_TITLE, ...labelRects], z, 160);
    for (const b of boxes) {
      items.push({
        photo: b.p, decade: d,
        x: Math.round(b.cx - b.w / 2), y: Math.round(b.cy - b.h / 2), w: Math.round(b.w), h: Math.round(b.h),
        r: +b.r.toFixed(2), layer: b.w * b.h > base * 1.1 ? 2 : rand() < 0.5 ? 1 : 0, z: Math.floor(rand() * 9),
      });
    }
  }
  // Nudge each label to the clearest spot near where it was meant to go.
  const taken = items.map((it) => ({ x: it.x, y: it.y, w: it.w, h: it.h }));
  taken.push(HOME_TITLE);
  const overlap = (r, b) => Math.max(0, Math.min(r.x + r.w, b.x + b.w) - Math.max(r.x, b.x)) * Math.max(0, Math.min(r.y + r.h, b.y + b.h) - Math.max(r.y, b.y));
  for (const l of labels) {
    let best = null;
    for (let dy = -60; dy <= 60; dy += 6) {
      for (let dx = -80; dx <= 80; dx += 6) {
        const r = { x: l.x + dx - 6, y: l.y + dy - 4, w: 106, h: 44 };
        if (r.x < 12 || r.y < 40 || r.x + r.w > HOME_W - 12 || r.y + r.h > HOME_H - 150) continue;
        let o = 0;
        for (const b of taken) o += overlap(r, b);
        const score = o + (dx * dx + dy * dy) * 0.5;
        if (!best || score < best.score) best = { score, x: l.x + dx, y: l.y + dy };
      }
    }
    if (best) { l.x = best.x; l.y = best.y; }
    taken.push({ x: l.x - 6, y: l.y - 4, w: 106, h: 44 });
  }
  return { w: HOME_W, h: HOME_H, items, labels };
}

/** Push boxes apart until overlaps are modest, keep them out of blocked rects and inside their zone. */
function relax(boxes, blocked, zone, iters) {
  const bounds = {
    x0: Math.min(zone.x, zone.spill?.x ?? zone.x) - 12,
    y0: Math.min(zone.y, zone.spill?.y ?? zone.y) - 12,
    x1: Math.max(zone.x + zone.w, zone.spill ? zone.spill.x + zone.spill.w : 0) + 12,
    y1: Math.max(zone.y + zone.h, zone.spill ? zone.spill.y + zone.spill.h : 0) + 12,
  };
  for (let it = 0; it < iters; it++) {
    let moved = false;
    for (let i = 0; i < boxes.length; i++) {
      for (let j = i + 1; j < boxes.length; j++) {
        const a = boxes[i], b = boxes[j];
        const ox = (a.w + b.w) / 2 - Math.abs(a.cx - b.cx);
        const oy = (a.h + b.h) / 2 - Math.abs(a.cy - b.cy);
        if (ox <= 0 || oy <= 0) continue;
        const allowed = 0.14 * Math.min(a.w * a.h, b.w * b.h);
        if (ox * oy <= allowed) continue;
        moved = true;
        if (ox < oy) {
          const s = (ox * 0.5 + 1) * Math.sign(a.cx - b.cx || 1);
          a.cx += s * 0.5; b.cx -= s * 0.5;
        } else {
          const s = (oy * 0.5 + 1) * Math.sign(a.cy - b.cy || 1);
          a.cy += s * 0.5; b.cy -= s * 0.5;
        }
      }
    }
    for (const a of boxes) {
      for (const r of blocked) {
        const ox = Math.min(a.cx + a.w / 2, r.x + r.w) - Math.max(a.cx - a.w / 2, r.x);
        const oy = Math.min(a.cy + a.h / 2, r.y + r.h) - Math.max(a.cy - a.h / 2, r.y);
        if (ox <= 0 || oy <= 0) continue;
        moved = true;
        // Push out along whichever axis leaves the print inside its zone, preferring the shorter move.
        const sx = a.cx < r.x + r.w / 2 ? -1 : 1;
        const sy = a.cy < r.y + r.h / 2 ? -1 : 1;
        const fitsX = a.cx + sx * ox - a.w / 2 >= bounds.x0 && a.cx + sx * ox + a.w / 2 <= bounds.x1;
        const fitsY = a.cy + sy * oy - a.h / 2 >= bounds.y0 && a.cy + sy * oy + a.h / 2 <= bounds.y1;
        if (fitsX && (!fitsY || ox <= oy)) a.cx += sx * Math.min(ox, 8);
        else a.cy += (fitsY ? sy : -sy) * Math.min(oy, 8);
      }
      a.cx = clamp(a.cx, bounds.x0 + a.w / 2, bounds.x1 - a.w / 2);
      a.cy = clamp(a.cy, bounds.y0 + a.h / 2, bounds.y1 - a.h / 2);
    }
    if (!moved) break;
  }
}

/* ---------- Decade table: a title, then one cluster of prints per year ---------- */
export const DEC_W = 2280;

export function clusterPrints(photos, rand) {
  const out = [];
  if (!photos.length) return { prints: out, w: 0, h: 0 };
  if (photos.length === 1) {
    const s = fitPrint(photos[0], 340, 300);
    out.push({ photo: photos[0], x: 30, y: 54, ...s, r: (rand() - 0.5) * 3, lead: true });
  } else {
    const lead = fitPrint(photos[0], photos.length === 2 ? 320 : 300, 320);
    out.push({ photo: photos[0], x: 0, y: 54, ...lead, r: (rand() - 0.5) * 3.5, lead: true });
    const s2 = fitPrint(photos[1], 200, 185);
    out.push({ photo: photos[1], x: lead.w - 16, y: photos.length === 2 ? 120 : 26, ...s2, r: (rand() - 0.5) * 6 });
    if (photos[2]) {
      const s3 = fitPrint(photos[2], 215, 185);
      out.push({ photo: photos[2], x: lead.w - 34, y: 26 + s2.h - 12, ...s3, r: (rand() - 0.5) * 6 });
    }
  }
  const w = Math.max(...out.map((o) => o.x + o.w));
  const h = Math.max(...out.map((o) => o.y + o.h));
  return { prints: out, w, h };
}

/** Title in the top-left corner, then rows of year clusters: 3 beside the title, then 3, 4, 3, 4... */
export function decadeLayout(decade) {
  const rand = seeded(`decade-${decade}`);
  const years = store.yearsInDecade(decade);
  const rows = [];
  for (let i = 0, r = 0; i < years.length; r++) {
    const n = r === 0 ? 3 : r % 2 ? 3 : 4;
    rows.push(years.slice(i, i + n));
    i += n;
  }
  const last = rows[rows.length - 1];
  if (rows.length > 1 && last.length === 1 && rows[rows.length - 2].length > 2) last.unshift(rows[rows.length - 2].pop());
  const clusters = [];
  let top = 40;
  rows.forEach((row, ri) => {
    const x0 = ri === 0 ? 800 : 30;
    const x1 = DEC_W - 30;
    const slot = (x1 - x0) / row.length;
    let bottom = 0;
    row.forEach((y, k) => {
      const cl = clusterPrints(store.featuredForYear(y, 3), rand);
      const cx = x0 + slot * (k + 0.5) + (rand() - 0.5) * 60;
      const cy = top + (k % 2 ? 24 : 0) + (rand() - 0.5) * 26;
      const c = {
        year: y, x: Math.round(cx - cl.w / 2), y: Math.round(cy), w: cl.w, h: cl.h, prints: cl.prints,
        movie: store.moviesInYear(y)[0] || null, count: store.photosInYear(y).length,
      };
      clusters.push(c);
      bottom = Math.max(bottom, c.y + c.h);
    });
    top = bottom + 92;
  });
  return { decade, w: DEC_W, h: top - 10, clusters, title: { x: 70, y: 40 } };
}

/** A few faded prints of the neighbouring decade, peeking in from the side. */
export function ghostLayout(decade, side, layout) {
  const rand = seeded(`ghost-${decade}-${side}`);
  const ps = store.photosInDecade(decade);
  const n = Math.min(5, ps.length);
  const pick = Array.from({ length: n }, (_, i) => ps[Math.floor(((i + 0.5) * ps.length) / n)]);
  // Prints above and below a gap that holds the decade's name.
  const slots = [0.0, 0.16, 0.48, 0.65, 0.82];
  const prints = pick.map((p, i) => {
    const s = fitPrint(p, 250, 200);
    const x = side < 0 ? -70 - s.w - rand() * 80 : layout.w + 70 + rand() * 80;
    const y = slots[i % slots.length] * layout.h + rand() * 30;
    return { photo: p, x: Math.round(x), y: Math.round(y), ...s, r: (rand() - 0.5) * 8 };
  });
  return { decade, side, prints, label: { x: side < 0 ? -270 : layout.w + 90, y: Math.round(layout.h * 0.37) } };
}

/* ---------- Justified rows for year pages ---------- */
export function justify(items, width, rowH, gap) {
  const out = [];
  let row = [];
  let y = 0;
  const flush = (last) => {
    if (!row.length) return;
    const sumA = row.reduce((s, it) => s + it.a, 0);
    const avail = width - gap * (row.length - 1);
    let h = avail / sumA;
    if (last && h > rowH * 1.15) h = rowH;
    // A lone short row (a year with only a few photos) sits in the middle rather than hugging the left.
    let x = last && !out.length ? Math.max(0, (avail - sumA * h) / 2) : 0;
    for (const it of row) {
      const w = it.a * h;
      out.push({ ...it, x: Math.round(x), y: Math.round(y), w: Math.round(w), h: Math.round(h) });
      x += w + gap;
    }
    y += h + gap;
    row = [];
  };
  for (const it of items) {
    if (it.full) {
      flush(false);
      const h = Math.round(Math.min(width / it.a, rowH * 1.6));
      const w = Math.round(Math.min(width, h * it.a));
      out.push({ ...it, x: Math.round((width - w) / 2), y: Math.round(y), w, h });
      y += h + gap;
      continue;
    }
    row.push(it);
    const sumA = row.reduce((s, r) => s + r.a, 0);
    if (sumA * rowH + gap * (row.length - 1) >= width) flush(false);
  }
  flush(true);
  return { items: out, h: Math.max(0, Math.round(y - gap)) };
}

/* ---------- Phone collages: hand-placed slots, scaled to the screen width ---------- */
// x, y (fractions of the hero's width and height), width (fraction of width), rotation.
// Two bands of prints above the title, one below, and two slivers peeking in at the edges.
const HERO_SLOTS = [
  [-0.03, 0.075, 0.35, -3], [0.31, 0.055, 0.42, 1.5], [0.72, 0.085, 0.32, 3],
  [0.05, 0.25, 0.36, -2], [0.43, 0.265, 0.28, 2.5], [0.69, 0.245, 0.33, -2.5],
  [-0.04, 0.765, 0.34, 2], [0.29, 0.79, 0.3, -2.5], [0.58, 0.755, 0.36, 3],
  [0.84, 0.865, 0.26, -2], [-0.16, 0.47, 0.22, 4], [0.94, 0.45, 0.22, -4],
];
export const HERO_IDS = ['m01', 'm02', 'm09', 'm03', 'm04', 'm13', 'h03', 'm12', 'm20', 'm29', 'm38', 'h31'];

/** The phone hero's twelve prints: archive.hero if set, else the sample picks, topped up from across the years. */
export function heroIds() {
  const ids = (store.archive.hero || HERO_IDS).filter((id) => store.photo(id)).slice(0, 12);
  const all = store.allPhotos();
  const step = Math.max(1, Math.floor(all.length / 12));
  for (let i = 0; i < all.length && ids.length < 12; i += step) if (!ids.includes(all[i].id)) ids.push(all[i].id);
  return ids;
}

export function heroLayout(W, H) {
  const ps = heroIds().map(store.photo);
  return ps.map((p, i) => {
    const [x, y, w, r] = HERO_SLOTS[i % HERO_SLOTS.length];
    const pw = w * W;
    const ph = pw / aspect(p);
    return { photo: p, x: Math.round(x * W), y: Math.round(y * H), w: Math.round(pw), h: Math.round(ph), r, depth: 0.15 + (i % 3) * 0.12 };
  });
}

const STREAM_TEMPLATES = [
  [[0.04, 0.03, 0.54, -2.5], [0.56, 0.08, 0.4, 3], [0.0, 0.42, 0.38, 2], [0.36, 0.47, 0.34, -2.5], [0.68, 0.41, 0.33, 2], [0.24, 0.75, 0.42, -1.5]],
  [[0.42, 0.02, 0.54, 2.5], [0.03, 0.07, 0.4, -3], [0.63, 0.42, 0.36, -2], [0.31, 0.46, 0.34, 2.5], [-0.01, 0.41, 0.33, -2], [0.34, 0.75, 0.42, 1.5]],
];

export function streamLayout(photos, W, variant = 0) {
  const t = STREAM_TEMPLATES[variant % STREAM_TEMPLATES.length];
  let bottom = 0;
  const items = photos.slice(0, t.length).map((p, i) => {
    const [x, y, w, r] = t[i];
    const pw = w * W;
    const ph = Math.min(pw / aspect(p), pw * 1.18);
    const item = { photo: p, x: Math.round(x * W), y: Math.round(y * W), w: Math.round(pw), h: Math.round(ph), r };
    bottom = Math.max(bottom, item.y + item.h);
    return item;
  });
  return { items, h: bottom + 8 };
}

const YEAR_TEMPLATES = {
  1: [[0.1, 0.02, 0.8, -1.5]],
  2: [[0.05, 0.02, 0.58, -2], [0.55, 0.16, 0.4, 2.5]],
  3: [[0.05, 0.02, 0.56, -2], [0.58, 0.0, 0.38, 2.5], [0.52, 0.38, 0.42, -1.5]],
};

export function yearCollage(photos, W) {
  const t = YEAR_TEMPLATES[Math.min(3, photos.length)] || YEAR_TEMPLATES[1];
  let bottom = 0;
  const items = photos.slice(0, 3).map((p, i) => {
    const [x, y, w, r] = t[i];
    const pw = w * W;
    const ph = Math.min(pw / aspect(p), pw * 1.2);
    const item = { photo: p, x: Math.round(x * W), y: Math.round(y * W), w: Math.round(pw), h: Math.round(ph), r };
    bottom = Math.max(bottom, item.y + item.h);
    return item;
  });
  return { items, h: bottom + 10 };
}

export { BORDER };
