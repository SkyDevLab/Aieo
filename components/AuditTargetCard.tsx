'use client';

import React, { useState } from 'react';
import { ExternalLink, CheckCircle2, Clock, Calendar, Check, Share2, RotateCcw } from 'lucide-react';
import { AuditReport } from '@/lib/audit/types';
import { analytics } from '@/lib/analytics';

interface AuditTargetCardProps {
  report: AuditReport;
  onReset?: () => void;
}

export const AuditTargetCard: React.FC<AuditTargetCardProps> = ({
  report,
  onReset,
}) => {
  const [copied, setCopied] = useState(false);

  // Format date cleanly
  const formattedDate = (() => {
    try {
      const d = new Date(report.analyzedAt);
      return d.toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return 'September 30, 2026';
    }
  })();

  const handleShare = () => {
    const summaryText = `Website AIEO Checker Report for ${report.url}
Overall Score: ${report.score}/100 (${report.rating.label})
• AI Crawlability: ${report.categories.crawlability.score}/100
• Content Structure: ${report.categories.content.score}/100
• Structured Data: ${report.categories.structuredData.score}/100
• Entity Clarity: ${report.categories.entity.score}/100
• Answer Readiness: ${report.categories.answerReadiness.score}/100
Audited by Website AIEO Checker (Built by SkyDevLab)`;

    navigator.clipboard.writeText(summaryText);
    setCopied(true);
    analytics.shareReportClicked('copy_summary');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-full rounded-xl bg-white dark:bg-surface border border-slate-200 dark:border-slate-800 p-4 sm:p-5 shadow-sm mb-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Left: Target Details */}
        <div className="min-w-0 space-y-1">
          <div className="flex items-center space-x-2 text-[11px] font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400">
            <span className="font-semibold text-brand-600 dark:text-brand-400">
              AUDIT TARGET
            </span>
            <span>•</span>
            <span className="flex items-center space-x-1 text-slate-600 dark:text-slate-400">
              <Clock className="w-3 h-3 text-slate-400" />
              <span>Audited in {report.durationMs}ms</span>
            </span>
            <span>•</span>
            <span className="flex items-center space-x-1 text-slate-600 dark:text-slate-400">
              <Calendar className="w-3 h-3 text-slate-400" />
              <span>{formattedDate}</span>
            </span>
          </div>

          <div className="flex items-center space-x-2 pt-0.5">
            <span className="text-base sm:text-lg font-bold font-mono text-slate-900 dark:text-white truncate">
              {report.url}
            </span>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center space-x-2 flex-wrap flex-shrink-0">
          <a
            href={report.url}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-medium transition-colors flex items-center space-x-1.5 shadow-sm"
          >
            <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
            <span>Open URL</span>
          </a>

          <button
            type="button"
            onClick={handleShare}
            className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-medium transition-colors flex items-center space-x-1.5 shadow-sm"
          >
            {copied ? (
              <Check className="w-3.5 h-3.5 text-emerald-500" />
            ) : (
              <Share2 className="w-3.5 h-3.5 text-slate-500" />
            )}
            <span>{copied ? 'Copied' : 'Share'}</span>
          </button>

          {onReset && (
            <button
              type="button"
              onClick={onReset}
              className="px-3 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold transition-colors flex items-center space-x-1.5 shadow-sm"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Audit Another</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
