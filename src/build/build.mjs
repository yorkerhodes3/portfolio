// Renders the static site and the print pages from the approved snapshot (catalog/snapshot.json),
// the career record (career/career.json) and config/site.json. Output: dist/.
import { readFileSync, writeFileSync, mkdirSync, cpSync, existsSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { esc, plural, monthLabel, longDate, head, siteHeader, siteFooter } from './html.mjs';
import sharp from 'sharp';
import { renderPrintPortfolio, renderCv, renderFullBio, renderSpeakerBio } from './print.mjs';

const read = p => JSON.parse(readFileSync(p, 'utf8'));
const site = read('config/site.json');
const vocab = read('catalog/tags.json');
const snapshot = read('catalog/snapshot.json');
const checks = existsSync('catalog/checks.json') ? read('catalog/checks.json') : { demos: {} };
const career = existsSync('career/career.json') ? read('career/career.json') : null;
const DIST = 'dist';
const METHOD = vocab.facets.method.tags, DOMAIN = vocab.facets.domain.tags, KIND = vocab.kinds, ROLE = vocab.roles, EVIDENCE = vocab.evidenceLevels;
const projects = [...snapshot.projects].sort((a, b) => b.contribution.date.localeCompare(a.contribution.date) || a.title.localeCompare(b.title) || a.id.localeCompare(b.id));
export const DOWNLOADS = [
  { key: 'portfolio', file: 'yorke-rhodes-portfolio.pdf', title: 'Full portfolio', text: `Every published project, its credits, evidence and default picture, in the Wayfinder style. Always the whole collection, whatever filters are set.`, edition: snapshot.inventoryDate, available: projects.length > 0 },
  { key: 'cv', file: 'yorke-rhodes-cv.pdf', title: 'CV', text: 'A traditional, single-column CV: profile, experience, selected work, education.', edition: career?.edition.revised, available: !!career },
  { key: 'full-bio', file: 'yorke-rhodes-full-bio.pdf', title: 'Full Bio', text: 'A one-page third-person biography.', edition: career?.edition.revised, available: !!career?.fullBio },
  { key: 'speaker-bio', file: 'yorke-rhodes-speaker-bio.pdf', title: 'Speaker Bio', text: 'A short introduction to read aloud before a talk or panel.', edition: career?.edition.revised, available: !!career?.speakerBio },
];

rmSync(DIST, { recursive: true, force: true });
mkdirSync(join(DIST, 'assets/fonts'), { recursive: true });
cpSync('src/site/css', join(DIST, 'assets/css'), { recursive: true });
cpSync('src/site/js', join(DIST, 'assets/js'), { recursive: true });
cpSync('src/site/brand', join(DIST, 'assets/brand'), { recursive: true });
for (const [pkg, files] of Object.entries({ 'bebas-neue': ['bebas-neue-latin-400-normal.woff2'], 'space-mono': ['space-mono-latin-400-normal.woff2', 'space-mono-latin-700-normal.woff2'], inter: ['inter-latin-400-normal.woff2', 'inter-latin-600-normal.woff2', 'inter-latin-700-normal.woff2'] })) {
  for (const f of files) cpSync(`node_modules/@fontsource/${pkg}/files/${f}`, join(DIST, 'assets/fonts', f));
  cpSync(`node_modules/@fontsource/${pkg}/LICENSE`, join(DIST, 'assets/fonts', `${pkg}-OFL.txt`));
}
for (const p of projects) cpSync(join('media', p.id), join(DIST, 'media', p.id), { recursive: true });
// Print copies of each default picture as JPEG: Chrome embeds JPEG unchanged but re-encodes WebP losslessly.
mkdirSync(join(DIST, 'print/img'), { recursive: true });
await Promise.all(projects.map(p => sharp(p.media[p.defaultImageId].full).resize({ width: 1400, withoutEnlargement: true }).flatten({ background: '#0c0812' }).jpeg({ quality: 74, mozjpeg: true }).toFile(join(DIST, 'print/img', `${p.id}.jpg`))));

const owner = p => site.accounts[p.repo.split('/')[0]] || p.repo.split('/')[0];
const demoState = p => {
  if (!p.links.demo) return null;
  const c = checks.demos[p.id];
  return c?.status === 'ok' ? { live: true, label: 'Live demo', note: `Checked ${longDate(c.checked)}` }
    : c?.status === 'failed' ? { live: false, label: 'Demo link', note: `Unavailable when last checked (${longDate(c.checked)}); see the source instead` }
    : { live: false, label: 'Demo link', note: 'Availability not yet verified by a refresh' };
};
const defaultMedia = p => p.media[p.defaultImageId];
const defaultImage = p => p.images.find(i => i.id === p.defaultImageId);
const abs = path => new URL(path, site.siteUrl).href;
const bioHtml = esc(site.bioLine).replace(/^(I make complex decisions testable)/, '<em>$1</em>');

function card(p) {
  const m = defaultMedia(p), img = defaultImage(p), d = demoState(p);
  return `<li class="card" data-id="${esc(p.id)}">
  <div class="thumb"><img src="${esc(m.thumb)}" alt="${esc(img.alt)}" width="640" height="${Math.round(640 * m.height / m.width)}" loading="lazy" decoding="async"></div>
  <div class="body">
    <div class="meta"><span class="badge role">${esc(ROLE[p.contribution.role])}</span><span class="badge ev-${esc(p.evidence.level)}">${esc(EVIDENCE[p.evidence.level])}</span></div>
    <h3><a href="p/${esc(p.id)}/">${esc(p.title)}</a></h3>
    <p class="summary">${esc(p.summary)}</p>
    <div class="tags">${p.methodTags.map(t => `<span class="tag">${esc(METHOD[t])}</span>`).join('')}${p.domainTags.map(t => `<span class="tag">${esc(DOMAIN[t])}</span>`).join('')}</div>
    <div class="owner">${esc(KIND[p.kind])} · ${esc(owner(p))} · updated ${esc(longDate(p.contribution.date))}</div>
    <div class="foot">${d ? `<a class="btn sm" href="${esc(p.links.demo)}" title="${esc(d.note)}">${esc(d.label)} ↗</a>` : ''}<a class="btn sm" href="${esc(p.links.source)}">Source ↗</a></div>
  </div>
</li>`;
}

function bars(entries, facet, labels) {
  const max = Math.max(1, ...entries.map(e => e[1]));
  return `<div class="bars">${entries.map(([k, v]) => `<div class="bar"><a href="./?${facet}=${esc(k)}#work" data-apply="${esc(k)}" data-apply-facet="${facet}">${esc(labels[k])}</a><div class="track" aria-hidden="true"><div class="fill" style="width:${(100 * v / max).toFixed(1)}%"></div></div><span class="v">${v}</span></div>`).join('')}</div>`;
}
const firstSentence = s => { const m = s.match(/^.{40,220}?[.;](?=\s|$)/); return m ? m[0] : s.length > 220 ? `${s.slice(0, 217).replace(/\s+\S*$/, '')}…` : s; };
const sorted = obj => Object.entries(obj || {}).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));

