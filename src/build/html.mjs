export const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const plural = (n, one, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
export const monthLabel = ym => `${MONTHS[Number(ym.slice(5, 7)) - 1]} ${ym.slice(0, 4)}`;
export const longDate = d => { const [y, m, day] = d.split('-'); return `${MONTHS[Number(m) - 1]} ${Number(day)}, ${y}`; };

export function head({ title, description, canonical, image, imageAlt, prefix, extra = '' }) {
  return `<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<link rel="canonical" href="${esc(canonical)}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Yorke E. Rhodes III · Portfolio">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${esc(canonical)}">
<meta property="og:image" content="${esc(image)}">
<meta property="og:image:alt" content="${esc(imageAlt)}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(title)}">
<meta name="twitter:description" content="${esc(description)}">
<meta name="twitter:image" content="${esc(image)}">
<link rel="icon" href="${prefix}assets/brand/favicon.svg" type="image/svg+xml">
<link rel="icon" href="${prefix}assets/brand/favicon-32.png" sizes="32x32" type="image/png">
<link rel="apple-touch-icon" href="${prefix}assets/brand/apple-touch-icon.png">
<meta name="theme-color" content="#120c1a">
<link rel="stylesheet" href="${prefix}assets/css/tokens.css">
<link rel="stylesheet" href="${prefix}assets/css/site.css">
${extra}`;
}

export function siteHeader(prefix, current) {
  const link = (href, label, key) => `<a href="${prefix}${href}"${current === key ? ' aria-current="page"' : ''}>${label}</a>`;
  return `<a class="skip" href="#main">Skip to content</a>
<header class="site-head"><div class="wrap">
  <a class="brand" href="${prefix}./">Yorke <span>Rhodes</span></a>
  <nav class="nav" aria-label="Site">${link('./#framework', 'Framework', 'framework')}${link('./#work', 'Work', 'work')}${link('./#downloads', 'Downloads', 'downloads')}<a href="https://www.linkedin.com/in/yorkerhodes">LinkedIn</a><a href="https://github.com/yorkerhodes3">GitHub</a></nav>
</div></header>`;
}

export function siteFooter(snapshot) {
  return `<footer class="site-foot"><div class="wrap">
  <p>Inventory as of <strong>${esc(longDate(snapshot.inventoryDate))}</strong>: public work in <a href="https://github.com/yorkerhodes3">yorkerhodes3</a> and <a href="https://github.com/Ethical-Tech-CoLab">Ethical-Tech-CoLab</a> created or substantively advanced since ${esc(longDate(snapshot.cutoff))}.${snapshot.complete ? '' : ' <strong>The last refresh could not list every repository; coverage is incomplete.</strong>'}</p>
  <p>Each project is described by its own <code>portfolio.json</code>; roles and credits come from repository history and the project's own documentation. Student work is credited to the students, with Yorke as Advisor/Prof. Screenshots were captured from the projects' own sites. <a href="https://github.com/yorkerhodes3/portfolio">Source, refresh function and corrections</a>.</p>
</div></footer>`;
}
