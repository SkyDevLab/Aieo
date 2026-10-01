'use client';

import React from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  FileCode,
  Globe,
  Server,
  FileText,
  Search,
} from 'lucide-react';
import { AuditReport } from '@/lib/audit/types';

interface TechnicalDashboardProps {
  report: AuditReport;
}

export const TechnicalDashboard: React.FC<TechnicalDashboardProps> = ({
  report,
}) => {
  const { technicalEvidence, llmsTxtStatus, categories } = report;

  const cards = [
    {
      label: 'HTTPS',
      value: technicalEvidence?.isHttps ? '✓ Enabled' : '✕ Insecure',
      isPass: technicalEvidence?.isHttps,
      detail: technicalEvidence?.isHttps ? 'TLS active' : 'Plain HTTP',
      icon: ShieldCheck,
    },
    {
      label: 'HTTP Status',
      value: `${technicalEvidence?.httpStatus || 200}`,
      isPass: technicalEvidence?.httpStatus === 200,
      detail: `${technicalEvidence?.redirectCount || 0} redirects`,
      icon: Server,
    },
    {
      label: 'Canonical',
      value: technicalEvidence?.canonicalUrl ? '✓ Valid' : '⚠ Missing',
      isPass: Boolean(technicalEvidence?.canonicalUrl),
      detail: technicalEvidence?.canonicalUrl ? 'Self-referential' : 'Not set',
      icon: CheckCircle2,
    },
    {
      label: 'Robots.txt',
      value: technicalEvidence?.robotsStatus === 200 ? '✓ Found' : '⚠ Not Found',
      isPass: technicalEvidence?.robotsStatus === 200,
      detail: `HTTP ${technicalEvidence?.robotsStatus || 404}`,
      icon: FileText,
    },
    {
      label: 'Sitemap',
      value: technicalEvidence?.sitemapStatus === 200 ? '✓ Found' : '⚠ Not Found',
      isPass: technicalEvidence?.sitemapStatus === 200,
      detail: `HTTP ${technicalEvidence?.sitemapStatus || 404}`,
      icon: Globe,
    },
    {
      label: 'Indexability',
      value: technicalEvidence?.metaRobots?.includes('noindex') ? '✕ Blocked' : '✓ Available',
      isPass: !technicalEvidence?.metaRobots?.includes('noindex'),
      detail: technicalEvidence?.metaRobots || 'Indexable',
      icon: Search,
    },
    {
      label: 'Language',
      value: technicalEvidence?.language ? technicalEvidence.language.toUpperCase() : 'Not Set',
      isPass: Boolean(technicalEvidence?.language),
      detail: technicalEvidence?.language ? `lang="${technicalEvidence.language}"` : 'Missing lang',
      icon: Globe,
    },
    {
      label: 'llms.txt',
      value: llmsTxtStatus.standardExists || llmsTxtStatus.fullExists
        ? '✓ Declared'
        : 'Not detected',
      isPass: null, // Informational
      detail: 'Optional convention — not detected.',
      icon: FileCode,
    },
  ];

  return (
    <div className="w-full bg-white dark:bg-surface border border-slate-200 dark:border-slate-800 rounded-xl p-6 sm:p-7 shadow-sm mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-5 border-b border-slate-200 dark:border-slate-800 gap-2">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider font-mono">
            TECHNICAL DIAGNOSTICS
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Low-level HTTP response headers, crawling instructions, and indexing signals.
          </p>
        </div>

        <div className="flex items-baseline space-x-1 font-mono text-slate-900 dark:text-white">
          <span className="text-xl font-bold">{categories.crawlability.score}</span>
          <span className="text-xs text-slate-400">/ 100</span>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {cards.map((card, idx) => {
          const Icon = card.icon;

          return (
            <div
              key={idx}
              className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400 font-bold">
                    {card.label}
                  </span>
                  <Icon className="w-3.5 h-3.5 text-slate-400" />
                </div>

                <div className="text-sm font-bold font-mono text-slate-900 dark:text-white my-0.5">
                  {card.value}
                </div>
              </div>

              <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 block truncate">
                {card.detail}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
