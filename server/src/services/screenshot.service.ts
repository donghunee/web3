import { Page } from 'puppeteer';
import { ScreenshotResult } from '../types/analysis.types';
import { logger } from '../utils/logger';

export interface ScreenshotOptions {
  fullPage?: boolean;
  width?: number;
  height?: number;
  format?: 'png' | 'jpeg';
  quality?: number;
}

// Common cookie consent selectors
const COOKIE_CONSENT_SELECTORS = [
  '[class*="cookie"] button[class*="accept"]',
  '[class*="cookie"] button[class*="agree"]',
  '[id*="cookie"] button[class*="accept"]',
  'button[class*="consent"]',
  '[class*="gdpr"] button',
  '#onetrust-accept-btn-handler',
  '.cc-btn.cc-dismiss',
];

async function dismissCookieConsent(page: Page): Promise<void> {
  for (const selector of COOKIE_CONSENT_SELECTORS) {
    try {
      const button = await page.$(selector);
      if (button) {
        await button.click();
        await page.waitForTimeout(500);
        logger.debug(`Dismissed cookie consent with selector: ${selector}`);
        return;
      }
    } catch {
      // Ignore errors, continue trying
    }
  }
}

export async function captureScreenshot(
  page: Page,
  options: ScreenshotOptions = {}
): Promise<ScreenshotResult> {
  const {
    fullPage = false,
    width = 1280,
    height = 720,
    format = 'png',
    quality = 80,
  } = options;

  // Set viewport
  await page.setViewport({ width, height });

  // Try to dismiss cookie consent
  await dismissCookieConsent(page);

  // Wait a bit for any animations to settle
  await page.waitForTimeout(500);

  // Capture screenshot
  const screenshotOptions: Parameters<Page['screenshot']>[0] = {
    fullPage,
    type: format,
    encoding: 'base64',
  };

  if (format === 'jpeg') {
    screenshotOptions.quality = quality;
  }

  const base64 = await page.screenshot(screenshotOptions) as string;

  // Calculate size
  const sizeBytes = Math.ceil((base64.length * 3) / 4);

  // Get actual dimensions
  const dimensions = await page.evaluate(() => ({
    width: document.documentElement.scrollWidth,
    height: document.documentElement.scrollHeight,
  }));

  return {
    base64,
    format,
    width: fullPage ? dimensions.width : width,
    height: fullPage ? dimensions.height : height,
    sizeBytes,
  };
}
