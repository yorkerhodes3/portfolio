// Proposes one pull request per source repository (PLAN D-04, D-11; BACKLOG T-023) containing:
//   portfolio.json (+ any adopted pictures in .portfolio/), and, for static sites that lack them,
//   a favicon and a 1200×630 share image with the missing <head> tags.
// It never pushes to a default branch; a maintainer reviews and merges.
//   node src/refresh/upstream-prs.mjs            dry run: writes .work/upstream/<id>/plan.json
//   node src/refresh/upstream-prs.mjs --open     creates or updates branch portfolio/metadata and the PR
import { readFileSync, readdirSync, existsSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, posix } from 'node:path';
import { gh, fileOrNull } from '../lib/github.mjs';

const OPEN = process.argv.includes('--open');
const only = process.argv.slice(2).filter(a => !a.startsWith('--'));
const BRANCH = 'portfolio/metadata';
const snapshot = JSON.parse(readFileSync('catalog/snapshot.json', 'utf8'));
const site = JSON.parse(readFileSync('config/site.json', 'utf8'));
const TRAILER = 'Co-authored-by: copilot-swe-agent[bot] <198982749+Copilot@users.noreply.github.com>';
const escAttr = s => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

// Where a site's files are deployed from, verified against each repository's Pages workflow on 2026-11-26.
// `dir` receives the favicon and share image; `html` is the page whose <head> is patched. Both are served at
// the Pages base URL, so links are relative. Legacy (branch) Pages sites are derived from their source path.
// Anything else is left for the maintainer, with the generated images committed under .portfolio/.
const LAYOUTS = {
  'bare-metal-jacket': { dir: 'site', html: 'site/index.html' },
  crowddeck: { dir: 'docs', html: 'docs/index.html' },
  dropboard: { dir: 'web', html: 'web/index.html' },
  'ethical-ai-field-guide': { dir: 'docs', html: 'docs/index.html' },
  'neocloud-supply-os': { dir: 'docs', html: 'docs/index.html' },
  'project-startup-guide': { dir: 'docs', html: 'docs/index.html' },
  'provenance-search': { dir: 'docs', html: 'docs/index.html' },
  'sovereign-agent-trust-mesh': { dir: 'site', html: 'site/index.html' },
  plumb: { dir: 'prototype', html: 'prototype/index.html' },            // workflow copies prototype/* to the site root
  turnstone: { dir: 'web', html: 'web/index.html' },                    // workflow copies web/* to the site root
  ercf: { dir: 'docs', html: 'static/index.html' },                     // workflow copies static/index.html over docs/index.html
  'colab-board': { dir: 'public', html: 'index.html' },                 // Vite copies public/ to the build root
  vango: { dir: 'public', html: 'index.html' },
  'brooklyn-bridge-3d': { dir: 'viewer/public', html: 'viewer/index.html' },
  'manhattan-bridge-3d': { dir: 'viewer/public', html: 'viewer/index.html' },
  'williamsburg-bridge-3d': { dir: 'viewer/public', html: 'viewer/index.html' },
  'dumbo-district-3d': { dir: 'viewer/public', html: 'viewer/index.html' },
};
const MANUAL = {
  'avatar-impact-stories': 'its Pages workflow copies an explicit list of files, so new images also need adding to that list',
  'reverse-stress': 'its Pages site is a build output without a public/ folder',
  'pageturn-book': 'its Pages site is assembled from several app builds',
  'race-condition-mod': 'its Pages artifact path is computed during the build',
  'evac-sim-melanie': 'docs/ is the committed build output of the Vite source',
};
const join2 = (...a) => posix.join(...a.filter(x => x && x !== '.'));

async function layoutFor(p, needs) {
  if (MANUAL[p.id]) return { note: `Site favicon/share tags not wired in: ${MANUAL[p.id]}. The images are in .portfolio/ for the maintainer.` };
  let pages;
  try { pages = await gh(`repos/${p.repo}/pages`); } catch { return { note: 'No GitHub Pages site, so the share-image URL is unknown. The images are in .portfolio/.' }; }
  const base = pages.html_url.endsWith('/') ? pages.html_url : `${pages.html_url}/`;
  if (LAYOUTS[p.id]) return { ...LAYOUTS[p.id], url: f => new URL(f, base).href };
  const entry = needs.siteEntry;
  if (pages.build_type !== 'legacy' || !entry?.endsWith('.html')) return { note: 'The Pages build is not a plain static folder. The images are in .portfolio/ for the maintainer.' };
  const root = (pages.source?.path || '/').replace(/^\/|\/$/g, '');
  const dir = posix.dirname(entry);
  if (root && dir !== root && !dir.startsWith(`${root}/`)) return { note: `${entry} is outside the published folder /${root}. The images are in .portfolio/.` };
  const served = posix.relative(root, dir === '.' ? '' : dir);
  return { dir: dir === '.' ? '' : dir, html: entry, url: f => new URL(join2(served, f), base).href };
}

