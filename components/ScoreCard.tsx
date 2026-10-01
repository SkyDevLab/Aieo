'use client';

import React, { useState } from 'react';
import {
  ShieldCheck,
  Clock,
  ExternalLink,
  Copy,
  Check,
  AlertCircle,
} from 'lucide-react';
import { AuditReport } from '@/lib/audit/types';

interface ScoreCardProps {
  report: AuditReport;
  onReset?: () => void;
}

export const ScoreCard: React.FC<ScoreCardProps> = ({ report, onReset }) => {
  const [copied, setCopied] = useState(false);

  const getScoreColor = (score: number) => {
    if (score >= 85) return 'from-emerald-500 to-teal-400 text-emerald-400';
    if (score >= 70) return 'from-indigo-500 to-cyan-400 text-indigo-400';
    if (score >= 50) return 'from-amber-500 to-orange-400 text-amber-400';
    return 'from-rose-500 to-pink-500 text-rose-400';
  };

  const getScoreBorder = (score: number) => {
    if (score >= 85) return 'border-emerald-500/30 shadow-emerald-500/5';
    if (score >= 70) return 'border-indigo-500/30 shadow-indigo-500/5';
    if (score >= 50) return 'border-amber-500/30 shadow-amber-500/5';
    return 'border-rose-500/30 shadow-rose-500/5';
  };

  const copySummary = () => {
    const summaryText = `AIEO Readiness Report for ${report.url}
Overall Readiness Score: ${report.score}/100 (${report.rating.label})
• AI Crawlability: ${report.categories.crawlability.score}/100
• Content Structure: ${report.categories.content.score}/100
• Structured Data: ${report.categories.structuredData.score}/100
• Entity Clarity: ${report.categories.entity.score}/100
• Answer Readiness: ${report.categories.answerReadiness.score}/100
Audited by AIEO Checker (SkyDevLab)`;

    navigator.clipboard.writeText(summaryText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className={`relative w-full rounded-3xl bg-surface/95 border ${getScoreBorder(
        report.score
      )} p-6 sm:p-8 md:p-10 shadow-2xl backdrop-blur-xl mb-10 overflow-hidden animate-fade-in`}
    >
      {/* Subtle background glow */}
      <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 rounded-full bg-brand-500/10 blur-3xl pointer-events-none" />

      {/* Top Bar: URL & Meta */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 mb-8 border-b border-surface-border/60 gap-4">
        <div className="min-w-0">
          <div className="flex items-center space-x-2 text-xs text-slate-400 mb-1">
            <span className="font-mono uppercase tracking-wider text-slate-400">
              Audit Target
            </span>
            <span>•</span>
            <span className="flex items-center space-x-1 font-mono">
              <Clock className="w-3 h-3 text-slate-400" />
              <span>{report.durationMs}ms</span>
            </span>
          </div>
          <a
            href={report.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-base sm:text-xl font-bold text-slate-100 hover:text-brand-300 transition-colors flex items-center space-x-2 truncate font-mono"
          >
            <span className="truncate">{report.url}</span>
            <ExternalLink className="w-4 h-4 text-slate-400 flex-shrink-0" />
          </a>
        </div>

        <div className="flex items-center space-x-3 flex-shrink-0">
          <button
            type="button"
            onClick={copySummary}
            className="px-3.5 py-2 rounded-xl bg-surface-card hover:bg-surface-hover border border-surface-border text-xs font-medium text-slate-300 transition-all flex items-center space-x-2"
          >
            {copied ? (
              <Check className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <Copy className="w-3.5 h-3.5 text-slate-400" />
            )}
            <span>{copied ? 'Copied' : 'Share Summary'}</span>
          </button>

          {onReset && (
            <button
              type="button"
              onClick={onReset}
              className="px-3.5 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-xs font-semibold text-white transition-all shadow-md shadow-brand-600/20"
            >
              Audit Another
            </button>
          )}
        </div>
      </div>

      {/* Centerpiece: Score & Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Big Score Display */}
        <div className="lg:col-span-5 flex flex-col items-center sm:items-start text-center sm:text-left">
          <span className="text-xs uppercase font-mono tracking-widest text-slate-400 font-semibold mb-2">
            AIEO READINESS SCORE
          </span>

          <div className="flex items-baseline space-x-3 my-2">
            <span
              className={`text-6xl sm:text-7xl font-extrabold tracking-tight font-mono bg-gradient-to-r ${getScoreColor(
                report.score
              )} bg-clip-text text-transparent`}
            >
              {report.score}
            </span>
            <span className="text-2xl sm:text-3xl font-mono text-slate-400 font-semibold">
              / 100
            </span>
          </div>

          <div className="flex items-center space-x-3 mt-1">
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${
                report.score >= 85
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                  : report.score >= 70
                  ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
                  : report.score >= 50
                  ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                  : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
              }`}
            >
              {report.rating.label}
            </span>
            <span className="text-xs text-slate-400">
              Technical + Semantic Readiness
            </span>
          </div>

          <p className="text-xs text-slate-300 mt-4 leading-relaxed max-w-sm">
            {report.rating.description}
          </p>
        </div>

        {/* Category Radar / Quick Matrix */}
        <div className="lg:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div className="p-3.5 rounded-xl bg-surface-card/70 border border-surface-border">
            <span className="text-[11px] text-slate-400 block truncate">AI Crawlability</span>
            <div className="text-lg font-bold font-mono text-indigo-300 mt-0.5">
              {report.categories.crawlability.score} <span className="text-xs text-slate-400">/ 100</span>
            </div>
            <span className="text-[10px] text-slate-400">20% weight</span>
          </div>

          <div className="p-3.5 rounded-xl bg-surface-card/70 border border-surface-border">
            <span className="text-[11px] text-slate-400 block truncate">Content Structure</span>
            <div className="text-lg font-bold font-mono text-emerald-300 mt-0.5">
              {report.categories.content.score} <span className="text-xs text-slate-400">/ 100</span>
            </div>
            <span className="text-[10px] text-slate-400">20% weight</span>
          </div>

          <div className="p-3.5 rounded-xl bg-surface-card/70 border border-surface-border">
            <span className="text-[11px] text-slate-400 block truncate">Structured Data</span>
            <div className="text-lg font-bold font-mono text-amber-300 mt-0.5">
              {report.categories.structuredData.score} <span className="text-xs text-slate-400">/ 100</span>
            </div>
            <span className="text-[10px] text-slate-400">20% weight</span>
          </div>

          <div className="p-3.5 rounded-xl bg-surface-card/70 border border-surface-border">
            <span className="text-[11px] text-slate-400 block truncate">Entity Clarity</span>
            <div className="text-lg font-bold font-mono text-purple-300 mt-0.5">
              {report.categories.entity.score} <span className="text-xs text-slate-400">/ 100</span>
            </div>
            <span className="text-[10px] text-slate-400">20% weight</span>
          </div>

          <div className="p-3.5 rounded-xl bg-surface-card/70 border border-surface-border">
            <span className="text-[11px] text-slate-400 block truncate">Answer Readiness</span>
            <div className="text-lg font-bold font-mono text-cyan-300 mt-0.5">
              {report.categories.answerReadiness.score} <span className="text-xs text-slate-400">/ 100</span>
            </div>
            <span className="text-[10px] text-slate-400">20% weight</span>
          </div>

          <div className="p-3.5 rounded-xl bg-surface-card/70 border border-surface-border flex flex-col justify-center">
            <span className="text-[11px] text-slate-400 block">Total Checks</span>
            <div className="text-sm font-semibold text-slate-200 mt-0.5 flex items-center space-x-1.5">
              <span className="text-emerald-400 font-mono font-bold">{report.summary.passed}✓</span>
              <span className="text-amber-400 font-mono font-bold">{report.summary.warnings}⚠</span>
              <span className="text-rose-400 font-mono font-bold">{report.summary.failures}✕</span>
            </div>
            <span className="text-[10px] text-slate-400">{report.summary.totalChecks} rules evaluated</span>
          </div>
        </div>
      </div>

      {/* Mandatory Disclaimer Box */}
      <div className="mt-8 pt-6 border-t border-surface-border/60">
        <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-400 flex items-start space-x-3">
          <AlertCircle className="w-4 h-4 text-brand-400 flex-shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <strong className="text-slate-300 font-medium">Evaluation Disclaimer: </strong>
            AIEO Checker evaluates publicly accessible technical and content signals. It does not measure or guarantee visibility, ranking, citation, or recommendation by any specific AI system (ChatGPT, Gemini, Claude, Perplexity, Google AI Overviews).
          </p>
        </div>
      </div>
    </div>
  );
};
