export type AuditCategory =
  | 'crawlability'
  | 'content'
  | 'structuredData'
  | 'entity'
  | 'answerReadiness';

export type AuditStatus = 'PASS' | 'WARNING' | 'FAIL' | 'INFO';

export type AuditSeverity = 'critical' | 'high' | 'medium' | 'low' | 'info';

export interface AuditRuleResult {
  id: string;
  category: AuditCategory;
  title: string;
  status: AuditStatus;
  severity: AuditSeverity;
  score: number; // Earned score (0 to maxScore)
  maxScore: number; // Maximum possible points for this check
  explanation: string;
  recommendation?: string;
  whatWeFound: string;
  whyItMatters: string;
  howToImprove: string;
  evidence?: string | Record<string, unknown>;
  data?: Record<string, unknown>;
}

export interface CategorySummary {
  id: AuditCategory;
  title: string;
  score: number; // 0 - 100 normalized
  maxScore: number; // 100
  weight: number; // percentage of overall score (e.g. 20)
  description: string;
  statusBreakdown: {
    pass: number;
    warning: number;
    fail: number;
    info: number;
  };
  checks: AuditRuleResult[];
}

export interface AnswerCoverageItem {
  question: string;
  status: 'ANSWERED' | 'PARTIALLY ANSWERED' | 'NOT FOUND';
  confidence: 'high' | 'medium' | 'low' | 'none';
  evidence: string;
}

export interface AnswerCoverageSummary {
  detectedSiteType: 'developer_portfolio' | 'company' | 'product_saas' | 'service' | 'general';
  overallCoverageScore: number; // e.g. 82%
  questions: AnswerCoverageItem[];
}

export interface EntitySignalItem {
  source: string;
  value: string;
  matchesPrimary: boolean;
}

export interface EntityConsistencyConflict {
  field: string;
  sources: { source: string; value: string }[];
  severity: 'high' | 'medium' | 'low';
  explanation: string;
}

export interface EntityConsistencyDetails {
  nameConsistencyScore: number; // 0 - 100%
  descriptionConsistencyScore: number; // 0 - 100%
  typeConsistencyScore: number; // 0 - 100%
  identityLinksScore: number; // 0 - 100%
  conflicts: EntityConsistencyConflict[];
}

export interface EntityRelationship {
  type: 'type' | 'industry' | 'audience' | 'capabilities' | 'provides' | 'servesIndustry' | 'founder' | 'parent';
  label: string;
  value: string;
  evidence?: string;
}

export interface EntityGraph {
  primaryEntity: {
    name: string;
    type: string;
    description: string;
    url: string;
    sameAs: string[];
  };
  industry?: string;
  audience?: string;
  capabilities: string[];
  relationships: EntityRelationship[];
}

export interface EntitySummary {
  primaryEntity: string;
  entityType: 'Person' | 'Organization' | 'Product' | 'Service' | 'Software' | 'WebSite' | 'LocalBusiness' | 'Unknown';
  consistencyScore: number; // 0 - 100
  signalsCount: number;
  signals: EntitySignalItem[];
  associatedEntities: string[];
  consistencyDetails: EntityConsistencyDetails;
  entityGraph: EntityGraph;
}

export interface IntentItem {
  name: string;
  category: string;
  source: string;
}

export interface EntityIntentCoverage {
  primaryEntity: string;
  intents: IntentItem[];
}

export interface EvidenceSignalItem {
  id: string;
  label: string;
  present: boolean;
  evidenceText?: string;
}

export interface EvidenceSignalsSummary {
  signals: EvidenceSignalItem[];
  detectedCount: number;
}

export interface NavLinkItem {
  category: 'About' | 'Pricing' | 'Products' | 'Services' | 'Contact' | 'Documentation' | 'Blog' | 'Legal' | 'Other';
  label: string;
  url: string;
  isExternal: boolean;
}

export interface InformationArchitectureSummary {
  links: NavLinkItem[];
  categoriesFound: string[];
  hasSuspiciousLinks: boolean;
  totalInternalLinks: number;
  totalExternalLinks: number;
}

export interface TechnicalEvidence {
  httpStatus: number;
  finalUrl: string;
  canonicalUrl: string | null;
  isHttps: boolean;
  redirectCount: number;
  robotsStatus: number;
  robotsUrl: string;
  sitemapStatus: number;
  sitemapUrl: string;
  jsonLdTypes: string[];
  title: string | null;
  h1: string | null;
  language: string | null;
  contentLengthBytes: number;
  wordCount: number;
  textToHtmlRatio: number;
  metaRobots: string | null;
}

export interface AuditReport {
  url: string;
  hostname: string;
  analyzedAt: string;
  durationMs: number;
  score: number; // 0 - 100
  rating: {
    label: string;
    tone: 'excellent' | 'good' | 'moderate' | 'needs-work' | 'poor';
    description: string;
  };
  summary: {
    totalChecks: number;
    passed: number;
    warnings: number;
    failures: number;
    info: number;
  };
  categories: {
    crawlability: CategorySummary;
    content: CategorySummary;
    structuredData: CategorySummary;
    entity: CategorySummary;
    answerReadiness: CategorySummary;
  };
  detectedSchemas: string[];
  entitySummary: EntitySummary;
  entityGraph: EntityGraph;
  answerCoverage: AnswerCoverageSummary;
  entityIntentCoverage: EntityIntentCoverage;
  evidenceSignals: EvidenceSignalsSummary;
  informationArchitecture: InformationArchitectureSummary;
  technicalEvidence: TechnicalEvidence;
  llmsTxtStatus: {
    standardExists: boolean;
    standardUrl?: string;
    fullExists: boolean;
    fullUrl?: string;
    details: string;
  };
}
