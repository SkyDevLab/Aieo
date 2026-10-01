'use client';

import React, { useState } from 'react';
import {
  FileCode,
  SlidersHorizontal,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Info,
} from 'lucide-react';
import { AuditReport, AuditStatus } from '@/lib/audit/types';
import { ScoreCard } from './ScoreCard';
import { CategoryCard } from './CategoryCard';
import { CheckResult } from './CheckResult';

interface ReportProps {
  report: AuditReport;
  onReset?: () => void;
}

export const Report: React.FC<ReportProps> = ({ report, onReset }) => {
  const [activeTab, setActiveTab] = useState<'categories' | 'all-checks'>('categories');
  const [statusFilter, setStatusFilter] = useState<AuditStatus | 'ALL'>('ALL');

  const allChecks = [
    ...report.categories.crawlability.checks,
    ...report.categories.content.checks,
    ...report.categories.structuredData.checks,
    ...report.categories.entity.checks,
    ...report.categories.answerReadiness.checks,
  ];

  const filteredChecks = allChecks.filter((c) => {
    if (statusFilter === 'ALL') return true;
    return c.status === statusFilter;
  });

  return (
    <div className="w-full max-w-5xl mx-auto py-8 px-4 sm:px-6">
      {/* Primary Score Hero */}
      <ScoreCard report={report} onReset={onReset} />

      {/* LLMs.txt Informational Spotlight */}
      <div className="mb-8 p-4 sm:p-5 rounded-2xl bg-surface/80 border border-surface-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400 flex-shrink-0">
            <FileCode className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h4 className="text-sm font-semibold text-slate-100">
                llms.txt Convention Check
              </h4>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                Optional
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {report.llmsTxtStatus.standardExists
                ? 'Found /llms.txt at root domain.'
                : report.llmsTxtStatus.fullExists
                ? 'Found /llms-full.txt at root domain.'
                : 'llms.txt was not detected. This is an optional emerging convention and is not required for normal search crawling.'}
            </p>
          </div>
        </div>

        <div className="text-left sm:text-right flex-shrink-0">
          <span
            className={`text-xs font-mono font-medium px-2.5 py-1 rounded-lg border ${
              report.llmsTxtStatus.standardExists || report.llmsTxtStatus.fullExists
                ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'
                : 'bg-slate-800/80 text-slate-400 border-slate-700'
            }`}
          >
            {report.llmsTxtStatus.standardExists || report.llmsTxtStatus.fullExists
              ? 'Declared'
              : 'Not Present (Informational)'}
          </span>
        </div>
      </div>

      {/* Navigation / Filter Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-surface-border">
        {/* View Toggle */}
        <div className="flex items-center space-x-2 p-1 rounded-xl bg-surface border border-surface-border text-xs font-medium">
          <button
            type="button"
            onClick={() => setActiveTab('categories')}
            className={`px-3.5 py-1.5 rounded-lg transition-all ${
              activeTab === 'categories'
                ? 'bg-brand-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Category Breakdown (5)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('all-checks')}
            className={`px-3.5 py-1.5 rounded-lg transition-all ${
              activeTab === 'all-checks'
                ? 'bg-brand-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            All Audit Checks ({allChecks.length})
          </button>
        </div>

        {/* Status Filters */}
        <div className="flex items-center space-x-1.5 flex-wrap text-xs">
          <span className="text-slate-400 mr-1 flex items-center space-x-1">
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Filter:</span>
          </span>

          <button
            type="button"
            onClick={() => setStatusFilter('ALL')}
            className={`px-2.5 py-1 rounded-lg font-mono text-[11px] transition-colors ${
              statusFilter === 'ALL'
                ? 'bg-slate-700 text-white font-semibold'
                : 'text-slate-400 hover:bg-slate-800'
            }`}
          >
            All ({allChecks.length})
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter('PASS')}
            className={`px-2.5 py-1 rounded-lg font-mono text-[11px] transition-colors flex items-center space-x-1 ${
              statusFilter === 'PASS'
                ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-700'
                : 'text-slate-400 hover:bg-slate-800'
            }`}
          >
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            <span>Passed ({report.summary.passed})</span>
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter('WARNING')}
            className={`px-2.5 py-1 rounded-lg font-mono text-[11px] transition-colors flex items-center space-x-1 ${
              statusFilter === 'WARNING'
                ? 'bg-amber-950/80 text-amber-300 border border-amber-700'
                : 'text-slate-400 hover:bg-slate-800'
            }`}
          >
            <AlertTriangle className="w-3 h-3 text-amber-400" />
            <span>Warnings ({report.summary.warnings})</span>
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter('FAIL')}
            className={`px-2.5 py-1 rounded-lg font-mono text-[11px] transition-colors flex items-center space-x-1 ${
              statusFilter === 'FAIL'
                ? 'bg-rose-950/80 text-rose-300 border border-rose-700'
                : 'text-slate-400 hover:bg-slate-800'
            }`}
          >
            <XCircle className="w-3 h-3 text-rose-400" />
            <span>Issues ({report.summary.failures})</span>
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter('INFO')}
            className={`px-2.5 py-1 rounded-lg font-mono text-[11px] transition-colors flex items-center space-x-1 ${
              statusFilter === 'INFO'
                ? 'bg-sky-950/80 text-sky-300 border border-sky-700'
                : 'text-slate-400 hover:bg-slate-800'
            }`}
          >
            <Info className="w-3 h-3 text-sky-400" />
            <span>Info ({report.summary.info})</span>
          </button>
        </div>
      </div>

      {/* Main View Display */}
      {activeTab === 'categories' ? (
        <div className="space-y-5">
          <CategoryCard
            category={report.categories.crawlability}
            defaultExpanded={true}
          />
          <CategoryCard
            category={report.categories.content}
            defaultExpanded={true}
          />
          <CategoryCard
            category={report.categories.structuredData}
            detectedSchemas={report.detectedSchemas}
            defaultExpanded={true}
          />
          <CategoryCard
            category={report.categories.entity}
            entitySummary={report.entitySummary}
            defaultExpanded={true}
          />
          <CategoryCard
            category={report.categories.answerReadiness}
            answerSummary={report.answerReadinessSummary}
            defaultExpanded={true}
          />
        </div>
      ) : (
        <div className="space-y-3">
          {filteredChecks.length > 0 ? (
            filteredChecks.map((check) => (
              <CheckResult key={check.id} check={check} />
            ))
          ) : (
            <div className="p-8 text-center rounded-2xl bg-surface/40 border border-surface-border text-slate-400">
              No audit checks found for filter: {statusFilter}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
