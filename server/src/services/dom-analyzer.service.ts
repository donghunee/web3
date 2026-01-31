import { Page } from 'puppeteer';
import { DomAnalysisResult, InteractiveElement, HeadingElement, ImageElement, FormElement, LandmarkElement } from '../types/analysis.types';

export async function analyzeDom(page: Page): Promise<DomAnalysisResult> {
  const result = await page.evaluate(() => {
    // Count total elements
    const totalElements = document.querySelectorAll('*').length;

    // Get interactive elements
    const interactiveSelectors = 'a, button, input, select, textarea, [role="button"], [tabindex]';
    const interactiveEls = Array.from(document.querySelectorAll(interactiveSelectors));
    const interactiveElements: InteractiveElement[] = interactiveEls.slice(0, 50).map(el => {
      const rect = el.getBoundingClientRect();
      return {
        type: el.tagName.toLowerCase(),
        text: (el.textContent || '').trim().substring(0, 100),
        selector: el.tagName.toLowerCase() + (el.id ? `#${el.id}` : '') + (el.className ? `.${el.className.split(' ')[0]}` : ''),
        boundingBox: rect.width > 0 && rect.height > 0 ? {
          x: Math.round(rect.x),
          y: Math.round(rect.y),
          width: Math.round(rect.width),
          height: Math.round(rect.height),
        } : null,
      };
    });

    // Get headings
    const headingEls = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6'));
    const headings: HeadingElement[] = headingEls.map(el => ({
      level: parseInt(el.tagName.charAt(1), 10),
      text: (el.textContent || '').trim().substring(0, 200),
    }));

    // Get forms
    const formEls = Array.from(document.querySelectorAll('form'));
    const forms: FormElement[] = formEls.map(el => ({
      action: el.getAttribute('action') || '',
      method: el.getAttribute('method') || 'get',
      inputCount: el.querySelectorAll('input, select, textarea').length,
    }));

    // Get images
    const imageEls = Array.from(document.querySelectorAll('img'));
    const images: ImageElement[] = imageEls.slice(0, 30).map(el => ({
      src: el.src || '',
      alt: el.alt || null,
      hasAlt: el.hasAttribute('alt') && el.alt.trim().length > 0,
    }));

    // Get landmarks
    const landmarkTypes = [
      { type: 'header', selector: 'header, [role="banner"]' },
      { type: 'nav', selector: 'nav, [role="navigation"]' },
      { type: 'main', selector: 'main, [role="main"]' },
      { type: 'footer', selector: 'footer, [role="contentinfo"]' },
      { type: 'aside', selector: 'aside, [role="complementary"]' },
    ];
    const landmarks: LandmarkElement[] = landmarkTypes.map(({ type, selector }) => ({
      type,
      exists: document.querySelector(selector) !== null,
    }));

    return {
      totalElements,
      interactiveElements,
      headings,
      forms,
      images,
      landmarks,
    };
  });

  return result;
}
