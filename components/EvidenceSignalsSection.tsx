'use client';

import React, { useState } from 'react';
import { ChevronDown, ChevronUp, CheckCircle2, XCircle, FileCheck2 } from 'lucide-react';
import { EvidenceSignalsSummary } from '@/lib/audit/types';

interface EvidenceSignalsSectionProps {
  evidenceSignals: EvidenceSignalsSummary;
  defaultExpanded?: boolean;
}

export const EvidenceSignalsSection: React.FC<EvidenceSignalsSectionProps> = ({
  evidenceSignals,
  defaultExpanded = false,
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  const { signals, detectedCount } = evidenceSignals;

  return (
    <div className="rounded-xl bg-white dark:bg-surface border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden transition-all">
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-3 focus:outline-none"
        aria-expanded={isExpanded}
      >
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 flex-shrink-0">
            <FileCheck2 className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                EVIDENCE SIGNALS
              </h3>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                {detectedCount}/{signals.length} Signals
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Verification of factual modules (pricing, testimonials, case studies, contact details).
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 flex-shrink-0">
          <span className="text-xs font-mono text-emerald-700 dark:text-emerald-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
            {detectedCount} Verified
          </span>
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 text-slate-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-400" />
          )}
        </div>
      </button>

      {isExpanded && (
        <div className="p-4 sm:p-5 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {signals.map((sig) => (
              <div
                key={sig.id}
                className={`p-3 rounded-lg border transition-colors ${
                  sig.present
                    ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                    : 'bg-slate-50/60 dark:bg-slate-900/30 border-slate-200/60 dark:border-slate-800/60 opacity-60'
                }`}
              >
                <div className="flex items-start space-x-2">
                  {sig.present ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 mt-0.5 flex-shrink-0" />
                  ) : (
                    <XCircle className="w-3.5 h-3.5 text-slate-400 mt-0.5 flex-shrink-0" />
                  )}
                  <div className="min-w-0">
                    <span className="font-semibold text-slate-900 dark:text-slate-100 block truncate">
                      {sig.label}
                    </span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 block truncate">
                      {sig.present ? sig.evidenceText || 'Detected in page markup' : 'Not detected'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Factual signals help automated answering engines verify operational authenticity and source authority.
          </p>
        </div>
      )}
    </div>
  );
};
