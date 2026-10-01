'use client';

import React, { useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  Bot,
  FileText,
  Boxes,
  Fingerprint,
  MessageSquare,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Info,
} from 'lucide-react';
import { CategorySummary, EntitySummary, AnswerReadinessSummary } from '@/lib/audit/types';
import { CheckResult } from './CheckResult';

interface CategoryCardProps {
  category: CategorySummary;
  detectedSchemas?: string[];
  entitySummary?: EntitySummary;
  answerSummary?: AnswerReadinessSummary;
  defaultExpanded?: boolean;
}

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  crawlability: <Bot className="w-5 h-5 text-indigo-400" />,
  content: <FileText className="w-5 h-5 text-emerald-400" />,
  structuredData: <Boxes className="w-5 h-5 text-amber-400" />,
  entity: <Fingerprint className="w-5 h-5 text-purple-400" />,
  answerReadiness: <MessageSquare className="w-5 h-5 text-cyan-400" />,
};

export const CategoryCard: React.FC<CategoryCardProps> = ({
  category,
  detectedSchemas,
  entitySummary,
  answerSummary,
  defaultExpanded = false,
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  const getScoreColor = (score: number) => {
    if (score >= 85) return 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10';
    if (score >= 70) return 'text-indigo-400 border-indigo-500/30 bg-indigo-500/10';
    if (score >= 50) return 'text-amber-400 border-amber-500/30 bg-amber-500/10';
    return 'text-rose-400 border-rose-500/30 bg-rose-500/10';
  };

  const getProgressBarColor = (score: number) => {
    if (score >= 85) return 'bg-emerald-500';
    if (score >= 70) return 'bg-indigo-500';
    if (score >= 50) return 'bg-amber-500';
    return 'bg-rose-500';
  };

  return (
    <div className="rounded-2xl bg-surface/90 border border-surface-border hover:border-surface-border/80 transition-all duration-300 shadow-lg overflow-hidden">
      {/* Clickable Header */}
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-5 sm:p-6 text-left flex flex-col md:flex-row md:items-center justify-between gap-4 focus:outline-none focus:ring-1 focus:ring-brand-500/50"
        aria-expanded={isExpanded}
      >
        <div className="flex items-start sm:items-center space-x-4 min-w-0">
          <div className="p-3 rounded-xl bg-surface-card border border-surface-border flex-shrink-0">
            {CATEGORY_ICONS[category.id] || <Boxes className="w-5 h-5 text-brand-400" />}
          </div>
          <div className="min-w-0">
            <div className="flex items-center space-x-2.5">
              <h3 className="text-base sm:text-lg font-semibold text-slate-100">
                {category.title}
              </h3>
              <span className="text-xs font-mono text-slate-400">
                ({category.weight}% weight)
              </span>
            </div>
            <p className="text-xs text-slate-400 line-clamp-1 mt-0.5">
              {category.description}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between md:justify-end space-x-6 flex-shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-surface-border/40">
          {/* Status Breakdown Pills */}
          <div className="flex items-center space-x-2 text-xs">
            {category.statusBreakdown.pass > 0 && (
              <span className="flex items-center space-x-1 text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{category.statusBreakdown.pass}</span>
              </span>
            )}
            {category.statusBreakdown.warning > 0 && (
              <span className="flex items-center space-x-1 text-amber-400">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>{category.statusBreakdown.warning}</span>
              </span>
            )}
            {category.statusBreakdown.fail > 0 && (
              <span className="flex items-center space-x-1 text-rose-400">
                <XCircle className="w-3.5 h-3.5" />
                <span>{category.statusBreakdown.fail}</span>
              </span>
            )}
            {category.statusBreakdown.info > 0 && (
              <span className="flex items-center space-x-1 text-sky-400">
                <Info className="w-3.5 h-3.5" />
                <span>{category.statusBreakdown.info}</span>
              </span>
            )}
          </div>

          {/* Score Badge */}
          <div className="flex items-center space-x-3">
            <div
              className={`px-3 py-1 rounded-xl border font-mono font-bold text-sm sm:text-base ${getScoreColor(
                category.score
              )}`}
            >
              {category.score} <span className="text-xs font-normal opacity-70">/ 100</span>
            </div>
            {isExpanded ? (
              <ChevronUp className="w-5 h-5 text-slate-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-slate-400" />
            )}
          </div>
        </div>
      </button>

      {/* Mini Progress Line */}
      <div className="w-full bg-slate-900 h-1">
        <div
          className={`h-full ${getProgressBarColor(category.score)} transition-all duration-500`}
          style={{ width: `${Math.max(4, category.score)}%` }}
        />
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="p-5 sm:p-6 border-t border-surface-border/70 bg-surface-card/40 space-y-6 animate-fade-in">
          {/* Specific Custom Differentiator Panels */}

          {/* Structured Data Special Panel */}
          {category.id === 'structuredData' && (
            <div className="p-4 rounded-xl bg-surface/90 border border-surface-border space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Detected Schema.org Types
                </h4>
                <span className="text-[11px] text-slate-400">
                  Note: Sites only need relevant schemas
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {detectedSchemas && detectedSchemas.length > 0 ? (
                  detectedSchemas.map((type) => (
                    <span
                      key={type}
                      className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-lg text-xs font-mono bg-amber-500/10 text-amber-300 border border-amber-500/20"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />
                      <span>{type}</span>
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-slate-400 italic">
                    No recognized Schema.org types detected on this page.
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Entity Clarity Special Panel */}
          {category.id === 'entity' && entitySummary && (
            <div className="p-4 sm:p-5 rounded-xl bg-surface/90 border border-surface-border space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-surface-border/50 pb-3">
                <div>
                  <span className="text-[10px] font-mono text-purple-400 uppercase tracking-wider font-semibold">
                    Resolved Primary Entity
                  </span>
                  <div className="text-base sm:text-lg font-bold text-slate-100 flex items-center space-x-2">
                    <span>{entitySummary.primaryEntity}</span>
                    <span className="text-xs font-mono font-medium px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/20">
                      {entitySummary.entityType}
                    </span>
                  </div>
                </div>

                <div className="text-left sm:text-right">
                  <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                    Entity Consistency
                  </span>
                  <div className="text-base font-mono font-bold text-purple-300">
                    {entitySummary.consistencyScore} / 100
                  </div>
                </div>
              </div>

              {entitySummary.associatedEntities.length > 0 && (
                <div className="text-xs text-slate-300">
                  <span className="font-semibold text-slate-400">Associated Entities: </span>
                  {entitySummary.associatedEntities.join(', ')}
                </div>
              )}

              <div>
                <span className="text-xs font-semibold text-slate-400 block mb-2">
                  Corroborating Signals Identified on Website:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {entitySummary.signals.map((sig, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-lg bg-surface-card border border-surface-border flex items-start space-x-2"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-purple-400 flex-shrink-0 mt-0.5" />
                      <div className="min-w-0">
                        <span className="font-semibold text-slate-200 block text-[11px]">
                          {sig.source}
                        </span>
                        <span className="text-slate-400 text-[11px] truncate block font-mono">
                          {sig.value}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Answer Readiness Special Panel */}
          {category.id === 'answerReadiness' && answerSummary && (
            <div className="p-4 rounded-xl bg-surface/90 border border-surface-border space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider font-semibold">
                    Detected Site Classification
                  </span>
                  <h4 className="text-sm font-semibold text-slate-200 capitalize">
                    {answerSummary.detectedSiteType.replace('_', ' ')}
                  </h4>
                </div>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                  Deterministic Heuristic (Non-LLM)
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Evaluation of core user and AI conversational queries relevant to this site classification.
              </p>
            </div>
          )}

          {/* Individual Rule Checks List */}
          <div className="space-y-3">
            {category.checks.map((check) => (
              <CheckResult key={check.id} check={check} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
