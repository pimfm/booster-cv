/**
 * `import { test, expect } from './fixtures'` in every story spec.
 *
 *   test('opens', async ({ app }) => {
 *     await app.openBox();
 *     expect(await app.phase()).toBe('box-open');
 *   });
 *
 * `holdMs` (default 50) is written to `window.__BOOSTER_HOLD_MS__` before the app loads;
 * override per file or describe with `test.use({ holdMs: 600 })`.
 */
import { test as base, expect } from '@playwright/test';
import { createApp } from './helpers/app';
import type { App } from './helpers/app';

export interface Fixtures {
  holdMs: number;
  app: App;
}

export const test = base.extend<Fixtures>({
  holdMs: [50, { option: true }],
  app: async ({ page, holdMs }, provide, testInfo) => {
    await page.addInitScript((ms) => {
      window.__BOOSTER_HOLD_MS__ = ms;
      // once per test: a reload inside the test keeps what the test stored
      if (window.sessionStorage.getItem('__booster_cleared') === null) {
        window.localStorage.clear();
        window.sessionStorage.setItem('__booster_cleared', '1');
      }
    }, holdMs);
    await page.goto('/?fresh');
    await expect(page.locator('main[data-phase]')).toBeVisible();
    await provide(createApp(page, testInfo, holdMs));
  },
});

export { expect };
export type { App, Phase, ProjectTraits } from './helpers/app';
