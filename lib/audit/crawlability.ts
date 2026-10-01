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

  // 1. HTTPS Protocol
  const isHttps = pageFetchResult.isHttps;
  results.push({
    id: 'crawl-https',
    category: 'crawlability',
    title: 'HTTPS Protocol Encryption',
    status: isHttps ? 'PASS' : 'FAIL',
    severity: isHttps ? 'info' : 'critical',
    score: isHttps ? 8 : 0,
    maxScore: 8,
    explanation: isHttps
      ? 'The website is served over secure HTTPS encryption.'
      : 'Insecure HTTP protocol detected. AI crawlers and search indexers require secure transport.',
    whatWeFound: isHttps ? `Secure HTTPS protocol on ${parsedUrl.hostname}.` : 'Insecure HTTP protocol.',
    whyItMatters: 'AI search bots prioritize encrypted HTTPS endpoints for transport integrity and safety.',
    howToImprove: isHttps ? 'No action needed.' : 'Install a valid TLS/SSL certificate and redirect HTTP to HTTPS.',
    evidence: { protocol: parsedUrl.protocol, isHttps },
  });

  // 2. HTTP Status Code
  const is200 = pageFetchResult.status === 200;
  const is2xx = pageFetchResult.status >= 200 && pageFetchResult.status < 300;
  results.push({
    id: 'crawl-http-status',
    category: 'crawlability',
    title: 'HTTP Response Status Code',
    status: is200 ? 'PASS' : is2xx ? 'PASS' : 'FAIL',
    severity: is2xx ? 'info' : 'critical',
    score: is200 ? 8 : is2xx ? 5 : 0,
    maxScore: 8,
    explanation: is200
      ? 'Server returned standard HTTP 200 OK.'
      : is2xx
      ? `Server returned HTTP ${pageFetchResult.status} (${pageFetchResult.statusText}).`
      : `Server returned non-success HTTP status ${pageFetchResult.status}.`,
    whatWeFound: `HTTP ${pageFetchResult.status} ${pageFetchResult.statusText}.`,
    whyItMatters: 'Clean 200 status is mandatory for automated content ingestion pipelines.',
    howToImprove: is2xx ? 'No action needed.' : 'Resolve the server error or broken routing.',
    evidence: { status: pageFetchResult.status, statusText: pageFetchResult.statusText },
  });

  // 3. Redirect Chain Hygiene
  const redirects = pageFetchResult.redirectCount;
  const redirectsOk = redirects <= 1;
  results.push({
    id: 'crawl-redirects',
    category: 'crawlability',
    title: 'Redirect Chain Length',
    status: redirectsOk ? 'PASS' : redirects <= 3 ? 'WARNING' : 'FAIL',
    severity: redirectsOk ? 'info' : 'medium',
    score: redirectsOk ? 5 : redirects <= 3 ? 3 : 0,
    maxScore: 5,
    explanation: redirects === 0
      ? 'Direct response with 0 redirects.'
      : redirects === 1
      ? 'Single canonical redirect hop.'
      : `Multiple redirect hops (${redirects}). Long redirect chains waste crawl budget.`,
    whatWeFound: `${redirects} redirect hop(s) before reaching final URL.`,
    whyItMatters: 'Excessive redirects slow crawler latency and risk crawler timeout aborts.',
    howToImprove: redirectsOk ? 'Maintain direct routing.' : 'Shorten redirect chains directly to final canonical URL.',
    evidence: { redirectCount: redirects, finalUrl: pageFetchResult.finalUrl },
  });

  // 4. robots.txt Existence
  results.push({
    id: 'crawl-robots-exists',
    category: 'crawlability',
    title: 'Robots.txt Presence',
    status: robotsData.exists ? 'PASS' : 'WARNING',
    severity: robotsData.exists ? 'info' : 'medium',
    score: robotsData.exists ? 6 : 2,
    maxScore: 6,
    explanation: robotsData.exists
      ? 'robots.txt file was found at domain root.'
      : 'No robots.txt file found at the root of the domain.',
    whatWeFound: robotsData.exists ? `Found robots.txt at ${robotsData.url}.` : 'robots.txt returned 404 or empty.',
    whyItMatters: 'robots.txt is the standard entrypoint used by crawlers to understand crawling permissions.',
    howToImprove: robotsData.exists ? 'Keep robots.txt active.' : 'Deploy a standard robots.txt file at /robots.txt.',
    evidence: { robotsUrl: robotsData.url, exists: robotsData.exists },
  });

  // 5. robots.txt Accessibility
  results.push({
    id: 'crawl-robots-accessible',
    category: 'crawlability',
    title: 'Robots.txt HTTP Accessibility',
    status: robotsData.isAccessible ? 'PASS' : 'WARNING',
    severity: robotsData.isAccessible ? 'info' : 'medium',
    score: robotsData.isAccessible ? 6 : 0,
    maxScore: 6,
    explanation: robotsData.isAccessible
      ? `robots.txt responded with successful HTTP ${robotsData.status}.`
      : `robots.txt returned HTTP ${robotsData.status}.`,
    whatWeFound: `Status: HTTP ${robotsData.status}.`,
    whyItMatters: 'Unreachable robots.txt files can trigger crawler fallback blocking or delayed indexing.',
    howToImprove: robotsData.isAccessible ? 'Keep response healthy.' : 'Ensure web server serves /robots.txt with HTTP 200.',
    evidence: { status: robotsData.status, url: robotsData.url },
  });

  // 6. robots.txt Syntax Validity
  results.push({
    id: 'crawl-robots-syntax',
    category: 'crawlability',
    title: 'Robots.txt Directive Syntax',
    status: !robotsData.hasSyntaxErrors ? 'PASS' : 'WARNING',
    severity: !robotsData.hasSyntaxErrors ? 'info' : 'low',
    score: !robotsData.hasSyntaxErrors ? 5 : 2,
    maxScore: 5,
    explanation: !robotsData.hasSyntaxErrors
      ? 'Robots.txt syntax is valid and follows standard directive format.'
      : `Syntax issues detected in robots.txt: ${robotsData.syntaxErrors.join('; ')}`,
    whatWeFound: !robotsData.hasSyntaxErrors ? 'Clean syntax without parsing errors.' : robotsData.syntaxErrors.join('; '),
    whyItMatters: 'Malformed directives in robots.txt may be misinterpreted or skipped by web crawlers.',
    howToImprove: !robotsData.hasSyntaxErrors ? 'Maintain standard formatting.' : 'Correct syntax errors such as missing colons or orphaned directives.',
    evidence: { syntaxErrors: robotsData.syntaxErrors },
  });

  // 7. robots.txt Homepage Access
  results.push({
    id: 'crawl-robots-homepage',
    category: 'crawlability',
    title: 'Homepage Crawling Permission',
    status: !robotsData.isHomepageDisallowed ? 'PASS' : 'FAIL',
    severity: !robotsData.isHomepageDisallowed ? 'info' : 'critical',
    score: !robotsData.isHomepageDisallowed ? 8 : 0,
    maxScore: 8,
    explanation: !robotsData.isHomepageDisallowed
      ? 'Homepage is allowed for web crawling in robots.txt.'
      : 'Homepage is explicitly disallowed in robots.txt. Automated systems are blocked from reading the main page.',
    whatWeFound: !robotsData.isHomepageDisallowed ? 'Homepage is crawlable.' : 'Disallow rule covers root path (/).',
    whyItMatters: 'Disallowing the root path prevents search engines and AI assistants from indexing your website.',
    howToImprove: !robotsData.isHomepageDisallowed ? 'No action needed.' : 'Remove "Disallow: /" under "User-agent: *" in robots.txt.',
    evidence: { isHomepageDisallowed: robotsData.isHomepageDisallowed },
  });

  // 8. robots.txt Important Paths
  const importantBlocked = robotsData.disallowedImportantPaths.length > 0;
  results.push({
    id: 'crawl-robots-important-paths',
    category: 'crawlability',
    title: 'Resource Assets Crawlability',
    status: !importantBlocked ? 'PASS' : 'WARNING',
    severity: !importantBlocked ? 'info' : 'low',
    score: !importantBlocked ? 4 : 2,
    maxScore: 4,
    explanation: !importantBlocked
      ? 'Static asset paths (/static/, /assets/, etc.) are not blocked in robots.txt.'
      : `Robots.txt blocks resource path(s): ${robotsData.disallowedImportantPaths.join(', ')}.`,
    whatWeFound: !importantBlocked ? 'No critical asset paths blocked.' : `Blocked paths: ${robotsData.disallowedImportantPaths.join(', ')}`,
    whyItMatters: 'Blocking CSS or script paths can hinder search bots from rendering web pages accurately.',
    howToImprove: !importantBlocked ? 'No action needed.' : 'Allow essential asset directories in robots.txt.',
    evidence: { disallowedImportantPaths: robotsData.disallowedImportantPaths },
  });

  // 9. robots.txt General Crawler Block Check
  results.push({
    id: 'crawl-robots-blocking',
    category: 'crawlability',
    title: 'Site-wide Crawler Permissiveness',
    status: !robotsData.blocksAllCrawlers ? 'PASS' : 'FAIL',
    severity: !robotsData.blocksAllCrawlers ? 'info' : 'critical',
    score: !robotsData.blocksAllCrawlers ? 8 : 0,
    maxScore: 8,
    explanation: !robotsData.blocksAllCrawlers
      ? `General crawler policy allows indexing (${robotsData.generalUserAgentPolicy}).`
      : 'Robots.txt completely blocks all web crawlers using "User-agent: * Disallow: /".',
    whatWeFound: !robotsData.blocksAllCrawlers ? `Policy: ${robotsData.generalUserAgentPolicy}` : 'Disallow: / wildcard active.',
    whyItMatters: 'Blocking all crawlers makes the domain invisible to search engines and AI engines alike.',
    howToImprove: !robotsData.blocksAllCrawlers ? 'Keep public paths crawlable.' : 'Remove site-wide disallow directive.',
    evidence: { policy: robotsData.generalUserAgentPolicy, blocksAll: robotsData.blocksAllCrawlers },
  });

  // 10. Meta Robots Noindex
  const hasNoindex = htmlData.metaRobots.hasNoindex;
  results.push({
    id: 'crawl-meta-noindex',
    category: 'crawlability',
    title: 'Meta Robots Indexation (noindex check)',
    status: !hasNoindex ? 'PASS' : 'FAIL',
    severity: !hasNoindex ? 'info' : 'critical',
    score: !hasNoindex ? 8 : 0,
    maxScore: 8,
    explanation: !hasNoindex
      ? 'Page does not contain a "noindex" directive in meta robots tags.'
      : 'Page contains a "noindex" directive, explicitly commanding search engines not to index this page.',
    whatWeFound: !hasNoindex ? 'Indexation permitted (no noindex tag).' : 'meta robots="noindex" detected.',
    whyItMatters: 'A noindex directive instructs search bots to purge the URL from search indexes and knowledge graphs.',
    howToImprove: !hasNoindex ? 'No action needed.' : 'Remove "noindex" from the <meta name="robots"> tag.',
    evidence: { metaRobots: htmlData.metaRobots.raw, hasNoindex },
  });

  // 11. Meta Robots Nofollow
  const hasNofollow = htmlData.metaRobots.hasNofollow;
  results.push({
    id: 'crawl-meta-nofollow',
    category: 'crawlability',
    title: 'Meta Robots Link Crawling (nofollow check)',
    status: !hasNofollow ? 'PASS' : 'WARNING',
    severity: !hasNofollow ? 'info' : 'medium',
    score: !hasNofollow ? 4 : 1,
    maxScore: 4,
    explanation: !hasNofollow
      ? 'Page allows crawlers to follow outgoing links.'
      : 'Page contains a "nofollow" meta directive, preventing discovery of internal navigation links.',
    whatWeFound: !hasNofollow ? 'Links are crawlable.' : 'meta robots="nofollow" detected.',
    whyItMatters: 'Link-following allows AI crawlers to discover subpages and build comprehensive site graphs.',
    howToImprove: !hasNofollow ? 'No action needed.' : 'Remove "nofollow" from page-level meta robots tags.',
    evidence: { hasNofollow },
  });

  // 12. Meta Robots Nosnippet
  const hasNosnippet = htmlData.metaRobots.hasNosnippet;
  results.push({
    id: 'crawl-meta-nosnippet',
    category: 'crawlability',
    title: 'Text Snippet Permission (nosnippet check)',
    status: !hasNosnippet ? 'PASS' : 'WARNING',
    severity: !hasNosnippet ? 'info' : 'high',
    score: !hasNosnippet ? 5 : 1,
    maxScore: 5,
    explanation: !hasNosnippet
      ? 'Snippets and excerpts are permitted by meta robots.'
      : 'Page contains a "nosnippet" directive, blocking search and AI engines from displaying text summaries.',
    whatWeFound: !hasNosnippet ? 'Snippets permitted.' : 'meta robots="nosnippet" detected.',
    whyItMatters: 'nosnippet stops generative AI engines from generating cited answers or summary snippets from your page.',
    howToImprove: !hasNosnippet ? 'No action needed.' : 'Remove "nosnippet" if you want AI engines to quote your content.',
    evidence: { hasNosnippet },
  });

  // 13. Meta Robots Max-Snippet
  const maxSnippetVal = htmlData.metaRobots.maxSnippet;
  const isSnippetRestricted = maxSnippetVal !== null && parseInt(maxSnippetVal, 10) >= 0 && parseInt(maxSnippetVal, 10) < 50;
  results.push({
    id: 'crawl-meta-max-snippet',
    category: 'crawlability',
    title: 'Snippet Length Limit (max-snippet)',
    status: !isSnippetRestricted ? 'PASS' : 'WARNING',
    severity: !isSnippetRestricted ? 'info' : 'low',
    score: !isSnippetRestricted ? 3 : 1,
    maxScore: 3,
    explanation: !isSnippetRestricted
      ? 'Snippet length is unrestricted (max-snippet:-1 or default).'
      : `Snippet length is heavily restricted to ${maxSnippetVal} characters.`,
    whatWeFound: maxSnippetVal ? `max-snippet: ${maxSnippetVal}` : 'Default / unrestricted snippet size.',
    whyItMatters: 'Restricting snippet length may truncate context passed into RAG models.',
    howToImprove: !isSnippetRestricted ? 'No action needed.' : 'Use max-snippet:-1 to allow rich AI snippets.',
    evidence: { maxSnippet: maxSnippetVal },
  });

  // 14. Canonical URL Presence
  const hasCanonical = !!htmlData.canonicalUrl;
  results.push({
    id: 'crawl-canonical-exists',
    category: 'crawlability',
    title: 'Canonical Tag Presence',
    status: hasCanonical ? 'PASS' : 'WARNING',
    severity: hasCanonical ? 'info' : 'medium',
    score: hasCanonical ? 6 : 2,
    maxScore: 6,
    explanation: hasCanonical
      ? `Canonical link tag declared: ${htmlData.canonicalUrl}`
      : 'No <link rel="canonical"> tag found on the page.',
    whatWeFound: htmlData.canonicalUrl ? `Found canonical: ${htmlData.canonicalUrl}` : 'Missing canonical tag.',
    whyItMatters: 'Canonical URLs prevent duplicate content issues across protocols and query parameters.',
    howToImprove: hasCanonical ? 'Keep canonical tags updated.' : 'Add <link rel="canonical" href="..."> in <head>.',
    evidence: { canonicalUrl: htmlData.canonicalUrl },
  });

  // 15. Canonical URL Validity
  let canonicalValid = false;
  if (hasCanonical && htmlData.canonicalUrl) {
    try {
      const c = new URL(htmlData.canonicalUrl);
      canonicalValid = c.protocol === 'http:' || c.protocol === 'https:';
    } catch {
      canonicalValid = false;
    }
  }
  results.push({
    id: 'crawl-canonical-valid',
    category: 'crawlability',
    title: 'Canonical URL Syntax Validity',
    status: !hasCanonical ? 'INFO' : canonicalValid ? 'PASS' : 'WARNING',
    severity: canonicalValid ? 'info' : 'low',
    score: !hasCanonical ? 2 : canonicalValid ? 4 : 1,
    maxScore: 4,
    explanation: !hasCanonical
      ? 'No canonical URL present to validate.'
      : canonicalValid
      ? 'Canonical URL is a valid absolute HTTP/HTTPS address.'
      : 'Canonical URL is relative or malformed.',
    whatWeFound: hasCanonical ? `Canonical: ${htmlData.canonicalUrl}` : 'N/A',
    whyItMatters: 'Malformed canonical URLs are disregarded by search crawlers.',
    howToImprove: canonicalValid ? 'No action needed.' : 'Specify an absolute URL with valid protocol.',
    evidence: { canonicalValid, canonicalUrl: htmlData.canonicalUrl },
  });

  // 16. Canonical Domain Consistency
  let canonicalMatchesDomain = true;
  if (hasCanonical && htmlData.canonicalUrl) {
    try {
      const c = new URL(htmlData.canonicalUrl);
      if (c.hostname !== parsedUrl.hostname) {
        canonicalMatchesDomain = false;
      }
    } catch {
      canonicalMatchesDomain = false;
    }
  }
  results.push({
    id: 'crawl-canonical-consistency',
    category: 'crawlability',
    title: 'Canonical Domain Alignment',
    status: !hasCanonical ? 'INFO' : canonicalMatchesDomain ? 'PASS' : 'WARNING',
    severity: canonicalMatchesDomain ? 'info' : 'medium',
    score: !hasCanonical ? 2 : canonicalMatchesDomain ? 4 : 1,
    maxScore: 4,
    explanation: !hasCanonical
      ? 'No canonical URL present.'
      : canonicalMatchesDomain
      ? 'Canonical domain matches the current website domain.'
      : `Canonical URL points to an external domain (${htmlData.canonicalUrl}). Ensure cross-domain canonicalization is intentional.`,
    whatWeFound: canonicalMatchesDomain ? 'Domain matches requested origin.' : `Points to external domain: ${htmlData.canonicalUrl}`,
    whyItMatters: 'Unintended external canonicals cause search engines to attribute all content to the external URL.',
    howToImprove: canonicalMatchesDomain ? 'No action needed.' : 'Ensure canonical points to your preferred domain.',
    evidence: { canonicalMatchesDomain, targetDomain: parsedUrl.hostname },
  });

  // 17. Sitemap Presence
  results.push({
    id: 'crawl-sitemap-exists',
    category: 'crawlability',
    title: 'XML Sitemap Discovery',
    status: sitemapData.exists ? 'PASS' : 'WARNING',
    severity: sitemapData.exists ? 'info' : 'medium',
    score: sitemapData.exists ? 6 : 2,
    maxScore: 6,
    explanation: sitemapData.exists
      ? `Discovered sitemap at ${sitemapData.url}.`
      : 'XML sitemap was not discovered at standard locations or via robots.txt.',
    whatWeFound: sitemapData.exists ? `Found sitemap at ${sitemapData.url}.` : 'No sitemap found.',
    whyItMatters: 'Sitemaps accelerate discovery of deep content and newly published pages.',
    howToImprove: sitemapData.exists ? 'Keep sitemap up to date.' : 'Create /sitemap.xml and declare it in robots.txt.',
    evidence: { sitemapUrl: sitemapData.url, exists: sitemapData.exists },
  });

  // 18. Sitemap Accessibility
  results.push({
    id: 'crawl-sitemap-accessible',
    category: 'crawlability',
    title: 'Sitemap HTTP Accessibility',
    status: sitemapData.accessible ? 'PASS' : 'WARNING',
    severity: sitemapData.accessible ? 'info' : 'medium',
    score: sitemapData.accessible ? 5 : 0,
    maxScore: 5,
    explanation: sitemapData.accessible
      ? `Sitemap responded with HTTP ${sitemapData.status}.`
      : `Sitemap request failed with HTTP ${sitemapData.status}.`,
    whatWeFound: `Status: HTTP ${sitemapData.status}.`,
    whyItMatters: 'Inaccessible sitemaps fail to index URLs.',
    howToImprove: sitemapData.accessible ? 'No action needed.' : 'Ensure sitemap URL returns HTTP 200.',
    evidence: { status: sitemapData.status },
  });

  // 19. Sitemap XML Validity
  results.push({
    id: 'crawl-sitemap-xml',
    category: 'crawlability',
    title: 'Sitemap XML Format Validity',
    status: sitemapData.isXml ? 'PASS' : sitemapData.exists ? 'WARNING' : 'INFO',
    severity: sitemapData.isXml ? 'info' : 'low',
    score: sitemapData.isXml ? 5 : 1,
    maxScore: 5,
    explanation: sitemapData.isXml
      ? `Valid XML sitemap markup detected (${sitemapData.isIndex ? 'Sitemap Index' : 'URLset'}).`
      : 'Sitemap content does not appear to be standard XML sitemap format.',
    whatWeFound: sitemapData.isXml ? `Valid XML with ${sitemapData.urlCount} URLs.` : 'Non-XML response.',
    whyItMatters: 'Malformed XML prevents automated parsing by search engines.',
    howToImprove: sitemapData.isXml ? 'No action needed.' : 'Generate standard XML conforming to sitemaps.org schema.',
    evidence: { isXml: sitemapData.isXml, isIndex: sitemapData.isIndex, urlCount: sitemapData.urlCount },
  });

  // 20. Sitemap Domain Alignment
  results.push({
    id: 'crawl-sitemap-domain',
    category: 'crawlability',
    title: 'Sitemap Domain Consistency',
    status: !sitemapData.exists ? 'INFO' : sitemapData.matchesDomain ? 'PASS' : 'WARNING',
    severity: sitemapData.matchesDomain ? 'info' : 'low',
    score: !sitemapData.exists ? 2 : sitemapData.matchesDomain ? 3 : 1,
    maxScore: 3,
    explanation: !sitemapData.exists
      ? 'No sitemap found to check domain alignment.'
      : sitemapData.matchesDomain
      ? 'All sample URLs in sitemap match the canonical website domain.'
      : 'Sitemap contains URLs pointing to external domains.',
    whatWeFound: sitemapData.matchesDomain ? 'URLs match site domain.' : 'Cross-domain URLs found in sitemap.',
    whyItMatters: 'Search engines generally reject sitemap entries that do not match the sitemap host domain.',
    howToImprove: sitemapData.matchesDomain ? 'No action needed.' : 'Ensure sitemap only lists URLs for this domain.',
    evidence: { matchesDomain: sitemapData.matchesDomain },
  });

  // 21. Sitemap Homepage Inclusion
  results.push({
    id: 'crawl-sitemap-homepage',
    category: 'crawlability',
    title: 'Sitemap Root Page Inclusion',
    status: !sitemapData.exists ? 'INFO' : sitemapData.containsHomepage ? 'PASS' : 'WARNING',
    severity: sitemapData.containsHomepage ? 'info' : 'low',
    score: !sitemapData.exists ? 1 : sitemapData.containsHomepage ? 3 : 1,
    maxScore: 3,
    explanation: !sitemapData.exists
      ? 'No sitemap found.'
      : sitemapData.containsHomepage
      ? 'Sitemap includes the primary homepage URL.'
      : 'Homepage URL was not explicitly identified in the sitemap sample.',
    whatWeFound: sitemapData.containsHomepage ? 'Homepage listed in sitemap.' : 'Homepage not found in sample.',
    whyItMatters: 'The homepage is the primary root anchor of site authority.',
    howToImprove: sitemapData.containsHomepage ? 'No action needed.' : 'Ensure root canonical URL is included in sitemap.',
    evidence: { containsHomepage: sitemapData.containsHomepage },
  });

  // 22. AI Bot Directives in robots.txt (Informational)
  const restrictedBots = robotsData.aiBotsDirectives.filter((b) => b.status === 'disallowed_all');
  results.push({
    id: 'crawl-ai-bot-directives',
    category: 'crawlability',
    title: 'AI Crawler Directives (GPTBot, ClaudeBot, etc.)',
    status: restrictedBots.length === 0 ? 'PASS' : 'WARNING',
    severity: restrictedBots.length === 0 ? 'info' : 'low',
    score: restrictedBots.length === 0 ? 5 : 2,
    maxScore: 5,
    explanation: restrictedBots.length === 0
      ? 'Robots.txt does not block known AI crawlers (GPTBot, ClaudeBot, PerplexityBot, etc.).'
      : `Explicit block detected for ${restrictedBots.length} AI crawler(s): ${restrictedBots.map((b) => b.bot).join(', ')}.`,
    whatWeFound: restrictedBots.length === 0 ? 'No AI crawler blocks.' : `Blocked: ${restrictedBots.map((b) => b.bot).join(', ')}`,
    whyItMatters: 'Blocking AI bots prevents conversational engines from answering queries with direct citations.',
    howToImprove: restrictedBots.length === 0 ? 'No action needed.' : 'Adjust directives if you wish to allow AI engines to ingest public data.',
    evidence: { aiBots: robotsData.aiBotsDirectives },
  });

  // 23. /llms.txt (Optional / Informational - NEVER a failure)
  results.push({
    id: 'crawl-llms-txt',
    category: 'crawlability',
    title: 'LLMs.txt Standard File',
    status: 'INFO',
    severity: 'info',
    score: 0,
    maxScore: 0, // Informational: does not penalize score
    explanation: llmsTxtStatus.standardExists
      ? 'Found /llms.txt at root domain.'
      : 'llms.txt was not found. Note: llms.txt is an optional developer convention and is not required for normal search crawling.',
    whatWeFound: llmsTxtStatus.standardExists ? 'Found /llms.txt.' : 'llms.txt not detected.',
    whyItMatters: 'llms.txt is an emerging proposal to provide concise markdown context for LLMs.',
    howToImprove: llmsTxtStatus.standardExists ? 'Keep it concise.' : 'Optionally add /llms.txt if you want to provide curated LLM documentation.',
    evidence: { standardExists: llmsTxtStatus.standardExists, url: llmsTxtStatus.standardUrl },
  });

  // 24. /llms-full.txt (Optional / Informational - NEVER a failure)
  results.push({
    id: 'crawl-llms-full-txt',
    category: 'crawlability',
    title: 'LLMs-full.txt Comprehensive Context File',
    status: 'INFO',
    severity: 'info',
    score: 0,
    maxScore: 0, // Informational: does not penalize score
    explanation: llmsTxtStatus.fullExists
      ? 'Found /llms-full.txt at root domain.'
      : 'llms-full.txt was not found. Optional convention.',
    whatWeFound: llmsTxtStatus.fullExists ? 'Found /llms-full.txt.' : 'llms-full.txt not detected.',
    whyItMatters: 'Optional extended documentation file for offline LLM indexing.',
    howToImprove: 'Optional developer convention.',
    evidence: { fullExists: llmsTxtStatus.fullExists, url: llmsTxtStatus.fullUrl },
  });

  return results;
}
