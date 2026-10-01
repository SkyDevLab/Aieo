'use client';

import React, { useState } from 'react';
import { Compass, ChevronDown, ChevronUp, Tag } from 'lucide-react';
import { EntityIntentCoverage } from '@/lib/audit/types';

interface EntityIntentCoverageSectionProps {
  intentCoverage: EntityIntentCoverage;
  defaultExpanded?: boolean;
}

export const EntityIntentCoverageSection: React.FC<EntityIntentCoverageSectionProps> = ({
  intentCoverage,
  defaultExpanded = false,
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  const { intents } = intentCoverage;

  return (
    <div className="rounded-xl bg-white dark:bg-surface border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden transition-all">
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-3 focus:outline-none"
        aria-expanded={isExpanded}
      >
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-600 dark:text-amber-400 flex-shrink-0">
            <Compass className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                ENTITY–INTENT COVERAGE
              </h3>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                Concepts
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Topical intents and functional concepts extracted from headings and navigation.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 flex-shrink-0">
          <span className="text-xs font-mono text-amber-700 dark:text-amber-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
            {intents.length} Concepts
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
            {intents.map((item, idx) => (
              <div
                key={idx}
                className="p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-start space-x-2"
              >
                <Tag className="w-3.5 h-3.5 text-slate-400 mt-0.5 flex-shrink-0" />
                <div className="min-w-0">
                  <div className="font-semibold text-slate-900 dark:text-slate-100 truncate">
                    {item.name}
                  </div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 font-mono">
                    {item.category} · {item.source}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Intents represent legitimate thematic groupings extracted from page structure, not search keyword stuffing.
          </p>
        </div>
      )}
    </div>
  );
};
