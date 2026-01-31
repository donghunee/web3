// URL Analysis utilities

// Backend API URL - uses environment variable or localhost default
const ANALYSIS_API_URL = import.meta.env.VITE_ANALYSIS_API_URL || 'http://localhost:3001/api'

export interface UrlMetadata {
  title: string
  description: string
  image: string | null
  url: string
  siteName: string | null
}

export interface UrlAnalysisResult {
  screenshotUrl: string
  metadata: UrlMetadata
  domAnalysis?: {
    totalElements: number
    interactiveElements: Array<{
      type: string
      text: string
      boundingBox: { x: number; y: number; width: number; height: number } | null
    }>
    headings: Array<{ level: number; text: string }>
    images: Array<{ src: string; hasAlt: boolean }>
  }
  accessibility?: {
    score: number
    issueCount: number
    issues: Array<{ type: string; severity: string; message: string }>
  }
  performance?: {
    loadTime: number
    domContentLoaded: number
    resourceCount: number
  }
}

// Backend API response types
interface BackendAnalysisResponse {
  success: boolean
  data?: {
    url: string
    analyzedAt: string
    screenshot: {
      base64: string
      format: string
      width: number
      height: number
    }
    metadata: {
      title: string
      description: string
      image: string | null
      siteName: string | null
      url: string
    }
    domAnalysis?: UrlAnalysisResult['domAnalysis']
    accessibility?: UrlAnalysisResult['accessibility']
    performance?: UrlAnalysisResult['performance']
  }
  error?: {
    code: string
    message: string
  }
}

// Get screenshot URL using different services
export function getScreenshotUrl(url: string, width: number = 1280): string {
  // Use WordPress mshots (free, reliable, no API key)
  const encodedUrl = encodeURIComponent(url)
  return `https://s.wordpress.com/mshots/v1/${encodedUrl}?w=${width}`
}

// Use microlink.io for screenshot (reliable, free tier available)
export async function getScreenshotFromMicrolink(url: string): Promise<string | null> {
  try {
    const apiUrl = `https://api.microlink.io/?url=${encodeURIComponent(url)}&screenshot=true&meta=false&waitForTimeout=3000`
    const response = await fetch(apiUrl)

    if (!response.ok) {
      console.log('Microlink API error:', response.status)
      return null
    }

    const data = await response.json()
    console.log('Microlink response:', data)

    if (data.status === 'success' && data.data?.screenshot?.url) {
      return data.data.screenshot.url
    }

    return null
  } catch (error) {
    console.error('Microlink fetch error:', error)
    return null
  }
}

