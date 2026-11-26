// Checks the four PDFs (SPECIFICATION FR-08, FR-09, FR-12): every published project once with its
// default picture, selectable text in reading order, career facts present, distinct files, size ceiling.
import { readFileSync, existsSync, statSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { getDocument, OPS } from 'pdfjs-dist/legacy/build/pdf.mjs';

const snapshot = JSON.parse(readFileSync('catalog/snapshot.json', 'utf8'));
const career = existsSync('career/career.json') ? JSON.parse(readFileSync('career/career.json', 'utf8')) : null;
const downloads = JSON.parse(readFileSync('dist/downloads.json', 'utf8'));
const norm = s => s.replace(/\s+/g, ' ').replace(/[‐‑–—]/g, '-').trim();
const failures = [];
const fail = m => failures.push(m);

async function load(file) {
  const data = new Uint8Array(readFileSync(file));
  const doc = await getDocument({ data, disableFontFace: true, useSystemFonts: false, verbosity: 0 }).promise;
  const pages = [];
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const text = norm((await page.getTextContent()).items.map(it => it.str + (it.hasEOL ? ' ' : '')).join(''));
    const ops = await page.getOperatorList();
    pages.push({ text, flat: text.replace(/\s+/g, ''), images: ops.fnArray.filter(f => f === OPS.paintImageXObject || f === OPS.paintInlineImageXObject).length });
  }
  return { pages, text: pages.map(p => p.text).join(' ') };
}

const hashes = new Map();
for (const d of downloads) {
  const file = `dist/downloads/${d.file}`;
  if (!d.available) continue;
  if (!existsSync(file)) { fail(`${d.file} is missing`); continue; }
  const buf = readFileSync(file);
  const h = createHash('sha256').update(buf).digest('hex');
  if (hashes.has(h)) fail(`${d.file} is identical to ${hashes.get(h)}`); else hashes.set(h, d.file);
  const mb = statSync(file).size / 1e6;
  const { pages, text } = await load(file);
  if (!text.length) fail(`${d.file} has no selectable text`);

  if (d.key === 'portfolio') {
    if (mb > 20) fail(`${d.file} is ${mb.toFixed(1)} MB; the ceiling is 20 MB`);
    const projectPages = pages.filter(p => p.flat.includes('Portfoliopage:'));
    if (projectPages.length !== snapshot.projects.length) fail(`${d.file}: ${projectPages.length} project pages for ${snapshot.projects.length} projects`);
    for (const p of snapshot.projects) {
      const url = `p/${p.id}/`;
      const hits = projectPages.filter(pg => pg.flat.includes(`portfolio/${url}`));
      if (hits.length !== 1) fail(`${d.file}: project ${p.id} appears on ${hits.length} pages`);
      else {
        // A sheet that could not be fitted flows onto a second page; its picture is then on the page before the links.
        const at = pages.indexOf(hits[0]);
        const start = at > 0 && !pages[at - 1].flat.includes('Portfoliopage:') && pages[at - 1].flat.includes(p.title.replace(/\s+/g, '').toUpperCase().slice(0, 12)) ? at - 1 : at;
        if (!pages[start].images) fail(`${d.file}: project ${p.id} has no embedded picture`);
      }
    }
  }
  if (d.key === 'cv' && career) {
    for (const org of career.experience) for (const r of org.roles) if (!text.includes(norm(r.title))) fail(`${d.file}: missing role "${r.title}"`);
    const order = ['Profile', 'Experience', 'Selected systems', 'Education'].map(s => text.indexOf(norm(s).toUpperCase()) >= 0 ? text.indexOf(norm(s).toUpperCase()) : text.indexOf(norm(s)));
    if (order.some(i => i < 0) || order.some((v, i) => i && v < order[i - 1])) fail(`${d.file}: sections are missing or out of reading order`);
    for (const e of career.education) if (!text.includes(norm(e.degree))) fail(`${d.file}: missing education`);
  }
  if (d.key === 'full-bio' && career) {
    if (pages.length !== 1) fail(`${d.file} is ${pages.length} pages; at most one`);
    for (const para of career.fullBio) if (!text.includes(norm(para).slice(0, 60))) fail(`${d.file}: a paragraph is missing or out of order`);
  }
  if (d.key === 'speaker-bio' && career) {
    if (pages.length !== 1) fail(`${d.file} is ${pages.length} pages`);
    if (!text.includes(norm(career.speakerBio).slice(0, 80))) fail(`${d.file}: speaker text missing`);
  }
  console.log(`check: ${d.file} · ${pages.length} pages · ${mb.toFixed(2)} MB`);
}
if (failures.length) { console.error(`PDF check failed:\n- ${failures.join('\n- ')}`); process.exitCode = 1; }
else console.log('PDF check passed');
