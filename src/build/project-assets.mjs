// Generates a favicon and a 1200×630 share image for each project whose own site lacks them (FR-07),
// into .work/upstream/<id>/. The upstream PR script places them next to the site's entry page.
// Usage: node src/build/project-assets.mjs [id ...]
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import sharp from 'sharp';
import { chromium } from 'playwright-core';
import { chromePath } from './capture.mjs';
import { inlineFontFaces } from '../lib/fonts.mjs';

const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const snapshot = JSON.parse(readFileSync('catalog/snapshot.json', 'utf8'));
const vocab = JSON.parse(readFileSync('catalog/tags.json', 'utf8'));
const initials = title => {
  const words = title.replace(/[—–:·(].*$/, '').split(/[\s-]+/).filter(w => /^[A-Za-z0-9]/.test(w) && !/^(the|of|and|for|a|an|to|in)$/i.test(w));
  const s = words.length > 1 ? words[0][0] + words[1][0] : (words[0] || title).slice(0, 2);
  return s.toUpperCase();
};

export function faviconSvg(title, brand = {}) {
  const bg = brand.bg || '#120c1a', fg = brand.accent || '#c8f04b', ring = '#7b5cff';
  const text = initials(title);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="${bg}"/><rect x="3" y="3" width="58" height="58" rx="11" fill="none" stroke="${ring}" stroke-width="2.5"/><text x="32" y="44" text-anchor="middle" font-family="Arial Narrow, Arial, Helvetica, sans-serif" font-weight="700" font-size="${text.length > 1 ? 30 : 36}" letter-spacing="-1" fill="${fg}">${esc(text)}</text></svg>`;
}

async function shareImage(browser, p, out) {
  const img = readFileSync(join('media', p.id, `${p.defaultImageId}.webp`)).toString('base64');
  const owner = p.repo.startsWith('Ethical-Tech-CoLab/') ? 'Ethical Tech CoLab' : 'Yorke E. Rhodes III';
  const html = `<!doctype html><html><head><style>${inlineFontFaces()}
  html,body{margin:0;width:1200px;height:630px;overflow:hidden;background:#120c1a;color:#f3eefb;font-family:"Space Mono",monospace}
  .bg{position:absolute;inset:0;background:radial-gradient(600px 400px at 100% 0%,rgba(123,92,255,.4),transparent 65%)}
  .pic{position:absolute;right:-70px;top:78px;width:620px;height:390px;border-radius:18px;overflow:hidden;border:2px solid rgba(139,92,246,.45);transform:rotate(-2deg);box-shadow:0 30px 80px rgba(0,0,0,.6)}
  .pic img{width:100%;height:100%;object-fit:cover;object-position:top}
  .t{position:absolute;left:64px;top:60px;width:510px}
  .e{color:#c8f04b;font-weight:700;letter-spacing:.12em;text-transform:uppercase;font-size:17px}
  h1{font-family:"Bebas Neue",Impact,sans-serif;font-weight:400;font-size:${p.title.length > 30 ? 60 : p.title.length > 18 ? 72 : 88}px;line-height:.92;margin:18px 0 18px;text-transform:uppercase}
  p{font-family:"Inter",sans-serif;font-size:21px;line-height:1.38;color:#ddd3ee;margin:0;display:-webkit-box;-webkit-line-clamp:5;-webkit-box-orient:vertical;overflow:hidden}
  .f{position:absolute;left:64px;bottom:44px;font-size:16px;color:#bdb1d6}
  .f b{color:#c8f04b;font-weight:400}</style></head><body><div class="bg"></div><div class="pic"><img src="data:image/webp;base64,${img}"></div>
  <div class="t"><div class="e">${esc(owner)} · ${esc(vocab.kinds[p.kind])}</div><h1>${esc(p.title)}</h1><p>${esc(p.summary)}</p></div>
  <div class="f"><b>■</b> github.com/${esc(p.repo)}</div></body></html>`;
  const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
  await page.setContent(html, { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);
  await sharp(await page.screenshot()).png({ compressionLevel: 9 }).toFile(out);
  await page.close();
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const only = process.argv.slice(2);
  const browser = await chromium.launch({ executablePath: chromePath() });
  let n = 0;
  for (const p of snapshot.projects.filter(p => !only.length || only.includes(p.id))) {
    const ctxFile = `.work/context/${(p.aliases?.length && !existsSync(`.work/context/${p.repo.replace('/', '__')}.json`) ? p.aliases[0] : p.repo).replace('/', '__')}.json`;
    const ctx = JSON.parse(readFileSync(ctxFile, 'utf8'));
    const dir = join('.work/upstream', p.id);
    mkdirSync(dir, { recursive: true });
    // A favicon only matters for a published site; every project gets a share image for link previews.
    const hasSite = !!(ctx.hasPages || ctx.homepage);
    const need = { favicon: hasSite && !ctx.siteHasFavicon, share: !ctx.siteHasShareImage };
    if (need.favicon) {
      const svg = faviconSvg(p.title, p.brand);
      writeFileSync(join(dir, 'favicon.svg'), svg);
      await sharp(Buffer.from(svg)).resize(32, 32).png().toFile(join(dir, 'favicon-32.png'));
      await sharp(Buffer.from(svg)).resize(180, 180).png().toFile(join(dir, 'apple-touch-icon.png'));
    }
    if (need.share) await shareImage(browser, p, join(dir, 'og-image.png'));
    writeFileSync(join(dir, 'needs.json'), JSON.stringify({ ...need, siteEntry: ctx.siteEntry, hasPages: ctx.hasPages }, null, 2));
    n++;
  }
  await browser.close();
  console.log(`project assets prepared for ${n} projects in .work/upstream/`);
}
