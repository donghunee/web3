// URL Analysis utilities

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

// Analyze URL: get screenshot and metadata
export async function analyzeUrl(url: string): Promise<UrlAnalysisResult> {
  // Validate URL
  try {
    new URL(url)
  } catch {
    throw new Error('Invalid URL')
  }

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
