'use client';

import React from 'react';
import { AuditReport } from '@/lib/audit/types';
import { ScoreRing } from './ScoreRing';
import { RadarChart } from './RadarChart';

interface HeroScoreDashboardProps {
  report: AuditReport;
}

export const HeroScoreDashboard: React.FC<HeroScoreDashboardProps> = ({
  report,
}) => {
  const { score, categories, rating } = report;

  // Generate dynamic, measured description strictly based on actual category scores
  const generateDynamicSummary = () => {
    const strongList: string[] = [];
    const oppList: string[] = [];

    const catMapping: Record<string, string> = {
      crawlability: 'crawlability',
      content: 'content structure',
      structuredData: 'structured data',
      entity: 'entity clarity',
      answerReadiness: 'answer coverage',
    };

    if (categories.crawlability.score >= 80) strongList.push(catMapping.crawlability);
    else oppList.push(catMapping.crawlability);

    if (categories.content.score >= 80) strongList.push(catMapping.content);
    else oppList.push(catMapping.content);

    if (categories.structuredData.score >= 80) strongList.push(catMapping.structuredData);
    else oppList.push(catMapping.structuredData);

    if (categories.entity.score >= 80) strongList.push(catMapping.entity);
    else oppList.push(catMapping.entity);

    if (categories.answerReadiness.score >= 80) strongList.push(catMapping.answerReadiness);
    else oppList.push(catMapping.answerReadiness);

    if (strongList.length > 0 && oppList.length > 0) {
      const strongStr =
        strongList.length === 1
          ? strongList[0]
          : `${strongList.slice(0, -1).join(', ')} and ${strongList[strongList.length - 1]}`;
      const oppStr =
        oppList.length === 1
          ? oppList[0]
          : `${oppList.slice(0, -1).join(', ')} and ${oppList[oppList.length - 1]}`;
      return `Your website presents strong ${strongStr}, with opportunities to improve ${oppStr}.`;
    }

    if (strongList.length === 5) {
      return 'Your website demonstrates comprehensive technical readiness across all five audit pillars with robust semantic signals.';
    }

    return 'Your website presents foundational web signals with key opportunities to improve crawlability, schema clarity, and answer readiness.';
  };

  const dynamicDescription = generateDynamicSummary();

  return (
    <div className="w-full rounded-xl bg-white dark:bg-surface border border-slate-200 dark:border-slate-800 p-6 sm:p-7 shadow-sm mb-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Left Column: AIEO Readiness + Score Ring + Summary */}
        <div className="lg:col-span-5 flex flex-col items-center sm:items-start text-center sm:text-left space-y-4">
          <div className="space-y-1">
            <span className="text-[11px] uppercase font-mono tracking-wider text-slate-500 dark:text-slate-400 font-semibold block">
              AIEO READINESS
            </span>
            <div className="text-xs text-slate-500 dark:text-slate-400">
              Technical + Semantic Readiness
            </div>
          </div>

          {/* Minimal Score Ring */}
          <div className="py-1">
            <ScoreRing score={score} size={150} strokeWidth={9} />
          </div>

          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-normal max-w-sm">
            {dynamicDescription}
          </p>
        </div>

        {/* Right Column: Radar Chart */}
        <div className="lg:col-span-7 flex flex-col justify-center border-t lg:border-t-0 lg:border-l border-slate-200 dark:border-slate-800 pt-6 lg:pt-0 lg:pl-8">
          <div className="mb-3 text-left">
            <span className="text-[11px] font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400 font-semibold block">
              PILLAR DISTRIBUTION
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Comparative scores across all 5 evaluation dimensions
            </span>
          </div>

          <RadarChart
            scores={{
              crawlability: categories.crawlability.score,
              content: categories.content.score,
              structuredData: categories.structuredData.score,
              entity: categories.entity.score,
              answerReadiness: categories.answerReadiness.score,
            }}
          />
        </div>
      </div>
    </div>
  );
};
