import { Request, Response, NextFunction } from 'express';
import { isValidUrl, isBlockedUrl, normalizeUrl } from '../utils/url-utils';
import { config } from '../config';

export function urlValidator(req: Request, res: Response, next: NextFunction): void {
  const { url } = req.body;

  if (!url) {
    res.status(400).json({
      success: false,
      error: {
        code: 'URL_REQUIRED',
        message: 'URL is required',
      },
    });
    return;
  }

  const normalizedUrl = normalizeUrl(url);

  if (!isValidUrl(normalizedUrl)) {
    res.status(400).json({
      success: false,
      error: {
        code: 'URL_INVALID',
        message: 'Invalid URL format. Please provide a valid HTTP or HTTPS URL.',
      },
    });
    return;
  }

  if (isBlockedUrl(normalizedUrl)) {
    res.status(400).json({
      success: false,
      error: {
        code: 'URL_BLOCKED',
        message: 'This URL is not allowed for security reasons.',
      },
    });
    return;
  }

  // Check domain whitelist if configured
  if (config.allowedDomains.length > 0) {
    try {
      const urlObj = new URL(normalizedUrl);
      const isAllowed = config.allowedDomains.some(
        domain => urlObj.hostname === domain || urlObj.hostname.endsWith(`.${domain}`)
      );

      if (!isAllowed) {
        res.status(400).json({
          success: false,
          error: {
            code: 'DOMAIN_NOT_ALLOWED',
            message: 'This domain is not in the allowed list.',
          },
        });
        return;
      }
    } catch {
      res.status(400).json({
        success: false,
        error: {
          code: 'URL_INVALID',
          message: 'Could not parse URL.',
        },
      });
      return;
    }
  }

  // Store normalized URL in request body
  req.body.url = normalizedUrl;
  next();
}
