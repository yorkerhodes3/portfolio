// Three-picture gallery (SPECIFICATION FR-06): opens on the default picture; keyboard, buttons and swipe.
// Browsing never changes the stored default, which is the picture printed in the portfolio PDF.
for (const fig of document.querySelectorAll('[data-gallery]')) {
  const images = JSON.parse(fig.querySelector('script[type="application/json"]').textContent);
  const stage = fig.querySelector('.stage');
  const img = stage.querySelector('img');
  const fallback = stage.querySelector('.img-fallback');
  const pos = fig.querySelector('.pos');
  const caption = fig.querySelector('.caption-text');
  const credit = fig.querySelector('.credit');
  const thumbs = [...fig.querySelectorAll('.thumbs button')];
  let i = Number(fig.dataset.default) || 0;

  function show(n) {
    i = (n + images.length) % images.length;
    const im = images[i];
    fallback.hidden = true; img.hidden = false;
    img.src = im.full; img.alt = im.alt; img.width = im.width; img.height = im.height;
    caption.textContent = im.caption; credit.textContent = im.credit;
    pos.textContent = `${i + 1} / ${images.length}`;
    thumbs.forEach((t, k) => t.setAttribute('aria-current', String(k === i)));
  }
  img.addEventListener('error', () => { img.hidden = true; fallback.hidden = false; fallback.textContent = `Picture unavailable: ${images[i].alt}`; });
  fig.querySelector('[data-prev]').addEventListener('click', () => show(i - 1));
  fig.querySelector('[data-next]').addEventListener('click', () => show(i + 1));
  thumbs.forEach((t, k) => t.addEventListener('click', () => show(k)));
  fig.addEventListener('keydown', e => {
    if (e.key === 'ArrowLeft') { e.preventDefault(); show(i - 1); }
    if (e.key === 'ArrowRight') { e.preventDefault(); show(i + 1); }
  });
  let x0 = null;
  stage.addEventListener('pointerdown', e => { x0 = e.clientX; });
  stage.addEventListener('pointerup', e => {
    if (x0 === null) return;
    const dx = e.clientX - x0; x0 = null;
    if (Math.abs(dx) > 40) show(dx < 0 ? i + 1 : i - 1);
  });
  show(i);
}

// Return to the dashboard with the visitor's filters intact.
const back = document.querySelector('[data-back]');
if (back) { try { const q = sessionStorage.getItem('portfolio:catalog'); if (q) back.href = `${back.getAttribute('href').split('#')[0]}${q}#work`; } catch { /* storage disabled */ } }
