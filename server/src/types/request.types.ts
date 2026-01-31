import { Request } from 'express';
import { AnalysisOptions } from './analysis.types';

export interface AnalyzeRequestBody {
  url: string;
  options?: AnalysisOptions;
}

export interface AnalyzeRequest extends Request {
  body: AnalyzeRequestBody;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
}
