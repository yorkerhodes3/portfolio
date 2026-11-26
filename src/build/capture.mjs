// Captures screenshots of each project's site from a local checkout, for the picture pool.
// The live *.github.io sites are not reachable from every environment, so pages are served
// locally under a Pages-like base path. CDN requests for npm packages (unpkg, jsdelivr) are
// answered from the npm registry; other external requests are blocked, so maps may lack tiles.
// Usage: node src/build/capture.mjs [id ...]   Output: .work/pool/<id>/capture-<n>.png + captures.json
import { execFileSync } from 'node:child_process';
import { createServer } from 'node:http';
import { existsSync, mkdirSync, readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join, extname, dirname, normalize } from 'node:path';
import { chromium } from 'playwright-core';
import { token } from '../lib/github.mjs';

const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.gif': 'image/gif', '.wasm': 'application/wasm', '.glb': 'model/gltf-binary', '.gltf': 'model/gltf+json', '.geojson': 'application/json', '.csv': 'text/csv', '.txt': 'text/plain', '.woff2': 'font/woff2', '.woff': 'font/woff', '.ico': 'image/x-icon', '.md': 'text/markdown', '.pdf': 'application/pdf', '.mp4': 'video/mp4' };
export const contentType = p => TYPES[extname(p).toLowerCase()] || 'application/octet-stream';
export const chromePath = () => process.env.CHROME_PATH || ['/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser'].find(existsSync);

// ---- npm CDN shim -------------------------------------------------------------------------
const NPM_CACHE = '.work/npm';
const packuments = new Map();
async function packument(name) {
  if (!packuments.has(name)) packuments.set(name, fetch(`https://registry.npmjs.org/${name.replace('/', '%2F')}`).then(r => r.ok ? r.json() : null).catch(() => null));
  return packuments.get(name);
}
function pickVersion(doc, spec) {
  if (!spec || spec === 'latest') return doc['dist-tags'].latest;
  if (doc.versions[spec]) return spec;
  if (doc['dist-tags'][spec]) return doc['dist-tags'][spec];
  const want = spec.replace(/^[\^~>=v]+/, '').split('.');
  const ok = Object.keys(doc.versions).filter(v => !v.includes('-') && v.split('.').slice(0, want.length).every((x, i) => i === want.length - 1 && /[\^~]/.test(spec) ? true : x === want[i]) && v.split('.')[0] === want[0]);
  return ok.sort((a, b) => a.localeCompare(b, undefined, { numeric: true })).pop() || doc['dist-tags'].latest;
}
async function npmFile(name, spec, file) {
  const doc = await packument(name); if (!doc) return null;
  const version = pickVersion(doc, spec);
  const dir = join(NPM_CACHE, `${name.replace('/', '__')}@${version}`);
  if (!existsSync(join(dir, 'package'))) {
    const res = await fetch(doc.versions[version].dist.tarball); if (!res.ok) return null;
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, 'pkg.tgz'), Buffer.from(await res.arrayBuffer()));
    execFileSync('tar', ['-xzf', 'pkg.tgz'], { cwd: dir });
    const top = readdirSync(dir).find(d => d !== 'pkg.tgz' && statSync(join(dir, d)).isDirectory());
    if (top && top !== 'package') execFileSync('mv', [top, 'package'], { cwd: dir });
  }
  const pkg = JSON.parse(readFileSync(join(dir, 'package', 'package.json'), 'utf8'));
  let rel = file || (typeof pkg.unpkg === 'string' && pkg.unpkg) || (typeof pkg.jsdelivr === 'string' && pkg.jsdelivr) || (typeof pkg.browser === 'string' && pkg.browser) || pkg.module || pkg.main || 'index.js';
  let path = join(dir, 'package', normalize(rel).replace(/^(\.\.(\/|$))+/, ''));
  for (const cand of [path, `${path}.js`, join(path, 'index.js')]) if (existsSync(cand) && statSync(cand).isFile()) return cand;
  return null;
}
function parseCdn(url) {
  const u = new URL(url);
  let p = u.pathname;
  if (u.hostname === 'cdn.jsdelivr.net') { if (!p.startsWith('/npm/')) return null; p = p.slice(4); }
  else if (u.hostname !== 'unpkg.com') return null;
  const m = p.match(/^\/((?:@[^/]+\/)?[^/@]+)(?:@([^/]+))?(?:\/(.*))?$/);
  if (!m || (m[3] || '').includes('+esm')) return null;
  return { name: m[1], spec: m[2], file: m[3] };
}

// ---- local server -------------------------------------------------------------------------
function serve(root, base) {
  const server = createServer((req, res) => {
    let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    if (!p.startsWith(base)) { res.writeHead(404).end(); return; }
    p = join(root, normalize(p.slice(base.length)).replace(/^(\.\.(\/|$))+/, ''));
    if (existsSync(p) && statSync(p).isDirectory()) p = join(p, 'index.html');
    if (!existsSync(p)) { res.writeHead(404).end(); return; }
    res.writeHead(200, { 'Content-Type': contentType(p) }).end(readFileSync(p));
  });
  return new Promise(resolve => server.listen(0, '127.0.0.1', () => resolve(server)));
}

