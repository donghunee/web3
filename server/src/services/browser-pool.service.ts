import puppeteer, { Browser } from 'puppeteer';
import { puppeteerLaunchOptions } from '../config/puppeteer.config';
import { config } from '../config';
import { logger } from '../utils/logger';

interface PooledBrowser {
  browser: Browser;
  inUse: boolean;
  requestCount: number;
  createdAt: Date;
}

class BrowserPool {
  private static instance: BrowserPool;
  private pool: PooledBrowser[] = [];
  private initialized = false;
  private readonly maxRequestsPerBrowser = 100;
  private readonly maxBrowserAge = 60 * 60 * 1000; // 1 hour

  private constructor() {}

  static getInstance(): BrowserPool {
    if (!BrowserPool.instance) {
      BrowserPool.instance = new BrowserPool();
    }
    return BrowserPool.instance;
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;

    logger.info(`Initializing browser pool with ${config.browserPool.size} browsers...`);

    for (let i = 0; i < config.browserPool.size; i++) {
      const browser = await this.createBrowser();
      this.pool.push({
        browser,
        inUse: false,
        requestCount: 0,
        createdAt: new Date(),
      });
    }

    this.initialized = true;
    logger.info('Browser pool initialized');
  }

  private async createBrowser(): Promise<Browser> {
    const browser = await puppeteer.launch(puppeteerLaunchOptions);

    browser.on('disconnected', () => {
      logger.warn('Browser disconnected, will be replaced on next acquire');
    });

    return browser;
  }

  async acquire(): Promise<Browser> {
    if (!this.initialized) {
      await this.initialize();
    }

    // Find available browser
    for (const pooled of this.pool) {
      if (!pooled.inUse && pooled.browser.connected) {
        // Check if browser needs refresh
        const needsRefresh =
          pooled.requestCount >= this.maxRequestsPerBrowser ||
          Date.now() - pooled.createdAt.getTime() > this.maxBrowserAge;

        if (needsRefresh) {
          logger.info('Refreshing browser due to age/request count');
          await pooled.browser.close().catch(() => {});
          pooled.browser = await this.createBrowser();
          pooled.requestCount = 0;
          pooled.createdAt = new Date();
        }

        pooled.inUse = true;
        pooled.requestCount++;
        return pooled.browser;
      }
    }

    // No available browser, wait and retry
    logger.debug('No available browser, waiting...');
    await new Promise(resolve => setTimeout(resolve, 1000));
    return this.acquire();
  }

  release(browser: Browser): void {
    const pooled = this.pool.find(p => p.browser === browser);
    if (pooled) {
      pooled.inUse = false;
    }
  }

  async close(): Promise<void> {
    logger.info('Closing browser pool...');
    for (const pooled of this.pool) {
      await pooled.browser.close().catch(() => {});
    }
    this.pool = [];
    this.initialized = false;
    logger.info('Browser pool closed');
  }

  getStatus(): { total: number; available: number; busy: number } {
    const available = this.pool.filter(p => !p.inUse && p.browser.connected).length;
    const busy = this.pool.filter(p => p.inUse).length;
    return {
      total: this.pool.length,
      available,
      busy,
    };
  }
}

export const browserPool = BrowserPool.getInstance();
