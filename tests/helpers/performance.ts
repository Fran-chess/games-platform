import type { Page } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Measure FPS (Frames Per Second) during animations
 * Counts requestAnimationFrame calls over a duration
 */
export async function measureFPS(page: Page, duration = 5000): Promise<number> {
  return page.evaluate((dur) => {
    return new Promise<number>((resolve) => {
      let frames = 0;
      let lastTime = performance.now();

      function count() {
        frames++;
        if (performance.now() - lastTime < dur) {
          requestAnimationFrame(count);
        } else {
          resolve((frames / dur) * 1000);
        }
      }
      requestAnimationFrame(count);
    });
  }, duration);
}

/**
 * Main-thread frame pacing over a recorded window.
 * Unlike an average FPS, the percentiles and long tasks expose jank:
 * a single 200 ms stall disappears in a 60 FPS average but not here.
 */
export interface FrameStats {
  frames: number;
  durationMs: number;
  avgFrameMs: number;
  p95FrameMs: number;
  maxFrameMs: number;
  /** Frames that took more than twice the median interval */
  jankFrames: number;
  longTasks: { count: number; totalMs: number; maxMs: number };
}

interface FrameRecorder {
  deltas: number[];
  longTasks: number[];
  running: boolean;
  observer: PerformanceObserver;
}

type RecorderWindow = Window & { __frameRecorder?: FrameRecorder };

/**
 * Start recording requestAnimationFrame intervals and long tasks (> 50 ms).
 * Call stopFrameRecorder on the same page (no navigation in between).
 */
export async function startFrameRecorder(page: Page): Promise<void> {
  await page.evaluate(() => {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) recorder.longTasks.push(entry.duration);
    });
    const recorder: FrameRecorder = { deltas: [], longTasks: [], running: true, observer };
    observer.observe({ type: 'longtask' });

    let last = performance.now();
    const tick = (now: number) => {
      if (!recorder.running) return;
      recorder.deltas.push(now - last);
      last = now;
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);

    (window as RecorderWindow).__frameRecorder = recorder;
  });
}

export async function stopFrameRecorder(page: Page): Promise<FrameStats> {
  return page.evaluate(() => {
    const w = window as RecorderWindow;
    const recorder = w.__frameRecorder;
    if (!recorder) throw new Error('Frame recorder was not started');
    recorder.running = false;
    recorder.observer.disconnect();
    delete w.__frameRecorder;

    // The first interval spans from recorder creation to the first frame: not a real frame
    const deltas = recorder.deltas.slice(1);
    const sorted = [...deltas].sort((a, b) => a - b);
    const at = (q: number) => sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * q))] ?? 0;
    const sum = (values: number[]) => values.reduce((acc, v) => acc + v, 0);
    const round = (v: number) => Math.round(v * 10) / 10;
    const median = at(0.5);

    return {
      frames: deltas.length,
      durationMs: round(sum(deltas)),
      avgFrameMs: round(deltas.length ? sum(deltas) / deltas.length : 0),
      p95FrameMs: round(at(0.95)),
      maxFrameMs: round(sorted[sorted.length - 1] ?? 0),
      jankFrames: deltas.filter((d) => d > median * 2).length,
      longTasks: {
        count: recorder.longTasks.length,
        totalMs: round(sum(recorder.longTasks)),
        maxMs: round(Math.max(0, ...recorder.longTasks)),
      },
    };
  });
}

/**
 * Slow the CPU down by `rate` (Chrome DevTools "CPU throttling").
 * A desktop running the tests is several times faster than the event tablets.
 */
export async function throttleCPU(page: Page, rate: number): Promise<void> {
  const client = await page.context().newCDPSession(page);
  await client.send('Emulation.setCPUThrottlingRate', { rate });
}

/**
 * JS heap in MB after a forced garbage collection, so leaks are not hidden
 * (or faked) by garbage that simply has not been collected yet.
 */
export async function measureHeapMB(page: Page): Promise<number> {
  const client = await page.context().newCDPSession(page);
  await client.send('HeapProfiler.collectGarbage');
  const { usedSize } = await client.send('Runtime.getHeapUsage');
  await client.detach();
  return usedSize / 1024 / 1024;
}

/**
 * JavaScript downloaded by the page so far (compressed and parsed size, in KB)
 */
export async function getScriptWeight(page: Page) {
  return page.evaluate(() => {
    const scripts = (performance.getEntriesByType('resource') as PerformanceResourceTiming[])
      .filter((entry) => entry.initiatorType === 'script' || entry.name.endsWith('.js'));
    const kb = (bytes: number) => Math.round(bytes / 102.4) / 10;

    return {
      requests: scripts.length,
      transferKB: kb(scripts.reduce((acc, s) => acc + s.encodedBodySize, 0)),
      parsedKB: kb(scripts.reduce((acc, s) => acc + s.decodedBodySize, 0)),
    };
  });
}

/**
 * Get Core Web Vitals (Lab metrics - stable for CI)
 * Opción A: Solo LCP + navigation timings
 * INP y CLS se cubren con RUM (web-vitals hook)
 */
export async function getCoreWebVitals(page: Page) {
  return page.evaluate(() => {
    return new Promise<{
      lcp: number;
      fcp: number;
      ttfb: number;
    }>((resolve) => {
      const metrics: any = {};

      // LCP - Largest Contentful Paint
      new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1] as any;
        metrics.lcp = lastEntry.renderTime || lastEntry.loadTime;
      }).observe({ type: 'largest-contentful-paint', buffered: true });

      // FCP desde paint timing; TTFB desde navigation timing
      const fcpEntry = performance.getEntriesByName('first-contentful-paint')[0];
      if (fcpEntry) {
        metrics.fcp = fcpEntry.startTime;
      }
      const navTiming = performance.getEntriesByType('navigation')[0] as any;
      if (navTiming) {
        metrics.ttfb = navTiming.responseStart - navTiming.requestStart;
      }

      // Retornar después de timeout
      setTimeout(() => resolve(metrics), 2000);
    });
  });
}

/**
 * Measure memory usage (JS heap size)
 * Returns MB or null if API not available
 */
export async function measureMemory(page: Page): Promise<number | null> {
  return page.evaluate(() => {
    if ('memory' in performance) {
      return (performance as any).memory.usedJSHeapSize / 1024 / 1024;  // MB
    }
    return null;
  });
}

/**
 * Save metrics to JSON file in benchmarks/results/
 */
export function saveMetrics(filename: string, data: any) {
  const dir = path.join(__dirname, '../../benchmarks/results');

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  fs.writeFileSync(
    path.join(dir, filename),
    JSON.stringify(data, null, 2)
  );
}
