'use client';

import React, { useState } from 'react';
import { Boxes, CheckCircle2, FileJson } from 'lucide-react';
import { AuditReport } from '@/lib/audit/types';

interface SchemaRelationshipTreeProps {
  score: number;
  detectedSchemas: string[];
  report: AuditReport;
}

export const SchemaRelationshipTree: React.FC<SchemaRelationshipTreeProps> = ({
  score,
  detectedSchemas,
  report,
}) => {
  const [selectedType, setSelectedType] = useState<string>(
    detectedSchemas[0] || 'Person'
  );

  const getPropertiesForType = (type: string): Record<string, unknown> => {
    if (type.toLowerCase() === 'person') {
      return {
        '@context': 'https://schema.org',
        '@type': 'Person',
        name: report.entityGraph?.primaryEntity?.name || 'Surya Pratap Singh',
        description: report.entityGraph?.primaryEntity?.description || 'Software Builder',
        url: report.entityGraph?.primaryEntity?.url || report.url,
        sameAs: report.entityGraph?.primaryEntity?.sameAs || [],
      };
    }
    if (type.toLowerCase() === 'organization') {
      return {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: report.entitySummary?.primaryEntity || 'Organization',
        url: report.url,
      };
    }
    if (type.toLowerCase() === 'website') {
      return {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: report.technicalEvidence?.title || 'WebSite',
        url: report.url,
      };
    }
    if (type.toLowerCase() === 'softwareapplication') {
      return {
        '@context': 'https://schema.org',
        '@type': 'SoftwareApplication',
        name: report.entitySummary?.primaryEntity || 'Software Application',
        applicationCategory: 'BusinessApplication',
      };
    }
    return {
      '@type': type,
      status: 'Declared in document JSON-LD',
      target: report.url,
    };
  };

  const selectedProps = getPropertiesForType(selectedType);

  return (
    <div className="w-full bg-white dark:bg-surface border border-slate-200 dark:border-slate-800 rounded-xl p-6 sm:p-7 shadow-sm mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-5 border-b border-slate-200 dark:border-slate-800 gap-2">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider font-mono">
            STRUCTURED DATA
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Schema.org semantic hierarchy and machine-readable JSON-LD entities.
          </p>
        </div>

        <div className="flex items-baseline space-x-1 font-mono text-slate-900 dark:text-white">
          <span className="text-xl font-bold">{score}</span>
          <span className="text-xs text-slate-400">/ 100</span>
        </div>
      </div>

      {/* Detected Types */}
      <div className="mb-5">
        <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400 font-semibold block mb-2">
          DETECTED SCHEMA TYPES
        </span>
        <div className="flex items-center flex-wrap gap-2">
          {detectedSchemas.length === 0 ? (
            <span className="text-xs text-slate-400 italic">No JSON-LD schemas detected.</span>
          ) : (
            detectedSchemas.map((schema) => (
              <button
                key={schema}
                type="button"
                onClick={() => setSelectedType(schema)}
                className={`px-2.5 py-1 rounded-md text-xs font-mono font-medium flex items-center space-x-1.5 transition-colors ${
                  selectedType === schema
                    ? 'bg-brand-600 text-white shadow-sm'
                    : 'bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                <span>{schema}</span>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Tree + Property Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Schema Linking Topology */}
        <div className="lg:col-span-5 p-4 rounded-lg bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 space-y-3 font-mono text-xs">
          <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400 font-semibold block">
            SCHEMA LINKING HIERARCHY
          </span>

          <div className="space-y-1.5">
            {detectedSchemas.map((schema, idx) => {
              const isLast = idx === detectedSchemas.length - 1;
              const isSelected = selectedType === schema;

              return (
                <div key={schema} className="space-y-1.5">
                  <button
                    type="button"
                    onClick={() => setSelectedType(schema)}
                    className={`w-full p-2.5 rounded border text-left flex items-center justify-between transition-colors ${
                      isSelected
                        ? 'bg-brand-50 dark:bg-brand-950/40 border-brand-300 dark:border-brand-800 text-brand-700 dark:text-brand-300 font-semibold'
                        : 'bg-white dark:bg-slate-950/60 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <Boxes className="w-3.5 h-3.5 text-slate-500" />
                      <span>{schema}</span>
                    </div>
                    <span className="text-[10px] text-slate-400">View</span>
                  </button>

                  {!isLast && (
                    <div className="flex justify-center text-slate-400 text-xs">
                      │<br />▼
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Properties Explorer */}
        <div className="lg:col-span-7 p-4 rounded-lg bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 space-y-2 font-mono text-xs">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center space-x-1.5 text-xs text-slate-900 dark:text-white font-semibold">
              <FileJson className="w-4 h-4 text-brand-600 dark:text-brand-400" />
              <span>{selectedType} Properties</span>
            </div>
            <span className="text-[10px] text-slate-400">Extracted JSON</span>
          </div>

          <div className="bg-white dark:bg-slate-950 p-3 rounded border border-slate-200 dark:border-slate-800 text-xs overflow-x-auto">
            <pre className="text-slate-800 dark:text-slate-200 leading-relaxed font-mono">
              {JSON.stringify(selectedProps, null, 2)}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};
