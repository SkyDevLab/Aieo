'use client';

import React, { useState } from 'react';
import {
  Network,
  ChevronDown,
  ChevronUp,
  Building2,
  Users,
  Sparkles,
  Layers,
} from 'lucide-react';
import { EntityGraph } from '@/lib/audit/types';

interface EntityMapProps {
  graph: EntityGraph;
  defaultExpanded?: boolean;
}

export const EntityMap: React.FC<EntityMapProps> = ({ graph, defaultExpanded = false }) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  const { primaryEntity, industry, audience, capabilities, relationships } = graph;

  return (
    <div className="rounded-xl bg-white dark:bg-surface border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden transition-all">
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-3 focus:outline-none"
        aria-expanded={isExpanded}
      >
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-lg bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 text-purple-600 dark:text-purple-400 flex-shrink-0">
            <Network className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                TAXONOMY TREE
              </h3>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                Extracted Tree
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Extracted internal entity representation and supported semantic relationships.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 flex-shrink-0">
          <span className="text-xs font-mono text-purple-700 dark:text-purple-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
            {primaryEntity.name} ({primaryEntity.type})
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
          {/* Tree View Layout */}
          <div className="p-4 rounded-lg bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 font-mono text-xs leading-relaxed text-slate-800 dark:text-slate-200 overflow-x-auto">
            <div className="text-brand-600 dark:text-brand-400 font-bold text-sm flex items-center space-x-2">
              <span>{primaryEntity.name}</span>
              <span className="text-[10px] text-slate-400 font-normal">[Primary Entity]</span>
            </div>
            <div className="text-slate-300 dark:text-slate-700">│</div>

            <div className="flex items-start">
              <span className="text-slate-300 dark:text-slate-700 mr-2">├──</span>
              <span className="text-purple-600 dark:text-purple-400 font-semibold mr-2">Type:</span>
              <span>{primaryEntity.type}</span>
            </div>

            <div className="flex items-start">
              <span className="text-slate-300 dark:text-slate-700 mr-2">├──</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold mr-2">Industry:</span>
              <span>{industry || 'Not explicitly declared'}</span>
            </div>

            <div className="flex items-start">
              <span className="text-slate-300 dark:text-slate-700 mr-2">├──</span>
              <span className="text-amber-600 dark:text-amber-400 font-semibold mr-2">Audience:</span>
              <span>{audience || 'Not explicitly declared'}</span>
            </div>

            <div className="flex items-start">
              <span className="text-slate-300 dark:text-slate-700 mr-2">├──</span>
              <span className="text-sky-600 dark:text-sky-400 font-semibold mr-2">Capabilities:</span>
              <span className="break-all">{capabilities.slice(0, 5).join(', ') || 'General Digital Services'}</span>
            </div>

            <div className="flex items-start">
              <span className="text-slate-300 dark:text-slate-700 mr-2">└──</span>
              <span className="text-indigo-600 dark:text-indigo-400 font-semibold mr-2">Outbound Authority:</span>
              <span>{primaryEntity.sameAs.length} Verified Profile(s)</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
