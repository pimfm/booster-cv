import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';

const r = (p: string) => fileURLToPath(new URL(p, import.meta.url));

export default defineConfig({
  base: process.env.VITE_BASE ?? '/',
  plugins: [react()],
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
