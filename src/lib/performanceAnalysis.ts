// Performance Analysis using Google PageSpeed Insights API

export interface CoreWebVitals {
  lcp: number | null // Largest Contentful Paint (seconds)
  fid: number | null // First Input Delay (milliseconds)
  cls: number | null // Cumulative Layout Shift
  fcp: number | null // First Contentful Paint (seconds)
  ttfb: number | null // Time to First Byte (seconds)
  si: number | null // Speed Index (seconds)
  tbt: number | null // Total Blocking Time (milliseconds)
}

export interface PerformanceScore {
  performance: number // 0-100
  accessibility: number
  bestPractices: number
  seo: number
}

export interface PerformanceIssue {
  id: string
  title: string
  description: string
  score: number | null
  displayValue?: string
  numericValue?: number
}

export interface PerformanceResult {
  url: string
  fetchTime: string
  scores: PerformanceScore
  coreWebVitals: CoreWebVitals
  opportunities: PerformanceIssue[] // Things to improve
  diagnostics: PerformanceIssue[] // Informational
  passedAudits: number
  totalAudits: number
}

// Analyze URL performance using PageSpeed Insights API
export async function analyzePerformance(url: string, strategy: 'mobile' | 'desktop' = 'mobile'): Promise<PerformanceResult> {
  const apiUrl = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(url)}&strategy=${strategy}&category=performance&category=accessibility&category=best-practices&category=seo`

  const response = await fetch(apiUrl)

  if (!response.ok) {
    throw new Error(`PageSpeed API error: ${response.status}`)
  }

  const data = await response.json()

  // Extract scores
  const categories = data.lighthouseResult?.categories || {}
  const scores: PerformanceScore = {
    performance: Math.round((categories.performance?.score || 0) * 100),
    accessibility: Math.round((categories.accessibility?.score || 0) * 100),
    bestPractices: Math.round((categories['best-practices']?.score || 0) * 100),
    seo: Math.round((categories.seo?.score || 0) * 100),
  }

  // Extract Core Web Vitals from audits
  const audits = data.lighthouseResult?.audits || {}

  const coreWebVitals: CoreWebVitals = {
    lcp: audits['largest-contentful-paint']?.numericValue ? audits['largest-contentful-paint'].numericValue / 1000 : null,
    fid: audits['max-potential-fid']?.numericValue || null,
    cls: audits['cumulative-layout-shift']?.numericValue || null,
    fcp: audits['first-contentful-paint']?.numericValue ? audits['first-contentful-paint'].numericValue / 1000 : null,
    ttfb: audits['server-response-time']?.numericValue ? audits['server-response-time'].numericValue / 1000 : null,
    si: audits['speed-index']?.numericValue ? audits['speed-index'].numericValue / 1000 : null,
    tbt: audits['total-blocking-time']?.numericValue || null,
  }

  // Extract opportunities (things to improve)
  const opportunityIds = [
    'render-blocking-resources',
    'unused-css-rules',
    'unused-javascript',
    'modern-image-formats',
    'offscreen-images',
    'unminified-css',
    'unminified-javascript',
    'efficient-animated-content',
    'duplicated-javascript',
    'legacy-javascript',
    'total-byte-weight',
    'uses-responsive-images',
    'uses-optimized-images',
    'uses-text-compression',
    'uses-rel-preconnect',
    'server-response-time',
    'redirects',
    'uses-rel-preload',
    'uses-http2',
    'dom-size',
  ]

  const opportunities: PerformanceIssue[] = opportunityIds
    .filter(id => audits[id] && audits[id].score !== null && audits[id].score < 1)
    .map(id => ({
      id,
      title: audits[id].title,
      description: audits[id].description,
      score: audits[id].score,
      displayValue: audits[id].displayValue,
      numericValue: audits[id].numericValue,
    }))
    .sort((a, b) => (a.score || 0) - (b.score || 0))

  // Extract diagnostics
  const diagnosticIds = [
    'mainthread-work-breakdown',
    'bootup-time',
    'font-display',
    'third-party-summary',
    'largest-contentful-paint-element',
    'layout-shift-elements',
    'long-tasks',
  ]

  const diagnostics: PerformanceIssue[] = diagnosticIds
    .filter(id => audits[id] && audits[id].score !== null && audits[id].score < 1)
    .map(id => ({
      id,
      title: audits[id].title,
      description: audits[id].description,
      score: audits[id].score,
      displayValue: audits[id].displayValue,
      numericValue: audits[id].numericValue,
    }))

  // Count passed audits
  const allAuditIds = Object.keys(audits)
  const passedAudits = allAuditIds.filter(id => audits[id].score === 1).length

  return {
    url,
    fetchTime: new Date().toISOString(),
    scores,
    coreWebVitals,
    opportunities,
    diagnostics,
    passedAudits,
    totalAudits: allAuditIds.length,
  }
}

// Get score color based on value
export function getScoreColor(score: number): string {
  if (score >= 90) return 'text-green-600 bg-green-50 dark:bg-green-950/30'
  if (score >= 50) return 'text-orange-600 bg-orange-50 dark:bg-orange-950/30'
  return 'text-red-600 bg-red-50 dark:bg-red-950/30'
}

// Get Core Web Vital status
export function getVitalStatus(metric: string, value: number | null): 'good' | 'needs-improvement' | 'poor' | 'unknown' {
  if (value === null) return 'unknown'

  switch (metric) {
    case 'lcp':
      if (value <= 2.5) return 'good'
      if (value <= 4.0) return 'needs-improvement'
      return 'poor'
    case 'fid':
      if (value <= 100) return 'good'
      if (value <= 300) return 'needs-improvement'
      return 'poor'
    case 'cls':
      if (value <= 0.1) return 'good'
      if (value <= 0.25) return 'needs-improvement'
      return 'poor'
    case 'fcp':
      if (value <= 1.8) return 'good'
      if (value <= 3.0) return 'needs-improvement'
      return 'poor'
    case 'ttfb':
      if (value <= 0.8) return 'good'
      if (value <= 1.8) return 'needs-improvement'
      return 'poor'
    default:
      return 'unknown'
  }
}

export function getVitalStatusColor(status: 'good' | 'needs-improvement' | 'poor' | 'unknown'): string {
  switch (status) {
    case 'good':
      return 'text-green-600 bg-green-100 dark:bg-green-950/50'
    case 'needs-improvement':
      return 'text-orange-600 bg-orange-100 dark:bg-orange-950/50'
    case 'poor':
      return 'text-red-600 bg-red-100 dark:bg-red-950/50'
    default:
      return 'text-gray-600 bg-gray-100 dark:bg-gray-950/50'
  }
}

// Format display value for vitals
export function formatVitalValue(metric: string, value: number | null): string {
  if (value === null) return '-'

  switch (metric) {
    case 'lcp':
    case 'fcp':
    case 'ttfb':
    case 'si':
      return `${value.toFixed(2)}s`
    case 'fid':
    case 'tbt':
      return `${Math.round(value)}ms`
    case 'cls':
      return value.toFixed(3)
    default:
      return String(value)
  }
}
