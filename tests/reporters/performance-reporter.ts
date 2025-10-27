import type { Reporter, TestCase, TestResult } from '@playwright/test/reporter';
import * as fs from 'fs';
import * as path from 'path';

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
    md += '| Metric | Value | Status |\n';
    md += '|--------|-------|--------|\n';

    if (metrics['memotest-load']) {
      const { loadTime, vitals } = metrics['memotest-load'];
      md += `| Load Time | ${loadTime}ms | ${loadTime < 3000 ? '✅' : '❌'} |\n`;
      if (vitals?.lcp) {
        md += `| LCP | ${vitals.lcp.toFixed(0)}ms | ${vitals.lcp < 2500 ? '✅' : '❌'} |\n`;
      }
      if (vitals?.fcp) {
        md += `| FCP | ${vitals.fcp.toFixed(0)}ms | ${vitals.fcp < 1800 ? '✅' : '❌'} |\n`;
      }
    }

    if (metrics['memotest-fps']) {
      const { fps } = metrics['memotest-fps'];
      md += `| FPS (flip) | ${fps.toFixed(1)} | ${fps > 45 ? '✅' : '❌'} |\n`;
    }

    if (metrics['memotest-memory']) {
      const { memoryBefore, memoryAfter, increase } = metrics['memotest-memory'];
      if (increase !== undefined) {
        md += `| Memory Increase | ${increase.toFixed(1)}MB | ${increase < 15 ? '✅' : '❌'} |\n`;
      }
      if (memoryBefore !== undefined) {
        md += `| Memory (before) | ${memoryBefore.toFixed(1)}MB | ℹ️ |\n`;
      }
      if (memoryAfter !== undefined) {
        md += `| Memory (after) | ${memoryAfter.toFixed(1)}MB | ℹ️ |\n`;
      }
    }

    if (metrics['memotest-stress']) {
      const { fps, memory } = metrics['memotest-stress'];
      if (fps !== undefined) {
        md += `| FPS (stress) | ${fps.toFixed(1)} | ${fps > 40 ? '✅' : '❌'} |\n`;
      }
      if (memory !== undefined) {
        md += `| Memory (stress) | ${memory.toFixed(1)}MB | ℹ️ |\n`;
      }
    }

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
}

export default PerformanceReporter;
