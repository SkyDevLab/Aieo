'use client';

import React from 'react';
import { CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';
import { AnswerCoverageSummary } from '@/lib/audit/types';

interface AnswerCoverageGraphProps {
  score: number;
  answerCoverage?: AnswerCoverageSummary;
}

export const AnswerCoverageGraph: React.FC<AnswerCoverageGraphProps> = ({
  score,
  answerCoverage,
}) => {
  if (!answerCoverage || !answerCoverage.questions || answerCoverage.questions.length === 0) {
    return null;
  }

  const questions = answerCoverage.questions;
  const total = questions.length;

  const answeredCount = questions.filter((q) => q.status === 'ANSWERED').length;
  const partialCount = questions.filter((q) => q.status === 'PARTIALLY ANSWERED').length;
  const missingCount = questions.filter((q) => q.status === 'NOT FOUND').length;

  const answeredPct = total > 0 ? Math.round((answeredCount / total) * 100) : 0;
  const partialPct = total > 0 ? Math.round((partialCount / total) * 100) : 0;
  const missingPct = total > 0 ? Math.round((missingCount / total) * 100) : 0;

  const getStatusBadge = (status: 'ANSWERED' | 'PARTIALLY ANSWERED' | 'NOT FOUND') => {
    switch (status) {
      case 'ANSWERED':
        return {
          icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />,
          badgeClass: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
          label: 'ANSWERED',
        };
      case 'PARTIALLY ANSWERED':
        return {
          icon: <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />,
          badgeClass: 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800',
          label: 'PARTIALLY ANSWERED',
        };
      case 'NOT FOUND':
        return {
          icon: <XCircle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />,
          badgeClass: 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800',
          label: 'NOT FOUND',
        };
    }
  };

  return (
    <div className="w-full bg-white dark:bg-surface border border-slate-200 dark:border-slate-800 rounded-xl p-6 sm:p-7 shadow-sm mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-5 border-b border-slate-200 dark:border-slate-800 gap-2">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider font-mono">
            ANSWER READINESS
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            How clearly your public content answers questions AI systems formulate about your website.
          </p>
        </div>

        <div className="flex items-baseline space-x-1 font-mono text-slate-900 dark:text-white">
          <span className="text-xl font-bold">{score}</span>
          <span className="text-xs text-slate-400">/ 100</span>
        </div>
      </div>

      {/* Answer Coverage Distribution Horizontal Bars */}
      <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 mb-5 space-y-3">
        <div className="flex items-center justify-between text-xs">
          <span className="font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400 font-semibold text-[10px]">
            ANSWER COVERAGE DISTRIBUTION
          </span>
          <span className="font-mono text-slate-500 dark:text-slate-400 text-[11px]">
            {total} Questions Evaluated
          </span>
        </div>

        {/* Answered Bar */}
        <div>
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-slate-700 dark:text-slate-300 font-medium text-[11px]">
              Answered ({answeredCount})
            </span>
            <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold text-xs">
              {answeredPct}%
            </span>
          </div>
          <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
            <div
              className="h-1.5 rounded-full bg-emerald-500 transition-all duration-500"
              style={{ width: `${answeredPct}%` }}
            />
          </div>
        </div>

        {/* Partial Bar */}
        <div>
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-slate-700 dark:text-slate-300 font-medium text-[11px]">
              Partially Answered ({partialCount})
            </span>
            <span className="font-mono text-amber-600 dark:text-amber-400 font-bold text-xs">
              {partialPct}%
            </span>
          </div>
          <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
            <div
              className="h-1.5 rounded-full bg-amber-500 transition-all duration-500"
              style={{ width: `${partialPct}%` }}
            />
          </div>
        </div>

        {/* Missing Bar */}
        <div>
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-slate-700 dark:text-slate-300 font-medium text-[11px]">
              Missing ({missingCount})
            </span>
            <span className="font-mono text-rose-600 dark:text-rose-400 font-bold text-xs">
              {missingPct}%
            </span>
          </div>
          <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
            <div
              className="h-1.5 rounded-full bg-rose-500 transition-all duration-500"
              style={{ width: `${missingPct}%` }}
            />
          </div>
        </div>
      </div>

      {/* Detected Questions List */}
      <div className="space-y-2">
        <h4 className="text-[11px] font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400 font-semibold mb-2">
          QUESTIONS AI SYSTEMS MAY NEED ANSWERED
        </h4>

        {questions.map((q, idx) => {
          const statusInfo = getStatusBadge(q.status);

          return (
            <div
              key={idx}
              className="p-3 rounded-lg bg-slate-50/60 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
            >
              <div className="space-y-0.5 min-w-0">
                <div className="font-medium text-slate-800 dark:text-slate-200">
                  {q.question}
                </div>
                {q.evidence && (
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-sans truncate">
                    Evidence: {q.evidence}
                  </p>
                )}
              </div>

              <div className="flex items-center space-x-1.5 flex-shrink-0">
                <span
                  className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-mono font-semibold border ${statusInfo.badgeClass}`}
                >
                  {statusInfo.icon}
                  <span>{statusInfo.label}</span>
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
