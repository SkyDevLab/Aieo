export interface ParsedSitemapData {
  exists: boolean;
  accessible: boolean;
  status: number;
  url: string;
  isXml: boolean;
  isIndex: boolean;
  urlCount: number;
  snippet?: string;
  error?: string;
}

export function parseSitemap(
  content: string,
  statusCode: number,
  sitemapUrl: string
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
      error: `Sitemap returned HTTP ${statusCode}`,
    };
  }

  const trimmed = content.trim();
  const isXml =
    trimmed.startsWith('<?xml') ||
    trimmed.includes('<urlset') ||
    trimmed.includes('<sitemapindex>');

  const isIndex = trimmed.includes('<sitemapindex');

  // Count <loc> tags
  const locMatches = trimmed.match(/<loc>/gi);
  const urlCount = locMatches ? locMatches.length : 0;

  return {
    exists: true,
    accessible: true,
    status: statusCode,
    url: sitemapUrl,
    isXml,
    isIndex,
    urlCount,
    snippet: trimmed.slice(0, 300),
  };
}
