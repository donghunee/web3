import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  logger.error('Error occurred:', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
        details: err.details,
      },
    });
    return;
  }

  // Handle Puppeteer timeout errors
  if (err.message.includes('timeout') || err.message.includes('Timeout')) {
    res.status(408).json({
      success: false,
      error: {
        code: 'TIMEOUT',
        message: 'The request timed out. The page may be loading too slowly.',
      },
    });
    return;
  }

  // Handle navigation errors
  if (err.message.includes('net::') || err.message.includes('Navigation')) {
    res.status(400).json({
      success: false,
      error: {
        code: 'NAVIGATION_FAILED',
        message: 'Failed to load the page. Please check if the URL is accessible.',
      },
    });
    return;
  }

  // Generic error
  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred.',
    },
  });
}
