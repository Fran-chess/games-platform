import { test, expect, type Page } from '@playwright/test';
import {
  getCoreWebVitals,
  getScriptWeight,
  measureHeapMB,
  saveMetrics,
  startFrameRecorder,
  stopFrameRecorder,
  throttleCPU,
} from './helpers/performance';

/** The test machine is several times faster than the event tablet (Lenovo Tab M11) */
const CPU_THROTTLE_RATE = 4;
const TOTAL_CARDS = 12;
const ROUNDS_FOR_MEMORY_TEST = 5;

type StorageWindow = Window & { __storageWrites?: number };

const game = (page: Page, phase: string) => page.locator(`[data-testid="game"][data-phase="${phase}"]`);
const cards = (page: Page) => page.locator('[data-testid="memo-card"]');

async function openWaitingScreen(page: Page) {
  await page.goto('/');
  await page.locator('[data-testid="waiting-screen"]').waitFor();
}

/** Waits for the playing phase and returns the icon of each card, by board position */
async function waitForBoard(page: Page): Promise<string[]> {
  await game(page, 'playing').waitFor();
  await expect(cards(page)).toHaveCount(TOTAL_CARDS);
  return cards(page).evaluateAll((els) => els.map((el) => el.getAttribute('data-icon') ?? ''));
}

/** Board positions grouped by icon: every entry is a matching pair */
function findPairs(icons: string[]): number[][] {
  const byIcon = new Map<string, number[]>();
  icons.forEach((icon, index) => byIcon.set(icon, [...(byIcon.get(icon) ?? []), index]));
  return [...byIcon.values()];
}

async function flipPair(page: Page, [first, second]: number[], expectedState: 'matched' | 'hidden') {
  await cards(page).nth(first).click();
  await cards(page).nth(second).click();
  // Both cards face up first: 'hidden' must mean "flipped back", not "the tap was ignored"
  await expect(cards(page).nth(second)).not.toHaveAttribute('data-state', 'hidden');
  await expect(cards(page).nth(first)).toHaveAttribute('data-state', expectedState);
  await expect(cards(page).nth(second)).toHaveAttribute('data-state', expectedState);
}

/** Two wrong attempts end the round: the required pairs are no longer reachable */
async function loseRound(page: Page) {
  const pairs = findPairs(await waitForBoard(page));
  await flipPair(page, [pairs[0][0], pairs[1][0]], 'hidden');
  await cards(page).nth(pairs[2][0]).click();
  await cards(page).nth(pairs[3][0]).click();
  await page.locator('[data-testid="defeat-screen"]').waitFor();
}

test.describe('Memotest Performance', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      const w = window as StorageWindow;
      w.__storageWrites = 0;
      const setItem = Storage.prototype.setItem;
      Storage.prototype.setItem = function (...args) {
        w.__storageWrites = (w.__storageWrites ?? 0) + 1;
        return setItem.apply(this, args);
      };
    });
    await throttleCPU(page, CPU_THROTTLE_RATE);
  });

  test('Load time and Core Web Vitals', async ({ page }) => {
    const startTime = Date.now();
    await openWaitingScreen(page);
    const loadTime = Date.now() - startTime;

    const vitals = await getCoreWebVitals(page);
    const scripts = await getScriptWeight(page);

    // ✅ Guardar ANTES de assertions
    saveMetrics('memotest-load.json', { loadTime, vitals, scripts });

    expect(loadTime).toBeLessThan(5000);
    if (vitals.lcp) {
      expect(vitals.lcp).toBeLessThan(4000);
    }
  });

  test('Winning round (frame pacing)', async ({ page }) => {
    await openWaitingScreen(page);

    // Intro: tap on the waiting screen until the board is playable
    await startFrameRecorder(page);
    const tapTime = Date.now();
    await page.locator('[data-testid="waiting-screen"]').click();
    await game(page, 'memorizing').waitFor();
    const tapToMemorizeMs = Date.now() - tapTime;
    const pairs = findPairs(await waitForBoard(page));
    const intro = await stopFrameRecorder(page);

    // Gameplay: two matching pairs, prize pick and result screen
    await startFrameRecorder(page);
    await flipPair(page, pairs[0], 'matched');
    await flipPair(page, pairs[1], 'matched');
    await game(page, 'prize').waitFor();
    await page.locator('[data-testid="prize-card"]').first().click();
    await page.locator('[data-testid="prize-result"]').waitFor({ timeout: 15000 });
    const gameplay = await stopFrameRecorder(page);

    const storageWrites = await page.evaluate(() => (window as StorageWindow).__storageWrites ?? 0);

    // ✅ Guardar ANTES de assertions
    saveMetrics('memotest-round-win.json', { tapToMemorizeMs, intro, gameplay, storageWrites });

    expect(intro.longTasks.maxMs).toBeLessThan(400);
    expect(gameplay.longTasks.maxMs).toBeLessThan(400);
  });

  test('Losing round (frame pacing)', async ({ page }) => {
    await openWaitingScreen(page);
    await page.locator('[data-testid="waiting-screen"]').click();
    await waitForBoard(page);

    await startFrameRecorder(page);
    await loseRound(page);
    const gameplay = await stopFrameRecorder(page);

    // ✅ Guardar ANTES de assertions
    saveMetrics('memotest-round-loss.json', { gameplay });

    expect(gameplay.longTasks.maxMs).toBeLessThan(400);
  });

  test('Memory after repeated rounds (no leaks)', async ({ page }) => {
    await openWaitingScreen(page);
    const heapBeforeMB = await measureHeapMB(page);

    await page.locator('[data-testid="waiting-screen"]').click();
    for (let round = 1; round <= ROUNDS_FOR_MEMORY_TEST; round++) {
      await loseRound(page);
      const isLastRound = round === ROUNDS_FOR_MEMORY_TEST;
      await page.locator(`[data-testid="${isLastRound ? 'back-to-start' : 'play-again'}"]`).click();
    }
    await page.locator('[data-testid="waiting-screen"]').waitFor();

    const heapAfterMB = await measureHeapMB(page);
    const increaseMB = heapAfterMB - heapBeforeMB;

    // ✅ Guardar ANTES de assertions
    saveMetrics('memotest-memory.json', {
      rounds: ROUNDS_FOR_MEMORY_TEST,
      heapBeforeMB,
      heapAfterMB,
      increaseMB,
    });

    expect(increaseMB).toBeLessThan(15);
  });
});