// Fetch metadata using a CORS proxy + parsing
export async function fetchUrlMetadata(url: string): Promise<UrlMetadata> {
  try {
    // Use allorigins.win as CORS proxy
    const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`

    const response = await fetch(proxyUrl, {
      headers: {
        'Accept': 'text/html',
      }
    })

    if (!response.ok) {
      throw new Error('Failed to fetch URL')
    }

    const html = await response.text()

    // Parse metadata from HTML
    const parser = new DOMParser()
    const doc = parser.parseFromString(html, 'text/html')

    // Extract title
    const title =
      doc.querySelector('meta[property="og:title"]')?.getAttribute('content') ||
      doc.querySelector('meta[name="twitter:title"]')?.getAttribute('content') ||
      doc.querySelector('title')?.textContent ||
      ''

    // Extract description
    const description =
      doc.querySelector('meta[property="og:description"]')?.getAttribute('content') ||
      doc.querySelector('meta[name="twitter:description"]')?.getAttribute('content') ||
      doc.querySelector('meta[name="description"]')?.getAttribute('content') ||
      ''

    // Extract image
    const image =
      doc.querySelector('meta[property="og:image"]')?.getAttribute('content') ||
      doc.querySelector('meta[name="twitter:image"]')?.getAttribute('content') ||
      null

    // Extract site name
    const siteName =
      doc.querySelector('meta[property="og:site_name"]')?.getAttribute('content') ||
      null

    return {
      title: title.trim(),
      description: description.trim(),
      image,
      url,
      siteName,
    }
  } catch (error) {
    console.error('Error fetching metadata:', error)
    // Return basic metadata from URL
    const urlObj = new URL(url)
    return {
      title: urlObj.hostname,
      description: '',
      image: null,
      url,
      siteName: urlObj.hostname,
    }
  }
}

// Analyze URL using self-hosted Puppeteer backend
async function analyzeUrlWithBackend(url: string): Promise<UrlAnalysisResult | null> {
  try {
    console.log('Trying Puppeteer backend API...')

    const response = await fetch(`${ANALYSIS_API_URL}/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url,
        options: {
          fullPageScreenshot: false,
          screenshotWidth: 1280,
          screenshotHeight: 720,
          screenshotFormat: 'png',
          includeDomAnalysis: true,
          includeAccessibility: true,
          includePerformance: true,
        },
      }),
    })

    if (!response.ok) {
      console.log('Backend API error:', response.status)
      return null
    }

    const data: BackendAnalysisResponse = await response.json()

    if (!data.success || !data.data) {
      console.log('Backend API returned error:', data.error)
      return null
    }

    // Convert base64 screenshot to data URL
    const screenshotUrl = `data:image/${data.data.screenshot.format};base64,${data.data.screenshot.base64}`

    return {
      screenshotUrl,
      metadata: {
        title: data.data.metadata.title,
        description: data.data.metadata.description,
        image: data.data.metadata.image,
        url: data.data.metadata.url,
        siteName: data.data.metadata.siteName,
      },
      domAnalysis: data.data.domAnalysis,
      accessibility: data.data.accessibility,
      performance: data.data.performance,
    }
  } catch (error) {
    console.log('Backend API fetch error:', error)
    return null
  }
}

// Analyze URL: get screenshot and metadata
export async function analyzeUrl(url: string): Promise<UrlAnalysisResult> {
  // Validate URL
  try {
    new URL(url)
  } catch {
    throw new Error('Invalid URL')
  }

  // 1. Try self-hosted Puppeteer backend first (best quality)
  const backendResult = await analyzeUrlWithBackend(url)
  if (backendResult) {
    console.log('Using Puppeteer backend result')
    return backendResult
  }

  // 2. Fallback to external services
  console.log('Falling back to external services...')

  // Fetch metadata first
  const metadata = await fetchUrlMetadata(url)

  // Try to get screenshot in order of preference:
  // 1. og:image from metadata (most reliable, no CORS issues)
  // 2. microlink API (good quality screenshots)
  // 3. WordPress mshots (fallback)

  let screenshotUrl: string | null = null

  // 1. Use og:image if available
  if (metadata.image) {
    // Make sure it's an absolute URL
    try {
      const imageUrl = new URL(metadata.image, url)
      screenshotUrl = imageUrl.href
      console.log('Using og:image:', screenshotUrl)
    } catch {
      console.log('Invalid og:image URL:', metadata.image)
    }
  }

  // 2. Try microlink if no og:image
  if (!screenshotUrl) {
    console.log('Trying microlink API...')
    screenshotUrl = await getScreenshotFromMicrolink(url)
  }

  // 3. Fallback to WordPress mshots
  if (!screenshotUrl) {
    console.log('Falling back to WordPress mshots')
    screenshotUrl = getScreenshotUrl(url)
  }

  return {
    screenshotUrl,
    metadata,
  }
}

// Convert screenshot URL to File for upload
export async function screenshotUrlToFile(screenshotUrl: string, filename: string): Promise<File | null> {
  try {
    const response = await fetch(screenshotUrl)
    if (!response.ok) {
      throw new Error('Failed to fetch screenshot')
    }

    const blob = await response.blob()
    return new File([blob], filename, { type: blob.type || 'image/png' })
  } catch (error) {
    console.error('Error converting screenshot to file:', error)
    return null
  }
}
