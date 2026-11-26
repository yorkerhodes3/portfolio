// Writes catalog/REVIEW.md: one row per published project, so the owner can check every claim in one pass
// (PLAN M1: "Yorke has reviewed the drafted records in one table"). Reviewer notes come from
// catalog/review-notes.json (doubts raised while drafting).
import { readFileSync, writeFileSync, existsSync } from 'node:fs';

const snap = JSON.parse(readFileSync('catalog/snapshot.json', 'utf8'));
const vocab = JSON.parse(readFileSync('catalog/tags.json', 'utf8'));
const notes = existsSync('catalog/review-notes.json') ? JSON.parse(readFileSync('catalog/review-notes.json', 'utf8')) : {};
const cell = s => String(s ?? '').replace(/\|/g, '\\|').replace(/\n/g, ' ');
const rows = [...snap.projects].sort((a, b) => a.repo.localeCompare(b.repo)).map(p => [
  `[${p.title}](../catalog/projects/${p.id}/portfolio.json)`,
  `[${p.repo}](${p.links.source})`,
  `${vocab.roles[p.contribution.role]}${p.contribution.roleNote ? ` (${p.contribution.roleNote})` : ''}`,
  p.contribution.credits.map(c => `${c.name}${c.role ? ` (${c.role})` : ''}`).join('; ') || '—',
  vocab.evidenceLevels[p.evidence.level],
  vocab.kinds[p.kind],
  [...p.methodTags, ...p.domainTags].join(', '),
  p.images.find(i => i.id === p.defaultImageId).caption,
  notes[p.id] || '',
].map(cell));
const md = `# Review table

Every published claim, one row per project (${snap.projects.length}, inventory ${snap.inventoryDate}). Check **role**, **credits**, **evidence** and **tags**; correct a row by editing the linked \`portfolio.json\` (or, once adopted, the file in the project's repository) and rerunning \`npm run refresh\`. Notes flag doubts raised while drafting.

| Project | Repository | Yorke's role | Credits | Evidence | Type | Tags | Default picture (printed) | Reviewer note |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
${rows.map(r => `| ${r.join(' | ')} |`).join('\n')}
`;
writeFileSync('catalog/REVIEW.md', md);
console.log(`catalog/REVIEW.md: ${rows.length} rows`);
