// Derives Yorke's role and collaborator credits from commit history, and writes .work/roles.json.
// Role rule (CONCEPT §9, SPECIFICATION FR-04): only other people's commits → advisor-prof;
// Yorke's share ≥ 80% of human commits → built; otherwise co-built. Agent and bot commits are excluded.
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { gh, BOT } from '../lib/github.mjs';

export const YORKE_LOGINS = new Set(['yorkerhodes3', 'yorhodes']);
export const isYorke = (login, name) => YORKE_LOGINS.has((login || '').toLowerCase()) || /^yorke (e\. )?rhodes/i.test(name || '');

async function commitAuthors(repo) {
  const counts = new Map();
  for (let page = 1; page <= 5; page++) {
    const batch = await gh(`repos/${repo}/commits?per_page=100&page=${page}`).catch(() => []);
    for (const c of batch) {
      const login = c.author?.login || '';
      const name = c.commit?.author?.name || '';
      if (BOT.test(login) || BOT.test(name)) continue;
      const key = isYorke(login, name) ? 'yorke' : (login || `name:${name}`);
      counts.set(key, (counts.get(key) || 0) + 1);
    }
    if (batch.length < 100) break;
  }
  return counts;
}

export function roleFor(counts) {
  const total = [...counts.values()].reduce((a, b) => a + b, 0);
  const mine = counts.get('yorke') || 0;
  if (!total || !mine) return 'advisor-prof';
  return mine / total >= 0.8 ? 'built' : 'co-built';
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const out = {};
  const files = await readdir('.work/context');
  await Promise.all(files.map(async f => {
    const ctx = JSON.parse(await readFile(`.work/context/${f}`, 'utf8'));
    const counts = await commitAuthors(ctx.repo);
    const names = new Map(ctx.contributors.map(p => [p.login, p.name]));
    const credits = [];
    for (const [key, n] of counts) {
      if (key === 'yorke') continue;
      const login = key.startsWith('name:') ? undefined : key;
      let name = login ? names.get(login) : key.slice(5);
      if (login && !name) { try { name = (await gh(`users/${login}`)).name || login; } catch { name = login; } }
      credits.push({ name, ...(login ? { github: login } : {}), commits: n });
    }
    credits.sort((a, b) => b.commits - a.commits);
    out[ctx.repo] = { role: roleFor(counts), yorkeCommits: counts.get('yorke') || 0, humanCommits: [...counts.values()].reduce((a, b) => a + b, 0), credits };
  }));
  await writeFile('.work/roles.json', JSON.stringify(out, null, 2));
  const tally = Object.values(out).reduce((t, r) => (t[r.role] = (t[r.role] || 0) + 1, t), {});
  console.log('roles:', tally);
}
