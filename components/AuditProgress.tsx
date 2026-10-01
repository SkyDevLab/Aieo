'use client';

import React from 'react';
import { Loader2, CheckCircle2, Circle } from 'lucide-react';
import { AuditProgressEvent } from '@/lib/audit/orchestrator';

interface AuditProgressProps {
  currentStep?: AuditProgressEvent['step'];
  completedSteps: Set<string>;
  analyzedUrl: string;
}

const AUDIT_STEPS = [
  { key: 'fetching_page', label: 'Fetching webpage and HTTP headers' },
  { key: 'checking_robots', label: 'Checking robots.txt & AI crawler directives' },
  { key: 'checking_sitemap', label: 'Checking XML sitemap accessibility' },
  { key: 'parsing_structured_data', label: 'Parsing Schema.org JSON-LD data' },
  { key: 'checking_entity_signals', label: 'Evaluating entity & brand signals' },
  { key: 'calculating_score', label: 'Calculating readiness scores & recommendations' },
] as const;

export const AuditProgress: React.FC<AuditProgressProps> = ({
  currentStep,
  completedSteps,
  analyzedUrl,
}) => {
  return (
    <div className="w-full max-w-2xl mx-auto my-6 p-6 rounded-xl bg-white dark:bg-surface border border-slate-200 dark:border-slate-800 shadow-sm animate-fade-in">
      <div className="flex items-center space-x-3 mb-5 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-brand-50 dark:bg-brand-950/40 text-brand-600 dark:text-brand-400 border border-brand-200 dark:border-brand-800">
          <Loader2 className="w-4 h-4 animate-spin" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
            Auditing website...
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-md font-mono">
            {analyzedUrl}
          </p>
        </div>
      </div>

      <div className="space-y-2">
        {AUDIT_STEPS.map((step, idx) => {
          const isDone = completedSteps.has(step.key);
          const isCurrent = currentStep === step.key && !isDone;

          return (
            <div
              key={step.key}
              className={`flex items-center justify-between p-2.5 rounded-lg border text-xs transition-colors ${
                isDone
                  ? 'bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
                  : isCurrent
                  ? 'bg-brand-50/60 dark:bg-brand-950/30 border-brand-200 dark:border-brand-800 text-brand-800 dark:text-brand-200 font-medium'
                  : 'bg-slate-50/50 dark:bg-slate-900/40 border-slate-200/60 dark:border-slate-800 text-slate-400'
              }`}
            >
              <div className="flex items-center space-x-2.5">
                {isDone ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                ) : isCurrent ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-brand-600 dark:text-brand-400 flex-shrink-0" />
                ) : (
                  <Circle className="w-3.5 h-3.5 text-slate-300 dark:text-slate-700 flex-shrink-0" />
                )}
                <span>{step.label}</span>
              </div>
              <span className="font-mono opacity-60 text-[10px]">
                0{idx + 1}
              </span>
            </div>
          );
        })}
      </div>

      <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
        <span className="flex items-center space-x-1.5">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500" />
          <span>Real-time deterministic heuristics</span>
        </span>
        <span className="font-mono">Open Engine</span>
      </div>
    </div>
  );
};
