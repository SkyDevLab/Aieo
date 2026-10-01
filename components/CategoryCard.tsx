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
import { CategorySummary, EntitySummary, AnswerCoverageSummary } from '@/lib/audit/types';
import { CheckResult } from './CheckResult';

interface CategoryCardProps {
  category: CategorySummary;
  detectedSchemas?: string[];
  entitySummary?: EntitySummary;
  answerSummary?: AnswerCoverageSummary;
  defaultExpanded?: boolean;
}

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  crawlability: <Bot className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />,
  content: <FileText className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />,
  structuredData: <Boxes className="w-4 h-4 text-amber-600 dark:text-amber-400" />,
  entity: <Fingerprint className="w-4 h-4 text-purple-600 dark:text-purple-400" />,
  answerReadiness: <MessageSquare className="w-4 h-4 text-sky-600 dark:text-sky-400" />,
};

export const CategoryCard: React.FC<CategoryCardProps> = ({
  category,
  defaultExpanded = false,
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  const getScoreColor = (score: number) => {
    if (score >= 85) return 'text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40';
    if (score >= 70) return 'text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-950/40';
    if (score >= 50) return 'text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40';
    return 'text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/40';
  };

  const getProgressBarColor = (score: number) => {
    if (score >= 85) return 'bg-emerald-500';
    if (score >= 70) return 'bg-indigo-600';
    if (score >= 50) return 'bg-amber-500';
    return 'bg-rose-500';
  };

  return (
    <div className="rounded-xl bg-white dark:bg-surface border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden mb-4">
      {/* Clickable Header */}
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-4 sm:p-5 text-left flex flex-col md:flex-row md:items-center justify-between gap-3 focus:outline-none"
        aria-expanded={isExpanded}
      >
        <div className="flex items-start sm:items-center space-x-3 min-w-0">
          <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex-shrink-0">
            {CATEGORY_ICONS[category.id] || <Boxes className="w-4 h-4 text-brand-600" />}
          </div>
          <div className="min-w-0">
            <div className="flex items-center space-x-2">
              <h3 className="text-sm sm:text-base font-semibold text-slate-900 dark:text-slate-100">
                {category.title}
              </h3>
              <span className="text-[11px] font-mono text-slate-400">
                ({category.weight}% weight)
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
              {category.description}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between md:justify-end space-x-4 flex-shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100 dark:border-slate-800">
          {/* Status Breakdown Pills */}
          <div className="flex items-center space-x-2 text-xs">
            {category.statusBreakdown.pass > 0 && (
              <span className="flex items-center space-x-1 text-emerald-600 dark:text-emerald-400 font-mono text-[11px]">
                <CheckCircle2 className="w-3 h-3" />
                <span>{category.statusBreakdown.pass}</span>
              </span>
            )}
            {category.statusBreakdown.warning > 0 && (
              <span className="flex items-center space-x-1 text-amber-600 dark:text-amber-400 font-mono text-[11px]">
                <AlertTriangle className="w-3 h-3" />
                <span>{category.statusBreakdown.warning}</span>
              </span>
            )}
            {category.statusBreakdown.fail > 0 && (
              <span className="flex items-center space-x-1 text-rose-600 dark:text-rose-400 font-mono text-[11px]">
                <XCircle className="w-3 h-3" />
                <span>{category.statusBreakdown.fail}</span>
              </span>
            )}
            {category.statusBreakdown.info > 0 && (
              <span className="flex items-center space-x-1 text-sky-600 dark:text-sky-400 font-mono text-[11px]">
                <Info className="w-3 h-3" />
                <span>{category.statusBreakdown.info}</span>
              </span>
            )}
          </div>

          {/* Score Badge */}
          <div className="flex items-center space-x-2">
            <div
              className={`px-2.5 py-0.5 rounded-md border font-mono font-bold text-xs sm:text-sm ${getScoreColor(
                category.score
              )}`}
            >
              {category.score} <span className="text-[10px] font-normal opacity-70">/ 100</span>
            </div>
            {isExpanded ? (
              <ChevronUp className="w-4 h-4 text-slate-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-slate-400" />
            )}
          </div>
        </div>
      </button>

      {/* Thin Category Progress Bar */}
      <div className="w-full bg-slate-100 dark:bg-slate-800 h-1">
        <div
          className={`h-1 transition-all duration-500 ${getProgressBarColor(
            category.score
          )}`}
          style={{ width: `${category.score}%` }}
        />
      </div>

      {/* Expanded Accordion Body */}
      {isExpanded && (
        <div className="p-4 sm:p-5 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 space-y-3">
          <div className="space-y-2">
            {category.checks.map((check) => (
              <CheckResult key={check.id} check={check} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
