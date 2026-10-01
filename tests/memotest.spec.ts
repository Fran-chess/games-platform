import { test, expect, type Page } from '@playwright/test';
import {
  getCoreWebVitals,
  getScriptWeight,
  measureHeapMB,
  medianOf,
  saveMetrics,
  startFrameRecorder,
  stopFrameRecorder,
  throttleCPU,
} from './helpers/performance';

/** The test machine is several times faster than the event tablet (Lenovo Tab M11) */
const CPU_THROTTLE_RATE = 4;
const TOTAL_CARDS = 12;
const ROUNDS_FOR_MEMORY_TEST = 5;
/** Each round scenario is played this many times and reported as the median */
const RUNS_PER_SCENARIO = 3;

type StorageWindow = Window & { __storageWrites?: number };

const game = (page: Page, phase: string) => page.locator(`[data-testid="game"][data-phase="${phase}"]`);
const cards = (page: Page) => page.locator('[data-testid="memo-card"]');

async function openWaitingScreen(page: Page) {
  await page.goto('/');
  await page.locator('[data-testid="waiting-screen"]').waitFor();
}

/**
 * Taps the waiting screen until the game takes over; returns when the tap that worked was sent.
 * The screen is in the server HTML, so a tap can land before React has finished hydrating
 * the page and be lost. Nothing in the DOM says "hydrated", so the test does what a person
 * would do: tap again.
 */
async function startRound(page: Page): Promise<number> {
  const waitingScreen = page.locator('[data-testid="waiting-screen"]');
  const gameRoot = page.locator('[data-testid="game"]');
  let tapTime = 0;
  await expect(async () => {
    // Only tap while the waiting screen is still there: a tap that worked removes it
    if ((await gameRoot.count()) === 0 && (await waitingScreen.count()) > 0) {
      tapTime = Date.now();
      await waitingScreen.click({ timeout: 2000 });
    }
    await expect(gameRoot).toBeAttached({ timeout: 2000 });
  }).toPass({ timeout: 30_000 });
  return tapTime;
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

/** Flips two cards. The pair that ends the round takes the board away: wait for the next phase instead */
async function flipPair(page: Page, [first, second]: number[]) {
  await cards(page).nth(first).click();
  await cards(page).nth(second).click();
}

/**
 * Resolves once the card has been face up and is face down again (a wrong pair flipping back).
 * Observed inside the page: the card is face up for about a second, too short to poll
 * reliably from the test under CPU throttling. Start it before tapping the cards.
 */
function watchFlipBack(page: Page, index: number): Promise<void> {
  return page.evaluate((cardIndex) => {
    return new Promise<void>((resolve) => {
      const card = document.querySelectorAll('[data-testid="memo-card"]')[cardIndex];
      let wasFaceUp = card.getAttribute('data-state') !== 'hidden';
      new MutationObserver((_, observer) => {
        if (card.getAttribute('data-state') !== 'hidden') {
          wasFaceUp = true;
        } else if (wasFaceUp) {
          observer.disconnect();
          resolve();
        }
      }).observe(card, { attributes: true, attributeFilter: ['data-state'] });
    });
  }, index);
}

/** Two wrong attempts end the round: the required pairs are no longer reachable */
async function loseRound(page: Page) {
  const pairs = findPairs(await waitForBoard(page));
  const firstMiss = [pairs[0][0], pairs[1][0]];
  const flippedBack = watchFlipBack(page, firstMiss[1]);
  await flipPair(page, firstMiss);
  await flippedBack;
  await flipPair(page, [pairs[2][0], pairs[3][0]]);
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

  // The round tests assert that a full round can be played and report its frame pacing.
  // They set no pacing budget: on a desktop under CPU throttling the same build varies
  // several times over between runs, so the numbers are for comparing reports.

  test('Winning round (frame pacing)', async ({ page }) => {
    test.setTimeout(240_000);

    const runs = [];
    for (let run = 0; run < RUNS_PER_SCENARIO; run++) {
      await openWaitingScreen(page);

      // Intro: tap on the waiting screen until the board is playable
      await startFrameRecorder(page);
      const tapTime = await startRound(page);
      await game(page, 'memorizing').waitFor();
      const tapToMemorizeMs = Date.now() - tapTime;
      const pairs = findPairs(await waitForBoard(page));
      const intro = await stopFrameRecorder(page);

      // Gameplay: two matching pairs, prize pick and result screen
      await startFrameRecorder(page);
      await flipPair(page, pairs[0]);
      await expect(cards(page).nth(pairs[0][1])).toHaveAttribute('data-state', 'matched');
      await flipPair(page, pairs[1]);
      await game(page, 'prize').waitFor();
      await page.locator('[data-testid="prize-card"]').first().click();
      await page.locator('[data-testid="prize-result"]').waitFor({ timeout: 15000 });
      const gameplay = await stopFrameRecorder(page);

      const storageWrites = await page.evaluate(() => (window as StorageWindow).__storageWrites ?? 0);
      runs.push({ tapToMemorizeMs, intro, gameplay, storageWrites });
    }

    saveMetrics('memotest-round-win.json', { runs: runs.length, ...medianOf(runs) });
  });

  test('Losing round (frame pacing)', async ({ page }) => {
    test.setTimeout(240_000);

    const runs = [];
    for (let run = 0; run < RUNS_PER_SCENARIO; run++) {
      await openWaitingScreen(page);
      await startRound(page);
      await waitForBoard(page);

      await startFrameRecorder(page);
      await loseRound(page);
      runs.push({ gameplay: await stopFrameRecorder(page) });
    }

    saveMetrics('memotest-round-loss.json', { runs: runs.length, ...medianOf(runs) });
  });

  test('Memory after repeated rounds (no leaks)', async ({ page }) => {
    // Five full rounds under CPU throttling do not fit in the default 60 s
    test.setTimeout(240_000);

    await openWaitingScreen(page);
    const heapBeforeMB = await measureHeapMB(page);

    await startRound(page);
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