async function sitePlan(p, needs) {
  if (!needs.favicon && !needs.share) return { files: [], assets: [], note: null };
  const up = join('.work/upstream', p.id);
  const assets = [];
  if (needs.favicon) assets.push(['favicon.svg', 'favicon.svg'], ['favicon-32.png', 'favicon-32.png'], ['apple-touch-icon.png', 'apple-touch-icon.png']);
  if (needs.share) assets.push(['og-image.png', 'og-image.png']);
  const layout = await layoutFor(p, needs);
  if (layout.note) return { files: assets.map(([f, src]) => [`.portfolio/${f}`, readFileSync(join(up, src))]), assets, note: layout.note };
  const html = (await fileOrNull(p.repo, layout.html))?.toString('utf8');
  if (!html || !/<\/head>/i.test(html)) return { files: assets.map(([f, src]) => [`.portfolio/${f}`, readFileSync(join(up, src))]), assets, note: `${layout.html} has no </head>. The images are in .portfolio/.` };
  const name = async f => (await fileOrNull(p.repo, join2(layout.dir, f))) ? `portfolio-${f}` : f;
  const files = [], tags = [];
  const placed = {};
  for (const [f, src] of assets) { placed[f] = await name(f); files.push([join2(layout.dir, placed[f]), readFileSync(join(up, src))]); }
  if (needs.favicon) tags.push(`<link rel="icon" href="${placed['favicon.svg']}" type="image/svg+xml">`, `<link rel="icon" href="${placed['favicon-32.png']}" sizes="32x32" type="image/png">`, `<link rel="apple-touch-icon" href="${placed['apple-touch-icon.png']}">`);
  if (needs.share) {
    const url = layout.url(placed['og-image.png']);
    const has = n => new RegExp(`(property|name)=["']${n}["']`, 'i').test(html);
    if (!has('og:title')) tags.push(`<meta property="og:title" content="${escAttr(p.title)}">`);
    if (!has('og:description')) tags.push(`<meta property="og:description" content="${escAttr(p.summary)}">`);
    if (!has('og:type')) tags.push('<meta property="og:type" content="website">');
    tags.push(`<meta property="og:image" content="${url}">`, '<meta property="og:image:width" content="1200">', '<meta property="og:image:height" content="630">', `<meta property="og:image:alt" content="${escAttr(`${p.title}: ${p.summary}`)}">`);
    if (!has('twitter:card')) tags.push('<meta name="twitter:card" content="summary_large_image">');
    if (!has('twitter:image')) tags.push(`<meta name="twitter:image" content="${url}">`);
  }
  const patched = html.replace(/<\/head>/i, `<!-- Favicon and share preview (portfolio metadata) -->\n${tags.join('\n')}\n</head>`);
  files.push([layout.html, Buffer.from(patched)]);
  return { files, assets, note: null };
}

async function commitFiles(repo, files, message) {
  const r = await gh(`repos/${repo}`);
  const head = await gh(`repos/${repo}/git/ref/heads/${encodeURIComponent(r.default_branch)}`);
  const baseCommit = await gh(`repos/${repo}/git/commits/${head.object.sha}`);
  const tree = [];
  for (const [path, buf] of files) {
    const blob = await gh(`repos/${repo}/git/blobs`, { method: 'POST', body: { content: buf.toString('base64'), encoding: 'base64' } });
    tree.push({ path, mode: '100644', type: 'blob', sha: blob.sha });
  }
  const newTree = await gh(`repos/${repo}/git/trees`, { method: 'POST', body: { base_tree: baseCommit.tree.sha, tree } });
  const commit = await gh(`repos/${repo}/git/commits`, { method: 'POST', body: { message, tree: newTree.sha, parents: [head.object.sha] } });
  try { await gh(`repos/${repo}/git/refs/heads/${BRANCH}`, { method: 'PATCH', body: { sha: commit.sha, force: true } }); }
  catch { await gh(`repos/${repo}/git/refs`, { method: 'POST', body: { ref: `refs/heads/${BRANCH}`, sha: commit.sha } }); }
  return r.default_branch;
}

