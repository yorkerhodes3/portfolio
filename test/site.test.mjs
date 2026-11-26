// Browser smoke test of the built site (run after `npm run build`): filters, grouping, gallery, downloads.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { chromium } from 'playwright-core';
import { startServer } from '../src/build/serve.mjs';
import { chromePath } from '../src/build/capture.mjs';

const ROOT = resolve(import.meta.dirname, '..');
const ready = existsSync(resolve(ROOT, 'dist/index.html'));

test('dashboard filters, groups and project gallery work in a browser', { skip: !ready && 'run npm run build first' }, async () => {
  process.chdir(ROOT);
  const snap = JSON.parse(readFileSync('catalog/snapshot.json', 'utf8'));
  const server = await startServer('dist', 0);
  const browser = await chromium.launch({ executablePath: chromePath() });
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    const origin = `http://127.0.0.1:${server.address().port}`;
    await page.goto(`${origin}/`);
    const visible = () => page.locator('#cards li.card').count();
    assert.equal(await visible(), snap.projects.length);
    assert.equal(await page.locator('#clear').isVisible(), false, 'no Clear filters button without filters');

    // Pick a method and a domain that co-occur, then expect exactly their intersection.
    const p0 = snap.projects[0];
    const [m, d] = [p0.methodTags[0], p0.domainTags[0]];
    const expected = snap.projects.filter(p => p.methodTags.includes(m) && p.domainTags.includes(d)).length;
    await page.click(`[data-facet="m"][data-tag="${m}"]`);
    await page.click(`[data-facet="d"][data-tag="${d}"]`);
    assert.equal(await visible(), expected);
    assert.match(await page.locator('#status-text').innerText(), new RegExp(`Showing ${expected} of ${snap.projects.length}`));
    assert.match(page.url(), new RegExp(`m=${m}`));

    await page.selectOption('#group', 'method');
    assert.match(await page.locator('#status-text').innerText(), new RegExp(`Showing ${expected} of`), 'grouping keeps the distinct count');
    await page.click('#clear');
    assert.equal(await page.locator('#cards li.card').count() >= snap.projects.length, true);
    await page.selectOption('#group', 'none');
    assert.equal(await visible(), snap.projects.length);

    // Empty state: a method and a domain that no project shares.
    const tags = Object.keys(snap.counts.byDomain);
    const method = Object.keys(snap.counts.byMethod).find(t => !snap.projects.some(p => p.methodTags.includes(t) && p.domainTags.includes(tags[0])));
    if (method) {
      await page.click(`[data-facet="m"][data-tag="${method}"]`);
      await page.click(`[data-facet="d"][data-tag="${tags[0]}"]`);
      assert.equal(await page.locator('#empty').isVisible(), true);
      await page.click('[data-clear]');
      assert.equal(await page.locator('#empty').isVisible(), false);
    }

    // Project page: gallery opens on the default, keyboard moves it, the default stays put.
    const p = snap.projects.find(x => x.images[0].id !== x.defaultImageId) || snap.projects[0];
    await page.goto(`${origin}/p/${p.id}/`);
    const idx = p.images.findIndex(i => i.id === p.defaultImageId);
    assert.equal(await page.locator('.gallery .pos').innerText(), `${idx + 1} / 3`);
    await page.focus('.gallery .stage');
    await page.keyboard.press('ArrowRight');
    assert.equal(await page.locator('.gallery .pos').innerText(), `${((idx + 1) % 3) + 1} / 3`);
    assert.equal(await page.locator('meta[property="og:image"]').getAttribute('content'), new URL(p.media[p.defaultImageId].full, 'https://yorkerhodes3.github.io/portfolio/').href);

    // Accessibility: no WCAG 2.1 A/AA violations on the dashboard or a project page.
    const axe = readFileSync('node_modules/axe-core/axe.min.js', 'utf8');
    for (const path of ['/', `/p/${p.id}/`]) {
      await page.goto(`${origin}${path}`, { waitUntil: 'networkidle' });
      await page.addScriptTag({ content: axe });
      const r = await page.evaluate(() => window.axe.run(document, { runOnly: ['wcag2a', 'wcag2aa', 'wcag21aa'] }));
      assert.deepEqual(r.violations.map(v => `${v.id}: ${v.nodes[0].target}`), [], `axe on ${path}`);
    }

    // Narrow screen: no horizontal page scroll.
    await page.setViewportSize({ width: 320, height: 800 });
    await page.goto(`${origin}/`);
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1), 'no horizontal scroll at 320 px');
  } finally {
    await browser.close();
    server.close();
  }
});
