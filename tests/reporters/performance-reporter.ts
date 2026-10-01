import type { Reporter, TestCase, TestResult } from '@playwright/test/reporter';
import * as fs from 'fs';
import * as path from 'path';

interface MetricRow {
  label: string;
  unit: string;
  value: (metrics: Record<string, any>) => number | undefined;
}

const MEMOTEST_ROWS: MetricRow[] = [
  { label: 'Load time', unit: 'ms', value: (m) => m['memotest-load']?.loadTime },
  { label: 'LCP', unit: 'ms', value: (m) => m['memotest-load']?.vitals?.lcp },
  { label: 'FCP', unit: 'ms', value: (m) => m['memotest-load']?.vitals?.fcp },
  { label: 'JavaScript transferred', unit: 'KB', value: (m) => m['memotest-load']?.scripts?.transferKB },
  { label: 'JavaScript parsed', unit: 'KB', value: (m) => m['memotest-load']?.scripts?.parsedKB },
  { label: 'Tap to cards visible', unit: 'ms', value: (m) => m['memotest-round-win']?.tapToMemorizeMs },
  { label: 'Intro: frame p95', unit: 'ms', value: (m) => m['memotest-round-win']?.intro?.p95FrameMs },
  { label: 'Intro: worst frame', unit: 'ms', value: (m) => m['memotest-round-win']?.intro?.maxFrameMs },
  { label: 'Intro: janky frames', unit: '', value: (m) => m['memotest-round-win']?.intro?.jankFrames },
  { label: 'Intro: long tasks (total)', unit: 'ms', value: (m) => m['memotest-round-win']?.intro?.longTasks?.totalMs },
  { label: 'Winning round: frame p95', unit: 'ms', value: (m) => m['memotest-round-win']?.gameplay?.p95FrameMs },
  { label: 'Winning round: worst frame', unit: 'ms', value: (m) => m['memotest-round-win']?.gameplay?.maxFrameMs },
  { label: 'Winning round: janky frames', unit: '', value: (m) => m['memotest-round-win']?.gameplay?.jankFrames },
  { label: 'Winning round: long tasks (total)', unit: 'ms', value: (m) => m['memotest-round-win']?.gameplay?.longTasks?.totalMs },
  { label: 'Losing round: worst frame', unit: 'ms', value: (m) => m['memotest-round-loss']?.gameplay?.maxFrameMs },
  { label: 'Losing round: long tasks (total)', unit: 'ms', value: (m) => m['memotest-round-loss']?.gameplay?.longTasks?.totalMs },
  { label: 'localStorage writes per round', unit: '', value: (m) => m['memotest-round-win']?.storageWrites },
  { label: 'Heap growth after 5 rounds', unit: 'MB', value: (m) => m['memotest-memory']?.increaseMB },
];

class PerformanceReporter implements Reporter {
  private results: any[] = [];

  onTestEnd(test: TestCase, result: TestResult) {
    this.results.push({
      name: test.title,
      project: test.parent.project()?.name,
      duration: result.duration,
      status: result.status,
    });
  }

  onEnd() {
    // ✅ Guardia para carpeta inexistente
    const benchmarksDir = path.join(__dirname, '../../benchmarks/results');

    if (!fs.existsSync(benchmarksDir)) {
      console.log('⚠️  No metrics found at benchmarks/results, skipping summary.');
      return;
    }

    // Leer métricas guardadas
    const files = fs.readdirSync(benchmarksDir);

    const metrics: Record<string, any> = {};
    files.forEach((file) => {
      if (file.endsWith('.json')) {
        const data = JSON.parse(
          fs.readFileSync(path.join(benchmarksDir, file), 'utf-8')
        );
        metrics[file.replace('.json', '')] = data;
      }
    });

    // Generar resumen markdown
    const markdown = this.generateMarkdown(metrics);

    const reportPath = path.join(
      __dirname,
      '../../benchmarks/PERFORMANCE_REPORT.md'
    );
    fs.writeFileSync(reportPath, markdown);

    console.log(
      '\n📊 Performance Report generated at benchmarks/PERFORMANCE_REPORT.md\n'
    );
  }

