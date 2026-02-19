import { test, expect } from '@playwright/test';
import { devices } from '@playwright/test';

test.use({
  ...devices['iPhone SE'],
  viewport: { width: 375, height: 667 },
});

test('docs page has no horizontal overflow on mobile viewport', async ({ page }) => {
  await page.goto('http://localhost:3000/docs/context-structure.html');

  await page.waitForLoadState('networkidle');

  const noHorizontalOverflow = await page.evaluate(() => {
    const html = document.documentElement;
    return html.scrollWidth <= html.clientWidth;
  });

  expect(noHorizontalOverflow).toBe(true);
});
