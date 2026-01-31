import { Response, NextFunction } from 'express';
import { browserPool } from '../services/browser-pool.service';
import { captureScreenshot } from '../services/screenshot.service';
import { extractMetadata } from '../services/metadata.service';
import { analyzeDom } from '../services/dom-analyzer.service';
import { analyzeAccessibility } from '../services/accessibility.service';
import { collectPerformanceMetrics } from '../services/performance.service';
import { AnalyzeRequest } from '../types/request.types';
import { AnalysisResult } from '../types/analysis.types';
import { config } from '../config';
import { logger } from '../utils/logger';

export async function analyzeUrl(
  req: AnalyzeRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const { url, options = {} } = req.body;
  let browser = null;
  let page = null;

  try {
    logger.info(`Starting analysis for: ${url}`);

    // Get browser from pool
    browser = await browserPool.acquire();
    page = await browser.newPage();

    // Set viewport
    await page.setViewport({
      width: options.screenshotWidth || config.screenshot.defaultWidth,
      height: options.screenshotHeight || config.screenshot.defaultHeight,
    });

    // Set timeout
    const timeout = options.timeout || config.screenshot.timeout;
    page.setDefaultNavigationTimeout(timeout);
    page.setDefaultTimeout(timeout);

    // Navigate to URL
    await page.goto(url, {
      waitUntil: 'networkidle2',
      timeout,
    });

    // Wait for specific selector if provided
    if (options.waitForSelector) {
      await page.waitForSelector(options.waitForSelector, { timeout: 5000 }).catch(() => {
        logger.debug(`Selector not found: ${options.waitForSelector}`);
      });
    }

    // Collect data in parallel where possible
    const [screenshot, metadata] = await Promise.all([
      captureScreenshot(page, {
        fullPage: options.fullPageScreenshot,
        width: options.screenshotWidth,
        height: options.screenshotHeight,
        format: options.screenshotFormat,
        quality: options.screenshotQuality,
      }),
      extractMetadata(page),
    ]);

    // Optional analyses
    const includeDom = options.includeDomAnalysis !== false;
    const includeAccessibility = options.includeAccessibility !== false;
    const includePerformance = options.includePerformance !== false;

    const [domAnalysis, accessibility, performance] = await Promise.all([
      includeDom ? analyzeDom(page) : undefined,
      includeAccessibility ? analyzeAccessibility(page) : undefined,
      includePerformance ? collectPerformanceMetrics(page) : undefined,
    ]);

    const result: AnalysisResult = {
      url,
      analyzedAt: new Date().toISOString(),
      screenshot,
      metadata,
      domAnalysis,
      accessibility,
      performance,
    };

    logger.info(`Analysis completed for: ${url}`);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  } finally {
    // Clean up
    if (page) {
      await page.close().catch(() => {});
    }
    if (browser) {
      browserPool.release(browser);
    }
  }
}

export async function screenshotOnly(
  req: AnalyzeRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const { url, options = {} } = req.body;
  let browser = null;
  let page = null;

  try {
    logger.info(`Taking screenshot for: ${url}`);

    browser = await browserPool.acquire();
    page = await browser.newPage();

    await page.setViewport({
      width: options.screenshotWidth || config.screenshot.defaultWidth,
      height: options.screenshotHeight || config.screenshot.defaultHeight,
    });

    const timeout = options.timeout || config.screenshot.timeout;
    page.setDefaultNavigationTimeout(timeout);

    await page.goto(url, {
      waitUntil: 'networkidle2',
      timeout,
    });

    const screenshot = await captureScreenshot(page, {
      fullPage: options.fullPageScreenshot,
      width: options.screenshotWidth,
      height: options.screenshotHeight,
      format: options.screenshotFormat,
      quality: options.screenshotQuality,
    });

    logger.info(`Screenshot completed for: ${url}`);

    res.json({
      success: true,
      data: {
        url,
        analyzedAt: new Date().toISOString(),
        screenshot,
      },
    });
  } catch (error) {
    next(error);
  } finally {
    if (page) {
      await page.close().catch(() => {});
    }
    if (browser) {
      browserPool.release(browser);
    }
  }
}
