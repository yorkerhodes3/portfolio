// The repository refresh function (SPECIFICATION FR-01, FR-10, FR-11).
// Rereads every candidate's portfolio.json, validates it, mirrors its pictures, checks demo links and
// writes catalog/snapshot.json, catalog/inventory.json, catalog/checks.json and catalog/refresh-report.md.
// Nothing is published until the resulting changes are reviewed and merged (PLAN D-05).
//
//   npm run refresh                  full refresh from GitHub
//   npm run refresh -- --offline     rebuild from drafts and the last snapshot only
//   npm run refresh -- --no-links    skip demo link checks (e.g. where *.github.io is unreachable)
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join, dirname, normalize } from 'node:path';
import sharp from 'sharp';
import { gh, listOwnerRepos, fileOrNull, pagesUrl } from '../lib/github.mjs';
import { validateRecord } from '../lib/validate.mjs';
import { OWNERS, CUTOFF } from './config.mjs';

const args = new Set(process.argv.slice(2));
const OFFLINE = args.has('--offline');
const LINKS = !args.has('--no-links') && !OFFLINE;
const today = new Date().toISOString().slice(0, 10);
const readJson = (p, fallback) => existsSync(p) ? JSON.parse(readFileSync(p, 'utf8')) : fallback;
const writeJson = (p, v) => {
  const text = JSON.stringify(v, null, 2) + '\n';
  if (!existsSync(p) || readFileSync(p, 'utf8') !== text) writeFileSync(p, text);
};
const sha = s => createHash('sha256').update(s.toLowerCase()).digest('hex');
export const idFor = name => name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const dispositions = readJson('catalog/dispositions.json', { excluded: {}, duplicates: {}, withdrawn: {} });
const hidden = new Set(readJson('catalog/exclusions.json', { sha256: [] }).sha256);
const previous = readJson('catalog/snapshot.json', { projects: [] });
const prevById = new Map(previous.projects.map(p => [p.id, p]));
const checks = readJson('catalog/checks.json', { demos: {} });
const lower = o => Object.fromEntries(Object.entries(o || {}).map(([k, v]) => [k.toLowerCase(), v]));
const excluded = lower(dispositions.excluded), duplicates = lower(dispositions.duplicates), withdrawn = lower(dispositions.withdrawn);

// Drafts: records awaiting adoption by their source repository (PLAN D-04).
const drafts = new Map();
const draftErrors = new Map(); // directory name (= project id) → problem
for (const dir of existsSync('catalog/projects') ? readdirSync('catalog/projects') : []) {
  const p = join('catalog/projects', dir, 'portfolio.json');
  if (!existsSync(p)) continue;
  try {
    const r = JSON.parse(readFileSync(p, 'utf8'));
    if (typeof r.repo !== 'string') throw new Error('missing "repo"');
    drafts.set(r.repo.toLowerCase(), { record: r, dir: join('catalog/projects', dir) });
  } catch (err) { draftErrors.set(dir, `catalog/projects/${dir}/portfolio.json cannot be read: ${err.message}`); }
}

// Previously approved projects by repository (canonical or alias), and which repository owns each id.
const prevByRepo = new Map();
for (const p of previous.projects) for (const r of [p.repo, ...(p.aliases || [])]) prevByRepo.set(r.toLowerCase(), p);
const isHttp = u => typeof u === 'string' && /^https?:\/\//i.test(u);

// 1. Discover candidates.
const warnings = [];
let candidates = [];
let hiddenCount = 0;
const failedOwners = new Set();
if (OFFLINE) {
  candidates = readJson('catalog/inventory.json', { candidates: [] }).candidates.map(c => ({ full_name: c.repo, offline: true, default_branch: c.branch || 'main', has_pages: !!c.pages, homepage: c.homepage || '' }));
  warnings.push('Offline run: repository listings and upstream records were not reread.');
} else {
  for (const owner of OWNERS) {
    try { candidates.push(...(await listOwnerRepos(owner)).filter(r => r.pushed_at >= CUTOFF || r.created_at >= CUTOFF)); }
    catch (err) { failedOwners.add(owner.toLowerCase()); warnings.push(`Incomplete listing for ${owner}: ${err.message}. Its approved projects are kept unchanged; coverage cannot be called complete.`); }
  }
}
candidates = candidates.filter(r => hidden.has(sha(r.full_name)) ? (hiddenCount++, false) : true);