const PREFER = /dashboard|demo|explorer|graph|map|live|viewer|report|index|sim|briefing|observatory|table|twin|board|lab|model/i;

export async function captureProject({ id, repo, siteEntry }, browser) {
  const work = `.work/repos/${id}`;
  if (!existsSync(work)) {
    const auth = token() ? `https://x-access-token:${token()}@github.com/${repo}.git` : `https://github.com/${repo}.git`;
    execFileSync('git', ['clone', '-q', '--depth', '1', auth, work], { stdio: 'ignore' });
  }
  const siteRoot = join(work, dirname(siteEntry));
  const base = `/${repo.split('/')[1]}/`;
  const server = await serve(siteRoot, base);
  const origin = `http://127.0.0.1:${server.address().port}`;
  const pages = readdirSync(siteRoot, { recursive: true }).map(String)
    .filter(p => p.endsWith('.html') && !/node_modules|(^|\/)(404|test|tests|e2e)[\/.]/.test(p))
    .sort((a, b) => (a === 'index.html' ? -1 : b === 'index.html' ? 1 : (PREFER.test(b) - PREFER.test(a)) || a.split('/').length - b.split('/').length));
  const out = [];
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1, colorScheme: 'dark' });
  await context.route('**/*', async route => {
    const url = route.request().url();
    if (url.startsWith(origin)) return route.continue();
    const cdn = parseCdn(url);
    if (cdn) {
      const file = await npmFile(cdn.name, cdn.spec, cdn.file).catch(() => null);
      if (file) return route.fulfill({ status: 200, contentType: contentType(file), headers: { 'Access-Control-Allow-Origin': '*' }, body: readFileSync(file) });
    }
    return route.abort('blockedbyclient');
  });
  mkdirSync(`.work/pool/${id}`, { recursive: true });
  for (const page of pages.slice(0, 4)) {
    if (out.length >= 3) break;
    const tab = await context.newPage();
    const errors = [];
    tab.on('pageerror', e => errors.push(e.message));
    try {
      await tab.goto(`${origin}${base}${page}`, { waitUntil: 'load', timeout: 20000 });
      await tab.waitForTimeout(3500);
      const blank = await tab.evaluate(() => (document.body?.innerText || '').trim().length < 20 && !document.querySelector('canvas, svg, img'));
      if (!blank) {
        const file = `.work/pool/${id}/capture-${out.length + 1}.png`;
        await tab.screenshot({ path: file });
        const height = await tab.evaluate(() => document.documentElement.scrollHeight);
        out.push({ file, rel: page, page: `${dirname(siteEntry) === '.' ? '' : dirname(siteEntry) + '/'}${page}`, height, errors: errors.slice(0, 3) });
      }
    } catch (err) {
      errors.push(err.message.split('\n')[0]);
    }
    await tab.close();
  }
  // Long single-page sites: add views of later sections until there are three distinct pictures.
  for (const shot of [...out].sort((a, b) => (b.height || 0) - (a.height || 0))) {
    if (out.length >= 3 || (shot.height || 0) < 1500) continue;
    const tab = await context.newPage();
    try {
      await tab.goto(`${origin}${base}${shot.rel}`, { waitUntil: 'load', timeout: 20000 });
      await tab.waitForTimeout(2500);
      for (const f of [0.42, 0.8]) {
        if (out.length >= 3) break;
        const y = await tab.evaluate(f => { const y = Math.round((document.documentElement.scrollHeight - innerHeight) * f); scrollTo(0, y); return y; }, f);
        await tab.waitForTimeout(1200);
        const file = `.work/pool/${id}/capture-${out.length + 1}.png`;
        await tab.screenshot({ path: file });
        out.push({ file, rel: shot.rel, page: shot.page, section: `scrolled to ${y}px of ${shot.height}px`, height: shot.height });
      }
    } catch { /* keep what we have */ }
    await tab.close();
  }
  await context.close();
  server.close();
  return out;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const plan = JSON.parse(readFileSync('.work/capture-plan.json', 'utf8'));
  const only = process.argv.slice(2);
  const browser = await chromium.launch({ executablePath: chromePath(), args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const results = existsSync('.work/captures.json') ? JSON.parse(readFileSync('.work/captures.json', 'utf8')) : {};
  const todo = plan.filter(p => !only.length || only.includes(p.id));
  let i = 0;
  await Promise.all(Array.from({ length: 4 }, async () => {
    while (i < todo.length) {
      const p = todo[i++];
      try { results[p.id] = await captureProject(p, browser); }
      catch (err) { results[p.id] = [{ error: err.message.split('\n')[0] }]; }
      console.log(`${p.id}: ${results[p.id].filter(r => r.file).length} captures`);
    }
  }));
  writeFileSync('.work/captures.json', JSON.stringify(results, null, 2));
  await browser.close();
}
