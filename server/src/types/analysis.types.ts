export interface ScreenshotResult {
  base64: string;
  format: 'png' | 'jpeg';
  width: number;
  height: number;
  sizeBytes: number;
}

export interface MetadataResult {
  title: string;
  description: string;
  image: string | null;
  siteName: string | null;
  url: string;
  favicon: string | null;
  lang: string | null;
}

export interface InteractiveElement {
  type: string;
  text: string;
  selector: string;
  boundingBox: {
    x: number;
    y: number;
    width: number;
    height: number;
  } | null;
}

export interface HeadingElement {
  level: number;
  text: string;
}

export interface ImageElement {
  src: string;
  alt: string | null;
  hasAlt: boolean;
}

export interface FormElement {
  action: string;
  method: string;
  inputCount: number;
}

export interface LandmarkElement {
  type: string;
  exists: boolean;
}

export interface DomAnalysisResult {
  totalElements: number;
  interactiveElements: InteractiveElement[];
  headings: HeadingElement[];
  forms: FormElement[];
  images: ImageElement[];
  landmarks: LandmarkElement[];
}

export interface AccessibilityIssue {
  type: string;
  severity: 'error' | 'warning' | 'info';
  element: string;
  message: string;
}

export interface AccessibilityResult {
  score: number;
  issueCount: number;
  issues: AccessibilityIssue[];
}

export interface PerformanceResult {
  loadTime: number;
  domContentLoaded: number;
  resourceCount: number;
  totalResourceSize: number;
  metrics: {
    lcp?: number;
    cls?: number;
    fcp?: number;
  };
}

export interface AnalysisResult {
  url: string;
  analyzedAt: string;
  screenshot: ScreenshotResult;
  metadata: MetadataResult;
  domAnalysis?: DomAnalysisResult;
  accessibility?: AccessibilityResult;
  performance?: PerformanceResult;
}

export interface AnalysisOptions {
  fullPageScreenshot?: boolean;
  screenshotWidth?: number;
  screenshotHeight?: number;
  screenshotFormat?: 'png' | 'jpeg';
  screenshotQuality?: number;
  waitForSelector?: string;
  timeout?: number;
  includeDomAnalysis?: boolean;
  includeAccessibility?: boolean;
  includePerformance?: boolean;
}
