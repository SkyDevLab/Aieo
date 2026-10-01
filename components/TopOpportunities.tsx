'use client';

import React from 'react';
import { ArrowRight } from 'lucide-react';
import { AuditReport, AuditRuleResult } from '@/lib/audit/types';

interface TopOpportunitiesProps {
  report: AuditReport;
  onSelectFinding: (ruleId: string, category: string) => void;
}

export const TopOpportunities: React.FC<TopOpportunitiesProps> = ({
  report,
  onSelectFinding,
}) => {
  const allChecks: AuditRuleResult[] = [
    ...report.categories.crawlability.checks,
    ...report.categories.content.checks,
    ...report.categories.structuredData.checks,
    ...report.categories.entity.checks,
    ...report.categories.answerReadiness.checks,
  ];

  // Prioritize FAIL first, then WARNING, then by severity and score deficit
  const actionableIssues = allChecks
    .filter((c) => c.status === 'FAIL' || c.status === 'WARNING')
    .sort((a, b) => {
      if (a.status === 'FAIL' && b.status !== 'FAIL') return -1;
      if (b.status === 'FAIL' && a.status !== 'FAIL') return 1;

      const severityWeight: Record<string, number> = {
        critical: 4,
        high: 3,
        medium: 2,
        low: 1,
        info: 0,
      };
      const diff = (severityWeight[b.severity] || 0) - (severityWeight[a.severity] || 0);
      if (diff !== 0) return diff;

      const aDeficit = a.maxScore - a.score;
      const bDeficit = b.maxScore - b.score;
      return bDeficit - aDeficit;
    })
    .slice(0, 3);

  if (actionableIssues.length === 0) {
    return null;
  }

  const categoryTabMap: Record<string, string> = {
    crawlability: 'technical',
    content: 'content',
    structuredData: 'schema',
    entity: 'entity',
    answerReadiness: 'evidence',
  };

  return (
    <div className="w-full bg-white dark:bg-surface border border-slate-200 dark:border-slate-800 rounded-xl p-6 sm:p-7 shadow-sm mb-6">
      <div className="pb-3 mb-5 border-b border-slate-200 dark:border-slate-800">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider font-mono">
          TOP OPPORTUNITIES
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Priority technical and semantic fixes to improve machine extractability.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {actionableIssues.map((issue, idx) => {
          const stepNumber = String(idx + 1).padStart(2, '0');
          const isFail = issue.status === 'FAIL';

          return (
            <div
              key={issue.id}
              className={`p-4 rounded-lg border flex flex-col justify-between transition-colors ${
                isFail
                  ? 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/40'
                  : 'bg-slate-50/50 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-lg font-mono font-bold text-brand-600 dark:text-brand-400">
                    {stepNumber}
                  </span>
                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded border font-semibold ${
                      isFail
                        ? 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800'
                        : 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                    }`}
                  >
                    {issue.status}
                  </span>
                </div>

                <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 mb-1 leading-snug">
                  {issue.title}
                </h4>

                <p className="text-xs text-slate-600 dark:text-slate-300 mb-3 leading-relaxed">
                  {issue.whatWeFound || issue.explanation}
                </p>
              </div>

              <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800/80">
                <button
                  type="button"
                  onClick={() =>
                    onSelectFinding(issue.id, categoryTabMap[issue.category] || 'issues')
                  }
                  className="text-xs font-medium text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 flex items-center space-x-1 transition-colors"
                >
                  <span>View finding</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
