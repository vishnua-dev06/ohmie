import { expect, test } from '@playwright/test';

test('preview dashboard navigates to the private organizer', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('/');
  await expect(page.getByRole('heading', { name: /Good .* friend/i })).toBeVisible();
  await expect(page.getByText(/preview mode/i).first()).toBeVisible();
  await page.screenshot({ path: 'work/ohmie-dashboard-desktop.png', fullPage: true });
  await page.getByRole('link', { name: 'Daily organizer' }).click();
  await expect(page.getByRole('heading', { name: 'Your daily rhythm.' })).toBeVisible();
});

test('mobile navigation remains available on narrow screens', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await page.getByRole('button', { name: 'Open menu' }).click();
  await expect(page.getByRole('link', { name: 'Mood tracker' })).toBeVisible();
});
