import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, cpSync, existsSync, readdirSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import sharp from 'sharp';
import { validateRecord } from '../src/lib/validate.mjs';
import { roleFor } from '../src/refresh/roles.mjs';

const ROOT = resolve(import.meta.dirname, '..');
const record = (over = {}) => ({
  schemaVersion: 1, id: 'alpha', title: 'Alpha', repo: 'yorkerhodes3/alpha', summary: 'A test project used to check the refresh rules.',
  kind: 'tool', methodTags: ['applied-ai', 'decision-models'], domainTags: ['global-affairs'],
  contribution: { date: '2026-03-01', role: 'built', credits: [] },
  narrative: { problem: 'A problem statement that is long enough to pass.', decision: 'A decision that mattered here.', tradeoff: 'What the decision costs us.', limitation: 'What is not yet done or known.' },
  evidence: { level: 'working-demo', links: [{ label: 'README', url: 'https://github.com/yorkerhodes3/alpha#readme', date: '2026-03-01' }] },
  links: { source: 'https://github.com/yorkerhodes3/alpha' },
  images: [1, 2, 3].map(n => ({ id: `i${n}`, src: `.portfolio/i${n}.png`, alt: `Picture number ${n} of alpha`, caption: `Caption ${n}`, credit: 'Test fixture' })),
  defaultImageId: 'i2',
  ...over,
});

test('a valid record passes and vocabulary, image and date rules are enforced', () => {
  assert.deepEqual(validateRecord(record()), []);
  assert.match(validateRecord(record({ methodTags: ['quantum'] })).join(), /unknown tag "quantum"/);
  assert.match(validateRecord(record({ defaultImageId: 'nope' })).join(), /defaultImageId/);
  const same = record(); same.images[2].src = same.images[0].src;
  assert.match(validateRecord(same).join(), /three different pictures/);
  assert.match(validateRecord(record({ contribution: { date: '2025-12-31', role: 'built', credits: [] } })).join(), /cutoff/);
  assert.match(validateRecord(record(), { repo: 'yorkerhodes3/other' }).join(), /does not match/);
  assert.ok(validateRecord({ ...record(), images: record().images.slice(0, 2) }).length, 'exactly three images');
  const js = 'javascript:alert(document.domain)';
  assert.ok(validateRecord(record({ links: { source: 'https://github.com/yorkerhodes3/alpha', demo: js } })).length, 'javascript: demo link rejected');
  assert.ok(validateRecord(record({ evidence: { level: 'design', links: [{ label: 'x', url: js, date: '2026-03-01' }] } })).length, 'javascript: evidence link rejected');
});

test('roles follow commit history: only others → Advisor/Prof, ≥80% Yorke → built, otherwise co-built', () => {
  assert.equal(roleFor(new Map([['student', 30]])), 'advisor-prof');
  assert.equal(roleFor(new Map([['yorke', 9], ['upstream', 2]])), 'built');
  assert.equal(roleFor(new Map([['yorke', 27], ['student', 71]])), 'co-built');
  assert.equal(roleFor(new Map()), 'advisor-prof');
});

// Offline refresh fixtures: drafts with local pictures, run in a temporary working directory.
async function fixture() {
  const dir = mkdtempSync(join(tmpdir(), 'refresh-'));
  for (const d of ['catalog/projects', 'src']) mkdirSync(join(dir, d), { recursive: true });
  cpSync(join(ROOT, 'src'), join(dir, 'src'), { recursive: true });
  cpSync(join(ROOT, 'catalog/schema'), join(dir, 'catalog/schema'), { recursive: true });
  cpSync(join(ROOT, 'catalog/tags.json'), join(dir, 'catalog/tags.json'));
  try { execFileSync('ln', ['-s', join(ROOT, 'node_modules'), join(dir, 'node_modules')]); } catch { /* exists */ }
  const hidden = 'yorkerhodes3/secret-thing';
  writeFileSync(join(dir, 'catalog/exclusions.json'), JSON.stringify({ sha256: [createHash('sha256').update(hidden).digest('hex')] }));
  writeFileSync(join(dir, 'catalog/dispositions.json'), JSON.stringify({ excluded: { 'yorkerhodes3/portfolio': 'This portfolio.' }, duplicates: {}, withdrawn: {} }));
  writeFileSync(join(dir, 'catalog/inventory.json'), JSON.stringify({ candidates: ['yorkerhodes3/alpha', 'yorkerhodes3/beta', 'yorkerhodes3/portfolio', hidden].map(repo => ({ repo })) }));
  for (const [id, tags] of [['alpha', ['applied-ai', 'decision-models']], ['beta', ['applied-ai']]]) {
    const d = join(dir, 'catalog/projects', id, '.portfolio');
    mkdirSync(d, { recursive: true });
    for (const n of [1, 2, 3]) await sharp({ create: { width: 800, height: 450, channels: 3, background: { r: 20 * n, g: 12, b: 26 } } }).png().toFile(join(d, `i${n}.png`));
    writeFileSync(join(dir, 'catalog/projects', id, 'portfolio.json'), JSON.stringify(record({ id, title: id, repo: `yorkerhodes3/${id}`, methodTags: tags, links: { source: `https://github.com/yorkerhodes3/${id}` } })));
  }
  const run = () => execFileSync(process.execPath, ['src/refresh/refresh.mjs', '--offline'], { cwd: dir, encoding: 'utf8' });
  const snap = () => JSON.parse(readFileSync(join(dir, 'catalog/snapshot.json'), 'utf8'));
  return { dir, run, snap };
}

