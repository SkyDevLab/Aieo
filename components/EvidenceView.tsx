'use client';

import React, { useState } from 'react';
import { Copy, Check, FileCode } from 'lucide-react';
import { AuditReport } from '@/lib/audit/types';

interface EvidenceViewProps {
  report: AuditReport;
}

export const EvidenceView: React.FC<EvidenceViewProps> = ({ report }) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const jsonLdPayload = {
    schemas: report.detectedSchemas,
    entityGraph: report.entityGraph,
    entitySummary: report.entitySummary,
  };

  return (
    <div className="w-full bg-white dark:bg-surface border border-slate-200 dark:border-slate-800 rounded-xl p-6 sm:p-7 shadow-sm mb-6 space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800 gap-2">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider font-mono">
            RAW AUDIT EVIDENCE
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Raw markup and structured data payloads extracted during deterministic parsing.
          </p>
        </div>

        <button
          type="button"
          onClick={() => copyText(JSON.stringify(report, null, 2), 'full')}
          className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-mono transition-colors flex items-center space-x-1.5 self-start sm:self-auto shadow-sm"
        >
          {copiedId === 'full' ? (
            <Check className="w-3.5 h-3.5 text-emerald-500" />
          ) : (
            <Copy className="w-3.5 h-3.5 text-slate-500" />
          )}
          <span>{copiedId === 'full' ? 'Copied Full Report' : 'Copy All JSON'}</span>
        </button>
      </div>

      {/* Grid: Core Text Snippets */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400 font-bold">
              PAGE TITLE
            </span>
            <button
              type="button"
              onClick={() => copyText(report.technicalEvidence?.title || '', 'title')}
              className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 text-xs"
            >
              {copiedId === 'title' ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
            </button>
          </div>
          <p className="text-xs font-mono text-slate-800 dark:text-slate-200 break-words">
            {report.technicalEvidence?.title || 'None detected'}
          </p>
        </div>

        <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400 font-bold">
              PRIMARY H1
            </span>
            <button
              type="button"
              onClick={() => copyText(report.technicalEvidence?.h1 || '', 'h1')}
              className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 text-xs"
            >
              {copiedId === 'h1' ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
            </button>
          </div>
          <p className="text-xs font-mono text-slate-800 dark:text-slate-200 break-words">
            {report.technicalEvidence?.h1 || 'None detected'}
          </p>
        </div>

        <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 space-y-1 md:col-span-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400 font-bold">
              META DESCRIPTION
            </span>
            <button
              type="button"
              onClick={() =>
                copyText(
                  report.entitySummary?.signals?.find((s) => s.source.includes('Meta Description'))?.value || '',
                  'meta'
                )
              }
              className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 text-xs"
            >
              {copiedId === 'meta' ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
            </button>
          </div>
          <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
            {report.entitySummary?.signals?.find((s) => s.source.includes('Meta Description'))?.value || 'None detected'}
          </p>
        </div>
      </div>

      {/* JSON-LD Block */}
      <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 space-y-2 font-mono text-xs">
        <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center space-x-1.5 text-slate-900 dark:text-white font-semibold">
            <FileCode className="w-4 h-4 text-brand-600 dark:text-brand-400" />
            <span>JSON-LD STRUCTURED DATA PAYLOAD</span>
          </div>
          <button
            type="button"
            onClick={() => copyText(JSON.stringify(jsonLdPayload, null, 2), 'json')}
            className="px-2 py-1 rounded bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-900 text-slate-600 dark:text-slate-300 text-[11px] flex items-center space-x-1"
          >
            {copiedId === 'json' ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
            <span>{copiedId === 'json' ? 'Copied' : 'Copy'}</span>
          </button>
        </div>

        <div className="bg-white dark:bg-slate-950 p-3 rounded border border-slate-200 dark:border-slate-800 max-h-64 overflow-y-auto">
          <pre className="text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-wrap break-all">
            {JSON.stringify(jsonLdPayload, null, 2)}
          </pre>
        </div>
      </div>

      {/* Crawl Directives & Navigation */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 text-xs font-mono">
        <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 space-y-1">
          <span className="text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400 font-bold block mb-1">
            CRAWL DIRECTIVES
          </span>
          <div className="text-slate-700 dark:text-slate-300 space-y-0.5">
            <div>Robots: {report.technicalEvidence?.robotsUrl} (HTTP {report.technicalEvidence?.robotsStatus})</div>
            <div>Sitemap: {report.technicalEvidence?.sitemapUrl} (HTTP {report.technicalEvidence?.sitemapStatus})</div>
            <div>Meta Robots: {report.technicalEvidence?.metaRobots || 'None (default: index, follow)'}</div>
          </div>
        </div>

        <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 space-y-1">
          <span className="text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400 font-bold block mb-1">
            DISCOVERED NAVIGATION LINKS
          </span>
          <div className="text-slate-700 dark:text-slate-300">
            <div>Categories: {report.informationArchitecture?.categoriesFound?.join(', ') || 'General Navigation'}</div>
            <div className="text-slate-500 mt-0.5">Internal links: {report.informationArchitecture?.totalInternalLinks || 0}</div>
          </div>
        </div>
      </div>
    </div>
  );
};
