const BLOCKED_HOSTS = [
  'localhost',
  '127.0.0.1',
  '0.0.0.0',
  '::1',
];

const BLOCKED_IP_RANGES = [
  /^10\./,
  /^172\.(1[6-9]|2[0-9]|3[0-1])\./,
  /^192\.168\./,
  /^169\.254\./,
];

export function isValidUrl(urlString: string): boolean {
  try {
    const url = new URL(urlString);
    return ['http:', 'https:'].includes(url.protocol);
  } catch {
    return false;
  }
}

export function isBlockedUrl(urlString: string): boolean {
  try {
    const url = new URL(urlString);
    const hostname = url.hostname.toLowerCase();

    // Check blocked hosts
    if (BLOCKED_HOSTS.includes(hostname)) {
      return true;
    }

    // Check blocked IP ranges (SSRF prevention)
    for (const pattern of BLOCKED_IP_RANGES) {
      if (pattern.test(hostname)) {
        return true;
      }
    }

    return false;
  } catch {
    return true;
  }
}

export function normalizeUrl(urlString: string): string {
  try {
    const url = new URL(urlString);
    return url.href;
  } catch {
    // Try adding https:// if missing
    if (!urlString.startsWith('http://') && !urlString.startsWith('https://')) {
      return `https://${urlString}`;
    }
    return urlString;
  }
}
