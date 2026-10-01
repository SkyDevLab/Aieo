'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Cpu, RotateCcw, Share2, Check } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';
import { analytics } from '@/lib/analytics';

export const Header: React.FC = () => {
  const [copied, setCopied] = useState(false);

  const handleShare = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      analytics.shareReportClicked('copy_link');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <header className="border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        {/* Left Side: Branding */}
        <Link
          href="/"
          className="flex items-center space-x-2.5 group focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 rounded-lg p-1 -ml-1"
          aria-label="Website AIEO Checker - Home"
        >
          <div className="w-7 h-7 rounded-lg bg-brand-600 dark:bg-brand-500 flex items-center justify-center text-white shadow-sm flex-shrink-0">
            <Cpu className="w-4 h-4" />
          </div>
          <div className="flex flex-col sm:flex-row sm:items-baseline sm:space-x-2">
            <span className="text-sm sm:text-base font-bold tracking-tight text-slate-900 dark:text-white">
              Website AIEO Checker
            </span>
            <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400">
              Built by SkyDevLab
            </span>
          </div>
        </Link>

        {/* Right Side: New Audit, Share, Theme Toggle */}
        <div className="flex items-center space-x-2 sm:space-x-3 text-xs">
          <Link
            href="/"
            className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium transition-colors flex items-center space-x-1.5 shadow-sm"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden sm:inline">New Audit</span>
          </Link>

          <button
            type="button"
            onClick={handleShare}
            className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium transition-colors flex items-center space-x-1.5 shadow-sm"
            aria-label="Share current audit URL"
          >
            {copied ? (
              <Check className="w-3.5 h-3.5 text-emerald-500" />
            ) : (
              <Share2 className="w-3.5 h-3.5 text-slate-500" />
            )}
            <span>{copied ? 'Copied' : 'Share'}</span>
          </button>

          {/* Theme Toggle Button */}
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
};
