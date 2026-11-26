// Prints the four downloads from dist/print/*.html with Chrome (PLAN D-08), then checks them.
// Fonts and pictures are local, so both are embedded and the PDFs work offline.
import { mkdirSync, existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { chromium } from 'playwright-core';
import { chromePath } from './capture.mjs';
import { startServer } from './serve.mjs';

const site = JSON.parse(readFileSync('config/site.json', 'utf8'));
const downloads = JSON.parse(readFileSync('dist/downloads.json', 'utf8'));
mkdirSync('dist/downloads', { recursive: true });
const server = await startServer('dist', 0);
const origin = `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch({ executablePath: chromePath() });
const footer = label => `<div style="width:100%;font:7.5px 'Space Mono',monospace;color:#5b4f6e;padding:0 0.65in;display:flex;justify-content:space-between"><span>${site.name} · ${label}</span><span>Page <span class="pageNumber"></span> of <span class="totalPages"></span></span></div>`;

for (const d of downloads) {
  if (!d.available) { console.log(`skip ${d.key}: unavailable`); continue; }
  const src = `print/${d.key}.html`;
  if (!existsSync(join('dist', src))) throw new Error(`missing ${src}`);
  // Lay out at the Letter page width (8.5in at 96 px/in) so fitting matches the printed result.
  const page = await browser.newPage({ viewport: { width: 816, height: 1056 } });
  await page.goto(`${origin}/${src}`, { waitUntil: 'networkidle' });
  await page.evaluate(async () => {
    await document.fonts.ready;
    await Promise.all([...document.images].map(img => img.complete ? (img.naturalWidth ? null : Promise.reject(new Error(`image failed: ${img.src}`))) : new Promise((ok, no) => { img.onload = ok; img.onerror = () => no(new Error(`image failed: ${img.src}`)); })));
  });
  if (d.key === 'portfolio') {
    await page.emulateMedia({ media: 'print' });
    await page.evaluate(() => Promise.all([...document.images].map(i => i.decode().catch(() => null))));
    const over = await page.evaluate(() => { window.fitSheets(); return [...document.querySelectorAll('.sheet.project[data-fit=overflow]')].map(s => s.dataset.project); });
    if (over.length) console.warn(`warning: still taller than one page: ${over.join(', ')}`);
  }
  const opts = d.key === 'cv'
    ? { displayHeaderFooter: true, headerTemplate: '<span></span>', footerTemplate: footer(`CV · Edition ${d.edition}`), margin: { top: '0.55in', bottom: '0.6in', left: '0.65in', right: '0.65in' } }
    : { preferCSSPageSize: true };
  await page.pdf({ path: join('dist/downloads', d.file), format: 'Letter', printBackground: true, tagged: true, outline: d.key === 'portfolio', ...opts });
  await page.close();
  console.log(`pdf: ${d.file}`);
}
await browser.close();
server.close();
