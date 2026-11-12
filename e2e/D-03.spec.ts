import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test.describe('D-03 /dev/kit', () => {
  test('has no axe violations and is screenshotted', async ({ page }, testInfo) => {
    await page.goto('/dev/kit');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await page.evaluate(() => document.fonts.ready);
    // let the SegmentBar fills settle
    await expect(page.getByRole('meter').first()).toBeVisible();
    await page.waitForTimeout(600);

    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`)).toEqual([]);

    await page.screenshot({ path: `e2e/__screens__/D-03-kit-${testInfo.project.name}.png`, fullPage: true });
  });

  test('controls work with the keyboard', async ({ page }) => {
    await page.goto('/dev/kit');
    const nl = page.getByRole('group', { name: 'Language' }).first().getByRole('button', { name: 'NL' });
    await nl.focus();
    await page.keyboard.press('Space');
    await expect(nl).toHaveAttribute('aria-pressed', 'true');

    const sw = page.getByRole('switch').last();
    await expect(sw).toHaveAttribute('aria-checked', 'false');
    await sw.focus();
    await page.keyboard.press('Space');
    await expect(sw).toHaveAttribute('aria-checked', 'true');
  });
});
