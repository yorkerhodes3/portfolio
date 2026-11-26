import { execFileSync } from 'node:child_process';

let cachedToken;
export function token() {
  if (cachedToken !== undefined) return cachedToken;
  cachedToken = process.env.GITHUB_TOKEN || process.env.GH_TOKEN || '';
  if (!cachedToken) {
    try { cachedToken = execFileSync('gh', ['auth', 'token'], { encoding: 'utf8' }).trim(); } catch { cachedToken = ''; }
  }
  return cachedToken;
}

const API = 'https://api.github.com';

export class GitHubError extends Error {
  constructor(message, status) { super(message); this.status = status; }
}

export async function gh(path, { raw = false, method = 'GET', body, retries = 2 } = {}) {
  const headers = {
    Accept: raw ? 'application/vnd.github.raw+json' : 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'User-Agent': 'yorke-rhodes-portfolio-refresh',
  };
  if (token()) headers.Authorization = `Bearer ${token()}`;
  if (body) headers['Content-Type'] = 'application/json';
  for (let attempt = 0; ; attempt++) {
    let res;
    try {
      res = await fetch(path.startsWith('http') ? path : `${API}/${path.replace(/^\//, '')}`, { method, headers, body: body ? JSON.stringify(body) : undefined });
    } catch (err) {
      if (attempt < retries) { await new Promise(r => setTimeout(r, 500 * (attempt + 1))); continue; }
      throw new GitHubError(`network error for ${path}: ${err.message}`, 0);
    }
    if (res.status >= 500 && attempt < retries) { await new Promise(r => setTimeout(r, 800 * (attempt + 1))); continue; }
    if (!res.ok) throw new GitHubError(`${res.status} for ${path}`, res.status);
    if (raw) return Buffer.from(await res.arrayBuffer());
    if (res.status === 204) return null;
    return res.json();
  }
}

/** All pages of a list endpoint. Throws if any page fails, so callers can mark a listing incomplete. */
export async function paginate(path) {
  const out = [];
  for (let page = 1; ; page++) {
    const sep = path.includes('?') ? '&' : '?';
    const batch = await gh(`${path}${sep}per_page=100&page=${page}`);
    out.push(...batch);
    if (batch.length < 100) return out;
  }
}

export async function listOwnerRepos(owner) {
  const user = await gh(`users/${owner}`);
  const path = user.type === 'Organization' ? `orgs/${owner}/repos?type=public` : `users/${owner}/repos?type=owner`;
  return (await paginate(path)).filter(r => !r.private);
}

export async function fileOrNull(repo, path, ref) {
  try {
    const q = ref ? `?ref=${encodeURIComponent(ref)}` : '';
    return await gh(`repos/${repo}/contents/${path.split('/').map(encodeURIComponent).join('/')}${q}`, { raw: true });
  } catch (err) {
    if (err.status === 404) return null;
    throw err;
  }
}

export const BOT = /\[bot\]$|^(copilot|github-actions|dependabot|actions-user|claude)$/i;

export function pagesUrl(repo) {
  const [owner, name] = repo.split('/');
  const host = `${owner.toLowerCase()}.github.io`;
  return name.toLowerCase() === host ? `https://${host}/` : `https://${host}/${name}/`;
}
