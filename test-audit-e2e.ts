import { validateUrlForSSR, SecurityValidationError } from './lib/security/url-validation';
import { parseHtml } from './lib/parsers/html';
import { parseJsonLd } from './lib/parsers/jsonld';
import { parseRobotsTxt } from './lib/parsers/robots';
import { parseSitemap } from './lib/parsers/sitemap';
import { auditCrawlability } from './lib/audit/crawlability';
import { auditContent } from './lib/audit/content';
import { auditStructuredData } from './lib/audit/structured-data';
import { auditEntity } from './lib/audit/entity';
import { auditAnswerReadiness } from './lib/audit/answer-readiness';
import { compileAuditReport } from './lib/audit/scoring';
import { TechnicalEvidence } from './lib/audit/types';

async function runAllUnitTests() {
  console.log('====================================================');
  console.log('RUNNING WEBSITE AIEO CHECKER EXTENDED TEST SUITE');
  console.log('====================================================');

  // TEST 1: SSRF Protection
  console.log('\n[1/17] Test: SSRF Protection against loopback and cloud metadata...');
  const blockedIps = [
    'http://localhost',
    'http://127.0.0.1:3000',
    'http://169.254.169.254/latest/meta-data',
    'http://0.0.0.0',
    'http://user:password@example.com',
    'http://10.0.0.1',
    'http://192.168.1.1',
    'http://172.16.0.1',
  ];
  for (const target of blockedIps) {
    try {
      await validateUrlForSSR(target);
      throw new Error(`Expected ${target} to be blocked!`);
    } catch (err: unknown) {
      if (err instanceof SecurityValidationError) {
        // expected
      } else {
        throw err;
      }
    }
  }
  console.log('✓ SSRF Protection passed.');

  // TEST 2: Missing Title
  console.log('\n[2/17] Test: Missing Title tag detection...');
  const htmlNoTitle = '<html><head></head><body><h1>Heading</h1><p>Some text</p></body></html>';
  const parsedNoTitle = parseHtml(htmlNoTitle);
  const contentNoTitle = auditContent({ htmlData: parsedNoTitle });
  const titleCheck = contentNoTitle.find((c) => c.id === 'content-title-exists');
  if (titleCheck?.status !== 'FAIL') throw new Error('Expected title-exists to FAIL');
  console.log('✓ Missing Title detected as FAIL.');

  // TEST 3: Missing Description
  console.log('\n[3/17] Test: Missing Meta Description detection...');
  const descCheck = contentNoTitle.find((c) => c.id === 'content-meta-desc-exists');
  if (descCheck?.status !== 'WARNING') throw new Error('Expected meta-desc to be WARNING');
  console.log('✓ Missing Meta Description detected.');

  // TEST 4: Missing H1
  console.log('\n[4/17] Test: Missing H1 detection...');
  const htmlNoH1 = '<html><head><title>Test Title Page</title></head><body><p>No H1 here</p></body></html>';
  const parsedNoH1 = parseHtml(htmlNoH1);
  const contentNoH1 = auditContent({ htmlData: parsedNoH1 });
  const h1Check = contentNoH1.find((c) => c.id === 'content-h1-exists');
  if (h1Check?.status !== 'FAIL') throw new Error('Expected H1 exists to FAIL');
  console.log('✓ Missing H1 detected as FAIL.');

  // TEST 5: Multiple H1s
  console.log('\n[5/17] Test: Multiple H1s detection...');
  const htmlMultiH1 = '<html><head><title>Title</title></head><body><h1>One</h1><h1>Two</h1></body></html>';
  const parsedMultiH1 = parseHtml(htmlMultiH1);
  const contentMultiH1 = auditContent({ htmlData: parsedMultiH1 });
  const multiH1Check = contentMultiH1.find((c) => c.id === 'content-h1-single');
  if (multiH1Check?.status !== 'WARNING') throw new Error('Expected multiple H1 to trigger WARNING');
  console.log('✓ Multiple H1s detected as WARNING.');

  // TEST 6: Malformed JSON-LD
  console.log('\n[6/17] Test: Malformed JSON-LD handling...');
  const htmlBadJson = '<html><head><script type="application/ld+json">{ broken json: true, }</script></head><body></body></html>';
  const jsonBad = parseJsonLd(htmlBadJson);
  const sdBad = auditStructuredData({ jsonLdData: jsonBad });
  const syntaxCheck = sdBad.find((c) => c.id === 'sd-syntax');
  if (syntaxCheck?.status !== 'FAIL') throw new Error('Expected JSON-LD syntax check to FAIL');
  console.log('✓ Malformed JSON-LD caught gracefully without crash.');

  // TEST 7: Valid Person Schema
  console.log('\n[7/17] Test: Valid Person Schema...');
  const htmlPerson = `<html><head><script type="application/ld+json">{"@context":"https://schema.org","@type":"Person","name":"Surya Pratap Singh","url":"https://skydevlab.com","sameAs":["https://github.com/surya"]}</script></head><body></body></html>`;
  const jsonPerson = parseJsonLd(htmlPerson);
  const sdPerson = auditStructuredData({ jsonLdData: jsonPerson });
  const nameCheck = sdPerson.find((c) => c.id === 'sd-name-property');
  if (nameCheck?.status !== 'PASS') throw new Error('Expected Person name check to PASS');
  console.log('✓ Valid Person schema verified.');

  // TEST 8: Valid Organization Schema
  console.log('\n[8/17] Test: Valid Organization Schema...');
  const htmlOrg = `<html><head><script type="application/ld+json">{"@context":"https://schema.org","@type":"Organization","name":"SkyDevLab","url":"https://skydevlab.com"}</script></head><body></body></html>`;
  const jsonOrg = parseJsonLd(htmlOrg);
  const sdOrg = auditStructuredData({ jsonLdData: jsonOrg });
  const orgTypeCheck = sdOrg.find((c) => c.id === 'sd-recognized-types');
  if (orgTypeCheck?.status !== 'PASS') throw new Error('Expected Organization schema to PASS');
  console.log('✓ Valid Organization schema verified.');

  // TEST 9: Inconsistent Entity Names
  console.log('\n[9/17] Test: Inconsistent Entity Names Detection...');
  const htmlInconsistent = `<html><head><title>Acme Corporation Online</title><script type="application/ld+json">{"@context":"https://schema.org","@type":"Organization","name":"Globex Worldwide"}</script></head><body><h1>Globex Worldwide</h1><footer><p>© 2026 Initech Ltd</p></footer></body></html>`;
  const parsedInconsistent = parseHtml(htmlInconsistent, 'https://example.com');
  const jsonInconsistent = parseJsonLd(htmlInconsistent);
  const entityInconsistent = auditEntity({
    targetUrl: 'https://example.com',
    htmlData: parsedInconsistent,
    jsonLdData: jsonInconsistent,
  });
  if (entityInconsistent.entitySummary.consistencyDetails.conflicts.length === 0) {
    throw new Error('Expected entity conflicts to be detected!');
  }
  console.log(`✓ Detected ${entityInconsistent.entitySummary.consistencyDetails.conflicts.length} entity name conflicts.`);

  // TEST 10: Missing robots.txt
  console.log('\n[10/17] Test: Missing robots.txt...');
  const robotsMissing = parseRobotsTxt('', 404, 'https://example.com/robots.txt');
  if (robotsMissing.exists !== false || robotsMissing.isAccessible !== false) {
    throw new Error('Expected robots.txt to report missing');
  }
  console.log('✓ Missing robots.txt properly handled.');

  // TEST 11: Blocked robots.txt
  console.log('\n[11/17] Test: Blocked robots.txt (Disallow: /)...');
  const robotsBlocked = parseRobotsTxt('User-agent: *\nDisallow: /', 200, 'https://example.com/robots.txt');
  if (robotsBlocked.blocksAllCrawlers !== true || robotsBlocked.isHomepageDisallowed !== true) {
    throw new Error('Expected robots.txt to report site-wide block!');
  }
  console.log('✓ Blocked robots.txt correctly identified.');

  // TEST 12: Valid Sitemap
  console.log('\n[12/17] Test: Valid Sitemap XML...');
  const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>https://example.com/</loc></url></urlset>`;
  const parsedSitemap = parseSitemap(sitemapXml, 200, 'https://example.com/sitemap.xml', 'https://example.com');
  if (!parsedSitemap.isXml || !parsedSitemap.containsHomepage) {
    throw new Error('Expected valid sitemap with homepage inclusion');
  }
  console.log('✓ Valid sitemap XML verified.');

  // TEST 13: Missing Sitemap
  console.log('\n[13/17] Test: Missing Sitemap...');
  const sitemapMissing = parseSitemap('', 404, 'https://example.com/sitemap.xml');
  if (sitemapMissing.exists !== false) throw new Error('Expected sitemap to report missing');
  console.log('✓ Missing sitemap properly reported.');

  // TEST 14: Missing llms.txt (Should be INFO, NOT FAIL)
  console.log('\n[14/17] Test: Missing llms.txt is INFO...');
  const crawlNoLlms = auditCrawlability({
    targetUrl: 'https://example.com',
    pageFetchResult: {
      status: 200,
      statusText: 'OK',
      finalUrl: 'https://example.com',
      headers: new Headers(),
      contentType: 'text/html',
      body: '<html></html>',
      isHttps: true,
      redirectCount: 0,
    },
    htmlData: parseHtml('<html></html>'),
    robotsData: robotsMissing,
    sitemapData: sitemapMissing,
    llmsTxtStatus: { standardExists: false, fullExists: false },
  });
  const llmsCheck = crawlNoLlms.find((c) => c.id === 'crawl-llms-txt');
  if (llmsCheck?.status !== 'INFO' || llmsCheck.maxScore !== 0) {
    throw new Error('Expected llms.txt check to be status=INFO with maxScore=0');
  }
  console.log('✓ llms.txt is informational and does not penalize score.');

  // TEST 15: Answer Coverage
  console.log('\n[15/17] Test: Answer Coverage heuristic...');
  const htmlSaas = `<html><head><title>CloudScale — Enterprise API</title></head><body><h1>CloudScale Platform</h1><h2>Features</h2><p>Designed for developers to scale microservices.</p><h2>Pricing Plans</h2><p>Starting at $29/mo with a 14-day free trial.</p><a href="/contact">Contact Support</a></body></html>`;
  const parsedSaas = parseHtml(htmlSaas, 'https://cloudscale.io');
  const jsonSaas = parseJsonLd(htmlSaas);
  const entitySaas = auditEntity({ targetUrl: 'https://cloudscale.io', htmlData: parsedSaas, jsonLdData: jsonSaas });
  const answerSaas = auditAnswerReadiness({ htmlData: parsedSaas, jsonLdData: jsonSaas, entitySummary: entitySaas.entitySummary });
  if (answerSaas.answerCoverage.overallCoverageScore <= 50) {
    throw new Error('Expected Answer Coverage > 50% for structured landing page');
  }
  console.log(`✓ Answer Coverage evaluated: ${answerSaas.answerCoverage.overallCoverageScore}%.`);

  // TEST 16: Entity Consistency
  console.log('\n[16/17] Test: Entity Consistency metrics...');
  if (entitySaas.entitySummary.consistencyDetails.nameConsistencyScore < 50) {
    throw new Error('Expected reasonable consistency score');
  }
  console.log(`✓ Entity Consistency calculated: ${entitySaas.entitySummary.consistencyScore}/100.`);

  // TEST 17: Comprehensive TANYO-like Fixture Test
  console.log('\n[17/17] Test: TANYO-like Full Retail Management Platform Fixture...');
  const tanyoFixtureHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>TANYO — Furniture Retail Management Software</title>
  <meta name="description" content="TANYO is an all-in-one software platform for furniture retail management, showroom operations, inventory tracking, CRM, billing, and production analytics." />
  <meta property="og:site_name" content="TANYO" />
  <meta property="og:title" content="TANYO — Furniture Retail Management Software" />
  <meta property="og:description" content="Manage your furniture showrooms, inventory, billing, and manufacturing orders with TANYO." />
  <meta property="og:url" content="https://tanyo.in/" />
  <meta property="og:type" content="website" />
  <link rel="canonical" href="https://tanyo.in/" />
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "@id": "https://tanyo.in/#software",
    "name": "TANYO",
    "url": "https://tanyo.in/",
    "applicationCategory": "BusinessApplication",
    "operatingSystem": "Web, Cloud",
    "description": "Comprehensive furniture store and showroom management system with integrated inventory, billing, CRM, and production modules.",
    "brand": {
      "@type": "Brand",
      "name": "TANYO"
    },
    "offers": {
      "@type": "Offer",
      "price": "Contact for pricing",
      "priceCurrency": "INR"
    },
    "sameAs": [
      "https://linkedin.com/company/tanyo",
      "https://x.com/tanyoapp"
    ]
  }
  </script>