test('refresh: distinct counts, exclusions, and an unchanged rerun produces identical content', async () => {
  const f = await fixture();
  f.run();
  const first = readFileSync(join(f.dir, 'catalog/snapshot.json'), 'utf8');
  const s = JSON.parse(first);
  assert.equal(s.counts.projects, 2);
  assert.equal(s.counts.byMethod['applied-ai'], 2, 'a tag shared by two projects counts both');
  assert.equal(s.counts.byMethod['decision-models'], 1);
  const inv = JSON.parse(readFileSync(join(f.dir, 'catalog/inventory.json'), 'utf8'));
  assert.equal(inv.privateExclusions, 1);
  assert.ok(!JSON.stringify(inv).includes('secret-thing'), 'hidden repository is never named');
  assert.equal(inv.candidates.find(c => c.repo === 'yorkerhodes3/portfolio').disposition, 'excluded');
  f.run();
  assert.equal(readFileSync(join(f.dir, 'catalog/snapshot.json'), 'utf8'), first, 'rerun without input changes');
});

test('refresh: a malformed revision keeps the last approved record; a withdrawal removes it', async () => {
  const f = await fixture();
  f.run();
  writeFileSync(join(f.dir, 'catalog/projects/alpha/portfolio.json'), JSON.stringify(record({ methodTags: ['not-a-tag'] })));
  f.run();
  const kept = f.snap().projects.find(p => p.id === 'alpha');
  assert.deepEqual(kept.methodTags, ['applied-ai', 'decision-models'], 'previous approved version survives');
  assert.match(readFileSync(join(f.dir, 'catalog/refresh-report.md'), 'utf8'), /alpha[\s\S]*last approved version kept/);
  writeFileSync(join(f.dir, 'catalog/dispositions.json'), JSON.stringify({ excluded: {}, duplicates: {}, withdrawn: { 'yorkerhodes3/alpha': 'owner request' } }));
  f.run();
  assert.equal(f.snap().projects.some(p => p.id === 'alpha'), false);
  assert.equal(f.snap().counts.projects, 1);
});

test('refresh: an unreadable draft or a stolen id never removes or replaces an approved project', async () => {
  const f = await fixture();
  f.run();
  const before = f.snap().projects.find(p => p.id === 'alpha');
  writeFileSync(join(f.dir, 'catalog/projects/alpha/portfolio.json'), '{ "not": json');
  f.run();
  assert.deepEqual(f.snap().projects.find(p => p.id === 'alpha'), before, 'syntax error keeps the approved record');
  assert.match(readFileSync(join(f.dir, 'catalog/refresh-report.md'), 'utf8'), /cannot be read/);
  // beta's record claims alpha's id: it is blocked, and alpha stays exactly once.
  writeFileSync(join(f.dir, 'catalog/projects/alpha/portfolio.json'), JSON.stringify(record()));
  const beta = JSON.parse(readFileSync(join(f.dir, 'catalog/projects/beta/portfolio.json'), 'utf8'));
  writeFileSync(join(f.dir, 'catalog/projects/beta/portfolio.json'), JSON.stringify({ ...beta, id: 'alpha' }));
  f.run();
  const ids = f.snap().projects.map(p => p.id);
  assert.deepEqual(ids.filter(i => i === 'alpha').length, 1);
  assert.ok(ids.includes('beta'), 'beta keeps its last approved version');
  assert.match(readFileSync(join(f.dir, 'catalog/refresh-report.md'), 'utf8'), /belongs to yorkerhodes3\/alpha/);
});

test('no privately excluded repository is named anywhere in published or catalog files', () => {
  const hashes = new Set(JSON.parse(readFileSync(join(ROOT, 'catalog/exclusions.json'), 'utf8')).sha256);
  const owners = ['yorkerhodes3', 'ethical-tech-colab'];
  const walk = d => readdirSync(d).flatMap(f => { const p = join(d, f); return statSync(p).isDirectory() ? walk(p) : [p]; });
  const files = ['catalog', 'dist', 'career', 'config', 'README.md', 'PLAN.md', 'BACKLOG.md', 'SPECIFICATION.md', 'CONCEPT-IDEA.md'].map(p => join(ROOT, p)).filter(existsSync)
    .flatMap(p => statSync(p).isDirectory() ? walk(p) : [p]).filter(p => /\.(json|md|html|txt|xml|js|css)$/.test(p));
  for (const file of files) {
    for (const token of new Set(readFileSync(file, 'utf8').toLowerCase().match(/[a-z0-9][a-z0-9._-]{4,}/g) || [])) {
      for (const o of owners) assert.ok(!hashes.has(createHash('sha256').update(`${o}/${token}`).digest('hex')), `${file} names an excluded repository`);
    }
  }
});

test('Wayfinder tokens meet WCAG contrast for text and controls', () => {
  const css = readFileSync(join(ROOT, 'src/site/css/tokens.css'), 'utf8');
  const v = n => css.match(new RegExp(`--${n}:\\s*(#[0-9a-f]{6})`, 'i'))[1];
  const lum = h => { const c = [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16) / 255).map(x => x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4); return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]; };
  const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m); return (x + 0.05) / (y + 0.05); };
  for (const ground of ['bg', 'surface', 'card']) {
    assert.ok(ratio(v('fg'), v(ground)) >= 7, `fg on ${ground}`);
    assert.ok(ratio(v('muted'), v(ground)) >= 4.5, `muted on ${ground}`);
    assert.ok(ratio(v('faint'), v(ground)) >= 4.5, `faint on ${ground}`);
    assert.ok(ratio(v('accent'), v(ground)) >= 4.5, `accent text on ${ground}`);
  }
  assert.ok(ratio(v('accent-ink'), v('accent')) >= 4.5, 'button text on lime');
  assert.ok(ratio(v('secondary'), '#ffffff') >= 7, 'CV plum on white');
});
