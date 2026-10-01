'use client';

import React, { useState } from 'react';
import {
  MessageSquare,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  HelpCircle,
} from 'lucide-react';
import { AnswerCoverageSummary } from '@/lib/audit/types';

interface AnswerCoverageSectionProps {
  coverage: AnswerCoverageSummary;
  defaultExpanded?: boolean;
}

export const AnswerCoverageSection: React.FC<AnswerCoverageSectionProps> = ({
  coverage,
  defaultExpanded = true,
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  const getStatusBadge = (status: 'ANSWERED' | 'PARTIALLY ANSWERED' | 'NOT FOUND') => {
    switch (status) {
      case 'ANSWERED':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>ANSWERED</span>
          </span>
        );
      case 'PARTIALLY ANSWERED':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>PARTIALLY ANSWERED</span>
          </span>
        );
      case 'NOT FOUND':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <XCircle className="w-3.5 h-3.5" />
            <span>NOT FOUND</span>
          </span>
        );
    }
  };

  return (
    <div className="rounded-2xl bg-surface/90 border border-surface-border shadow-lg overflow-hidden transition-all duration-300">
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-5 sm:p-6 text-left flex items-center justify-between gap-4 focus:outline-none focus:ring-1 focus:ring-brand-500/50"
        aria-expanded={isExpanded}
      >
        <div className="flex items-center space-x-3.5">
          <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex-shrink-0">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-base sm:text-lg font-bold text-slate-100">
                ANSWER COVERAGE
              </h3>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-cyan-950/60 text-cyan-300 border border-cyan-800/40">
                Deterministic Inquiries
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Deterministic evaluation of whether the page addresses core inquiries appropriate to its classification.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-4 flex-shrink-0">
          <div className="text-right">
            <div className="text-base sm:text-lg font-mono font-bold text-cyan-300">
              {coverage.overallCoverageScore}%
            </div>
            <span className="text-[10px] text-slate-400 uppercase tracking-wider">
              Coverage
            </span>
          </div>
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-slate-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-slate-400" />
          )}
        </div>
      </button>

      {isExpanded && (
        <div className="p-5 sm:p-6 border-t border-surface-border/70 bg-surface-card/40 space-y-4 animate-fade-in text-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-xl bg-surface border border-surface-border">
            <div className="text-xs text-slate-300">
              <span className="font-semibold text-slate-400">Classified Archetype: </span>
              <span className="capitalize font-mono text-cyan-300">
                {coverage.detectedSiteType.replace('_', ' ')}
              </span>
            </div>
            <span className="text-[11px] text-slate-400">
              Evaluated with deterministic keyword, heading, and semantic heuristics (Non-LLM).
            </span>
          </div>

          <div className="space-y-2.5">
            {coverage.questions.map((q, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-xl bg-surface border border-surface-border/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="space-y-1 min-w-0">
                  <div className="font-semibold text-slate-100 text-xs sm:text-sm">
                    {q.question}
                  </div>
                  <div className="text-xs text-slate-400 line-clamp-2">
                    {q.evidence}
                  </div>
                </div>

                <div className="flex-shrink-0">{getStatusBadge(q.status)}</div>
              </div>
            ))}
          </div>

          <p className="text-[11px] text-slate-400 pt-2 border-t border-surface-border/50">
            Note: Answer Coverage evaluates visible on-page text and headings against standard question templates for this entity type.
          </p>
        </div>
      )}
    </div>
  );
};
