// Catalog filtering (SPECIFICATION FR-03): any selected tag within a facet, all facets together.
// Cards are pre-rendered; this script only shows, orders and groups them. State lives in the URL.
const data = JSON.parse(document.getElementById('catalog-data').textContent);
const FACETS = { m: 'methods', d: 'domains', k: 'kinds' };
const LABEL = { m: data.labels.method, d: data.labels.domain, k: data.labels.kind };
const cardsRoot = document.getElementById('cards');
const template = new Map([...cardsRoot.querySelectorAll('[data-id]')].map(el => [el.dataset.id, el]));
const sortSel = document.getElementById('sort');
const groupSel = document.getElementById('group');
const statusText = document.getElementById('status-text');
const clearBtn = document.getElementById('clear');
const empty = document.getElementById('empty');
document.getElementById('filters').hidden = false;

const state = { m: new Set(), d: new Set(), k: new Set(), sort: 'newest', group: 'none' };

function readUrl() {
  const q = new URLSearchParams(location.search);
  for (const f of Object.keys(FACETS)) state[f] = new Set((q.get(f) || '').split(',').filter(t => LABEL[f][t]));
  state.sort = q.get('sort') === 'title' ? 'title' : 'newest';
  state.group = ['method', 'domain', 'kind'].includes(q.get('group')) ? q.get('group') : 'none';
}
function writeUrl() {
  const q = new URLSearchParams();
  for (const f of Object.keys(FACETS)) if (state[f].size) q.set(f, [...state[f]].sort().join(','));
  if (state.sort !== 'newest') q.set('sort', state.sort);
  if (state.group !== 'none') q.set('group', state.group);
  const search = q.toString() ? `?${q}` : '';
  history.replaceState(null, '', `${location.pathname}${search}${location.hash}`);
  try { sessionStorage.setItem('portfolio:catalog', search); } catch { /* storage disabled */ }
}
const matches = p => Object.entries(FACETS).every(([f, key]) => !state[f].size || p[key].some(t => state[f].has(t)));
const order = (a, b) => state.sort === 'title' ? a.title.localeCompare(b.title) || a.id.localeCompare(b.id)
  : b.date.localeCompare(a.date) || a.title.localeCompare(b.title) || a.id.localeCompare(b.id);

function render() {
  const shown = data.projects.filter(matches).sort(order);
  cardsRoot.replaceChildren();
  if (state.group === 'none') {
    const list = document.createElement('ul'); list.className = 'cards'; list.setAttribute('role', 'list');
    for (const p of shown) list.append(template.get(p.id));
    cardsRoot.append(list);
  } else {
    const key = { method: 'methods', domain: 'domains', kind: 'kinds' }[state.group];
    const labels = data.labels[state.group];
    const groups = new Map();
    for (const p of shown) for (const t of p[key]) (groups.get(t) || groups.set(t, []).get(t)).push(p);
    for (const [t, ps] of [...groups].sort((a, b) => labels[a[0]].localeCompare(labels[b[0]]))) {
      const h = document.createElement('h3'); h.className = 'group-title';
      h.innerHTML = `${labels[t]} <span>${ps.length} project${ps.length === 1 ? '' : 's'}</span>`;
      const list = document.createElement('ul'); list.className = 'cards'; list.setAttribute('role', 'list');
      for (const p of ps) list.append(template.get(p.id).cloneNode(true));
      cardsRoot.append(h, list);
    }
  }
  for (const btn of document.querySelectorAll('[data-facet]')) btn.setAttribute('aria-pressed', String(state[btn.dataset.facet].has(btn.dataset.tag)));
  sortSel.value = state.sort; groupSel.value = state.group;
  const active = Object.keys(FACETS).flatMap(f => [...state[f]].map(t => LABEL[f][t]));
  statusText.innerHTML = `Showing <strong>${shown.length}</strong> of ${data.projects.length} projects` +
    (active.length ? ` · filtered by ${active.map(a => `<strong>${a}</strong>`).join(', ')}` : '') +
    (state.group !== 'none' && shown.length ? ` · grouped by ${groupSel.selectedOptions[0].textContent.toLowerCase()}; a project can appear in more than one group` : '');
  clearBtn.hidden = !active.length;
  empty.hidden = shown.length > 0;
  writeUrl();
}

document.addEventListener('click', e => {
  const chip = e.target.closest('[data-facet]');
  if (chip) { const s = state[chip.dataset.facet]; s.has(chip.dataset.tag) ? s.delete(chip.dataset.tag) : s.add(chip.dataset.tag); render(); return; }
  const apply = e.target.closest('[data-apply]');
  if (apply) {
    e.preventDefault();
    for (const f of Object.keys(FACETS)) state[f].clear();
    state[apply.dataset.applyFacet].add(apply.dataset.apply);
    render();
    document.getElementById('work').scrollIntoView();
    document.getElementById('status-text').focus({ preventScroll: true });
    return;
  }
  if (e.target.closest('#clear, [data-clear]')) { for (const f of Object.keys(FACETS)) state[f].clear(); render(); }
});
sortSel.addEventListener('change', () => { state.sort = sortSel.value; render(); });
groupSel.addEventListener('change', () => { state.group = groupSel.value; render(); });
readUrl();
render();