</head>
<body>
  <header>
    <nav>
      <a href="/">Home</a>
      <a href="/about">About TANYO</a>
      <a href="/features">Product Modules</a>
      <a href="/pricing">Pricing Plans</a>
      <a href="/contact">Book a Demo</a>
      <a href="/privacy">Privacy Policy</a>
    </nav>
  </header>
  <main>
    <h1>TANYO Furniture Retail Management System</h1>
    <p>TANYO provides furniture showrooms and retailers with end-to-end operational software to manage inventory, catalog selections, and customer quotes.</p>

    <section>
      <h2>Inventory Management</h2>
      <p>Real-time stock tracking across multiple warehouses and showrooms.</p>
    </section>

    <section>
      <h2>Showroom POS & Invoicing</h2>
      <p>Generate quotations, invoices, and process retail customer payments seamlessly.</p>
    </section>

    <section>
      <h2>CRM & Production Tracking</h2>
      <p>Manage customer leads, follow-ups, custom furniture manufacturing orders, and dispatch schedules.</p>
    </section>

    <section>
      <h2>What Furniture Retailers Say</h2>
      <p>"TANYO streamlined our 5 furniture showrooms in Delhi and cut stock errors by 90%." — Retail Partner</p>
    </section>

    <section>
      <h2>Contact Our Team</h2>
      <p>Get in touch with TANYO specialists at contact@tanyo.in or call +91-9876543210.</p>
      <a href="mailto:contact@tanyo.in">Email Us</a>
    </section>
  </main>
  <footer>
    <p>© 2026 TANYO Technologies. All rights reserved. <a href="/privacy">Privacy Policy</a></p>
  </footer>