// 2. Resolve, validate and mirror each candidate.
const inventory = [];
const projects = [];
const report = { new: [], changed: [], unchanged: [], blocked: [], withdrawn: [], pending: [], awaiting: [] };

async function readImage(src, { repo, sha: ref, dir, source }) {
  if (/^https:\/\//.test(src)) { const r = await fetch(src); if (!r.ok) throw new Error(`${r.status} for ${src}`); return Buffer.from(await r.arrayBuffer()); }
  const rel = normalize(src).replace(/^(\.\.(\/|$))+/, '');
  if (source === 'draft' && existsSync(join(dir, rel))) return readFileSync(join(dir, rel));
  if (OFFLINE) throw new Error(`offline: cannot read ${src} from ${repo}`);
  const buf = await fileOrNull(repo, rel, ref);
  if (!buf) throw new Error(`${src} not found in ${repo}`);
  return buf;
}

// Reads and encodes all three pictures before writing any, so a failure never leaves media half-replaced.
async function mirror(record, ctx) {
  const media = {}, writes = [];
  for (const img of record.images) {
    const buf = await readImage(img.src, ctx);
    const base = join('media', record.id, img.id);
    const full = await sharp(buf, { animated: false }).resize({ width: 1600, withoutEnlargement: true }).webp({ quality: 78 }).toBuffer();
    const thumb = await sharp(buf, { animated: false }).resize({ width: 640, withoutEnlargement: true }).webp({ quality: 72 }).toBuffer();
    writes.push([`${base}.webp`, full], [`${base}-640.webp`, thumb]);
    const meta = await sharp(full).metadata();
    media[img.id] = { full: `media/${record.id}/${img.id}.webp`, thumb: `media/${record.id}/${img.id}-640.webp`, width: meta.width, height: meta.height };
  }
  return { media, commit: () => { mkdirSync(join('media', record.id), { recursive: true }); for (const [p, b] of writes) if (!existsSync(p) || !readFileSync(p).equals(b)) writeFileSync(p, b); } };
}

for (const r of candidates.sort((a, b) => a.full_name.localeCompare(b.full_name))) {
  const repo = r.full_name, key = repo.toLowerCase();
  const entry = { repo, id: idFor(repo.split('/')[1]) };
  if (excluded[key]) { inventory.push({ ...entry, disposition: 'excluded', reason: excluded[key] }); continue; }
  if (duplicates[key]) { inventory.push({ ...entry, disposition: 'duplicate', reason: `Same project as ${duplicates[key]}.` }); continue; }

  const prev = prevByRepo.get(key);
  let record, source, ref, problems = [], dir;
  const draftError = draftErrors.get(prev?.id) || draftErrors.get(entry.id);
  if (draftError) problems.push(draftError);
  try {
    const upstream = OFFLINE ? null : await fileOrNull(repo, 'portfolio.json');
    if (upstream) {
      source = 'upstream';
      ref = (await gh(`repos/${repo}/commits/${r.default_branch}`)).sha;
      try { record = JSON.parse(upstream.toString('utf8')); } catch (err) { problems.push(`portfolio.json is not valid JSON: ${err.message}`); }
    } else if (drafts.get(key)) {
      source = 'draft'; record = drafts.get(key).record; dir = drafts.get(key).dir;
    }
  } catch (err) {
    problems.push(`could not read the repository: ${err.message}`);
  }
  if (!record && !problems.length) {
    if (prev && !withdrawn[key] && !withdrawn[prev.id]) {
      // An approved project only leaves the catalog by an explicit withdrawal, never because a file went missing.
      report.blocked.push({ repo, problems: [OFFLINE ? 'offline: the record lives in the repository and was not reread' : 'no portfolio.json found in the repository or catalog/projects'], kept: true });
      projects.push(prev);
      inventory.push({ ...entry, id: prev.id, disposition: 'included', reason: 'Last approved version kept; no record found this run.' });
      continue;
    }
    inventory.push({ ...entry, disposition: 'awaiting confirmation', reason: 'No portfolio.json yet.' });
    report.awaiting.push(repo);
    continue;
  }
  if (record) problems.push(...validateRecord(record, { repo }));
  const id = record?.id || prev?.id || entry.id;
  if (withdrawn[key] || withdrawn[id]) { inventory.push({ ...entry, id, disposition: 'withdrawn', reason: 'Withdrawn by the owner.' }); if (prevById.has(id)) report.withdrawn.push(id); continue; }
  const owner = prevById.get(id);
  if (owner && owner !== prev) problems.push(`id "${id}" belongs to ${owner.repo}`);
  else if (projects.some(p => p.id === id)) problems.push(`id "${id}" is already used by another project`);
  if (prev && record && record.id !== prev.id) problems.push(`id changed from "${prev.id}" to "${record.id}"; ids are stable`);
  if (record?.links && !isHttp(record.links.source)) problems.push('/links/source must be an http(s) URL');

  let media;
  if (!problems.length) {
    try { const m = await mirror(record, { repo, sha: ref, dir, source }); m.commit(); media = m.media; }
    catch (err) { problems.push(`picture could not be read: ${err.message}`); }
  }
  if (problems.length) {
    const keep = prev && !projects.some(p => p.id === prev.id);
    report.blocked.push({ repo, problems, kept: !!keep });
    if (keep) projects.push(prev);
    inventory.push({ ...entry, id, disposition: prev ? 'included' : 'awaiting confirmation', reason: prev ? 'Last approved version kept; latest revision is invalid.' : 'Record is invalid.', source });
    continue;
  }
  const demo = record.links.demo || (r.has_pages ? pagesUrl(repo) : (isHttp(r.homepage) ? r.homepage : undefined));
  const project = { ...record, links: { ...record.links, ...(demo ? { demo } : {}) }, source, ...(ref ? { sourceCommit: ref } : prev?.sourceCommit ? { sourceCommit: prev.sourceCommit } : {}), media };
  if (source === 'draft') report.pending.push(id);
  if (!prev) report.new.push(id);
  else if (JSON.stringify(stripVolatile(prev)) !== JSON.stringify(stripVolatile(project))) report.changed.push(id);
  else report.unchanged.push(id);
  projects.push(project);
  inventory.push({ ...entry, id, disposition: 'included', source, ...(r.has_pages ? { pages: true } : {}), ...(r.homepage ? { homepage: r.homepage } : {}), branch: r.default_branch });
}
function stripVolatile(p) { const { sourceCommit, ...rest } = p; return rest; }

// Withdrawals apply even when the source cannot be reached.
for (const [key] of Object.entries(withdrawn)) {
  const gone = previous.projects.find(p => p.repo.toLowerCase() === key || p.id === key);
  if (gone && !report.withdrawn.includes(gone.id)) report.withdrawn.push(gone.id);
}
// A failed owner listing keeps that owner's approved projects unchanged.
for (const p of previous.projects) {
  if (!failedOwners.has(p.repo.split('/')[0].toLowerCase()) || projects.some(x => x.id === p.id)) continue;
  projects.push(p);
  report.blocked.push({ repo: p.repo, problems: ['owner listing failed'], kept: true });
}
const kept = projects.filter(p => !report.withdrawn.includes(p.id)).sort((a, b) => a.id.localeCompare(b.id));

// 3. Demo link checks, kept apart from content so unchanged reruns produce no content diff.
if (LINKS) {
  await Promise.all(kept.filter(p => p.links.demo).map(async p => {
    const prior = checks.demos[p.id] || {};
    let status, http;
    try {
      const res = await fetch(p.links.demo, { redirect: 'follow', signal: AbortSignal.timeout(15000) });
      http = res.status; status = res.ok ? 'ok' : 'failed';
    } catch (err) { status = 'unreachable'; }
    if (status === 'unreachable') { checks.demos[p.id] = { ...prior, url: p.links.demo, lastAttempt: today, lastAttemptResult: 'network unreachable from the refresh machine' }; return; }
    checks.demos[p.id] = { url: p.links.demo, status, http, checked: today, ...(status === 'ok' ? { lastOk: today } : prior.lastOk ? { lastOk: prior.lastOk } : {}), failures: status === 'ok' ? 0 : (prior.failures || 0) + 1 };
  }));
}
for (const id of Object.keys(checks.demos)) if (!kept.some(p => p.id === id)) delete checks.demos[id];

// 4. Derived counts (FR-02): distinct projects, overlapping tags are not additive.
const count = (fn) => kept.reduce((m, p) => { for (const k of [].concat(fn(p))) m[k] = (m[k] || 0) + 1; return m; }, {});
const counts = {
  projects: kept.length,
  withDemo: kept.filter(p => p.links.demo).length,
  byOwner: count(p => p.repo.split('/')[0]),
  byMonth: count(p => p.contribution.date.slice(0, 7)),
  byKind: count(p => p.kind), byRole: count(p => p.contribution.role), byEvidence: count(p => p.evidence.level),
  byMethod: count(p => p.methodTags), byDomain: count(p => p.domainTags),
};
const contentChanged = report.new.length || report.changed.length || report.withdrawn.length || kept.length !== previous.projects.length;
const snapshot = { schemaVersion: 1, inventoryDate: contentChanged || !previous.inventoryDate ? today : previous.inventoryDate, cutoff: CUTOFF, owners: OWNERS, complete: !warnings.some(w => w.startsWith('Incomplete')), counts, projects: kept };

writeJson('catalog/snapshot.json', snapshot);
writeJson('catalog/inventory.json', { $comment: 'Every candidate and its disposition. Public: reasons are neutral.', privateExclusions: hiddenCount, candidates: inventory });
writeJson('catalog/checks.json', checks);

const list = (xs) => xs.length ? xs.map(x => `- ${typeof x === 'string' ? x : `**${x.repo}**${x.kept ? ' (last approved version kept)' : ''}: ${x.problems.join('; ')}`}`).join('\n') : '- none';
const demoLines = kept.filter(p => p.links.demo).map(p => { const c = checks.demos[p.id]; return `| ${p.id} | ${c?.status || 'not checked'} | ${c?.checked || '—'} | ${c?.lastAttemptResult && c.lastAttempt > (c.checked || '') ? `${c.lastAttempt}: ${c.lastAttemptResult}` : ''} |`; });
const md = `# Refresh report

Run ${today}${OFFLINE ? ' (offline)' : ''}. Review this with the snapshot diff; merging the PR publishes it.

| Included | New | Changed | Unchanged | Blocked | Withdrawn | Awaiting a record | Pending upstream adoption | Private exclusions |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| ${kept.length} | ${report.new.length} | ${report.changed.length} | ${report.unchanged.length} | ${report.blocked.length} | ${report.withdrawn.length} | ${report.awaiting.length} | ${report.pending.length} | ${hiddenCount} |

${warnings.length ? `## Warnings\n\n${warnings.map(w => `- ${w}`).join('\n')}\n\n` : ''}## New\n\n${list(report.new)}\n\n## Changed\n\n${list(report.changed)}\n\n## Blocked\n\n${list(report.blocked)}\n\n## Withdrawn\n\n${list(report.withdrawn)}\n\n## Awaiting a record\n\n${list(report.awaiting)}\n\n## Pending upstream adoption (read from catalog/projects)\n\n${list(report.pending)}\n\n## Demo checks\n\n| Project | Status | Checked | Last attempt |\n| --- | --- | --- | --- |\n${demoLines.join('\n')}\n`;
writeFileSync('catalog/refresh-report.md', md);
console.log(`refresh: ${kept.length} included · ${report.new.length} new · ${report.changed.length} changed · ${report.blocked.length} blocked · ${report.awaiting.length} awaiting · ${report.withdrawn.length} withdrawn${warnings.length ? ` · ${warnings.length} warning(s)` : ''}`);
if (report.blocked.length) process.exitCode = 0;
