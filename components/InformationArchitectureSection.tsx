'use client';

import React, { useState } from 'react';
import { FolderTree, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';
import { InformationArchitectureSummary } from '@/lib/audit/types';

interface InformationArchitectureSectionProps {
  ia: InformationArchitectureSummary;
  defaultExpanded?: boolean;
}

export const InformationArchitectureSection: React.FC<InformationArchitectureSectionProps> = ({
  ia,
  defaultExpanded = false,
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  const { links, categoriesFound, totalInternalLinks, totalExternalLinks } = ia;

  // Group by category
  const groupedLinks: Record<string, typeof links> = {};
  for (const l of links) {
    if (!groupedLinks[l.category]) {
      groupedLinks[l.category] = [];
    }
    groupedLinks[l.category].push(l);
  }

  return (
    <div className="rounded-xl bg-white dark:bg-surface border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden transition-all">
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-3 focus:outline-none"
        aria-expanded={isExpanded}
      >
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 flex-shrink-0">
            <FolderTree className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                NAVIGATION ARCHITECTURE
              </h3>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                {categoriesFound.length} Hubs
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Internal navigation structure and key thematic pathways identified from links.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 flex-shrink-0">
          <span className="text-xs font-mono text-indigo-700 dark:text-indigo-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
            {totalInternalLinks} Internal · {totalExternalLinks} External
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {Object.entries(groupedLinks).map(([cat, catLinks]) => (
              <div
                key={cat}
                className="p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2"
              >
                <div className="flex items-center justify-between font-mono text-[10px] font-bold text-slate-500 uppercase tracking-wider pb-1 border-b border-slate-100 dark:border-slate-800">
                  <span>{cat}</span>
                  <span>{catLinks.length}</span>
                </div>
                <div className="space-y-1 max-h-36 overflow-y-auto pr-1">
                  {catLinks.slice(0, 5).map((l, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white truncate"
                    >
                      <span className="truncate">{l.label}</span>
                      {l.isExternal && <ExternalLink className="w-3 h-3 text-slate-400 flex-shrink-0 ml-1" />}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