</body>
</html>`;

  const tanyoRobots = `User-agent: *
Allow: /

User-agent: GPTBot
Allow: /

Sitemap: https://tanyo.in/sitemap.xml
`;

  const tanyoSitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>https://tanyo.in/</loc></url>
  <url><loc>https://tanyo.in/features</loc></url>
  <url><loc>https://tanyo.in/pricing</loc></url>
</urlset>`;

  const htmlData = parseHtml(tanyoFixtureHtml, 'https://tanyo.in/');
  const jsonLdData = parseJsonLd(tanyoFixtureHtml);
  const robotsData = parseRobotsTxt(tanyoRobots, 200, 'https://tanyo.in/robots.txt');
  const sitemapData = parseSitemap(tanyoSitemap, 200, 'https://tanyo.in/sitemap.xml', 'https://tanyo.in/');

  const crawlabilityChecks = auditCrawlability({
    targetUrl: 'https://tanyo.in/',
    pageFetchResult: {
      status: 200,
      statusText: 'OK',
      finalUrl: 'https://tanyo.in/',
      headers: new Headers(),
      contentType: 'text/html',
      body: tanyoFixtureHtml,
      isHttps: true,
      redirectCount: 0,
    },
    htmlData,
    robotsData,
    sitemapData,
    llmsTxtStatus: { standardExists: false, fullExists: false },
  });

  const contentChecks = auditContent({ htmlData });
  const structuredDataChecks = auditStructuredData({ jsonLdData });
  const entityResult = auditEntity({
    targetUrl: 'https://tanyo.in/',
    htmlData,
    jsonLdData,
  });
  const answerResult = auditAnswerReadiness({
    htmlData,
    jsonLdData,
    entitySummary: entityResult.entitySummary,
  });

  const technicalEvidence: TechnicalEvidence = {
    httpStatus: 200,
    finalUrl: 'https://tanyo.in/',
    canonicalUrl: htmlData.canonicalUrl,
    isHttps: true,
    redirectCount: 0,
    robotsStatus: 200,
    robotsUrl: 'https://tanyo.in/robots.txt',
    sitemapStatus: 200,
    sitemapUrl: 'https://tanyo.in/sitemap.xml',
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
    url: 'https://tanyo.in/',
    durationMs: 380,
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
    llmsTxtStatus: { standardExists: false, fullExists: false, details: 'Optional' },
  });

  console.log(`\nTANYO Fixture Audit Results:`);
  console.log(`Overall Score: ${report.score} / 100 (${report.rating.label})`);
  console.log(`- AI Crawlability: ${report.categories.crawlability.score} / 100 (${report.categories.crawlability.checks.length} rules)`);
  console.log(`- Content Structure: ${report.categories.content.score} / 100 (${report.categories.content.checks.length} rules)`);
  console.log(`- Structured Data: ${report.categories.structuredData.score} / 100 (${report.categories.structuredData.checks.length} rules)`);
  console.log(`- Entity Clarity: ${report.categories.entity.score} / 100 (${report.categories.entity.checks.length} rules)`);
  console.log(`- Answer Readiness: ${report.categories.answerReadiness.score} / 100 (${report.categories.answerReadiness.checks.length} rules)`);
  console.log(`Total Evaluated Rules: ${report.summary.totalChecks} (${report.summary.passed} ✓, ${report.summary.warnings} ⚠, ${report.summary.failures} ✕, ${report.summary.info} ℹ)`);
  console.log(`Entity Graph: ${report.entityGraph.primaryEntity.name} (Type: ${report.entityGraph.primaryEntity.type}, Industry: ${report.entityGraph.industry})`);
  console.log(`Answer Coverage: ${report.answerCoverage.overallCoverageScore}% (${report.answerCoverage.questions.length} questions evaluated)`);
  console.log(`Evidence Signals Found: ${report.evidenceSignals.detectedCount} signals`);
  console.log(`IA Hubs Discovered: ${report.informationArchitecture.categoriesFound.join(', ')}`);

  if (report.summary.totalChecks < 70 || report.summary.totalChecks > 105) {
    throw new Error(`Rule count ${report.summary.totalChecks} is out of target range [70, 105]!`);
  }

  console.log('\n====================================================');
  console.log(`ALL 17 UNIT TESTS PASSED! Total rules: ${report.summary.totalChecks}`);
  console.log('====================================================');
}

runAllUnitTests().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
