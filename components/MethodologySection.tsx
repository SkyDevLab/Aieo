'use client';

import React from 'react';
import { ShieldCheck, Info, Cpu, Lock } from 'lucide-react';

export const MethodologySection: React.FC = () => {
  return (
    <div className="w-full bg-white dark:bg-surface border border-slate-200 dark:border-slate-800 rounded-xl p-6 sm:p-7 shadow-sm mb-6 space-y-5">
      <div className="pb-3 border-b border-slate-200 dark:border-slate-800">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider font-mono">
          METHODOLOGY & TRANSPARENCY
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Deterministic technical heuristics evaluating web extractability without opaque AI API dependencies.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 text-xs">
        <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 space-y-1.5">
          <div className="flex items-center space-x-1.5 text-brand-600 dark:text-brand-400 font-bold">
            <Cpu className="w-3.5 h-3.5" />
            <h4 className="font-mono uppercase tracking-wider text-[11px]">DETERMINISTIC RULES</h4>
          </div>
          <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
            All 101 rules execute server-side on live HTML, HTTP headers, robots.txt, and sitemaps with zero generative hallucinations.
          </p>
        </div>

        <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 space-y-1.5">
          <div className="flex items-center space-x-1.5 text-emerald-600 dark:text-emerald-400 font-bold">
            <ShieldCheck className="w-3.5 h-3.5" />
            <h4 className="font-mono uppercase tracking-wider text-[11px]">20% PILLAR WEIGHTS</h4>
          </div>
          <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
            Score is the balanced average of the 5 pillars: Crawlability, Content, Schema, Entity Clarity, and Answer Readiness (20 points each).
          </p>
        </div>

        <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 space-y-1.5">
          <div className="flex items-center space-x-1.5 text-sky-600 dark:text-sky-400 font-bold">
            <Lock className="w-3.5 h-3.5" />
            <h4 className="font-mono uppercase tracking-wider text-[11px]">SSRF PROTECTED</h4>
          </div>
          <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
            Network fetches block private IPs, cloud metadata endpoints (169.254.169.254), and loopback addresses.
          </p>
        </div>
      </div>

      <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 flex items-start space-x-2.5">
        <Info className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong className="text-slate-800 dark:text-slate-200 font-medium">Non-Predictive AIEO Disclaimer: </strong>
          Website AIEO Checker evaluates publicly accessible website signals. It does not measure or guarantee ranking, citation, visibility, or recommendation by any specific AI search system.
        </p>
      </div>
    </div>
  );
};
