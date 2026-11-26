// Minimal static server for previews and PDF printing. Usage: node src/build/serve.mjs [dir] [port]
import { createServer } from 'node:http';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { join, normalize, extname } from 'node:path';

const TYPES = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.webp': 'image/webp', '.woff2': 'font/woff2', '.pdf': 'application/pdf', '.txt': 'text/plain', '.xml': 'application/xml' };

export function startServer(root = 'dist', port = 4173) {
  const server = createServer((req, res) => {
    let p = decodeURIComponent(new URL(req.url, 'http://x').pathname).replace(/^\/portfolio(?=\/|$)/, '');
    p = join(root, normalize(p).replace(/^(\.\.(\/|$))+/, ''));
    if (existsSync(p) && statSync(p).isDirectory()) p = join(p, 'index.html');
    if (!existsSync(p)) { res.writeHead(404, { 'Content-Type': TYPES['.html'] }).end(existsSync(join(root, '404.html')) ? readFileSync(join(root, '404.html')) : 'Not found'); return; }
    res.writeHead(200, { 'Content-Type': TYPES[extname(p)] || 'application/octet-stream' });
    res.end(req.method === 'HEAD' ? undefined : readFileSync(p));
  });
  return new Promise(resolve => server.listen(port, '127.0.0.1', () => resolve(server)));
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const [root = 'dist', port = '4173'] = process.argv.slice(2);
  const s = await startServer(root, Number(port));
  console.log(`serving ${root} at http://127.0.0.1:${s.address().port}/ (also under /portfolio/)`);
}
