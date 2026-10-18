import { test, expect } from '@playwright/test';

test('light mode starts Snake locally and stops its worker', async ({ page }) => {
  const external: string[] = [];
  page.on('request', request => { if (request.url().includes('pygame-web.github.io')) external.push(request.url()); });
  await page.goto('/pygame');
  await expect(page.getByLabel('Ажиллуулах горим')).toHaveValue('light');
  await page.getByRole('button', { name: 'Snake жишээ' }).click();
  await expect(page.getByText('Pygame бэлэн — кодоо шууд ажиллуулж болно.')).toBeVisible();
  await expect(page.locator('.py-unsupported')).toHaveCount(0);
  await page.getByRole('button', { name: 'Ажиллуулах', exact: true }).click();
  await expect(page.locator('.pygame-status')).toHaveText('Ажиллаж байна');
  const canvas = page.frameLocator('iframe').locator('canvas');
  await expect.poll(() => canvas.evaluate(node => {
    const c = node as HTMLCanvasElement;
    return [...c.getContext('2d')!.getImageData(300, 200, 1, 1).data];
  })).not.toEqual([0, 0, 0, 0]);
  await canvas.press('ArrowDown');
  await page.getByRole('button', { name: 'Зогсоох', exact: true }).click();
  await expect(page.locator('iframe')).toHaveCount(0);
  expect(external).toEqual([]);
});

test('unsupported APIs are red and prevent light execution, full mode remains available', async ({ page }) => {
  await page.goto('/pygame');
  await page.getByRole('textbox', { name: 'Pygame Python код' }).fill('import pygame\npygame.image.load("sprite.png")');
  await expect(page.locator('.py-unsupported').first()).toBeVisible();
  await expect(page.locator('#python-diagnostics')).toContainText('дэмжигдэхгүй');
  await expect(page.getByRole('button', { name: 'Ажиллуулах', exact: true })).toBeDisabled();
  await page.getByLabel('Ажиллуулах горим').selectOption('full');
  await expect(page.locator('.py-unsupported')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Ажиллуулах', exact: true })).toBeEnabled();
});
