import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { copyFileSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Plugin } from 'vite';

const r = (p: string) => fileURLToPath(new URL(p, import.meta.url));

/** GitHub Pages SPA fallback: `dist/404.html` is a copy of `dist/index.html` (PL-05). */
function spaFallback(): Plugin {
  let outDir = 'dist';
  return {
    name: 'booster:spa-404',
    apply: 'build',
    configResolved(config) {
      outDir = resolve(config.root, config.build.outDir);
    },
    closeBundle() {
      const index = join(outDir, 'index.html');
      if (existsSync(index)) copyFileSync(index, join(outDir, '404.html'));
    },
  };
}

export default defineConfig({
  // `/booster-cv/` on GitHub Pages (set by deploy.yml), `/` locally and on a custom domain
  base: process.env.VITE_BASE || '/',
  plugins: [react(), spaFallback()],
  resolve: { alias: { '@': r('./src'), '@content': r('./content') } },
  server: { host: true, port: 5173 },
  preview: { host: true, port: 4173 },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}', 'scripts/**/*.test.{ts,mjs}'],
    css: { modules: { classNameStrategy: 'non-scoped' } },
    coverage: { provider: 'v8', include: ['src/machine/reducer.ts', 'src/machine/hold.ts'] },
  },
});