function dashboard() {
  const c = snapshot.counts;
  const months = [];
  for (let m = 1; m <= 12; m++) { const ym = `${snapshot.cutoff.slice(0, 4)}-${String(m).padStart(2, '0')}`; if (ym <= snapshot.inventoryDate.slice(0, 7)) months.push([ym, c.byMonth[ym] || 0]); }
  const maxMonth = Math.max(1, ...months.map(m => m[1]));
  const liveDemos = projects.filter(p => demoState(p)?.live).length;
  const featured = (career?.selectedProjects || []).map(id => projects.find(p => p.id === id)).filter(Boolean).slice(0, 4);
  const chips = (facet, labels, counts) => Object.keys(labels).filter(k => counts[k]).map(k => `<button type="button" class="chip" data-facet="${facet}" data-tag="${esc(k)}" aria-pressed="false">${esc(labels[k])} <span class="n">${counts[k]}</span></button>`).join('');
  const catalogData = { projects: projects.map(p => ({ id: p.id, title: p.title, date: p.contribution.date, methods: p.methodTags, domains: p.domainTags, kinds: [p.kind] })), labels: { method: METHOD, domain: DOMAIN, kind: KIND } };
  const description = `${site.name}: ${c.projects} projects since ${longDate(snapshot.cutoff)} across AI, agentic systems, commerce, blockchain, decision models and edge hardware. ${site.bioLine}`;
  return `<!doctype html><html lang="en"><head>
${head({ title: `${site.name} · Portfolio`, description, canonical: site.siteUrl, image: abs('assets/brand/og.png'), imageAlt: `${site.name} portfolio: ${site.bioLine}`, prefix: '' })}
</head><body>
${siteHeader('', 'home')}
<main id="main">
<section class="hero"><div class="grid-bg" aria-hidden="true"></div><div class="wrap" style="position:relative">
  <span class="eyebrow">Portfolio · work since ${esc(monthLabel(snapshot.cutoff.slice(0, 7)))}</span>
  <h1>${esc(site.name)}</h1>
  <p class="bio-line">${bioHtml}</p>
  <p class="lede">${esc(site.headline)}.</p>
  <div class="row" style="margin-top:22px"><a class="btn primary" href="#work">Explore the work</a><a class="btn" href="downloads/${DOWNLOADS[0].file}" data-download>Download full portfolio (PDF)</a><a class="btn" href="downloads/${DOWNLOADS[1].file}" data-download>Download CV (PDF)</a></div>
  <p class="meta">${plural(c.projects, 'project')} · ${plural(c.withDemo, 'demo link')} · ${Object.keys(c.byOwner).length} GitHub accounts · inventory as of ${esc(longDate(snapshot.inventoryDate))}</p>
</div></section>

<section class="band" id="framework" aria-labelledby="framework-h"><div class="wrap">
  <div class="section-head"><span class="eyebrow">How to read this body of work</span><h2 id="framework-h">Four lenses on <span class="display-em">one catalog</span></h2>
  <p class="lede">Volume, depth, type and focus all read from the same reviewed records. Select any bar to filter the work below.</p></div>
  <div class="lenses">
    <article class="panel lens"><h3><span class="k">01</span>Volume</h3><p class="q">How much, when, and where it lives.</p>
      <div class="stat-row"><div class="stat"><b>${c.projects}</b><span>distinct projects</span></div><div class="stat"><b>${c.withDemo}</b><span>with a demo link${liveDemos ? ` (${liveDemos} verified live)` : ''}</span></div>${Object.entries(c.byOwner).map(([o, n]) => `<div class="stat"><b>${n}</b><span>${esc(site.accounts[o] || o)}</span></div>`).join('')}</div>
      <div class="months" role="img" aria-label="Projects by month of latest contribution: ${months.map(([m, n]) => `${monthLabel(m)} ${n}`).join(', ')}">${months.map(([m, n]) => `<div class="m"><i style="height:${Math.max(3, 80 * n / maxMonth)}px"></i>${monthLabel(m).slice(0, 3)}</div>`).join('')}</div>
      <p class="note">By month of each project's latest contribution. A mirror or second copy of a repository counts once.</p></article>
    <article class="panel lens"><h3><span class="k">02</span>Depth</h3><p class="q">What the evidence shows, and who did the work. No expertise scores.</p>
      <div class="ladder">${Object.entries(EVIDENCE).map(([k, l]) => `<div><b>${c.byEvidence[k] || 0}</b><span>${esc(l)}</span></div>`).join('')}</div>
      <div class="bars">${Object.entries(ROLE).map(([k, l]) => `<div class="bar"><span>${esc(l)}</span><div class="track" aria-hidden="true"><div class="fill" style="width:${(100 * (c.byRole[k] || 0) / c.projects).toFixed(1)}%"></div></div><span class="v">${c.byRole[k] || 0}</span></div>`).join('')}</div>
      ${featured.length ? `<div class="decisions">${featured.map(p => `<p class="decision"><a href="p/${esc(p.id)}/">${esc(p.title)}</a>: ${esc(firstSentence(p.narrative.decision))}</p>`).join('')}</div>` : ''}
      <p class="note">Every project page states the problem, a consequential decision and its trade-off, dated evidence and a known limitation.</p></article>
    <article class="panel lens"><h3><span class="k">03</span>Type</h3><p class="q">Research, models, tools, infrastructure and applications.</p>${bars(sorted(c.byKind), 'k', KIND)}</article>
    <article class="panel lens"><h3><span class="k">04</span>Focus</h3><p class="q">Methods used, and the domain problems they serve.</p>
      <h4 class="eyebrow" style="margin:4px 0 10px">Methods</h4>${bars(sorted(c.byMethod), 'm', METHOD)}
      <h4 class="eyebrow" style="margin:18px 0 10px">Domains</h4>${bars(sorted(c.byDomain), 'd', DOMAIN)}
      <p class="note">Projects carry several tags, so these counts overlap and do not add up to the total.</p></article>
  </div>
</div></section>

<section class="band" id="work" aria-labelledby="work-h"><div class="wrap">
  <div class="section-head"><span class="eyebrow">The work</span><h2 id="work-h">Filter by <span class="display-em">method, domain or type</span></h2>
  <p class="lede">Choose any tags: projects match any selected tag within a group and every group you use.</p></div>
  <div id="filters" class="filters panel" hidden>
    <fieldset class="facet"><legend>Methods</legend><div class="chips">${chips('m', METHOD, c.byMethod)}</div></fieldset>
    <fieldset class="facet"><legend>Domains</legend><div class="chips">${chips('d', DOMAIN, c.byDomain)}</div></fieldset>
    <fieldset class="facet"><legend>Type</legend><div class="chips">${chips('k', KIND, c.byKind)}</div></fieldset>
    <div class="controls">
      <label>Sort<select id="sort"><option value="newest">Newest contribution first</option><option value="title">Title A–Z</option></select></label>
      <label>Group<select id="group"><option value="none">No grouping</option><option value="method">By method</option><option value="domain">By domain</option><option value="kind">By type</option></select></label>
    </div>
  </div>
  <div class="status"><span id="status-text" tabindex="-1" aria-live="polite">Showing <strong>${projects.length}</strong> of ${projects.length} projects</span><button type="button" class="btn sm" id="clear" hidden>Clear filters</button></div>
  <div id="cards"><ul class="cards" role="list">${projects.map(card).join('\n')}</ul></div>
  <div id="empty" class="empty" hidden><h3>No projects match these filters</h3><p class="muted">Try fewer tags, or start again.</p><button type="button" class="btn primary" data-clear>Clear filters</button></div>
  <noscript><p class="muted">Filtering needs JavaScript; every project is listed above.</p></noscript>
</div></section>

<section class="band" id="downloads" aria-labelledby="downloads-h"><div class="wrap">
  <div class="section-head"><span class="eyebrow">Take it with you</span><h2 id="downloads-h">Downloads</h2><p class="lede">PDFs for offline reading. Text is selectable, and pictures are embedded.</p></div>
  <div class="downloads">${DOWNLOADS.map(d => `<article class="panel download"><h3>${esc(d.title)}</h3><p>${esc(d.text)}</p>${d.available ? `<a class="btn primary" href="downloads/${d.file}" data-download download>Download ${esc(d.title)} (PDF)</a><span class="edition">Edition ${esc(longDate(d.edition))}</span>` : `<p class="edition"><strong>Unavailable:</strong> this document has not been published yet.</p>`}</article>`).join('')}</div>
</div></section>
</main>
${siteFooter(snapshot)}
<script type="application/json" id="catalog-data">${JSON.stringify(catalogData).replace(/</g, '\\u003c')}</script>
<script type="module" src="assets/js/catalog.js"></script>
<script type="module">
for (const a of document.querySelectorAll('[data-download]')) fetch(a.href, { method: 'HEAD' }).then(r => { if (!r.ok) throw 0; }).catch(() => { a.removeAttribute('href'); a.setAttribute('aria-disabled', 'true'); a.textContent += ' — unavailable'; });
</script>
</body></html>`;
}