const results = [];
for (const p of snapshot.projects.filter(p => !only.length || only.includes(p.id))) {
  const draftDir = join('catalog/projects', p.id);
  const needs = existsSync(join('.work/upstream', p.id, 'needs.json')) ? JSON.parse(readFileSync(join('.work/upstream', p.id, 'needs.json'), 'utf8')) : { favicon: false, share: false };
  const files = [];
  if (p.source === 'draft') {
    files.push(['portfolio.json', readFileSync(join(draftDir, 'portfolio.json'))]);
    const media = join(draftDir, '.portfolio');
    if (existsSync(media)) for (const f of readdirSync(media)) files.push([`.portfolio/${f}`, readFileSync(join(media, f))]);
  }
  const sitePart = await sitePlan(p, needs);
  files.push(...sitePart.files);
  const plan = { id: p.id, repo: p.repo, files: files.map(f => f[0]), wired: !sitePart.note && sitePart.assets.length > 0, note: sitePart.note };
  mkdirSync(join('.work/upstream', p.id), { recursive: true });
  writeFileSync(join('.work/upstream', p.id, 'plan.json'), JSON.stringify(plan, null, 2));
  if (!files.length) { results.push({ ...plan, status: 'nothing to propose' }); continue; }
  if (!OPEN) { results.push({ ...plan, status: 'dry run' }); continue; }
  const changed = [needs.favicon && 'favicon', needs.share && 'share preview'].filter(Boolean);
  const message = `Add portfolio metadata${changed.length ? ` and ${changed.join(' and ')}` : ''}\n\nportfolio.json describes this project for ${site.siteUrl}; tags in it drive the portfolio's filters.\n\n${TRAILER}`;
  try {
    const base = await commitFiles(p.repo, files, message);
    const existing = await gh(`repos/${p.repo}/pulls?state=open&head=${p.repo.split('/')[0]}:${encodeURIComponent(BRANCH)}`);
    const body = `This adds **\`portfolio.json\`**, the record that describes this project in [Yorke Rhodes's portfolio](${site.siteUrl}p/${p.id}/)${files.some(f => f[0].startsWith('.portfolio/')) ? ', plus the pictures it uses in `.portfolio/`' : ''}.${changed.length ? (plan.wired ? ` It also adds a ${changed.join(' and a ')} for this project's site, with the matching \`<head>\` tags.` : ` It also adds a generated ${changed.join(' and ')} in \`.portfolio/\`.`) : ''}\n\n- Edit \`methodTags\` / \`domainTags\` to change how the project is filtered; valid tags are listed in [catalog/tags.json](https://github.com/yorkerhodes3/portfolio/blob/main/catalog/tags.json).\n- Credits and roles come from the commit history and README. Please correct anything inaccurate before merging.\n- The portfolio reads this file on its next refresh. Nothing here changes how the project runs.\n${needs.share ? `\nOptional: upload the share image (${plan.wired ? files.find(f => /og-image\.png$/.test(f[0]))[0] : '.portfolio/og-image.png'}) under **Settings → General → Social preview** so GitHub links show it too.\n` : ''}${sitePart.note ? `\nNot included: ${sitePart.note}\n` : ''}`;
    const pr = existing[0] || await gh(`repos/${p.repo}/pulls`, { method: 'POST', body: { title: `Add portfolio metadata${changed.length ? `, ${changed.join(' and ')}` : ''}`, head: BRANCH, base, body } });
    results.push({ ...plan, status: existing[0] ? 'updated' : 'opened', pr: pr.html_url });
  } catch (err) {
    results.push({ ...plan, status: `failed: ${err.message}` });
  }
}
writeFileSync('.work/upstream-results.json', JSON.stringify(results, null, 2));
const tally = results.reduce((t, r) => (t[r.status.split(':')[0]] = (t[r.status.split(':')[0]] || 0) + 1, t), {});
console.log('upstream:', tally);
