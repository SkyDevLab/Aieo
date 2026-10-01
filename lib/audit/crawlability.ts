import { AuditRuleResult } from './types';
import { ParsedRobotsData } from '../parsers/robots';
import { ParsedSitemapData } from '../parsers/sitemap';
import { ExtractedHtmlData } from '../parsers/html';
import { SafeFetchResult } from '../security/url-validation';

export interface CrawlabilityInput {
  targetUrl: string;
  pageFetchResult: SafeFetchResult;
  htmlData: ExtractedHtmlData;
  robotsData: ParsedRobotsData;
  sitemapData: ParsedSitemapData;
  llmsTxtStatus: {
    standardExists: boolean;
    standardUrl?: string;
    fullExists: boolean;
    fullUrl?: string;
  };
}

export function auditCrawlability(input: CrawlabilityInput): AuditRuleResult[] {
  const { targetUrl, pageFetchResult, htmlData, robotsData, sitemapData, llmsTxtStatus } = input;
  const results: AuditRuleResult[] = [];

  const parsedUrl = new URL(targetUrl);

  // 1. HTTPS Enabled
  const isHttps = pageFetchResult.isHttps;
  results.push({
    id: 'crawl-https',
    category: 'crawlability',
    title: 'HTTPS Encryption Protocol',
    status: isHttps ? 'PASS' : 'FAIL',
    severity: isHttps ? 'info' : 'critical',
    score: isHttps ? 15 : 0,
    maxScore: 15,
    explanation: isHttps
      ? 'The website is served over secure HTTPS encryption.'
      : 'The website is not using secure HTTPS protocol. Search engines and AI crawlers strongly prioritize secure endpoints.',
    whatWeFound: isHttps
      ? `Secure HTTPS verified for ${parsedUrl.hostname}.`
      : `Insecure HTTP protocol detected for ${parsedUrl.hostname}.`,
    whyItMatters:
      'AI search bots and web crawlers prioritize encrypted HTTPS endpoints for data security, transport integrity, and user trust.',
    howToImprove: isHttps
      ? 'No action required. HTTPS is correctly configured.'
      : 'Install a TLS/SSL certificate (such as free Let’s Encrypt certificates) and configure automatic HTTP to HTTPS 301 redirection.',
  });

  // 2. HTTP Status Code
  const is200 = pageFetchResult.status === 200;
  const is2xx = pageFetchResult.status >= 200 && pageFetchResult.status < 300;
  results.push({
    id: 'crawl-http-status',
    category: 'crawlability',
    title: 'HTTP Response Status',
    status: is200 ? 'PASS' : is2xx ? 'PASS' : 'FAIL',
    severity: is2xx ? 'info' : 'critical',
    score: is200 ? 15 : is2xx ? 12 : 0,
    maxScore: 15,
    explanation: is2xx
      ? `The server returned a successful HTTP ${pageFetchResult.status} status.`
      : `The server returned HTTP status ${pageFetchResult.status} (${pageFetchResult.statusText}).`,
    whatWeFound: `HTTP status code: ${pageFetchResult.status} (${pageFetchResult.statusText}).`,
    whyItMatters:
      'AI crawlers require a healthy 200 OK status to ingest content. Non-200 responses impede crawling and indexation.',
    howToImprove: is2xx
      ? 'No action needed. The server responds with an acceptable HTTP status.'
      : 'Investigate web server logs to resolve the non-200 error code and ensure the URL resolves cleanly.',
  });

  // 3. robots.txt Accessibility
  const robotsAccessible = robotsData.isAccessible && robotsData.exists;
  results.push({
    id: 'crawl-robots-accessible',
    category: 'crawlability',
    title: 'robots.txt Accessibility',
    status: robotsAccessible ? 'PASS' : 'WARNING',
    severity: robotsAccessible ? 'info' : 'medium',
    score: robotsAccessible ? 15 : 5,
    maxScore: 15,
    explanation: robotsAccessible
      ? 'robots.txt is accessible and provides crawling instructions.'
      : 'robots.txt was not found or was not accessible at the root domain.',
    whatWeFound: robotsAccessible
      ? `robots.txt responded with HTTP ${robotsData.status} at ${robotsData.url}.`
      : `robots.txt returned HTTP ${robotsData.status} or was missing.`,
    whyItMatters:
      'robots.txt informs automated crawlers where they are permitted to go and where sitemaps are hosted.',
    howToImprove: robotsAccessible
      ? 'Maintain up-to-date directives in robots.txt.'
      : 'Create a standard robots.txt file at the root of your domain (/robots.txt) declaring crawl directives and sitemap locations.',
  });

  // 4. robots.txt General Crawler Restrictions
  const blocksAll = robotsData.blocksAllCrawlers;
  results.push({
    id: 'crawl-robots-blocking',
    category: 'crawlability',
    title: 'Robots.txt Crawler Access',
    status: blocksAll ? 'FAIL' : 'PASS',
    severity: blocksAll ? 'critical' : 'info',
    score: blocksAll ? 0 : 20,
    maxScore: 20,
    explanation: blocksAll
      ? 'robots.txt contains "Disallow: /" for all crawlers (*), completely preventing automated bots from indexing the site.'
      : 'robots.txt does not block general web crawlers from indexing the site.',
    whatWeFound: blocksAll
      ? 'General wildcard crawler block detected: User-agent: * Disallow: /.'
      : `General crawler policy: ${robotsData.generalUserAgentPolicy}. No site-wide Disallow: / wildcard blocking.`,
    whyItMatters:
      'Blocking all crawlers prevents AI systems and search engines from accessing or indexing any content on your domain.',
    howToImprove: blocksAll
      ? 'Remove "Disallow: /" under "User-agent: *" in robots.txt if you want search engines and AI bots to crawl your public pages.'
      : 'Ensure paths containing public information remain accessible while keeping private administration routes protected.',
  });

  // 5. AI Crawlers Policy (Informational)
  const restrictedBots = robotsData.aiBotsDirectives.filter(
    (b) => b.status === 'disallowed_all' || b.status === 'restricted'
  );
  const aiStatus = restrictedBots.length > 0 ? 'WARNING' : 'PASS';
  results.push({
    id: 'crawl-ai-bots-policy',
    category: 'crawlability',
    title: 'AI Bot Directives in robots.txt',
    status: aiStatus,
    severity: restrictedBots.length > 0 ? 'low' : 'info',
    score: restrictedBots.length > 0 ? 3 : 5,
    maxScore: 5,
    explanation:
      restrictedBots.length > 0
        ? `Explicit restrictions found for ${restrictedBots.length} AI bot(s): ${restrictedBots.map((b) => b.bot).join(', ')}.`
        : 'robots.txt does not block major AI crawlers (GPTBot, ClaudeBot, PerplexityBot, etc.). They follow general crawler rules.',
    whatWeFound:
      restrictedBots.length > 0
        ? `Restricted AI crawlers: ${restrictedBots.map((b) => `${b.bot} (${b.details})`).join('; ')}.`
        : 'No explicit blocks targeted at known AI search engine crawlers.',
    whyItMatters:
      'Directives for bots like GPTBot, ClaudeBot, and PerplexityBot govern whether generative AI search engines can ingest your public pages.',
    howToImprove:
      restrictedBots.length > 0
        ? 'If you want your website to be directly crawlable by these AI engines, adjust or remove the disallow directives for their user-agents.'
        : 'Keep monitoring emerging AI user-agents if you wish to define fine-grained data-scraping policies.',
  });

  // 6. Sitemap.xml Accessibility
  const sitemapOk = sitemapData.accessible && sitemapData.isXml;
  results.push({
    id: 'crawl-sitemap',
    category: 'crawlability',
    title: 'XML Sitemap Availability',
    status: sitemapOk ? 'PASS' : sitemapData.accessible ? 'WARNING' : 'WARNING',
    severity: sitemapOk ? 'info' : 'medium',
    score: sitemapOk ? 15 : sitemapData.accessible ? 8 : 0,
    maxScore: 15,
    explanation: sitemapOk
      ? `XML sitemap is accessible at ${sitemapData.url} with ${sitemapData.urlCount} discovered URLs.`
      : 'Standard sitemap.xml was not accessible at the default location or did not contain valid XML markup.',
    whatWeFound: sitemapOk
      ? `Found valid XML sitemap (${sitemapData.isIndex ? 'Sitemap Index' : 'URLset'}) with ${sitemapData.urlCount} URLs.`
      : `Sitemap status: ${sitemapData.status} at ${sitemapData.url}. ${sitemapData.error || 'No valid XML content found.'}`,
    whyItMatters:
      'Sitemaps provide AI crawlers with an authoritative map of all public canonical URLs, ensuring comprehensive discovery.',
    howToImprove: sitemapOk
      ? 'Ensure your XML sitemap is regularly refreshed and submitted in your robots.txt "Sitemap:" directive.'
      : 'Generate and publish an XML sitemap at /sitemap.xml and declare its URL in your robots.txt file.',
  });

  // 7. Canonical URL Check
  const hasCanonical = !!htmlData.canonicalUrl;
  let canonicalValid = false;
  let canonicalMismatch = false;

  if (hasCanonical && htmlData.canonicalUrl) {
    try {
      const cUrl = new URL(htmlData.canonicalUrl);
      canonicalValid = cUrl.protocol === 'http:' || cUrl.protocol === 'https:';
      if (cUrl.hostname !== parsedUrl.hostname) {
        canonicalMismatch = true;
      }
    } catch {
      canonicalValid = false;
    }
  }

  const canonicalStatus = hasCanonical && canonicalValid && !canonicalMismatch
    ? 'PASS'
    : hasCanonical && canonicalMismatch
    ? 'WARNING'
    : hasCanonical
    ? 'WARNING'
    : 'WARNING';

  const canonicalScore = hasCanonical && canonicalValid && !canonicalMismatch ? 15 : hasCanonical ? 8 : 4;

  results.push({
    id: 'crawl-canonical',
    category: 'crawlability',
    title: 'Canonical URL Tag',
    status: canonicalStatus,
    severity: canonicalStatus === 'PASS' ? 'info' : 'low',
    score: canonicalScore,
    maxScore: 15,
    explanation:
      canonicalStatus === 'PASS'
        ? `Canonical link tag is properly defined: ${htmlData.canonicalUrl}.`
        : hasCanonical && canonicalMismatch
        ? `Canonical tag points to an external domain (${htmlData.canonicalUrl}). Ensure this is intentional.`
        : hasCanonical
        ? 'Canonical URL tag exists but contains a malformed URL.'
        : 'No <link rel="canonical"> tag was found on the page.',
    whatWeFound: htmlData.canonicalUrl
      ? `Canonical tag: ${htmlData.canonicalUrl}.`
      : 'Missing canonical URL link tag.',
    whyItMatters:
      'Canonical tags prevent duplicate content issues by telling AI engines which exact URL is the primary source of truth.',
    howToImprove: hasCanonical
      ? 'Ensure the canonical link matches the exact preferred protocol and domain for this page.'
      : 'Add a <link rel="canonical" href="https://yourdomain.com/path"> element in the HTML <head>.',
  });

  // 8. LLMS.TXT (Informational check - NOT a failure)
  const llmsFound = llmsTxtStatus.standardExists || llmsTxtStatus.fullExists;
  results.push({
    id: 'crawl-llms-txt',
    category: 'crawlability',
    title: 'LLMs.txt Standard File',
    status: 'INFO',
    severity: 'info',
    score: 0,
    maxScore: 0, // Informational only: does not penalize score
    explanation: llmsFound
      ? `llms.txt was detected on this domain (${llmsTxtStatus.standardExists ? '/llms.txt' : '/llms-full.txt'}).`
      : 'llms.txt was not found. Note: llms.txt is an optional emerging convention and is not required for search crawling.',
    whatWeFound: llmsFound
      ? `Detected: ${[llmsTxtStatus.standardExists ? '/llms.txt' : null, llmsTxtStatus.fullExists ? '/llms-full.txt' : null].filter(Boolean).join(', ')}.`
      : 'Neither /llms.txt nor /llms-full.txt were found on the domain.',
    whyItMatters:
      'llms.txt is an emerging proposal to provide concise markdown context specifically formatted for LLM ingestion.',
    howToImprove: llmsFound
      ? 'Keep your llms.txt file concise, accurate, and aligned with your website documentation.'
      : 'If desired, create a /llms.txt markdown file summarizing your site’s core purpose and high-value reference links.',
  });

  return results;
}
