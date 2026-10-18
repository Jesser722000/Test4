// Builds the static site into ./site:
//   node build.mjs            bundle JS and CSS, write site/index.html
//   node build.mjs --watch    rebuild when src/ changes
//   node build.mjs --serve    rebuild on change and serve site/ on http://localhost:8080
//   node build.mjs --artifact <dir>   also write a single-file preview (inline CSS, JS and data) into <dir>
import * as esbuild from 'esbuild';
import { createHash } from 'node:crypto';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { watch } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(import.meta.url));
const src = join(root, 'src');
const out = join(root, 'site');
const args = process.argv.slice(2);
const flag = (f) => args.includes(f);
const artifactDir = flag('--artifact') ? resolve(args[args.indexOf('--artifact') + 1] || 'artifact') : null;

const hash = (s) => createHash('sha1').update(s).digest('hex').slice(0, 10);

async function build() {
  const t0 = Date.now();
  const js = await esbuild.build({
    entryPoints: [join(src, 'js/main.js')],
    bundle: true,
    format: 'iife',
    minify: true,
    target: ['es2020', 'safari14'],
    legalComments: 'none',
    write: false,
  });
  const css = await esbuild.build({
    entryPoints: [join(src, 'styles.css')],
    bundle: true,
    minify: true,
    target: ['safari14', 'chrome100', 'firefox100'],
    write: false,
  });
  const jsText = js.outputFiles[0].text;
  const cssText = css.outputFiles[0].text;
  const data = await readFile(join(out, 'data/archive.js'), 'utf8');
  const html = await readFile(join(src, 'index.html'), 'utf8');

  await writeFile(join(out, 'app.js'), jsText);
  await writeFile(join(out, 'styles.css'), cssText);
  const page = html
    .replace('<!--styles-->', `<link rel="stylesheet" href="styles.css?v=${hash(cssText)}">`)
    .replace('<!--scripts-->', `<script src="data/archive.js?v=${hash(data)}"></script>\n<script src="app.js?v=${hash(jsText)}"></script>`);
  await writeFile(join(out, 'index.html'), page);

  if (artifactDir) {
    // One self-contained page: no document wrapper, the title first, everything but media inline.
    await mkdir(artifactDir, { recursive: true });
    const body = html.slice(html.indexOf('<body>') + 6, html.indexOf('</body>'))
      .replace('<!--scripts-->', '')
      .trim();
    const fonts = /<link rel="stylesheet" href="(https:\/\/fonts\.googleapis\.com[^"]+)">/.exec(html)[1];
    const safe = (s) => s.replace(/<\/script/gi, '<\\/script');
    const art = [
      '<title>Richards Family Archive</title>',
      '<link rel="preconnect" href="https://fonts.googleapis.com">',
      '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>',
      `<link rel="stylesheet" href="${fonts}">`,
      `<style>${cssText}</style>`,
      body,
      `<script>${safe(data)}</script>`,
      `<script>${safe(jsText)}</script>`,
    ].join('\n');
    await writeFile(join(artifactDir, 'index.html'), art);
  }
  console.log(`built in ${Date.now() - t0} ms  (app.js ${(jsText.length / 1024).toFixed(1)} KB, styles.css ${(cssText.length / 1024).toFixed(1)} KB)`);
}

const TYPES = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.webp': 'image/webp', '.jpg': 'image/jpeg', '.png': 'image/png', '.svg': 'image/svg+xml',
  '.mp4': 'video/mp4', '.webm': 'video/webm', '.vtt': 'text/vtt; charset=utf-8', '.json': 'application/json',
};

function serve(port = 8080) {
  createServer(async (req, res) => {
    try {
      const url = decodeURIComponent(new URL(req.url, 'http://x').pathname);
      const file = normalize(join(out, url.endsWith('/') ? `${url}index.html` : url));
      if (!file.startsWith(out)) { res.writeHead(403).end(); return; }
      const body = await readFile(file);
      const type = TYPES[extname(file)] || 'application/octet-stream';
      const range = req.headers.range;
      if (range && /^(video|audio)\//.test(type)) {
        const [a, b] = range.replace('bytes=', '').split('-');
        const start = +a, end = b ? +b : body.length - 1;
        res.writeHead(206, { 'Content-Type': type, 'Content-Range': `bytes ${start}-${end}/${body.length}`, 'Accept-Ranges': 'bytes', 'Content-Length': end - start + 1 });
        res.end(body.subarray(start, end + 1));
        return;
      }
      res.writeHead(200, { 'Content-Type': type, 'Cache-Control': 'no-cache', 'Accept-Ranges': 'bytes' });
      res.end(body);
    } catch {
      res.writeHead(404).end('Not found');
    }
  }).listen(port, () => console.log(`serving site/ on http://localhost:${port}`));
}

await build();
if (flag('--watch') || flag('--serve')) {
  let timer = null;
  watch(src, { recursive: true }, () => {
    clearTimeout(timer);
    timer = setTimeout(() => build().catch((e) => console.error(e.message)), 80);
  });
  if (flag('--serve')) serve(+(process.env.PORT || 8080));
}