  private generateMarkdown(metrics: Record<string, any>): string {
    let md = '# Performance Test Results\n\n';
    md += `*Generated: ${new Date().toISOString()}*\n\n`;

    // ========== MEMOTEST ==========
    md += '## Memotest\n\n';
    md += this.memotestTable(metrics);

    // ========== ROULETTE ==========
    md += '\n## Roulette\n\n';
    md += '| Metric | Value | Status |\n';
    md += '|--------|-------|--------|\n';

    if (metrics['roulette-load']) {
      const { loadTime, vitals } = metrics['roulette-load'];
      md += `| Load Time | ${loadTime}ms | ${loadTime < 5000 ? '✅' : '❌'} |\n`;
      if (vitals?.lcp) {
        md += `| LCP | ${vitals.lcp.toFixed(0)}ms | ${vitals.lcp < 3000 ? '✅' : '❌'} |\n`;
      }
      if (vitals?.fcp) {
        md += `| FCP | ${vitals.fcp.toFixed(0)}ms | ${vitals.fcp < 1800 ? '✅' : '❌'} |\n`;
      }
      if (vitals?.ttfb) {
        md += `| TTFB | ${vitals.ttfb.toFixed(0)}ms | ${vitals.ttfb < 800 ? '✅' : '❌'} |\n`;
      }
    }

    if (metrics['roulette-spin-fps']) {
      const { fps } = metrics['roulette-spin-fps'];
      md += `| FPS (spin) | ${fps.toFixed(1)} | ${fps > 45 ? '✅' : '❌'} |\n`;
    }

    if (metrics['roulette-canvas']) {
      const { idleFps, canvasMetrics } = metrics['roulette-canvas'];
      if (idleFps !== undefined) {
        md += `| FPS (idle) | ${idleFps.toFixed(1)} | ${idleFps > 40 ? '✅' : '❌'} |\n`;
      }
      if (canvasMetrics?.width) {
        md += `| Canvas Size | ${canvasMetrics.width}x${canvasMetrics.height} | ℹ️ |\n`;
      }
    }

    if (metrics['roulette-audio']) {
      const { audioLoadTime } = metrics['roulette-audio'];
      if (audioLoadTime !== undefined) {
        md += `| Audio Load Time | ${audioLoadTime.toFixed(0)}ms | ${audioLoadTime < 2000 ? '✅' : '❌'} |\n`;
      }
    }

    if (metrics['roulette-full-round']) {
      const { memoryBefore, memoryAfter, vitals } = metrics['roulette-full-round'];
      if (memoryBefore !== undefined && memoryAfter !== undefined) {
        const increase = memoryAfter - memoryBefore;
        md += `| Memory (full round) | ${memoryBefore.toFixed(1)}MB → ${memoryAfter.toFixed(1)}MB (${increase >= 0 ? '+' : ''}${increase.toFixed(1)}MB) | ${increase < 15 ? '✅' : '❌'} |\n`;
      }
    }

    return md;
  }

  /**
   * Memotest table. When benchmarks/memotest-before.json exists (a saved run of the
   * same tests on an earlier version of the game) each row also shows that value.
   */
  private memotestTable(metrics: Record<string, any>): string {
    const beforePath = path.join(__dirname, '../../benchmarks/memotest-before.json');
    const before: Record<string, any> | null = fs.existsSync(beforePath)
      ? JSON.parse(fs.readFileSync(beforePath, 'utf-8'))
      : null;

    const format = (value: number | undefined, unit: string) =>
      value === undefined ? '-' : `${Math.round(value * 10) / 10}${unit}`;

    let md = before ? '| Metric | Before | Now |\n|--------|--------|-----|\n' : '| Metric | Value |\n|--------|-------|\n';
    for (const row of MEMOTEST_ROWS) {
      const now = row.value(metrics);
      if (now === undefined) continue;
      md += before
        ? `| ${row.label} | ${format(row.value(before), row.unit)} | ${format(now, row.unit)} |\n`
        : `| ${row.label} | ${format(now, row.unit)} |\n`;
    }
    return md;
  }
}

export default PerformanceReporter;
