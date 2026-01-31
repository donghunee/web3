import { Page } from 'puppeteer';
import { MetadataResult } from '../types/analysis.types';

export async function extractMetadata(page: Page): Promise<MetadataResult> {
  const metadata = await page.evaluate(() => {
    const getMetaContent = (selectors: string[]): string | null => {
      for (const selector of selectors) {
        const el = document.querySelector(selector);
        if (el) {
          return el.getAttribute('content') || null;
        }
      }
      return null;
    };

    const getLinkHref = (rel: string): string | null => {
      const el = document.querySelector(`link[rel="${rel}"]`);
      return el?.getAttribute('href') || null;
    };

    return {
      title: document.title || '',
      description: getMetaContent([
        'meta[name="description"]',
        'meta[property="og:description"]',
        'meta[name="twitter:description"]',
      ]) || '',
      image: getMetaContent([
        'meta[property="og:image"]',
        'meta[name="twitter:image"]',
      ]),
      siteName: getMetaContent([
        'meta[property="og:site_name"]',
      ]),
      url: window.location.href,
      favicon: getLinkHref('icon') || getLinkHref('shortcut icon') || '/favicon.ico',
      lang: document.documentElement.lang || null,
    };
  });

  // Make favicon absolute URL
  if (metadata.favicon && !metadata.favicon.startsWith('http')) {
    const url = new URL(page.url());
    metadata.favicon = new URL(metadata.favicon, url.origin).href;
  }

  return metadata;
}
