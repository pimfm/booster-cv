#!/usr/bin/env node
// og-render — screenshots /dev/og into the committed share images (PL-04).
//
//   public/og.png              1200×630 @2x (2400×1260) link preview
//   public/apple-touch-icon.png  180×180 icon from /dev/og?icon
//
// Starts a Vite dev server on a free port, drives Chromium (Playwright), closes both.
// Re-run after changing content/meta.ts, packs, or tokens:  npm run og:render
import { createServer as createNetServer } from 'node:net';
import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';
import { chromium } from '@playwright/test';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const out = (name) => resolve(root, 'public', name);

function freePort() {
  return new Promise((ok, fail) => {
    const srv = createNetServer();
    srv.once('error', fail);
    srv.listen(0, '127.0.0.1', () => {
      const { port } = srv.address();
      srv.close(() => ok(port));
    });
  });
}

async function shoot(browser, url, { width, height, scale, selector, path }) {
  const context = await browser.newContext({
    viewport: { width, height },
    deviceScaleFactor: scale,
    reducedMotion: 'reduce',
  });
  const page = await context.newPage();
  page.on('pageerror', (err) => console.error(`[og-render] page error: ${err.message}`));
  await page.goto(url, { waitUntil: 'networkidle' });
  const target = page.locator(selector);
  await target.waitFor({ state: 'visible' });
  await page.evaluate(() => globalThis.document.fonts.ready);
  await target.screenshot({ path, animations: 'disabled' });
  await context.close();
  console.log(`[og-render] ${path.slice(root.length + 1)} (${width * scale}×${height * scale})`);
}

const port = await freePort();
const server = await createServer({
  root,
  base: '/',
  logLevel: 'warn',
  server: { host: '127.0.0.1', port, strictPort: true, hmr: false },
});
let browser;
try {
  await server.listen();
  const origin = `http://127.0.0.1:${port}`;
  mkdirSync(resolve(root, 'public'), { recursive: true });
  browser = await chromium.launch();
  await shoot(browser, `${origin}/dev/og`, {
    width: 1200,
    height: 630,
    scale: 2,
    selector: '[data-og="card"]',
    path: out('og.png'),
  });
  await shoot(browser, `${origin}/dev/og?icon`, {
    width: 180,
    height: 180,
    scale: 1,
    selector: '[data-og="icon"]',
    path: out('apple-touch-icon.png'),
  });
} finally {
  await browser?.close();
  await server.close();
}
