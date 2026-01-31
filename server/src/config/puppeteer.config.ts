import { PuppeteerLaunchOptions } from 'puppeteer';
import { config } from './index';

export const puppeteerLaunchOptions: PuppeteerLaunchOptions = {
  headless: true,
  args: [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-dev-shm-usage',
    '--disable-accelerated-2d-canvas',
    '--disable-gpu',
    '--window-size=1920,1080',
  ],
  defaultViewport: {
    width: config.screenshot.defaultWidth,
    height: config.screenshot.defaultHeight,
  },
};

export const defaultNavigationOptions = {
  waitUntil: 'networkidle2' as const,
  timeout: config.screenshot.timeout,
};
