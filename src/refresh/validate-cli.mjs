// Validates portfolio.json files without publishing anything.
//   npm run validate                       every draft in catalog/projects
//   npm run validate -- path/to/portfolio.json
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { validateRecord } from '../lib/validate.mjs';

const files = process.argv.slice(2).length ? process.argv.slice(2)
  : readdirSync('catalog/projects').map(d => join('catalog/projects', d, 'portfolio.json')).filter(existsSync);
let bad = 0;
for (const f of files) {
  let problems;
  try {
    const record = JSON.parse(readFileSync(f, 'utf8'));
    problems = validateRecord(record);
  } catch (err) { problems = [`not valid JSON: ${err.message}`]; }
  if (problems.length) { bad++; console.log(`✗ ${f}\n  - ${problems.join('\n  - ')}`); }
}
console.log(`${files.length - bad} of ${files.length} records valid`);
process.exitCode = bad ? 1 : 0;
