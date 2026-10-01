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

async function runTests() {
  console.log('--- 1. Testing SSRF Security Defenses ---');

  const blockedTargets = [
    'http://localhost',
    'http://127.0.0.1:3000',
    'http://169.254.169.254/latest/meta-data',
    'http://0.0.0.0',
    'http://user:password@example.com',
  ];

  for (const target of blockedTargets) {
    try {
      await validateUrlForSSR(target);
      console.error(`FAILED: Expected target to be blocked: ${target}`);
      process.exit(1);
    } catch (err: unknown) {
      if (err instanceof SecurityValidationError) {
        console.log(`PASS: Safely blocked ${target} (${err.code})`);
      } else {
        console.log(`PASS: Blocked ${target} with ${err}`);
      }
    }
  }

  console.log('\n--- 2. Testing End-to-End Audit Heuristics on Sample Payload ---');

  const sampleHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>SkyDevLab — Engineering Scalable AI Applications</title>
  <meta name="description" content="SkyDevLab builds high-performance AI engines, intelligent web applications, and developer tools for engineering teams worldwide." />
  <meta property="og:site_name" content="SkyDevLab" />
  <meta property="og:title" content="SkyDevLab — Engineering Scalable AI Applications" />
  <meta name="author" content="Surya Pratap Singh" />
  <link rel="canonical" href="https://skydevlab.com" />
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "SkyDevLab",
    "url": "https://skydevlab.com",
    "founder": {
      "@type": "Person",
      "name": "Surya Pratap Singh",
      "sameAs": [
        "https://github.com/surya",
        "https://linkedin.com/in/surya"
      ]
    },
    "sameAs": [
      "https://github.com/skydevlab",
      "https://x.com/skydevlab"
    ]
  }
  </script>
</head>
<body>
  <header>
    <nav><a href="/">Home</a> <a href="#features">Solutions</a> <a href="/contact">Contact</a></nav>
  </header>
  <main>
    <h1>SkyDevLab AI Solutions & Infrastructure</h1>
    <p>SkyDevLab offers intelligent web services, AI search readiness audits, and custom machine learning pipelines for modern developers.</p>
    
    <section>
      <h2>Core Engineering Solutions</h2>
      <p>We provide full-stack architecture, Python microservices, TypeScript Next.js web applications, and LLM orchestration.</p>
    </section>

    <section>
      <h2>Target Engineering Teams</h2>
      <p>Our solutions are designed for developers, engineering managers, and tech startups scaling AI features.</p>
    </section>

    <section>
      <h2>Get Started & Contact</h2>
      <p>Contact our core engineering team directly at contact@skydevlab.com or submit a project inquiry.</p>
      <a href="mailto:contact@skydevlab.com">Email Us</a>
      <a href="https://github.com/skydevlab">GitHub Organization</a>
    </section>
  </main>
  <footer>
    <p>© 2026 SkyDevLab Inc. All rights reserved.</p>
  </footer>
</body>
</html>`;

  const sampleRobots = `User-agent: *
Allow: /

User-agent: GPTBot
Allow: /

Sitemap: https://skydevlab.com/sitemap.xml
`;

  const sampleSitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>https://skydevlab.com/</loc></url>
  <url><loc>https://skydevlab.com/solutions</loc></url>
</urlset>`;

  const htmlData = parseHtml(sampleHtml, 'https://skydevlab.com');
  const jsonLdData = parseJsonLd(sampleHtml);
  const robotsData = parseRobotsTxt(sampleRobots, 200, 'https://skydevlab.com/robots.txt');
  const sitemapData = parseSitemap(sampleSitemap, 200, 'https://skydevlab.com/sitemap.xml');

  const crawlabilityChecks = auditCrawlability({
    targetUrl: 'https://skydevlab.com',
    pageFetchResult: {
      status: 200,
      statusText: 'OK',
      finalUrl: 'https://skydevlab.com',
      headers: new Headers(),
      contentType: 'text/html',
      body: sampleHtml,
      isHttps: true,
      redirectCount: 0,
    },
    htmlData,
    robotsData,
    sitemapData,
    llmsTxtStatus: {
      standardExists: true,
      standardUrl: 'https://skydevlab.com/llms.txt',
      fullExists: false,
    },
  });

  const contentChecks = auditContent({ htmlData });
  const structuredDataChecks = auditStructuredData({ jsonLdData });
  const entityResult = auditEntity({
    targetUrl: 'https://skydevlab.com',
    htmlData,
    jsonLdData,
  });
  const answerResult = auditAnswerReadiness({
    htmlData,
    jsonLdData,
    entitySummary: entityResult.entitySummary,
  });

  const report = compileAuditReport({
    url: 'https://skydevlab.com',
    durationMs: 420,
    crawlabilityChecks,
    contentChecks,
    structuredDataChecks,
    entityChecks: entityResult.checks,
    answerReadinessChecks: answerResult.checks,
    detectedSchemas: jsonLdData.detectedTypes,
    entitySummary: entityResult.entitySummary,
    answerReadinessSummary: answerResult.summary,
    llmsTxtStatus: {
      standardExists: true,
      standardUrl: 'https://skydevlab.com/llms.txt',
      fullExists: false,
      details: 'Optional',
    },
  });

  console.log('\n--- 3. Audit Report Results ---');
  console.log(`URL: ${report.url}`);
  console.log(`Overall AIEO Readiness Score: ${report.score} / 100 (${report.rating.label})`);
  console.log(`- Crawlability: ${report.categories.crawlability.score} / 100`);
  console.log(`- Content: ${report.categories.content.score} / 100`);
  console.log(`- Structured Data: ${report.categories.structuredData.score} / 100`);
  console.log(`- Entity Clarity: ${report.categories.entity.score} / 100`);
  console.log(`- Answer Readiness: ${report.categories.answerReadiness.score} / 100`);
  console.log(`Entity Identified: "${report.entitySummary.primaryEntity}" (${report.entitySummary.entityType})`);
  console.log(`Associated Entities: ${report.entitySummary.associatedEntities.join(', ')}`);
  console.log(`Detected Schemas: ${report.detectedSchemas.join(', ')}`);
  console.log(`Site Classification: ${report.answerReadinessSummary.detectedSiteType}`);
  console.log(`Total Checks: ${report.summary.totalChecks} (${report.summary.passed} passed, ${report.summary.warnings} warnings, ${report.summary.failures} issues)`);

  if (report.score < 75) {
    console.error(`Expected score >= 75 for well-formed site, got ${report.score}`);
    process.exit(1);
  }

  console.log('\nAll audit heuristics & scoring tests verified successfully!');
}

runTests().catch((err) => {
  console.error('Test run failed:', err);
  process.exit(1);
});
