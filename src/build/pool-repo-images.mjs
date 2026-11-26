// Adds existing repository images (share images, screenshots, figures) to each project's picture pool,
// converted to PNG so they can be reviewed and later optimized. Output: .work/pool/<id>/repo-<n>.png + repo-images.json
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import sharp from 'sharp';
import { fileOrNull } from '../lib/github.mjs';

const included = JSON.parse(readFileSync('.work/included.json', 'utf8'));
const SKIP = /logo|badge|icon|avatar|sprite|texture|favicon|emoji|flag|(^|\/)og-?image-?(old|bak)|thumb-\d|placeholder|\/fonts?\//i;
const out = {};
await Promise.all(included.map(async p => {
  const ctx = JSON.parse(readFileSync(`.work/context/${p.repo.replace('/', '__')}.json`, 'utf8'));
  const picks = ctx.images
    .filter(i => !SKIP.test(i.path) && (/\.svg$/i.test(i.path) ? i.size > 2500 : i.size > 15000))
    .sort((a, b) => (/og|social|share|preview|screenshot|hero|cover/i.test(b.path) - /og|social|share|preview|screenshot|hero|cover/i.test(a.path)) || b.size - a.size)
    .slice(0, 6);
  mkdirSync(`.work/pool/${p.id}`, { recursive: true });
  out[p.id] = [];
  for (const [n, img] of picks.entries()) {
    try {
      const buf = await fileOrNull(p.repo, img.path);
      if (!buf) continue;
      const svg = /\.svg$/i.test(img.path);
      // Charts and diagrams are drawn for a light page; render them at a readable width on white.
      const src = svg ? sharp(buf, { density: 200 }).resize({ width: 1600 }).flatten({ background: '#ffffff' }) : sharp(buf);
      const meta = await (svg ? sharp(await src.clone().png().toBuffer()) : src.clone()).metadata();
      if ((meta.width || 0) < 500 || (meta.height || 0) < 200) continue;
      const file = `.work/pool/${p.id}/repo-${n + 1}.png`;
      await src.resize({ width: 1440, withoutEnlargement: !svg }).png().toFile(file);
      out[p.id].push({ file, path: img.path, width: meta.width, height: meta.height });
    } catch { /* unreadable image */ }
  }
}));
writeFileSync('.work/repo-images.json', JSON.stringify(out, null, 2));
console.log('projects with ≥1 usable repo image:', Object.values(out).filter(v => v.length).length, '| total images:', Object.values(out).flat().length);
