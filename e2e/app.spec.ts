import { test, expect, type Page } from '@playwright/test';
const shot = (p: Page, n: string) => p.waitForTimeout(250).then(() => p.screenshot({ path: `screens/${n}.png` }));
const day = (o: number) => { const d = new Date(); d.setDate(d.getDate() + o); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };

test('review session, deck, progress, settings', async ({ page }) => {
  await page.goto('./'); await page.evaluate(() => localStorage.clear()); await page.reload();
  await expect(page.getByTestId('start')).toBeVisible();
  await shot(page, '01-today');
  await page.getByTestId('start').click();
  await shot(page, '02-card-front');
  await page.getByTestId('show').click();
  await shot(page, '03-card-answer');
  await page.getByTestId('grade-again').click();
  for (let i = 0; i < 30 && await page.getByTestId('show').isVisible(); i++) {
    await page.getByTestId('show').click();
    await page.getByTestId(i % 4 === 3 ? 'grade-easy' : 'grade-good').click();
  }
  await expect(page.getByText('All done for today')).toBeVisible();
  await shot(page, '04-done');
  const st = await page.evaluate(() => JSON.parse(localStorage.getItem('hanzi-flashcards-v1')!));
  expect(Object.keys(st.cards)).toHaveLength(10);
  expect(st.log[Object.keys(st.log)[0]]).toBe(11);

  await page.getByTestId('tab-deck').click(); await shot(page, '05-deck');
  await page.getByTestId('search').fill('ni'); await page.locator('.row-btn').first().click(); await shot(page, '06-deck-search');

  // seed three weeks of history for a realistic progress screen
  await page.evaluate(({ days }) => {
    const s = JSON.parse(localStorage.getItem('hanzi-flashcards-v1')!);
    days.forEach((d: string, i: number) => { if (i % 9 !== 4 || i > 15) s.log[d] = 8 + (i * 7) % 15; });
    const order = '一二三十八九七六五四人大小中日月火水木口'.split('');
    order.forEach((c: string, i: number) => { s.cards[c] = { ef: 2.5, ivl: i < 8 ? 25 + i : 3 + (i % 5), reps: 4, due: days[days.length - 1 - (i % 3)], lapses: 0, seen: days[0] }; });
    localStorage.setItem('hanzi-flashcards-v1', JSON.stringify(s));
  }, { days: Array.from({ length: 24 }, (_, i) => day(i - 24)) });
  await page.reload();
  await page.getByTestId('tab-stats').click(); await shot(page, '07-progress');
  await page.getByTestId('tab-more').click(); await shot(page, '08-settings');
  await page.getByText('meaning → 字').click();
  await page.getByTestId('tab-review').click(); await shot(page, '09-today-due');
  await page.getByTestId('start').click(); await shot(page, '10-reverse-front');
  await page.getByTestId('show').click(); await shot(page, '11-reverse-answer');
});
