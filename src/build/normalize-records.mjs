// One-off consistency pass over drafted records, applying owner-level review decisions of 2026-11-26.
// Kept for the audit trail; rerunning it is idempotent.
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';

// Ethical Tech CoLab cohort members named in the lab's own reports (e.g. After the Corridor, Summer 2026 cohort).
const COHORT = { 'carolina-moron': 'Carolina Moron', ChristineLumen: 'Christine Lumen', mmelanie: 'Melanie MacKew', 'indiaclarke03-ops': 'India Clarke', 'yagorocha-web': 'Yago Rocha', alanarobertson: 'Alana Robertson' };
// Evidence levels with no reported evaluation: tests or measurement output alone mean a working demonstration.
const EVIDENCE = { 'colab-board': 'working-demo', 'usage-calc': 'working-demo', 'dumbo-district-3d': 'working-demo', '3d-agentic-evacuation-simulation': 'working-demo' };
// Tags that replace weak fits (set), or a tag to add (add).
const TAGS = {
  'webpage-note': { set: { methodTags: ['collaboration-tools', 'applied-ai'], domainTags: ['collaboration'] } },
  'read-as-book': { set: { methodTags: ['collaboration-tools', 'open-source'], domainTags: ['education'] } },
  'colab-board': { set: { methodTags: ['collaboration-tools', 'provenance'], domainTags: ['education', 'collaboration'] } },
  'nyu-violet-lab-preview': { set: { methodTags: ['collaboration-tools'], domainTags: ['education'] } },
  dropboard: { set: { methodTags: ['collaboration-tools'], domainTags: ['collaboration', 'education'] } },
  'pageturn-book': { set: { methodTags: ['collaboration-tools'] } },
  website: { set: { methodTags: ['collaboration-tools'] } },
};
let changed = 0;
for (const id of readdirSync('catalog/projects')) {
  const f = `catalog/projects/${id}/portfolio.json`;
  if (!existsSync(f)) continue;
  const before = readFileSync(f, 'utf8');
  const r = JSON.parse(before);
  const seen = new Set();
  r.contribution.credits = r.contribution.credits.filter(c => {
    if (COHORT[c.github]) c.name = COHORT[c.github];
    if (c.github && COHORT[c.github] && c.role !== 'Original author') c.role = 'Student researcher';
    if (c.github === 'ChristineLumen' || c.name === 'Christine') c.name = 'Christine Lumen';
    const key = (c.github || c.name).toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  // Drop a name-only duplicate of someone who also appears by login.
  const names = new Map(r.contribution.credits.filter(c => c.github).map(c => [c.name.toLowerCase(), c]));
  r.contribution.credits = r.contribution.credits.filter(c => c.github || !names.has(c.name.toLowerCase()));
  if (EVIDENCE[id]) r.evidence.level = EVIDENCE[id];
  // CERAI's paper names Teresa Cantero as the developer.
  if (id === 'cerai-ar') for (const c of r.contribution.credits) if (c.name === 'Teresa Cantero') c.role = 'Developer';
  if (TAGS[id]?.set) Object.assign(r, TAGS[id].set);
  if (TAGS[id]?.add && !r.methodTags.includes(TAGS[id].add)) r.methodTags = [TAGS[id].add, ...r.methodTags].slice(0, 4);
  const after = JSON.stringify(r, null, 2) + '\n';
  if (after !== before) { writeFileSync(f, after); changed++; }
}
console.log(`normalized ${changed} records`);
