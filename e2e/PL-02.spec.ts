import { expect, test } from './fixtures';

/** PL-02: the binder survives a reload; a reset survives one too. */
test('collect 3 → reload keeps the binder; reset → reload is sealed', async ({ app, page }) => {
  await app.openBox();
  await app.focusPack();
  await app.tearPack();
  for (let i = 0; i < 3; i += 1) {
    await app.drawCard();
    await app.collect();
  }
  expect(await app.binderCount()).toBe(3);

  // the fixture's /?fresh drops itself from the URL, so this reload keeps storage
  await page.reload();
  await expect(page.locator('main[data-phase]')).toBeVisible();
  await app.waitForPhase('box-open');
  expect(await app.binderCount()).toBe(3);
  const stored = await page.evaluate(() => JSON.parse(window.localStorage.getItem('booster.v1') ?? 'null'));
  expect(stored).toMatchObject({ v: 1, collected: expect.any(Array) });
  expect(stored.collected).toHaveLength(3);
  await app.shot('PL-02', 'restored');

  await app.byTestId('reset').click();
  const confirm = app.byTestId('reset-confirm');
  if (await confirm.isVisible().catch(() => false)) await confirm.click();
  await app.waitForPhase('sealed');

  await page.reload();
  await expect(page.locator('main[data-phase]')).toBeVisible();
  // give a stray late write the chance to show up before asserting
  await page.waitForTimeout(300);
  expect(await app.phase()).toBe('sealed');
  expect(await app.binderCount()).toBe(0);
  expect(await page.evaluate(() => window.localStorage.getItem('booster.v1'))).toBeNull();
});
