const { test, expect } = require('@playwright/test');

test('draw room and calculate carpet', async ({ page }) => {
  await page.goto('http://localhost:8000'); // Serve app locally
  await page.click('#btnDraw');
  await page.mouse.down(100, 100);
  await page.mouse.move(200, 150);
  await page.mouse.up();
  await page.click('#calculate');
  await expect(page.locator('#results')).toContainText('Total Area');
});

test('save and load plan', async ({ page }) => {
  await page.goto('http://localhost:8000');
  await page.click('#savePlan');
  const planId = await page.locator('#currentPlanId').textContent();
  await page.click('#showLoadModal');
  await page.fill('#loadInput', planId);
  await page.click('#loadBtn');
  await expect(page.locator('#roomsList')).toBeVisible();
});