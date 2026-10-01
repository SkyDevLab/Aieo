import { safeFetch, validateUrlForSSR, SecurityValidationError } from '../security/url-validation';
import { parseHtml } from '../parsers/html';
import { parseJsonLd } from '../parsers/jsonld';
import { parseRobotsTxt } from '../parsers/robots';
import { parseSitemap } from '../parsers/sitemap';
import { auditCrawlability } from './crawlability';
import { auditContent } from './content';
import { auditStructuredData } from './structured-data';
import { auditEntity } from './entity';
import { auditAnswerReadiness } from './answer-readiness';
import { compileAuditReport } from './scoring';
import { AuditReport, TechnicalEvidence } from './types';

export interface AuditProgressEvent {
  step:
    | 'fetching_page'
    | 'checking_robots'
    | 'checking_sitemap'
    | 'parsing_structured_data'
    | 'checking_entity_signals'
    | 'calculating_score'
    | 'completed';
  label: string;
  timestamp: number;
}

export async function runFullAudit(
  rawUrl: string,
  onProgress?: (event: AuditProgressEvent) => void
): Promise<AuditReport> {
  const startTime = Date.now();

  // Validate URL & IP (SSRF Protection)
  const validated = await validateUrlForSSR(rawUrl);
  const targetUrlStr = validated.url.toString();
  const origin = validated.url.origin;

  // Step 1: Fetching page
  onProgress?.({
    step: 'fetching_page',
    label: 'Fetching webpage content and HTTP headers',
    timestamp: Date.now(),
  });

  const robotsUrl = `${origin}/robots.txt`;
  const defaultSitemapUrl = `${origin}/sitemap.xml`;
  const llmsUrl = `${origin}/llms.txt`;
  const llmsFullUrl = `${origin}/llms-full.txt`;

  // Fetch page, robots.txt, llms.txt concurrently
  const [pageResult, robotsFetch, llmsFetch, llmsFullFetch] = await Promise.all([
    safeFetch(targetUrlStr),
    safeFetch(robotsUrl, { timeoutMs: 5000 }).catch(() => null),
    safeFetch(llmsUrl, { timeoutMs: 4000 }).catch(() => null),
    safeFetch(llmsFullUrl, { timeoutMs: 4000 }).catch(() => null),
  ]);

  // Step 2: Checking robots.txt
  onProgress?.({
    step: 'checking_robots',
    label: 'Analyzing robots.txt crawl rules and AI bot directives',
    timestamp: Date.now(),
  });

  const robotsData = parseRobotsTxt(
    robotsFetch?.body || '',
    robotsFetch?.status || 404,
    robotsUrl
  );

  // Step 3: Checking sitemap
  onProgress?.({
    step: 'checking_sitemap',
    label: 'Validating XML sitemap discovery and accessibility',
    timestamp: Date.now(),
  });

  // Determine sitemap URL: prefer one listed in robots.txt if available
  const discoveredSitemapUrl =
    robotsData.sitemapsDeclared.length > 0
      ? robotsData.sitemapsDeclared[0]
      : defaultSitemapUrl;

  let sitemapFetch: Awaited<ReturnType<typeof safeFetch>> | null = null;
  try {
    sitemapFetch = await safeFetch(discoveredSitemapUrl, { timeoutMs: 5000 });
  } catch {
    sitemapFetch = null;
  }

  const sitemapData = parseSitemap(
    sitemapFetch?.body || '',
    sitemapFetch?.status || 404,
    discoveredSitemapUrl,
    origin
  );

  // Step 4: Parsing structured data
  onProgress?.({
    step: 'parsing_structured_data',
    label: 'Extracting and verifying Schema.org JSON-LD definitions',
    timestamp: Date.now(),
  });

  const htmlData = parseHtml(pageResult.body, pageResult.finalUrl);
  const jsonLdData = parseJsonLd(pageResult.body);

  // Step 5: Checking entity signals
  onProgress?.({
    step: 'checking_entity_signals',
    label: 'Cross-referencing brand, author, and entity signals',
    timestamp: Date.now(),
  });

  const llmsTxtStatus = {
    standardExists: !!llmsFetch && llmsFetch.status >= 200 && llmsFetch.status < 300 && llmsFetch.body.trim().length > 0,
    standardUrl: llmsUrl,
    fullExists: !!llmsFullFetch && llmsFullFetch.status >= 200 && llmsFullFetch.status < 300 && llmsFullFetch.body.trim().length > 0,
    fullUrl: llmsFullUrl,
    details: 'llms.txt is an optional developer convention for LLM context.',
  };

  // Run audit rules across all 5 categories
  const crawlabilityChecks = auditCrawlability({
    targetUrl: pageResult.finalUrl,
    pageFetchResult: pageResult,
    htmlData,
    robotsData,
    sitemapData,
    llmsTxtStatus,
  });

  const contentChecks = auditContent({
    htmlData,
  });

  const structuredDataChecks = auditStructuredData({
    jsonLdData,
  });

  const entityResult = auditEntity({
    targetUrl: pageResult.finalUrl,
    htmlData,
    jsonLdData,
  });

  const answerResult = auditAnswerReadiness({
    htmlData,
    jsonLdData,
    entitySummary: entityResult.entitySummary,
  });

  // Step 6: Calculating score
  onProgress?.({
    step: 'calculating_score',
    label: 'Synthesizing weighted metrics and generating readiness report',
    timestamp: Date.now(),
  });

  const technicalEvidence: TechnicalEvidence = {
    httpStatus: pageResult.status,
    finalUrl: pageResult.finalUrl,
    canonicalUrl: htmlData.canonicalUrl,
    isHttps: pageResult.isHttps,
    redirectCount: pageResult.redirectCount,
    robotsStatus: robotsData.status,
    robotsUrl: robotsData.url,
    sitemapStatus: sitemapData.status,
    sitemapUrl: sitemapData.url,
    jsonLdTypes: jsonLdData.detectedTypes,
    title: htmlData.title,
    h1: htmlData.h1List[0] || null,
    language: htmlData.language,
    contentLengthBytes: htmlData.rawHtmlLength,
    wordCount: htmlData.wordCount,
    textToHtmlRatio: htmlData.textToHtmlRatio,
    metaRobots: htmlData.metaRobots.raw,
  };

  const report = compileAuditReport({
    url: pageResult.finalUrl,
    durationMs: Date.now() - startTime,
    crawlabilityChecks,
    contentChecks,
    structuredDataChecks,
    entityChecks: entityResult.checks,
    answerReadinessChecks: answerResult.checks,
    detectedSchemas: jsonLdData.detectedTypes,
    entitySummary: entityResult.entitySummary,
    entityGraph: entityResult.entityGraph,
    answerCoverage: answerResult.answerCoverage,
    entityIntentCoverage: answerResult.entityIntentCoverage,
    evidenceSignals: answerResult.evidenceSignals,
    informationArchitecture: answerResult.informationArchitecture,
    technicalEvidence,
    llmsTxtStatus,
  });

  onProgress?.({
    step: 'completed',
    label: 'Audit completed successfully',
    timestamp: Date.now(),
  });

  return report;
}
