'use client';

import React from 'react';
import { User, Building, Globe } from 'lucide-react';
import { EntitySummary } from '@/lib/audit/types';

interface EntityProfileCardProps {
  entitySummary: EntitySummary;
}

export const EntityProfileCard: React.FC<EntityProfileCardProps> = ({
  entitySummary,
}) => {
  const {
    primaryEntity,
    entityType,
    consistencyScore,
    consistencyDetails,
    entityGraph,
  } = entitySummary;

  const desc =
    entityGraph?.primaryEntity?.description ||
    'No explicit schema description found.';

  const associatedName =
    entitySummary.associatedEntities?.[0] ||
    (entityType === 'Person'
      ? entityGraph?.relationships?.find((r) => r.type === 'founder' || r.type === 'parent')?.value || 'SkyDevLab'
      : entityGraph?.relationships?.find((r) => r.type === 'founder')?.value || 'Not explicitly declared');

  const consistencyMetrics = [
    {
      label: 'Name Consistency',
      score: consistencyDetails.nameConsistencyScore,
    },
    {
      label: 'Description Consistency',
      score: consistencyDetails.descriptionConsistencyScore,
    },
    {
      label: 'Type & URL Match',
      score: consistencyDetails.typeConsistencyScore,
    },
    {
      label: 'Identity Links (sameAs)',
      score: consistencyDetails.identityLinksScore,
    },
  ];

  return (
    <div className="w-full bg-white dark:bg-surface border border-slate-200 dark:border-slate-800 rounded-xl p-6 sm:p-7 shadow-sm mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-5 border-b border-slate-200 dark:border-slate-800 gap-2">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider font-mono">
            ENTITY PROFILE
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Core entity attribution and identity signals discovered across web surfaces.
          </p>
        </div>

        <div className="flex items-center space-x-2 text-xs font-mono">
          <span className="text-slate-500 dark:text-slate-400">Identity Signals:</span>
          <span className="font-bold text-brand-600 dark:text-brand-400">
            {consistencyScore} / 100
          </span>
        </div>
      </div>

      {/* Grid: Primary Entity Meta */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 mb-5">
        <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800">
          <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400 font-bold block mb-1">
            PRIMARY ENTITY
          </span>
          <div className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center space-x-1.5 truncate">
            <User className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400 flex-shrink-0" />
            <span className="truncate">{primaryEntity}</span>
          </div>
        </div>

        <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800">
          <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400 font-bold block mb-1">
            TYPE
          </span>
          <div className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center space-x-1.5 truncate">
            <Building className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
            <span className="truncate">{entityType}</span>
          </div>
        </div>

        <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800">
          <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400 font-bold block mb-1">
            ASSOCIATED PERSON / BRAND
          </span>
          <div className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center space-x-1.5 truncate">
            <Globe className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400 flex-shrink-0" />
            <span className="truncate">{associatedName}</span>
          </div>
        </div>
      </div>

      {/* Description Snippet */}
      <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 mb-5">
        <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400 font-bold block mb-1">
          DETECTED DESCRIPTION
        </span>
        <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-sans">
          &ldquo;{desc}&rdquo;
        </p>
      </div>

      {/* Consistency Metrics Grid */}
      <div>
        <h4 className="text-[11px] font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400 font-semibold mb-2.5">
          SIGNAL CONSISTENCY
        </h4>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
          {consistencyMetrics.map((m, idx) => (
            <div
              key={idx}
              className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-medium text-slate-700 dark:text-slate-300 truncate">
                  {m.label}
                </span>
                <span className="text-xs font-mono font-bold text-slate-900 dark:text-white pl-1">
                  {m.score}%
                </span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-1 overflow-hidden">
                <div
                  className="h-1 rounded-full bg-brand-600 dark:bg-brand-500"
                  style={{ width: `${m.score}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
