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

export interface AnswerQuestionEvaluation {
  question: string;
  answered: boolean;
  confidence: 'high' | 'medium' | 'low' | 'none';
  evidence: string;
}

export interface EntitySignalItem {
  source: string;
  value: string;
  matchesPrimary: boolean;
}

export interface EntitySummary {
  primaryEntity: string;
  entityType: 'Person' | 'Organization' | 'Product' | 'WebSite' | 'Unknown';
  consistencyScore: number; // 0 - 100
  signalsCount: number;
  signals: EntitySignalItem[];
  associatedEntities: string[];
}

export interface AnswerReadinessSummary {
  detectedSiteType: 'developer_portfolio' | 'company' | 'product_saas' | 'content_editorial' | 'general';
  questions: AnswerQuestionEvaluation[];
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
  answerReadinessSummary: AnswerReadinessSummary;
  llmsTxtStatus: {
    standardExists: boolean;
    standardUrl?: string;
    fullExists: boolean;
    fullUrl?: string;
    details: string;
  };
}
