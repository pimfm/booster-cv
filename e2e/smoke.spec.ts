import { test, expect } from '@playwright/test';

test('page loads with the right title', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/Pim/);
  await expect(page.locator('main')).toBeVisible();
});
