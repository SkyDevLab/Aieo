'use client';

import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { AuditReport } from '@/lib/audit/types';

interface ContentHierarchyTreeProps {
  score: number;
  report: AuditReport;
}

export const ContentHierarchyTree: React.FC<ContentHierarchyTreeProps> = ({
  score,
  report,
}) => {
  const title = report.technicalEvidence?.title || 'Page Document';
  const h1 = report.technicalEvidence?.h1 || 'No H1 Detected';

  const headingOrderCheck = report.categories.content.checks.find(
    (c) => c.id === 'content-heading-order'
  );
  const emptyHeadingsCheck = report.categories.content.checks.find(
    (c) => c.id === 'content-empty-headings'
  );

  const hasHeadingWarning =
    headingOrderCheck?.status === 'WARNING' ||
    emptyHeadingsCheck?.status === 'WARNING';

  const extractedCapabilities = report.entityGraph?.capabilities || [];

  return (
    <div className="w-full bg-white dark:bg-surface border border-slate-200 dark:border-slate-800 rounded-xl p-6 sm:p-7 shadow-sm mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-5 border-b border-slate-200 dark:border-slate-800 gap-2">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider font-mono">
            CONTENT HIERARCHY TREE
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Outline readability and sequential heading structure (TITLE → H1 → H2 → H3).
          </p>
        </div>

        <div className="flex items-baseline space-x-1 font-mono text-slate-900 dark:text-white">
          <span className="text-xl font-bold">{score}</span>
          <span className="text-xs text-slate-400">/ 100</span>
        </div>
      </div>

      {hasHeadingWarning && (
        <div className="mb-4 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-xs flex items-start space-x-2">
          <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold block">Heading Structure Notice</span>
            <p className="mt-0.5 leading-relaxed">
              {headingOrderCheck?.status === 'WARNING'
                ? headingOrderCheck.whatWeFound
                : emptyHeadingsCheck?.whatWeFound}
            </p>
          </div>
        </div>
      )}

      {/* Visual Tree */}
      <div className="p-4 sm:p-5 rounded-lg bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 font-mono text-xs space-y-2.5">
        {/* Title */}
        <div className="flex items-center space-x-2">
          <span className="text-slate-500 dark:text-slate-400 font-bold">TITLE:</span>
          <span className="text-slate-900 dark:text-white font-medium truncate max-w-xl">
            {title}
          </span>
        </div>

        {/* H1 */}
        <div className="pl-4 border-l border-slate-300 dark:border-slate-700 space-y-2">
          <div className="flex items-center space-x-2">
            <span className="text-slate-400">└──</span>
            <span className="px-1.5 py-0.2 rounded bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 text-[10px] font-bold">
              H1
            </span>
            <span className="text-slate-900 dark:text-white font-semibold truncate max-w-xl">
              {h1}
            </span>
          </div>

          {/* H2 section 1 */}
          <div className="pl-6 border-l border-slate-300 dark:border-slate-700 space-y-1.5">
            <div className="flex items-center space-x-2">
              <span className="text-slate-400">├──</span>
              <span className="px-1.5 py-0.2 rounded bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold">
                H2
              </span>
              <span className="text-slate-800 dark:text-slate-200">
                Core Overview & Work
              </span>
            </div>

            {/* H3 sub items */}
            <div className="pl-6 border-l border-slate-300 dark:border-slate-700 space-y-1 text-slate-600 dark:text-slate-400 text-[11px]">
              <div className="flex items-center space-x-2">
                <span>├──</span>
                <span className="text-slate-500">H3:</span>
                <span className="text-slate-700 dark:text-slate-300">
                  {extractedCapabilities[0] || 'Technical Capabilities'}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <span>└──</span>
                <span className="text-slate-500">H3:</span>
                <span className="text-slate-700 dark:text-slate-300">
                  {extractedCapabilities[1] || 'Featured Projects'}
                </span>
              </div>
            </div>

            {/* H2 section 2 */}
            <div className="flex items-center space-x-2 pt-1">
              <span className="text-slate-400">└──</span>
              <span className="px-1.5 py-0.2 rounded bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold">
                H2
              </span>
              <span className="text-slate-800 dark:text-slate-200">
                Contact & Profiles
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
