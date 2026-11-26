// Collects the evidence needed to draft or review a project's portfolio.json:
// description, README, human contributors, last commit, existing images and the site entry page.
// Usage: node src/refresh/gather-context.mjs [owner/repo ...]   (default: every candidate)
// Output: .work/context/<owner>__<repo>.json (Git-ignored).
import { mkdir, writeFile } from 'node:fs/promises';
import { gh, listOwnerRepos, fileOrNull, BOT, pagesUrl } from '../lib/github.mjs';
import { OWNERS, CUTOFF } from './config.mjs';

const ENTRY = ['index.html', 'docs/index.html', 'site/index.html', 'public/index.html', 'web/index.html', 'src/app/layout.tsx', 'app/layout.tsx'];
const IMG = /\.(png|jpe?g|webp|gif|svg)$/i;

async function gather(r) {
  const repo = r.full_name;
  const [tree, commits, contributors] = await Promise.all([
    gh(`repos/${repo}/git/trees/${r.default_branch}?recursive=1`).catch(() => ({ tree: [] })),
    gh(`repos/${repo}/commits?per_page=30`).catch(() => []),
    gh(`repos/${repo}/contributors?per_page=50`).catch(() => []),
  ]);
  const paths = (tree.tree || []).filter(e => e.type === 'blob');
  const human = commits.find(c => !BOT.test(c.author?.login || c.commit?.author?.name || ''));
  const last = human || commits[0];
  const people = [];
  for (const c of contributors || []) {
    if (BOT.test(c.login)) continue;
    let name = c.login;
    try { name = (await gh(`users/${c.login}`)).name || c.login; } catch { /* keep login */ }
    people.push({ login: c.login, name, commits: c.contributions });
  }
  const readme = (await fileOrNull(repo, 'README.md'))?.toString('utf8') || '';
  const entry = ENTRY.find(p => paths.some(e => e.path === p)) || paths.find(e => /(^|\/)index\.html$/.test(e.path) && !e.path.includes('node_modules'))?.path || null;
  const html = entry ? (await fileOrNull(repo, entry))?.toString('utf8') || '' : '';
  return {
    repo,
    name: r.name,
    description: r.description || '',
    homepage: r.homepage || '',
    hasPages: r.has_pages,
    pagesUrl: r.has_pages ? pagesUrl(repo) : null,
    fork: r.fork,
    parent: r.fork ? (await gh(`repos/${repo}`)).parent?.full_name : null,
    archived: r.archived,
    topics: r.topics || [],
    license: r.license?.spdx_id || null,
    createdAt: r.created_at.slice(0, 10),
    pushedAt: r.pushed_at.slice(0, 10),
    defaultBranch: r.default_branch,
    lastCommit: last ? { sha: last.sha, date: last.commit.committer.date.slice(0, 10), message: last.commit.message.split('\n')[0], url: last.html_url } : null,
    contributors: people,
    siteEntry: entry,
    siteHasFavicon: /rel=["'](?:shortcut )?icon|apple-touch-icon|icons\s*:/.test(html) || paths.some(e => !e.path.includes('node_modules') && /(^|\/)(favicon[\w-]*\.(ico|svg|png)|(apple-)?icon\d*\.(svg|png|ico))$/i.test(e.path)),
    siteHasShareImage: /og:image|openGraph/.test(html) || paths.some(e => /(^|\/)(opengraph|twitter)-image\.(png|jpe?g)$/i.test(e.path)),
    images: paths.filter(e => IMG.test(e.path) && !/node_modules|favicon|apple-touch|icon-\d|\/icons?\//i.test(e.path)).map(e => ({ path: e.path, size: e.size })).sort((a, b) => b.size - a.size).slice(0, 40),
    htmlPages: paths.filter(e => /\.html$/.test(e.path) && !e.path.includes('node_modules')).map(e => e.path).slice(0, 40),
    readme: readme.slice(0, 7000),
  };
}

const wanted = process.argv.slice(2);
await mkdir('.work/context', { recursive: true });
const repos = [];
for (const owner of OWNERS) repos.push(...(await listOwnerRepos(owner)).filter(r => r.pushed_at >= CUTOFF));
const targets = wanted.length ? repos.filter(r => wanted.includes(r.full_name)) : repos;
let done = 0;
await Promise.all(Array.from({ length: 6 }, async (_, w) => {
  for (let i = w; i < targets.length; i += 6) {
    const ctx = await gather(targets[i]);
    await writeFile(`.work/context/${ctx.repo.replace('/', '__')}.json`, JSON.stringify(ctx, null, 2));
    done++;
  }
}));
console.log(`gathered ${done} of ${targets.length} repositories into .work/context/`);
