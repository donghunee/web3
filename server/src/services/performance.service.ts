import { Page } from 'puppeteer';
import { PerformanceResult } from '../types/analysis.types';

export async function collectPerformanceMetrics(page: Page): Promise<PerformanceResult> {
  // Get navigation timing
  const timing = await page.evaluate(() => {
    const perf = window.performance;
    const timing = perf.timing;

    return {
      loadTime: timing.loadEventEnd - timing.navigationStart,
      domContentLoaded: timing.domContentLoadedEventEnd - timing.navigationStart,
    };
  });

  // Get resource information
  const resources = await page.evaluate(() => {
    const entries = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
    let totalSize = 0;

    entries.forEach(entry => {
      if (entry.transferSize) {
        totalSize += entry.transferSize;
      }
    });

    return {
      count: entries.length,
      totalSize,
    };
  });

  // Get Core Web Vitals approximations
  const metrics = await page.evaluate(() => {
    return new Promise<{ lcp?: number; cls?: number; fcp?: number }>((resolve) => {
      const result: { lcp?: number; cls?: number; fcp?: number } = {};

      // Get FCP from paint timing
      const paintEntries = performance.getEntriesByType('paint');
      const fcpEntry = paintEntries.find(entry => entry.name === 'first-contentful-paint');
      if (fcpEntry) {
        result.fcp = fcpEntry.startTime;
      }

      // Try to get LCP
      try {
        const lcpEntries = performance.getEntriesByType('largest-contentful-paint');
        if (lcpEntries.length > 0) {
          result.lcp = (lcpEntries[lcpEntries.length - 1] as PerformanceEntry & { startTime: number }).startTime;
        }
      } catch {
        // LCP might not be available
      }

      // CLS is harder to measure without PerformanceObserver running from start
      // Return undefined for now

      resolve(result);
    });
  });

  return {
    loadTime: timing.loadTime > 0 ? timing.loadTime : 0,
    domContentLoaded: timing.domContentLoaded > 0 ? timing.domContentLoaded : 0,
    resourceCount: resources.count,
    totalResourceSize: resources.totalSize,
    metrics: {
      lcp: metrics.lcp,
      cls: metrics.cls,
      fcp: metrics.fcp,
    },
  };
}
