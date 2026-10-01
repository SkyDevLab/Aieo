'use client';

import React, { useState } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Info,
  ChevronDown,
  ChevronUp,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import { AuditReport, AuditRuleResult, AuditStatus } from '@/lib/audit/types';

interface IssuesViewProps {
  report: AuditReport;
}

export const IssuesView: React.FC<IssuesViewProps> = ({ report }) => {
  const allChecks: AuditRuleResult[] = [
    ...report.categories.crawlability.checks,
    ...report.categories.content.checks,
    ...report.categories.structuredData.checks,
    ...report.categories.entity.checks,
    ...report.categories.answerReadiness.checks,
  ];

  const [filterMode, setFilterMode] = useState<'ISSUES_ONLY' | 'WARNINGS' | 'FAILS' | 'ALL'>('ISSUES_ONLY');
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const displayedChecks = allChecks.filter((c) => {
    if (filterMode === 'ISSUES_ONLY') return c.status === 'FAIL' || c.status === 'WARNING';
    if (filterMode === 'WARNINGS') return c.status === 'WARNING';
    if (filterMode === 'FAILS') return c.status === 'FAIL';
    return true; // ALL
  });

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const expandAll = () => {
    setExpandedIds(new Set(displayedChecks.map((c) => c.id)));
  };

  const collapseAll = () => {
    setExpandedIds(new Set());
  };

  const getStatusIcon = (status: AuditStatus) => {
    switch (status) {
      case 'PASS':
        return <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />;
      case 'WARNING':
        return <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />;
      case 'FAIL':
        return <XCircle className="w-4 h-4 text-rose-600 dark:text-rose-400" />;
      case 'INFO':
        return <Info className="w-4 h-4 text-sky-600 dark:text-sky-400" />;
    }
  };

  const getStatusBadge = (status: AuditStatus) => {
    switch (status) {
      case 'PASS':
        return 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800';
      case 'WARNING':
        return 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800';
      case 'FAIL':
        return 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800';
      case 'INFO':
        return 'bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-800';
    }
  };

  return (
    <div className="w-full bg-white dark:bg-surface border border-slate-200 dark:border-slate-800 rounded-xl p-6 sm:p-7 shadow-sm">
      {/* Top Banner: Status Counts */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 mb-5 border-b border-slate-200 dark:border-slate-800 gap-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider font-mono">
            AUDIT FINDINGS & ISSUES
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Transparent verification of machine-understandable signals and content bottlenecks.
          </p>
        </div>

        {/* Counter Badges */}
        <div className="flex items-center space-x-2 text-xs font-mono">
          <div className="px-2.5 py-1 rounded-md bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 font-bold flex items-center space-x-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{report.summary.passed} Passed</span>
          </div>
          <div className="px-2.5 py-1 rounded-md bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 font-bold flex items-center space-x-1">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>{report.summary.warnings} Warnings</span>
          </div>
          <div className="px-2.5 py-1 rounded-md bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 font-bold flex items-center space-x-1">
            <XCircle className="w-3.5 h-3.5" />
            <span>{report.summary.failures} Failed</span>
          </div>
        </div>
      </div>

      {/* Filter and Expand/Collapse Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-4 border-b border-slate-200/60 dark:border-slate-800/80 text-xs">
        <div className="flex items-center space-x-1.5 flex-wrap">
          <button
            type="button"
            onClick={() => setFilterMode('ISSUES_ONLY')}
            className={`px-2.5 py-1 rounded text-xs transition-colors ${
              filterMode === 'ISSUES_ONLY'
                ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            Warnings & Failures ({report.summary.warnings + report.summary.failures})
          </button>
          <button
            type="button"
            onClick={() => setFilterMode('WARNINGS')}
            className={`px-2.5 py-1 rounded text-xs transition-colors ${
              filterMode === 'WARNINGS'
                ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            Warnings ({report.summary.warnings})
          </button>
          <button
            type="button"
            onClick={() => setFilterMode('FAILS')}
            className={`px-2.5 py-1 rounded text-xs transition-colors ${
              filterMode === 'FAILS'
                ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            Failures ({report.summary.failures})
          </button>
          <button
            type="button"
            onClick={() => setFilterMode('ALL')}
            className={`px-2.5 py-1 rounded text-xs transition-colors ${
              filterMode === 'ALL'
                ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            All Rules ({allChecks.length})
          </button>
        </div>

        <div className="flex items-center space-x-2 flex-shrink-0">
          <button
            type="button"
            onClick={expandAll}
            className="text-[11px] text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center space-x-1"
          >
            <Maximize2 className="w-3 h-3" />
            <span>Expand all</span>
          </button>
          <span>·</span>
          <button
            type="button"
            onClick={collapseAll}
            className="text-[11px] text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center space-x-1"
          >
            <Minimize2 className="w-3 h-3" />
            <span>Collapse all</span>
          </button>
        </div>
      </div>

      {/* Accordion Rule List (Collapsed by default) */}
      <div className="space-y-2.5">
        {displayedChecks.length === 0 ? (
          <div className="p-8 text-center text-slate-500 dark:text-slate-400 text-xs">
            <CheckCircle2 className="w-6 h-6 text-emerald-500 mx-auto mb-2" />
            <p className="font-semibold text-slate-800 dark:text-slate-200">
              No findings matching this filter.
            </p>
          </div>
        ) : (
          displayedChecks.map((rule) => {
            const isExpanded = expandedIds.has(rule.id);

            return (
              <div
                key={rule.id}
                className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 overflow-hidden transition-colors"
              >
                <button
                  type="button"
                  onClick={() => toggleExpand(rule.id)}
                  className="w-full p-3.5 sm:p-4 text-left flex items-start sm:items-center justify-between gap-3 focus:outline-none"
                  aria-expanded={isExpanded}
                >
                  <div className="flex items-start sm:items-center space-x-2.5 min-w-0">
                    <div className="mt-0.5 sm:mt-0 flex-shrink-0">
                      {getStatusIcon(rule.status)}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                        <span className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-slate-100">
                          {rule.title}
                        </span>
                        <span
                          className={`text-[10px] font-mono px-1.5 py-0.2 rounded border font-semibold ${getStatusBadge(
                            rule.status
                          )}`}
                        >
                          {rule.status}
                        </span>
                        <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 capitalize">
                          {rule.category}
                        </span>
                      </div>

                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                        {rule.whatWeFound || rule.explanation}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2.5 flex-shrink-0">
                    <span className="text-xs font-mono font-medium text-slate-500 dark:text-slate-400">
                      {rule.score}/{rule.maxScore}
                    </span>

                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-slate-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-400" />
                    )}
                  </div>
                </button>

                {isExpanded && (
                  <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/50 space-y-3 text-xs">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="p-3 rounded-md bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
                        <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400 font-bold block mb-1">
                          WHAT WE FOUND
                        </span>
                        <p className="text-slate-800 dark:text-slate-200 leading-relaxed">
                          {rule.whatWeFound || rule.explanation}
                        </p>
                      </div>

                      <div className="p-3 rounded-md bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
                        <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400 font-bold block mb-1">
                          WHY IT MATTERS FOR AIEO
                        </span>
                        <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                          {rule.whyItMatters}
                        </p>
                      </div>
                    </div>

                    <div className="p-3 rounded-md bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
                      <span className="text-[10px] font-mono uppercase tracking-wider text-brand-600 dark:text-brand-400 font-bold block mb-1">
                        RECOMMENDED FIX
                      </span>
                      <p className="text-slate-800 dark:text-slate-200 leading-relaxed">
                        {rule.howToImprove || rule.recommendation || 'No action needed.'}
                      </p>
                    </div>

                    {rule.evidence && (
                      <div className="p-3 rounded-md bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 font-mono text-[11px]">
                        <span className="text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400 font-bold block mb-1">
                          EVIDENCE
                        </span>
                        <pre className="text-slate-700 dark:text-slate-300 overflow-x-auto whitespace-pre-wrap break-all">
                          {typeof rule.evidence === 'string'
                            ? rule.evidence
                            : JSON.stringify(rule.evidence, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
