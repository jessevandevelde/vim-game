import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
});

test('switches between Normal and Insert mode', async ({ page }) => {
  await page.goto('/challenge/ch1-07');
  const editor = page.locator('.monaco-editor textarea.inputarea');
  await editor.press('i');
  await expect(page.getByText('INSERT', { exact: true })).toBeVisible();
  await editor.press('Escape');
  await expect(page.getByText('NORMAL', { exact: true }).first()).toBeVisible();
});

test('completes a guided HJKL movement with a real Vim key', async ({ page }) => {
  await page.goto('/challenge/ch1-01');
  await page.locator('.monaco-editor textarea.inputarea').press('l');
  await expect(page.getByRole('dialog')).toContainText('Command landed');
  await expect(page.getByRole('dialog')).toContainText('100%');
});

test('deletes a word with an operator and motion', async ({ page }) => {
  await page.goto('/challenge/ch4-02');
  const editor = page.locator('.monaco-editor textarea.inputarea');
  await editor.press('d');
  await editor.press('w');
  await expect(page.getByRole('dialog')).toContainText('Command landed');
});

test('prevents arrow-key bypasses in guided movement', async ({ page }) => {
  await page.goto('/challenge/ch1-01');
  await page.locator('.monaco-editor textarea.inputarea').press('ArrowRight');
  await expect(page.getByRole('dialog')).toHaveCount(0);
});

test('persists completed campaign progress after reload', async ({ page }) => {
  await page.goto('/challenge/ch1-01');
  await page.locator('.monaco-editor textarea.inputarea').press('l');
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.reload();
  await expect(page.getByText('25 XP', { exact: true }).first()).toBeVisible();
});
