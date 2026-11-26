import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../../node_modules/@fontsource/', import.meta.url));
export const FONT_FILES = {
  'Bebas Neue': [[400, 'bebas-neue/files/bebas-neue-latin-400-normal.woff2']],
  'Space Mono': [[400, 'space-mono/files/space-mono-latin-400-normal.woff2'], [700, 'space-mono/files/space-mono-latin-700-normal.woff2']],
  Inter: [[400, 'inter/files/inter-latin-400-normal.woff2'], [600, 'inter/files/inter-latin-600-normal.woff2'], [700, 'inter/files/inter-latin-700-normal.woff2']],
};

/** @font-face rules with inline data URLs, for pages rendered from strings (cards, share images). */
export function inlineFontFaces() {
  return Object.entries(FONT_FILES).flatMap(([family, files]) => files.map(([weight, f]) =>
    `@font-face{font-family:"${family}";font-weight:${weight};font-style:normal;src:url(data:font/woff2;base64,${readFileSync(root + f).toString('base64')}) format("woff2")}`)).join('\n');
}
