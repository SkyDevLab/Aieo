'use client';

import React, { useState } from 'react';
import {
  Terminal,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
} from 'lucide-react';
import { TechnicalEvidence } from '@/lib/audit/types';

interface TechnicalEvidenceSectionProps {
  evidence: TechnicalEvidence;
  defaultExpanded?: boolean;
}

export const TechnicalEvidenceSection: React.FC<TechnicalEvidenceSectionProps> = ({
  evidence,
  defaultExpanded = false,
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [copied, setCopied] = useState(false);

  const copyRaw = () => {
    navigator.clipboard.writeText(JSON.stringify(evidence, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-xl bg-white dark:bg-surface border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden transition-all">
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-3 focus:outline-none"
        aria-expanded={isExpanded}
      >
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 flex-shrink-0">
            <Terminal className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                TECHNICAL EVIDENCE
              </h3>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                Raw Metrics
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Verified low-level HTTP headers, crawling signals, and document attributes.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3 flex-shrink-0">
          <span className="text-xs font-mono text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
            HTTP {evidence.httpStatus}
          </span>
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 text-slate-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-400" />
          )}
        </div>
      </button>

      {isExpanded && (
        <div className="p-4 sm:p-5 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 space-y-4 text-xs font-mono">
          <div className="flex justify-end">
            <button
              type="button"
              onClick={copyRaw}
              className="px-2.5 py-1 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-[11px] text-slate-700 dark:text-slate-300 flex items-center space-x-1.5 transition-colors shadow-sm"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
              <span>{copied ? 'Copied' : 'Copy JSON'}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
              <span className="text-slate-400 dark:text-slate-500 text-[10px] block uppercase font-sans">Final URL</span>
              <span className="text-slate-900 dark:text-slate-200 text-xs break-all block">{evidence.finalUrl}</span>
            </div>

            <div className="p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
              <span className="text-slate-400 dark:text-slate-500 text-[10px] block uppercase font-sans">Canonical URL</span>
              <span className="text-slate-900 dark:text-slate-200 text-xs break-all block">{evidence.canonicalUrl || 'None'}</span>
            </div>

            <div className="p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
              <span className="text-slate-400 dark:text-slate-500 text-[10px] block uppercase font-sans">HTTP Response Status</span>
              <span className="text-slate-900 dark:text-slate-200 text-xs block">HTTP {evidence.httpStatus} ({evidence.isHttps ? 'HTTPS' : 'HTTP'}) • {evidence.redirectCount} redirects</span>
            </div>

            <div className="p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
              <span className="text-slate-400 dark:text-slate-500 text-[10px] block uppercase font-sans">Robots.txt & Sitemap</span>
              <span className="text-slate-900 dark:text-slate-200 text-xs block">Robots: HTTP {evidence.robotsStatus} • Sitemap: HTTP {evidence.sitemapStatus}</span>
            </div>

            <div className="p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
              <span className="text-slate-400 dark:text-slate-500 text-[10px] block uppercase font-sans">HTML Document Title</span>
              <span className="text-slate-900 dark:text-slate-200 text-xs block truncate">{evidence.title || 'None'}</span>
            </div>

            <div className="p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
              <span className="text-slate-400 dark:text-slate-500 text-[10px] block uppercase font-sans">Primary H1 Heading</span>
              <span className="text-slate-900 dark:text-slate-200 text-xs block truncate">{evidence.h1 || 'None'}</span>
            </div>

            <div className="p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
              <span className="text-slate-400 dark:text-slate-500 text-[10px] block uppercase font-sans">Detected JSON-LD Types</span>
              <span className="text-slate-900 dark:text-slate-200 text-xs block">{evidence.jsonLdTypes.join(', ') || 'None'}</span>
            </div>

            <div className="p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
              <span className="text-slate-400 dark:text-slate-500 text-[10px] block uppercase font-sans">Size & Language</span>
              <span className="text-slate-900 dark:text-slate-200 text-xs block">{(evidence.contentLengthBytes / 1024).toFixed(1)} KB HTML • {evidence.wordCount} words • {evidence.textToHtmlRatio}% ratio • lang={JSON.stringify(evidence.language || 'none')}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
