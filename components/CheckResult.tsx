'use client';

import React, { useState } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Info,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { AuditRuleResult } from '@/lib/audit/types';

interface CheckResultProps {
  check: AuditRuleResult;
}

export const CheckResult: React.FC<CheckResultProps> = ({ check }) => {
  const [isOpen, setIsOpen] = useState(
    check.status === 'FAIL' || check.status === 'WARNING'
  );

  const getStatusBadge = () => {
    switch (check.status) {
      case 'PASS':
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
            <span>PASS</span>
          </span>
        );
      case 'WARNING':
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[11px] font-medium bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
            <AlertTriangle className="w-3 h-3 text-amber-600 dark:text-amber-400" />
            <span>WARNING</span>
          </span>
        );
      case 'FAIL':
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[11px] font-medium bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
            <XCircle className="w-3 h-3 text-rose-600 dark:text-rose-400" />
            <span>FAIL</span>
          </span>
        );
      case 'INFO':
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[11px] font-medium bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800">
            <Info className="w-3 h-3 text-sky-600 dark:text-sky-400" />
            <span>INFO</span>
          </span>
        );
    }
  };

  return (
    <div
      className={`border rounded-lg transition-colors ${
        check.status === 'FAIL'
          ? 'bg-rose-50/30 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/40'
          : check.status === 'WARNING'
          ? 'bg-amber-50/30 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/40'
          : check.status === 'INFO'
          ? 'bg-sky-50/30 dark:bg-sky-950/20 border-sky-200 dark:border-sky-900/40'
          : 'bg-white dark:bg-slate-900/60 border-slate-200 dark:border-slate-800'
      }`}
    >
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-3 sm:p-3.5 flex items-center justify-between text-left focus:outline-none"
        aria-expanded={isOpen}
      >
        <div className="flex items-center space-x-2.5 pr-3 min-w-0">
          <div className="flex-shrink-0">{getStatusBadge()}</div>
          <div className="min-w-0">
            <h4 className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
              {check.title}
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
              {check.explanation}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2.5 flex-shrink-0">
          {check.maxScore > 0 && (
            <span className="hidden sm:inline-block text-[11px] font-mono px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400">
              +{check.score}/{check.maxScore}
            </span>
          )}
          {isOpen ? (
            <ChevronUp className="w-4 h-4 text-slate-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-400" />
          )}
        </div>
      </button>

      {isOpen && (
        <div className="px-3.5 pb-3.5 pt-1 border-t border-slate-200 dark:border-slate-800 text-xs space-y-2.5">
          <div>
            <span className="font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[10px] block mb-1">
              What we found
            </span>
            <div className="p-2.5 rounded-md bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 font-mono text-[11px] leading-relaxed break-words">
              {check.whatWeFound}
            </div>
          </div>

          <div>
            <span className="font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[10px] block mb-1">
              Why it matters
            </span>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
              {check.whyItMatters}
            </p>
          </div>

          <div>
            <span className="font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[10px] block mb-1">
              How to improve
            </span>
            <div className="p-2.5 rounded-md bg-brand-50/60 dark:bg-brand-950/30 border border-brand-200 dark:border-brand-800 text-brand-900 dark:text-brand-200 leading-relaxed">
              {check.howToImprove}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
