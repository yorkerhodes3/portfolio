// Renders the portfolio's own favicon and share image into src/site/brand/ (committed).
// Usage: node src/build/brand-assets.mjs
import { mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import sharp from 'sharp';
import { chromium } from 'playwright-core';
import { chromePath } from './capture.mjs';
import { inlineFontFaces } from '../lib/fonts.mjs';

const site = JSON.parse(readFileSync('config/site.json', 'utf8'));
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
mkdirSync('src/site/brand', { recursive: true });

// Monogram: lime "YR" on the plum ground, legible at 16 px.
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="#120c1a"/><rect x="3" y="3" width="58" height="58" rx="11" fill="none" stroke="#7b5cff" stroke-width="2"/><path d="M12 15h8l6 12 6-12h8L30 33v16h-8V33z" fill="#c8f04b"/><path d="M38 49V15h9a9 9 0 0 1 2 17.8L55 49h-8l-5-15h-1v15zM42 21v8h4a4 4 0 0 0 0-8z" fill="#f3eefb"/></svg>`;
writeFileSync('src/site/brand/favicon.svg', svg);
await sharp(Buffer.from(svg)).resize(32, 32).png().toFile('src/site/brand/favicon-32.png');
await sharp(Buffer.from(svg)).resize(180, 180).flatten({ background: '#120c1a' }).png().toFile('src/site/brand/apple-touch-icon.png');

export async function renderShareImage({ eyebrow, title, line, foot, out, brand = {} }) {
  const bg = brand.bg || '#120c1a', fg = brand.fg || '#f3eefb', accent = brand.accent || '#c8f04b';
  const html = `<!doctype html><html><head><style>${inlineFontFaces()}
  html,body{margin:0;width:1200px;height:630px;overflow:hidden;background:${bg};color:${fg};font-family:"Space Mono",monospace}
  .g{position:absolute;inset:0;background:radial-gradient(700px 420px at 92% 0%,rgba(123,92,255,.45),transparent 65%),radial-gradient(600px 400px at 0% 100%,rgba(184,212,0,.16),transparent 60%)}
  .grid{position:absolute;inset:0;background-image:linear-gradient(rgba(123,92,255,.10) 1px,transparent 1px),linear-gradient(90deg,rgba(123,92,255,.10) 1px,transparent 1px);background-size:40px 40px}
  .c{position:absolute;inset:64px 72px}
  .e{color:${accent};font-weight:700;letter-spacing:.14em;text-transform:uppercase;font-size:20px}
  h1{font-family:"Bebas Neue",Impact,sans-serif;font-weight:400;font-size:${title.length > 22 ? 96 : 118}px;line-height:.9;margin:22px 0 24px;text-transform:uppercase;letter-spacing:.01em}
  p{font-family:"Bebas Neue",Impact,sans-serif;font-size:40px;line-height:1.04;text-transform:uppercase;color:${accent};max-width:960px;margin:0}
  .f{position:absolute;left:0;bottom:0;font-size:18px;opacity:.8}</style></head>
  <body><div class="g"></div><div class="grid"></div><div class="c"><div class="e">${esc(eyebrow)}</div><h1>${esc(title)}</h1><p>${esc(line)}</p><div class="f">${esc(foot)}</div></div></body></html>`;
  const browser = await chromium.launch({ executablePath: chromePath() });
  const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
  await page.setContent(html, { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);
  const png = await page.screenshot();
  await browser.close();
  await sharp(png).png({ compressionLevel: 9, palette: true, quality: 90 }).toFile(out);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  await renderShareImage({ eyebrow: 'Portfolio · work since January 2026', title: site.name, line: site.bioLine, foot: 'AI · agentic workloads · commerce · blockchain · decision models · edge hardware', out: 'src/site/brand/og.png' });
  console.log('brand assets written to src/site/brand/');
}
