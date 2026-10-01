export interface ParsedSitemapData {
  exists: boolean;
  accessible: boolean;
  status: number;
  url: string;
  isXml: boolean;
  isIndex: boolean;
  urlCount: number;
  sampleUrls: string[];
  containsHomepage: boolean;
  allUrlsValid: boolean;
  matchesDomain: boolean;
  snippet?: string;
  error?: string;
}

export function parseSitemap(
  content: string,
  statusCode: number,
  sitemapUrl: string,
  targetOrigin?: string
): ParsedSitemapData {
  const accessible = statusCode >= 200 && statusCode < 300;
  if (!accessible || !content.trim()) {
    return {
      exists: accessible && content.trim().length > 0,
      accessible,
      status: statusCode,
      url: sitemapUrl,
      isXml: false,
      isIndex: false,
      urlCount: 0,
      sampleUrls: [],
      containsHomepage: false,
      allUrlsValid: false,
      matchesDomain: false,
      error: `Sitemap returned HTTP ${statusCode}`,
    };
  }

  const trimmed = content.trim();
  const isXml =
    trimmed.startsWith('<?xml') ||
    trimmed.includes('<urlset') ||
    trimmed.includes('<sitemapindex>');

  const isIndex = trimmed.includes('<sitemapindex');

  // Extract <loc>...</loc> content
  const locRegex = /<loc>\s*(https?:\/\/[^<\s]+)\s*<\/loc>/gi;
  const discoveredUrls: string[] = [];
  let match: RegExpExecArray | null;

  while ((match = locRegex.exec(trimmed)) !== null) {
    discoveredUrls.push(match[1].trim());
    if (discoveredUrls.length >= 200) break; // sample up to 200 URLs
  }

  const urlCount = discoveredUrls.length;

  let containsHomepage = false;
  let matchesDomain = true;
  let allUrlsValid = urlCount > 0;

  let targetHostname = '';
  if (targetOrigin) {
    try {
      targetHostname = new URL(targetOrigin).hostname.replace(/^www\./, '');
    } catch {
      targetHostname = '';
    }
  }

  for (const u of discoveredUrls) {
    try {
      const parsed = new URL(u);
      const host = parsed.hostname.replace(/^www\./, '');
      if (targetHostname && host !== targetHostname && !host.endsWith(`.${targetHostname}`)) {
        matchesDomain = false;
      }
      if (targetOrigin && (u === targetOrigin || u === `${targetOrigin}/` || parsed.pathname === '/' || parsed.pathname === '')) {
        containsHomepage = true;
      }
    } catch {
      allUrlsValid = false;
    }
  }

  return {
    exists: true,
    accessible: true,
    status: statusCode,
    url: sitemapUrl,
    isXml,
    isIndex,
    urlCount,
    sampleUrls: discoveredUrls.slice(0, 10),
    containsHomepage,
    allUrlsValid,
    matchesDomain,
    snippet: trimmed.slice(0, 300),
  };
}
