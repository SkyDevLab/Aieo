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
    <div className="w-full max-w-2xl mx-auto my-8 p-6 md:p-8 rounded-2xl bg-surface/80 border border-surface-border shadow-2xl backdrop-blur-xl animate-fade-in">
      <div className="flex items-center space-x-3 mb-6">
        <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-brand-500/10 border border-brand-500/20 text-brand-400">
          <Loader2 className="w-5 h-5 animate-spin text-brand-400" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-slate-100">
            Analyzing website...
          </h3>
          <p className="text-xs text-slate-400 truncate max-w-md font-mono">
            {analyzedUrl}
          </p>
        </div>
      </div>

      <div className="space-y-3.5">
        {AUDIT_STEPS.map((step, idx) => {
          const isDone = completedSteps.has(step.key);
          const isCurrent = currentStep === step.key && !isDone;

          return (
            <div
              key={step.key}
              className={`flex items-center justify-between p-3 rounded-lg border transition-all duration-300 ${
                isDone
                  ? 'bg-emerald-950/20 border-emerald-800/30 text-emerald-300'
                  : isCurrent
                  ? 'bg-brand-950/30 border-brand-500/40 text-brand-200'
                  : 'bg-slate-900/40 border-slate-800/40 text-slate-500'
              }`}
            >
              <div className="flex items-center space-x-3">
                {isDone ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                ) : isCurrent ? (
                  <Loader2 className="w-4 h-4 animate-spin text-brand-400 flex-shrink-0" />
                ) : (
                  <Circle className="w-4 h-4 text-slate-600 flex-shrink-0" />
                )}
                <span className="text-sm font-medium">
                  {step.label}
                </span>
              </div>
              <span className="text-xs font-mono font-medium opacity-60">
                0{idx + 1}
              </span>
            </div>
          );
        })}
      </div>

      <div className="mt-6 pt-4 border-t border-surface-border/60 flex items-center justify-between text-xs text-slate-400">
        <span className="flex items-center space-x-1.5">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Real-time heuristic evaluation</span>
        </span>
        <span>Zero simulated delays</span>
      </div>
    </div>
  );
};
