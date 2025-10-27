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

      // FCP y TTFB desde navigation timing
      const navTiming = performance.getEntriesByType('navigation')[0] as any;
      if (navTiming) {
        metrics.fcp = navTiming.responseStart - navTiming.fetchStart;
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
