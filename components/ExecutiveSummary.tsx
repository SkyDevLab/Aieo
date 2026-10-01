'use client';

import React from 'react';
import { CheckCircle2, AlertTriangle } from 'lucide-react';
import { AuditReport } from '@/lib/audit/types';

interface ExecutiveSummaryProps {
  report: AuditReport;
}

export const ExecutiveSummary: React.FC<ExecutiveSummaryProps> = ({ report }) => {
  const { categories, entitySummary, technicalEvidence, detectedSchemas } = report;

  // Compute WHAT'S STRONG dynamically
  const strongPoints: { title: string; detail: string }[] = [];

  if (categories.structuredData.score >= 80) {
    strongPoints.push({
      title: 'Structured Data',
      detail: `Scored ${categories.structuredData.score}/100 with ${detectedSchemas.length} verified Schema.org type(s).`,
    });
  }

  if (categories.content.score >= 80) {
    strongPoints.push({
      title: 'Content Structure',
      detail: `Scored ${categories.content.score}/100 with sequential heading hierarchy and semantic HTML landmarks.`,
    });
  }

  if (categories.entity.score >= 80 || (entitySummary?.consistencyScore ?? 0) >= 80) {
    strongPoints.push({
      title: 'Entity Clarity',
      detail: `Consistent entity attribution (${entitySummary?.consistencyScore || categories.entity.score}%) across title, schema, and metadata.`,
    });
  }

  if (categories.crawlability.score >= 80) {
    strongPoints.push({
      title: 'AI Crawlability',
      detail: `Scored ${categories.crawlability.score}/100 with open bot access directives and valid sitemap.`,
    });
  }

  if (categories.answerReadiness.score >= 80) {
    strongPoints.push({
      title: 'Answer Readiness',
      detail: `Scored ${categories.answerReadiness.score}/100 with clear answers to standard informational queries.`,
    });
  }

  if (technicalEvidence?.isHttps && strongPoints.length < 3) {
    strongPoints.push({
      title: 'Transport Security',
      detail: 'TLS encryption verified for automated indexing bots.',
    });
  }

  if (strongPoints.length === 0) {
    strongPoints.push({
      title: 'Baseline Web Accessibility',
      detail: `Site responds with HTTP ${technicalEvidence?.httpStatus || 200}.`,
    });
  }

  // Compute OPPORTUNITIES dynamically
  const opportunityPoints: { title: string; detail: string }[] = [];

  if (categories.answerReadiness.score < 80) {
    opportunityPoints.push({
      title: 'Answer Coverage',
      detail: `Scored ${categories.answerReadiness.score}/100. Provide concise, direct answers to common user questions.`,
    });
  }

  if (categories.crawlability.score < 80) {
    opportunityPoints.push({
      title: 'Crawler Discovery',
      detail: `Scored ${categories.crawlability.score}/100. Verify robots.txt bot rules and sitemap URL coverage.`,
    });
  }

  if (categories.entity.score < 80 || (entitySummary?.consistencyDetails?.conflicts?.length ?? 0) > 0) {
    opportunityPoints.push({
      title: 'Entity Relationships',
      detail: `Scored ${categories.entity.score}/100. Clarify entity names and connections across title, headings, and schema.`,
    });
  }

  if (categories.content.score < 80) {
    opportunityPoints.push({
      title: 'Semantic Content Organization',
      detail: `Scored ${categories.content.score}/100. Add semantic <main> tags and increase text density.`,
    });
  }

  if (categories.structuredData.score < 80) {
    opportunityPoints.push({
      title: 'Schema Vocabulary Completeness',
      detail: `Scored ${categories.structuredData.score}/100. Implement formal Schema.org types with complete properties.`,
    });
  }

  // Fine-tuning fallback
  if (opportunityPoints.length < 3) {
    const allWarnings = [
      ...categories.crawlability.checks,
      ...categories.content.checks,
      ...categories.structuredData.checks,
      ...categories.entity.checks,
      ...categories.answerReadiness.checks,
    ].filter((c) => c.status === 'WARNING');

    for (const w of allWarnings) {
      if (opportunityPoints.length >= 3) break;
      if (!opportunityPoints.some((p) => p.title.toLowerCase().includes(w.title.toLowerCase()))) {
        opportunityPoints.push({
          title: w.title,
          detail: w.explanation,
        });
      }
    }
  }

  if (opportunityPoints.length === 0) {
    opportunityPoints.push({
      title: 'Ongoing Schema Maintenance',
      detail: 'Keep sitemaps updated and maintain schema alignment as new pages are created.',
    });
  }

  return (
    <div className="w-full bg-white dark:bg-surface border border-slate-200 dark:border-slate-800 rounded-xl p-6 sm:p-7 shadow-sm mb-6">
      <div className="pb-3 mb-5 border-b border-slate-200 dark:border-slate-800">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider font-mono">
          EXECUTIVE SUMMARY
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Deterministic synthesis of current technical strengths and priority optimization areas.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Left: What's Strong */}
        <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 space-y-3">
          <div className="flex items-center space-x-1.5 text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="w-4 h-4" />
            <h4 className="text-xs font-mono uppercase tracking-wider font-bold">
              WHAT&apos;S STRONG
            </h4>
          </div>

          <div className="space-y-2.5 pt-1">
            {strongPoints.slice(0, 3).map((item, idx) => (
              <div key={`strong-${idx}`} className="flex items-start space-x-2">
                <span className="text-emerald-600 dark:text-emerald-400 font-bold text-xs mt-0.5">
                  ✓
                </span>
                <div>
                  <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    {item.title}
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                    {item.detail}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Opportunities */}
        <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 space-y-3">
          <div className="flex items-center space-x-1.5 text-amber-600 dark:text-amber-400">
            <AlertTriangle className="w-4 h-4" />
            <h4 className="text-xs font-mono uppercase tracking-wider font-bold">
              OPPORTUNITIES
            </h4>
          </div>

          <div className="space-y-2.5 pt-1">
            {opportunityPoints.slice(0, 3).map((item, idx) => (
              <div key={`opp-${idx}`} className="flex items-start space-x-2">
                <span className="text-amber-600 dark:text-amber-400 font-bold text-xs mt-0.5">
                  ⚠
                </span>
                <div>
                  <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    {item.title}
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                    {item.detail}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
