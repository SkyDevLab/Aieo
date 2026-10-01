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
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>PASS</span>
          </span>
        );
      case 'WARNING':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>WARNING</span>
          </span>
        );
      case 'FAIL':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <XCircle className="w-3.5 h-3.5" />
            <span>FAIL</span>
          </span>
        );
      case 'INFO':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-sky-500/10 text-sky-400 border border-sky-500/20">
            <Info className="w-3.5 h-3.5" />
            <span>INFO</span>
          </span>
        );
    }
  };

  return (
    <div
      className={`border rounded-xl transition-all duration-200 ${
        check.status === 'FAIL'
          ? 'bg-rose-950/10 border-rose-900/30'
          : check.status === 'WARNING'
          ? 'bg-amber-950/10 border-amber-900/30'
          : check.status === 'INFO'
          ? 'bg-sky-950/10 border-sky-900/30'
          : 'bg-slate-900/40 border-surface-border/60 hover:border-surface-border'
      }`}
    >
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-4 flex items-center justify-between text-left focus:outline-none focus:ring-1 focus:ring-brand-500/40 rounded-xl"
        aria-expanded={isOpen}
      >
        <div className="flex items-center space-x-3 pr-4 min-w-0">
          <div className="flex-shrink-0">{getStatusBadge()}</div>
          <div className="min-w-0">
            <h4 className="text-sm font-semibold text-slate-100 truncate">
              {check.title}
            </h4>
            <p className="text-xs text-slate-400 line-clamp-1 mt-0.5">
              {check.explanation}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3 flex-shrink-0">
          {check.maxScore > 0 && (
            <span className="hidden sm:inline-block text-xs font-mono font-medium px-2 py-0.5 rounded bg-surface border border-surface-border text-slate-300">
              +{check.score}/{check.maxScore} pts
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
        <div className="px-4 pb-4 pt-1 border-t border-surface-border/40 text-xs space-y-3 animate-fade-in">
          <div>
            <span className="font-semibold text-slate-300 uppercase tracking-wider text-[10px] block mb-1">
              What we found
            </span>
            <div className="p-2.5 rounded-lg bg-surface/90 border border-surface-border/80 text-slate-200 font-mono text-[11px] leading-relaxed break-words">
              {check.whatWeFound}
            </div>
          </div>

          <div>
            <span className="font-semibold text-slate-300 uppercase tracking-wider text-[10px] block mb-1">
              Why it matters
            </span>
            <p className="text-slate-300 leading-relaxed">
              {check.whyItMatters}
            </p>
          </div>

          <div>
            <span className="font-semibold text-slate-300 uppercase tracking-wider text-[10px] block mb-1">
              How to improve
            </span>
            <div className="p-2.5 rounded-lg bg-brand-950/20 border border-brand-900/30 text-brand-200 leading-relaxed">
              {check.howToImprove}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
