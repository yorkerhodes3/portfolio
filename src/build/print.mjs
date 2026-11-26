import { esc, longDate, plural } from './html.mjs';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const ym = v => v == null ? 'Present' : /^\d{4}$/.test(v) ? v : `${MONTHS[Number(v.slice(5, 7)) - 1]} ${v.slice(0, 4)}`;
const pageHead = (title, css) => `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>${esc(title)}</title>
<link rel="stylesheet" href="../assets/css/tokens.css"><link rel="stylesheet" href="../assets/css/${css}"></head>`;

export function renderPrintPortfolio({ site, snapshot, projects, vocab, checks, owner }) {
  const { method: { tags: METHOD }, domain: { tags: DOMAIN } } = vocab.facets;
  const KIND = vocab.kinds, ROLE = vocab.roles, EVIDENCE = vocab.evidenceLevels;
  const c = snapshot.counts;
  const rank = o => Object.entries(o || {}).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  const bars = (entries, labels, max = Math.max(1, ...entries.map(e => e[1]))) => entries.map(([k, v]) => `<div class="pbar"><span>${esc(labels[k])}</span><i style="width:${(100 * v / max).toFixed(1)}%"></i><b>${v}</b></div>`).join('');
  const share = p => new URL(`p/${p.id}/`, site.siteUrl).href;
  const bare = u => u.replace(/^https?:\/\//, '').replace(/\/$/, '');
  const demo = p => {
    if (!p.links.demo) return '';
    const ch = checks.demos[p.id];
    return `<li><b>Demo:</b> ${esc(bare(p.links.demo))} <span class="dim">(${ch?.status === 'ok' ? `live, checked ${esc(longDate(ch.checked))}` : ch?.status === 'failed' ? `unavailable when checked ${esc(longDate(ch.checked))}` : 'availability not yet verified'})</span></li>`;
  };
  const sheet = p => {
    const img = p.images.find(i => i.id === p.defaultImageId);
    return `<section class="sheet project" data-project="${esc(p.id)}">
  <div class="p-head"><span class="eyebrow">${esc(KIND[p.kind])} · ${esc(owner(p))} · updated ${esc(longDate(p.contribution.date))}</span>
  <h2>${esc(p.title)}</h2><p class="summary">${esc(p.summary)}</p>
  <div class="badges"><span class="badge role">Yorke's role: ${esc(ROLE[p.contribution.role])}</span><span class="badge">${esc(EVIDENCE[p.evidence.level])}</span>${p.methodTags.map(t => `<span class="tag">${esc(METHOD[t])}</span>`).join('')}${p.domainTags.map(t => `<span class="tag">${esc(DOMAIN[t])}</span>`).join('')}</div></div>
  <figure><img src="img/${esc(p.id)}.jpg" alt="${esc(img.alt)}"><figcaption>${esc(img.caption)} <span class="dim">${esc(img.credit)}</span></figcaption></figure>
  <div class="cols">
    <div><h3>The problem</h3><p>${esc(p.narrative.problem)}</p><h3>A decision that mattered</h3><p>${esc(p.narrative.decision)}</p><h3>The trade-off</h3><p>${esc(p.narrative.tradeoff)}</p></div>
    <div><h3>Known limitation</h3><p>${esc(p.narrative.limitation)}</p>${p.narrative.caveat ? `<p class="caveat"><b>Note:</b> ${esc(p.narrative.caveat)}</p>` : ''}
      <h3>Who did the work</h3><p>Yorke: ${esc(ROLE[p.contribution.role])}.${p.contribution.roleNote ? ` ${esc(p.contribution.roleNote)}` : ''}${p.contribution.credits.length ? ` With ${p.contribution.credits.slice(0, 6).map(cr => `${esc(cr.name)}${cr.role ? ` (${esc(cr.role)})` : ''}`).join(', ')}${p.contribution.credits.length > 6 ? ` and ${p.contribution.credits.length - 6} more, listed on the portfolio page` : ''}.` : ''}</p>
      <h3>Evidence and links</h3><ul class="links">${p.evidence.links.slice(0, 4).map(e => `<li><b>${esc(e.label)}</b> (${esc(e.date)}): ${esc(bare(e.url.replace(/\/commit\/([0-9a-f]{7})[0-9a-f]+/, '/commit/$1')))}</li>`).join('')}${p.evidence.links.length > 4 ? `<li class="dim">${p.evidence.links.length - 4} more on the portfolio page</li>` : ''}${demo(p)}<li><b>Source:</b> ${esc(bare(p.links.source))}</li><li><b>Portfolio page:</b> ${esc(bare(share(p)))}</li></ul></div>
  </div>
  <footer class="pf">${esc(site.name)} · Portfolio · ${esc(share(p))}</footer>
</section>`;
  };
  return `${pageHead(`${site.name} · Full portfolio · ${snapshot.inventoryDate}`, 'print-portfolio.css')}<body>
<section class="sheet cover">
  <div class="grid-bg"></div>
  <span class="eyebrow">Portfolio · work since ${esc(longDate(snapshot.cutoff))}</span>
  <h1>${esc(site.name)}</h1>
  <p class="bio">${esc(site.bioLine)}</p>
  <p class="headline">${esc(site.headline)}</p>
  <div class="cover-stats"><div><b>${c.projects}</b><span>projects</span></div><div><b>${c.withDemo}</b><span>demo links</span></div><div><b>${Object.keys(c.byDomain).length}</b><span>domains</span></div><div><b>${Object.keys(c.byMethod).length}</b><span>methods</span></div></div>
  <p class="edition">Edition ${esc(longDate(snapshot.inventoryDate))} · ${esc(site.siteUrl)}</p>
</section>
<section class="sheet framework">
  <span class="eyebrow">How to read this body of work</span><h2>Four lenses on one catalog</h2>
  <div class="lens-grid">
    <div class="lens"><h3>01 · Volume</h3><p class="big">${c.projects} <span>distinct projects</span></p><p>${Object.entries(c.byOwner).map(([o, n]) => `${n} in ${esc(site.accounts[o] || o)}`).join(' · ')}. ${plural(c.withDemo, 'project')} with a demo link. Inventory of public work in yorkerhodes3 and Ethical-Tech-CoLab as of ${esc(longDate(snapshot.inventoryDate))}; a mirror counts once.</p></div>
    <div class="lens"><h3>02 · Depth</h3><p>Evidence: ${Object.entries(EVIDENCE).map(([k, l]) => `${l} <b>${c.byEvidence[k] || 0}</b>`).join(' · ')}.</p><p>Yorke's role: ${Object.entries(ROLE).map(([k, l]) => `${l} <b>${c.byRole[k] || 0}</b>`).join(' · ')}. Student work is credited to the students.</p><p>Each project states its problem, a consequential decision and trade-off, dated evidence and a known limitation.</p></div>
    <div class="lens"><h3>03 · Type</h3>${bars(rank(c.byKind), KIND)}</div>
    <div class="lens"><h3>04 · Focus: methods</h3>${bars(rank(c.byMethod), METHOD)}</div>
    <div class="lens wide"><h3>04 · Focus: domains</h3>${bars(rank(c.byDomain), DOMAIN)}<p class="dim">Projects carry several tags; counts overlap.</p></div>
  </div>
</section>
<section class="sheet contents">
  <span class="eyebrow">Contents</span><h2>${c.projects} projects, newest first</h2>
  <table><thead><tr><th>Project</th><th>Type</th><th>Yorke's role</th><th>Evidence</th><th>Updated</th></tr></thead><tbody>
  ${projects.map(p => `<tr><td>${esc(p.title)}</td><td>${esc(KIND[p.kind])}</td><td>${esc(ROLE[p.contribution.role])}</td><td>${esc(EVIDENCE[p.evidence.level])}</td><td>${esc(p.contribution.date)}</td></tr>`).join('')}
  </tbody></table>
</section>
${projects.map(sheet).join('\n')}
<script>
// Fit each project to one Letter page: shrink text and picture in small steps, never below 6.8pt.
window.fitSheets = () => { for (const s of document.querySelectorAll('.sheet.project, .sheet.framework')) { let fs = s.classList.contains('framework') ? 8.4 : 8.8, ih = 3.25; while (s.scrollHeight > s.clientHeight + 1 && (fs > 7.0 || ih > 1.7)) { if (fs > 7.0) fs -= 0.2; if (ih > 2.3 || fs <= 7.0) ih -= 0.1; s.style.setProperty('--fs', fs.toFixed(1) + 'pt'); s.style.setProperty('--img-h', ih.toFixed(2) + 'in'); } if (s.scrollHeight > s.clientHeight + 1) { s.dataset.fit = 'overflow'; s.style.height = 'auto'; s.style.minHeight = '11in'; } else s.dataset.fit = 'ok'; } };
document.fonts.ready.then(() => Promise.all([...document.images].map(i => i.decode().catch(() => null)))).then(window.fitSheets);
</script>
</body></html>`;
}

function paperHeader(site, career, subtitle) {
  return `<header class="band">
  <div><h1>${esc(site.name)}</h1><p class="sub">${esc(subtitle)}</p></div>
  <p class="contact">${esc(career.contact.location)}<br>${career.contact.links.map(l => `<a href="${esc(l.url)}">${esc(l.label)}</a>`).join('<br>')}</p>
</header>`;
}

export function renderCv({ site, career, selected, vocab }) {
  const ROLE = vocab.roles;
  const list = items => `<ul>${items.map(i => `<li>${esc(i)}</li>`).join('')}</ul>`;
  return `${pageHead(`${site.name} · CV · ${career.edition.revised}`, 'paper.css')}<body class="cv">
${paperHeader(site, career, site.headline)}
<p class="tagline">${esc(site.bioLine)}</p>
<section><h2>Profile</h2><p>${esc(career.profile)}</p></section>
<section><h2>Experience</h2>
${career.experience.map(org => `<div class="org"><h3>${esc(org.organization)} <span class="dates">${esc(org.period)}</span></h3>
${org.roles.map(r => `<div class="role"><h4>${esc(r.title)} <span class="dates">${esc(ym(r.start))} – ${esc(ym(r.end))}</span></h4>${list(r.bullets)}</div>`).join('')}</div>`).join('\n')}
</section>
<section><h2>Selected systems</h2><ul>${career.systems.map(s => `<li><b>${esc(s.name)}:</b> ${esc(s.detail)}</li>`).join('')}</ul></section>
<section><h2>Selected work since 2026</h2><p class="lead">From the portfolio at ${esc(site.siteUrl)}; each has a demo or source and its credits online.</p>
<ul>${selected.map(p => `<li><b>${esc(p.title)}</b> (${esc(ROLE[p.contribution.role])}): ${esc(p.summary)}</li>`).join('')}</ul></section>
<section><h2>Teaching and convening</h2>${list(career.teaching)}</section>
<section><h2>Public engagement</h2>${list(career.engagement)}</section>
<section><h2>Recognition</h2>${list(career.recognition)}</section>
<section><h2>Boards and affiliations</h2>${list(career.affiliations)}</section>
<section><h2>Education</h2><ul>${career.education.map(e => `<li><b>${esc(e.institution)}</b>, ${esc(e.degree)}, ${esc(e.year)}</li>`).join('')}</ul></section>
<section><h2>Skills and languages</h2><p>${esc(career.skills.join(' · '))}. Languages: ${esc(career.languages.join(', '))}.</p></section>
</body></html>`;
}

export function renderFullBio({ site, career }) {
  return `${pageHead(`${site.name} · Full Bio · ${career.edition.revised}`, 'paper.css')}<body class="bio">
${paperHeader(site, career, 'Biography')}
${career.fullBio.map(p => `<p>${esc(p)}</p>`).join('\n')}
<p class="edition">Edition ${esc(longDate(career.edition.revised))} · ${esc(site.siteUrl)}</p>
</body></html>`;
}

export function renderSpeakerBio({ site, career }) {
  return `${pageHead(`${site.name} · Speaker Bio · ${career.edition.revised}`, 'paper.css')}<body class="bio speaker">
${paperHeader(site, career, 'Speaker introduction')}
<p class="speaker-text">${esc(career.speakerBio)}</p>
<p class="edition">Edition ${esc(longDate(career.edition.revised))} · ${esc(career.speakerBio.split(/\s+/).length)} words · ${esc(site.siteUrl)}</p>
</body></html>`;
}
