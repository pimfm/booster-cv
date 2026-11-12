import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import meta from '@content/meta';
import { palette } from '@/design/tokens';

// Parses the source index.html (no build). Vite replaces %VITE_SITE_URL% at build time;
// deploy.yml greps dist/index.html for the absolute og:image and the sub-path assets.
const html = readFileSync(resolve(process.cwd(), 'index.html'), 'utf8'); // vitest runs at the repo root;
const doc = new DOMParser().parseFromString(html, 'text/html');

const attr = (selector: string, name = 'content') =>
  doc.head.querySelector(selector)?.getAttribute(name);

describe('index.html head', () => {
  it('has English defaults that match content/meta.ts', () => {
    expect(doc.title).toBe(meta.og.title.en);
    expect(attr('meta[name="description"]')).toBe(meta.og.description.en);
    expect(attr('meta[property="og:title"]')).toBe(meta.og.title.en);
    expect(attr('meta[property="og:description"]')).toBe(meta.og.description.en);
    expect(attr('meta[name="twitter:title"]')).toBe(meta.og.title.en);
    expect(attr('meta[name="twitter:description"]')).toBe(meta.og.description.en);
  });

  it('declares a large absolute OG image', () => {
    expect(attr('meta[property="og:type"]')).toBe('website');
    expect(attr('meta[property="og:image"]')).toBe('%VITE_SITE_URL%/og.png');
    expect(attr('meta[name="twitter:image"]')).toBe('%VITE_SITE_URL%/og.png');
    expect(attr('meta[property="og:image:width"]')).toBe('1200');
    expect(attr('meta[property="og:image:height"]')).toBe('630');
    expect(attr('meta[name="twitter:card"]')).toBe('summary_large_image');
  });

  it('declares both locales', () => {
    expect(attr('meta[property="og:locale"]')).toBe('en_GB');
    expect(attr('meta[property="og:locale:alternate"]')).toBe('nl_NL');
  });

  it('uses paper as theme colour and links icons and manifest', () => {
    expect(attr('meta[name="theme-color"]')).toBe(palette.paper);
    expect(attr('link[rel="icon"][type="image/svg+xml"]', 'href')).toBe('/favicon.svg');
    expect(attr('link[rel="apple-touch-icon"]', 'href')).toBe('/apple-touch-icon.png');
    expect(attr('link[rel="manifest"]', 'href')).toBe('/site.webmanifest');
  });
});
