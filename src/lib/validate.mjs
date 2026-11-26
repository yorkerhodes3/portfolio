import { readFileSync } from 'node:fs';
import Ajv from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';

const schema = JSON.parse(readFileSync(new URL('../../catalog/schema/portfolio.schema.json', import.meta.url), 'utf8'));
export const vocab = JSON.parse(readFileSync(new URL('../../catalog/tags.json', import.meta.url), 'utf8'));
const ajv = new Ajv({ allErrors: true, strict: false });
addFormats(ajv);
const check = ajv.compile(schema);

/** Returns a list of human-readable problems; empty means valid. */
export function validateRecord(record, { repo } = {}) {
  const problems = [];
  if (!check(record)) {
    for (const e of check.errors) problems.push(`${e.instancePath || '(record)'} ${e.message}${e.params?.additionalProperty ? `: ${e.params.additionalProperty}` : ''}`);
    return problems;
  }
  const methods = vocab.facets.method.tags, domains = vocab.facets.domain.tags;
  for (const t of record.methodTags) if (!methods[t]) problems.push(`/methodTags unknown tag "${t}" (add it to catalog/tags.json first)`);
  for (const t of record.domainTags) if (!domains[t]) problems.push(`/domainTags unknown tag "${t}"`);
  if (!vocab.kinds[record.kind]) problems.push(`/kind unknown "${record.kind}"`);
  if (!vocab.roles[record.contribution.role]) problems.push(`/contribution/role unknown "${record.contribution.role}"`);
  if (!vocab.evidenceLevels[record.evidence.level]) problems.push(`/evidence/level unknown "${record.evidence.level}"`);
  const ids = record.images.map(i => i.id);
  if (new Set(ids).size !== ids.length) problems.push('/images ids must be distinct');
  if (new Set(record.images.map(i => i.src)).size !== ids.length) problems.push('/images must be three different pictures');
  if (!ids.includes(record.defaultImageId)) problems.push(`/defaultImageId "${record.defaultImageId}" is not one of the three images`);
  if (repo && record.repo.toLowerCase() !== repo.toLowerCase() && !(record.aliases || []).some(a => a.toLowerCase() === repo.toLowerCase())) problems.push(`/repo "${record.repo}" does not match the repository it was read from (${repo})`);
  if (record.contribution.date < '2026-01-01') problems.push('/contribution/date is before the 2026-01-01 cutoff');
  return problems;
}
