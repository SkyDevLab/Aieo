import {
  AuditCategory,
  AuditReport,
  AuditRuleResult,
  CategorySummary,
  EntitySummary,
  AnswerReadinessSummary,
} from './types';

export interface ScoreEngineInput {
  url: string;
  durationMs: number;
  crawlabilityChecks: AuditRuleResult[];
  contentChecks: AuditRuleResult[];
  structuredDataChecks: AuditRuleResult[];
  entityChecks: AuditRuleResult[];
  answerReadinessChecks: AuditRuleResult[];
  detectedSchemas: string[];
  entitySummary: EntitySummary;
  answerReadinessSummary: AnswerReadinessSummary;
  llmsTxtStatus: AuditReport['llmsTxtStatus'];
}

const CATEGORY_METADATA: Record<
  AuditCategory,
  { title: string; description: string; weight: number }
> = {
  crawlability: {
    title: 'AI Crawlability',
    description: 'HTTPS, HTTP headers, robots.txt bot directives, XML sitemaps, and canonical resolution.',
    weight: 20,
  },
  content: {
    title: 'Content Structure',
    description: 'Heading hierarchy, meta descriptions, semantic HTML5 landmarks, and readable text density.',
    weight: 20,
  },
  structuredData: {
    title: 'Structured Data',
    description: 'Schema.org JSON-LD syntax, entity definitions, vocabularies, and external verification links.',
    weight: 20,
  },
  entity: {
    title: 'Entity Clarity',
    description: 'Cross-source disambiguation and consistency for the core person, company, or brand identity.',
    weight: 20,
  },
  answerReadiness: {
    title: 'Answer Readiness',
    description: 'Deterministic heuristic coverage of fundamental user inquiries tailored to site classification.',
    weight: 20,
  },
};

function buildCategorySummary(
  id: AuditCategory,
  checks: AuditRuleResult[]
): CategorySummary {
  const meta = CATEGORY_METADATA[id];

  let earnedPoints = 0;
  let totalMax = 0;

  let pass = 0;
  let warning = 0;
  let fail = 0;
  let info = 0;

  for (const check of checks) {
    earnedPoints += check.score;
    totalMax += check.maxScore;

    if (check.status === 'PASS') pass++;
    else if (check.status === 'WARNING') warning++;
    else if (check.status === 'FAIL') fail++;
    else if (check.status === 'INFO') info++;
  }

  // Normalize to 100
  const normalizedScore = totalMax > 0 ? Math.min(100, Math.round((earnedPoints / totalMax) * 100)) : 0;

  return {
    id,
    title: meta.title,
    score: normalizedScore,
    maxScore: 100,
    weight: meta.weight,
    description: meta.description,
    statusBreakdown: { pass, warning, fail, info },
    checks,
  };
}

export function compileAuditReport(input: ScoreEngineInput): AuditReport {
  const crawlability = buildCategorySummary('crawlability', input.crawlabilityChecks);
  const content = buildCategorySummary('content', input.contentChecks);
  const structuredData = buildCategorySummary('structuredData', input.structuredDataChecks);
  const entity = buildCategorySummary('entity', input.entityChecks);
  const answerReadiness = buildCategorySummary('answerReadiness', input.answerReadinessChecks);

  // Exact 20% weight per category: sum = 100
  const rawScore =
    (crawlability.score * crawlability.weight) / 100 +
    (content.score * content.weight) / 100 +
    (structuredData.score * structuredData.weight) / 100 +
    (entity.score * entity.weight) / 100 +
    (answerReadiness.score * answerReadiness.weight) / 100;

  const finalScore = Math.min(100, Math.max(0, Math.round(rawScore)));

  // Qualitative grade
  let rating: AuditReport['rating'];
  if (finalScore >= 85) {
    rating = {
      label: 'Excellent',
      tone: 'excellent',
      description: 'Your website presents robust technical and semantic signals that make extraction easy for AI crawlers.',
    };
  } else if (finalScore >= 70) {
    rating = {
      label: 'Good',
      tone: 'good',
      description: 'Solid foundation for AI search understanding with a few high-value refinement opportunities.',
    };
  } else if (finalScore >= 55) {
    rating = {
      label: 'Fair',
      tone: 'moderate',
      description: 'Core signals are present, but important schema or structured content gaps limit AI clarity.',
    };
  } else if (finalScore >= 40) {
    rating = {
      label: 'Needs Improvement',
      tone: 'needs-work',
      description: 'Key technical signals or entity disambiguation markers are missing or inconsistent.',
    };
  } else {
    rating = {
      label: 'Poor',
      tone: 'poor',
      description: 'Significant crawling barriers, missing structured data, or minimal machine-readable content.',
    };
  }

  const allChecks = [
    ...crawlability.checks,
    ...content.checks,
    ...structuredData.checks,
    ...entity.checks,
    ...answerReadiness.checks,
  ];

  const totalPassed = allChecks.filter((c) => c.status === 'PASS').length;
  const totalWarnings = allChecks.filter((c) => c.status === 'WARNING').length;
  const totalFailures = allChecks.filter((c) => c.status === 'FAIL').length;
  const totalInfo = allChecks.filter((c) => c.status === 'INFO').length;

  let hostname = '';
  try {
    hostname = new URL(input.url).hostname;
  } catch {
    hostname = input.url;
  }

  return {
    url: input.url,
    hostname,
    analyzedAt: new Date().toISOString(),
    durationMs: input.durationMs,
    score: finalScore,
    rating,
    summary: {
      totalChecks: allChecks.length,
      passed: totalPassed,
      warnings: totalWarnings,
      failures: totalFailures,
      info: totalInfo,
    },
    categories: {
      crawlability,
      content,
      structuredData,
      entity,
      answerReadiness,
    },
    detectedSchemas: input.detectedSchemas,
    entitySummary: input.entitySummary,
    answerReadinessSummary: input.answerReadinessSummary,
    llmsTxtStatus: input.llmsTxtStatus,
  };
}