function projectPage(p) {
  const prefix = '../../';
  const m = defaultMedia(p), img = defaultImage(p), d = demoState(p);
  const idx = p.images.findIndex(i => i.id === p.defaultImageId);
  const gallery = p.images.map(i => ({ full: prefix + p.media[i.id].full, width: p.media[i.id].width, height: p.media[i.id].height, alt: i.alt, caption: i.caption, credit: i.credit }));
  const canonical = abs(`p/${p.id}/`);
  const credits = p.contribution.credits;
  return `<!doctype html><html lang="en"><head>
${head({ title: `${p.title} · ${site.name}`, description: p.summary, canonical, image: abs(m.full), imageAlt: img.alt, prefix })}
</head><body>
${siteHeader(prefix, 'work')}
<main id="main"><div class="wrap">
  <nav class="crumbs" aria-label="Breadcrumb"><a href="${prefix}#work" data-back>← Back to the work</a></nav>
  <header class="project-head">
    <span class="eyebrow">${esc(KIND[p.kind])} · ${esc(owner(p))}</span>
    <h1>${esc(p.title)}</h1>
    <p class="summary">${esc(p.summary)}</p>
    <div class="row"><span class="badge role">Yorke's role: ${esc(ROLE[p.contribution.role])}</span><span class="badge ev-${esc(p.evidence.level)}">${esc(EVIDENCE[p.evidence.level])}</span><span class="badge">Updated ${esc(longDate(p.contribution.date))}</span></div>
    <div class="tags" style="margin-top:14px">${p.methodTags.map(t => `<a class="tag" href="${prefix}?m=${t}#work">${esc(METHOD[t])}</a>`).join('')}${p.domainTags.map(t => `<a class="tag" href="${prefix}?d=${t}#work">${esc(DOMAIN[t])}</a>`).join('')}</div>
  </header>
  <div class="project-grid">
    <figure class="gallery" data-gallery data-default="${idx}" aria-roledescription="gallery" aria-label="${esc(p.title)} pictures">
      <script type="application/json">${JSON.stringify(gallery).replace(/</g, '\\u003c')}</script>
      <div class="stage" tabindex="0" aria-label="Picture; use the left and right arrow keys to change"><img src="${esc(prefix + m.full)}" alt="${esc(img.alt)}" width="${m.width}" height="${m.height}"><div class="img-fallback" hidden></div></div>
      <div class="bar-ctl"><button type="button" class="btn sm" data-prev aria-label="Previous picture">←</button><span class="pos" aria-live="polite">${idx + 1} / 3</span><button type="button" class="btn sm" data-next aria-label="Next picture">→</button>
        <div class="thumbs">${p.images.map((i, k) => `<button type="button" aria-label="Show picture ${k + 1}: ${esc(i.caption)}" aria-current="${k === idx}"><img src="${esc(prefix + p.media[i.id].thumb)}" alt="" loading="lazy"></button>`).join('')}</div></div>
      <figcaption><span class="caption-text">${esc(img.caption)}</span><span class="credit">${esc(img.credit)}</span></figcaption>
    </figure>
    <aside class="facts">
      <div class="panel actions">
        ${d ? `<a class="btn primary" href="${esc(p.links.demo)}">${d.live ? 'Try the live demo ↗' : 'Open the demo link ↗'}</a><span class="check">${esc(d.note)}</span>` : `<p class="small muted" style="margin:0">No demo: this project's evidence is in its repository and documents.</p>`}
        ${p.narrative.caveat ? `<p class="caveat"><b>Before you try it:</b> ${esc(p.narrative.caveat)}</p>` : ''}
        <a class="btn" href="${esc(p.links.source)}">View the source ↗</a>
      </div>
      <div class="panel fact"><h2>Who did the work</h2>
        <p><strong>Yorke: ${esc(ROLE[p.contribution.role])}.</strong>${p.contribution.roleNote ? ` ${esc(p.contribution.roleNote)}` : ''}</p>
        ${credits.length ? `<ul>${credits.map(c => `<li>${c.github ? `<a href="https://github.com/${esc(c.github)}">${esc(c.name)}</a>` : esc(c.name)}${c.role ? `, ${esc(c.role)}` : ''}</li>`).join('')}</ul>` : '<p class="muted small" style="margin:0">No other contributors recorded.</p>'}
      </div>
      <div class="panel fact"><h2>Evidence</h2><p>${esc(EVIDENCE[p.evidence.level])}.</p><ul>${p.evidence.links.map(e => `<li><a href="${esc(e.url)}">${esc(e.label)}</a> <span class="muted">(${esc(longDate(e.date))})</span></li>`).join('')}</ul></div>
    </aside>
  </div>
  <section class="story" aria-label="Project narrative">
    <article class="panel"><h2>The problem</h2><p>${esc(p.narrative.problem)}</p></article>
    <article class="panel"><h2>A decision that mattered</h2><p>${esc(p.narrative.decision)}</p></article>
    <article class="panel"><h2>The trade-off</h2><p>${esc(p.narrative.tradeoff)}</p></article>
    <article class="panel"><h2>Known limitation</h2><p>${esc(p.narrative.limitation)}</p></article>
  </section>
</div></main>
${siteFooter(snapshot)}
<script type="module" src="${prefix}assets/js/project.js"></script>
</body></html>`;
}

function notFound() {
  const prefix = '/portfolio/';
  return `<!doctype html><html lang="en"><head>
${head({ title: `Not found · ${site.name}`, description: 'This page does not exist or the project was withdrawn.', canonical: site.siteUrl, image: abs('assets/brand/og.png'), imageAlt: site.name, prefix })}
<meta name="robots" content="noindex">
</head><body>${siteHeader(prefix, '')}<main id="main"><section class="hero"><div class="wrap"><span class="eyebrow">404</span><h1>Not here</h1><p class="lede">This page does not exist, or the project is no longer listed.</p><a class="btn primary" href="${prefix}#work">Browse the work</a></div></section></main></body></html>`;
}

const out = (path, html) => { mkdirSync(join(DIST, path, '..'), { recursive: true }); writeFileSync(join(DIST, path), html); };
out('index.html', dashboard());
for (const p of projects) out(`p/${p.id}/index.html`, projectPage(p));
out('404.html', notFound());
out('print/portfolio.html', renderPrintPortfolio({ site, snapshot, projects, vocab, checks, owner }));
if (career) {
  const selected = career.selectedProjects.map(id => projects.find(p => p.id === id)).filter(Boolean);
  out('print/cv.html', renderCv({ site, career, selected, vocab }));
  out('print/full-bio.html', renderFullBio({ site, career }));
  out('print/speaker-bio.html', renderSpeakerBio({ site, career }));
}
writeFileSync(join(DIST, '.nojekyll'), '');
writeFileSync(join(DIST, 'robots.txt'), `User-agent: *\nAllow: /\nSitemap: ${abs('sitemap.xml')}\n`);
writeFileSync(join(DIST, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${[site.siteUrl, ...projects.map(p => abs(`p/${p.id}/`))].map(u => `  <url><loc>${u}</loc></url>`).join('\n')}\n</urlset>\n`);
writeFileSync(join(DIST, 'downloads.json'), JSON.stringify(DOWNLOADS, null, 2));
console.log(`build: ${projects.length} project pages, dashboard, 404 and ${career ? 4 : 1} print pages in dist/`);
