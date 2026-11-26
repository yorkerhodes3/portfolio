// Helpers used while drafting records.
//   node src/build/draft-media.mjs adopt <id> <pool-file> <imageId>
//       Converts a pool picture to WebP at catalog/projects/<id>/.portfolio/<imageId>.webp and prints its src.
//   node src/build/draft-media.mjs excerpt <id> <imageId> "<eyebrow>" "<heading>" "<excerpt>"
//       Renders a labeled document-excerpt card (for research without screenshots); quote the source text verbatim.
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import sharp from 'sharp';
import { chromium } from 'playwright-core';
import { chromePath } from './capture.mjs';
import { inlineFontFaces } from '../lib/fonts.mjs';

const [cmd, id, ...rest] = process.argv.slice(2);
const dir = join('catalog/projects', id, '.portfolio');
mkdirSync(dir, { recursive: true });
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

if (cmd === 'adopt') {
  const [pool, imageId] = rest;
  await sharp(pool).resize({ width: 1600, withoutEnlargement: true }).webp({ quality: 80 }).toFile(join(dir, `${imageId}.webp`));
  console.log(`.portfolio/${imageId}.webp`);
} else if (cmd === 'excerpt') {
  const [imageId, eyebrow, heading, excerpt] = rest;
  const html = `<!doctype html><html><head><style>
    ${inlineFontFaces()}
    html,body{margin:0;width:1600px;height:900px;background:#120c1a;color:#f3eefb;font-family:"Inter",sans-serif}
    .card{position:absolute;inset:70px 90px;border:1px solid rgba(139,92,246,.35);border-radius:22px;padding:70px 80px;background:linear-gradient(160deg,#201630,#1b1226 60%,#120c1a);box-sizing:border-box;overflow:hidden}
    .grid{position:absolute;inset:0;background-image:linear-gradient(rgba(123,92,255,.08) 1px,transparent 1px),linear-gradient(90deg,rgba(123,92,255,.08) 1px,transparent 1px);background-size:48px 48px}
    .eyebrow{position:relative;font-family:"Space Mono",monospace;color:#c8f04b;letter-spacing:.12em;text-transform:uppercase;font-size:24px}
    h1{position:relative;font-family:"Bebas Neue",Impact,sans-serif;font-weight:400;font-size:96px;line-height:.95;margin:28px 0 34px;letter-spacing:.01em}
    p{position:relative;font-size:34px;line-height:1.45;color:#ddd3ee;margin:0;max-width:1250px;border-left:6px solid #c8f04b;padding-left:34px}
    .tag{position:absolute;right:70px;bottom:50px;font-family:"Space Mono",monospace;font-size:20px;color:#a99bc4}
  </style></head><body><div class="card"><div class="grid"></div><div class="eyebrow">${esc(eyebrow)}</div><h1>${esc(heading)}</h1><p>${esc(excerpt)}</p><div class="tag">Document excerpt</div></div></body></html>`;
  const browser = await chromium.launch({ executablePath: chromePath() });
  const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
  await page.setContent(html, { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);
  const png = await page.screenshot();
  await browser.close();
  await sharp(png).webp({ quality: 82 }).toFile(join(dir, `${imageId}.webp`));
  console.log(`.portfolio/${imageId}.webp`);
} else {
  console.error('usage: adopt <id> <pool-file> <imageId> | excerpt <id> <imageId> <eyebrow> <heading> <excerpt>');
  process.exitCode = 2;
}
