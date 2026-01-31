import { Page } from 'puppeteer';
import { AccessibilityResult, AccessibilityIssue } from '../types/analysis.types';

export async function analyzeAccessibility(page: Page): Promise<AccessibilityResult> {
  const issues = await page.evaluate(() => {
    const foundIssues: AccessibilityIssue[] = [];

    // Check images without alt text
    const images = document.querySelectorAll('img');
    images.forEach((img, index) => {
      if (!img.hasAttribute('alt')) {
        foundIssues.push({
          type: 'missing-alt',
          severity: 'error',
          element: `img[${index}]: ${img.src?.substring(0, 50)}`,
          message: '이미지에 alt 속성이 없습니다.',
        });
      } else if (img.alt.trim() === '') {
        foundIssues.push({
          type: 'empty-alt',
          severity: 'warning',
          element: `img[${index}]: ${img.src?.substring(0, 50)}`,
          message: '이미지의 alt 속성이 비어 있습니다.',
        });
      }
    });

    // Check form inputs without labels
    const inputs = document.querySelectorAll('input:not([type="hidden"]):not([type="submit"]):not([type="button"]), select, textarea');
    inputs.forEach((input, index) => {
      const id = input.id;
      const hasLabel = id && document.querySelector(`label[for="${id}"]`);
      const hasAriaLabel = input.hasAttribute('aria-label') || input.hasAttribute('aria-labelledby');
      const hasPlaceholder = input.hasAttribute('placeholder');

      if (!hasLabel && !hasAriaLabel) {
        foundIssues.push({
          type: 'missing-label',
          severity: hasPlaceholder ? 'warning' : 'error',
          element: `${input.tagName.toLowerCase()}[${index}]`,
          message: '폼 요소에 연결된 label이 없습니다.',
        });
      }
    });

    // Check heading hierarchy
    const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6'));
    let lastLevel = 0;
    headings.forEach((heading, index) => {
      const level = parseInt(heading.tagName.charAt(1), 10);
      if (index === 0 && level !== 1) {
        foundIssues.push({
          type: 'heading-order',
          severity: 'warning',
          element: heading.tagName,
          message: '페이지가 h1으로 시작하지 않습니다.',
        });
      } else if (level > lastLevel + 1) {
        foundIssues.push({
          type: 'heading-skip',
          severity: 'warning',
          element: heading.tagName,
          message: `헤딩 레벨이 ${lastLevel}에서 ${level}로 건너뛰었습니다.`,
        });
      }
      lastLevel = level;
    });

    // Check for multiple h1s
    const h1Count = document.querySelectorAll('h1').length;
    if (h1Count > 1) {
      foundIssues.push({
        type: 'multiple-h1',
        severity: 'warning',
        element: 'h1',
        message: `페이지에 ${h1Count}개의 h1이 있습니다. 일반적으로 하나만 권장됩니다.`,
      });
    }

    // Check for links without text
    const links = document.querySelectorAll('a');
    links.forEach((link, index) => {
      const hasText = link.textContent?.trim();
      const hasAriaLabel = link.hasAttribute('aria-label');
      const hasImage = link.querySelector('img[alt]');

      if (!hasText && !hasAriaLabel && !hasImage) {
        foundIssues.push({
          type: 'empty-link',
          severity: 'error',
          element: `a[${index}]`,
          message: '링크에 접근 가능한 텍스트가 없습니다.',
        });
      }
    });

    // Check for buttons without text
    const buttons = document.querySelectorAll('button, [role="button"]');
    buttons.forEach((button, index) => {
      const hasText = button.textContent?.trim();
      const hasAriaLabel = button.hasAttribute('aria-label');

      if (!hasText && !hasAriaLabel) {
        foundIssues.push({
          type: 'empty-button',
          severity: 'error',
          element: `button[${index}]`,
          message: '버튼에 접근 가능한 텍스트가 없습니다.',
        });
      }
    });

    return foundIssues;
  });

  // Calculate score (simple scoring)
  const errorCount = issues.filter(i => i.severity === 'error').length;
  const warningCount = issues.filter(i => i.severity === 'warning').length;

  let score = 100;
  score -= errorCount * 10;
  score -= warningCount * 3;
  score = Math.max(0, Math.min(100, score));

  return {
    score,
    issueCount: issues.length,
    issues: issues.slice(0, 50), // Limit to 50 issues
  };
}
