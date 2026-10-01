'use client';

import React from 'react';
import { History, TrendingUp, Lock } from 'lucide-react';

export interface HistoricalAuditPoint {
  date: string;
  score: number;
  crawlability?: number;
  content?: number;
  structuredData?: number;
  entity?: number;
  answerReadiness?: number;
}

interface ScoreTrendGraphProps {
  history?: HistoricalAuditPoint[];
}

export const ScoreTrendGraph: React.FC<ScoreTrendGraphProps> = ({
  history = [],
}) => {
  // If no actual historical audit data exists, render clean placeholder as specified
  if (!history || history.length < 2) {
    return (
      <div className="w-full bg-slate-50/60 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-800 rounded-xl p-4 sm:p-5 mb-6 text-slate-500 text-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-400 border border-slate-200 dark:border-slate-700 flex-shrink-0">
              <History className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h4 className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider font-mono">
                  AUDIT HISTORY
                </h4>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 flex items-center space-x-1">
                  <Lock className="w-2.5 h-2.5" />
                  <span>Future Feature</span>
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Historical comparison will be available when audit history is enabled.
              </p>
            </div>
          </div>

          <span className="text-[11px] font-mono text-slate-400">
            Single Session Mode
          </span>
        </div>
      </div>
    );
  }

  // Future renderer: Accessible SVG Line Chart (Active only when real history points exist)
  const width = 600;
  const height = 180;
  const padding = 25;
  const minScore = 0;
  const maxScore = 100;

  const points = history.map((pt, idx) => {
    const x = padding + (idx / (history.length - 1)) * (width - 2 * padding);
    const y = height - padding - (pt.score / (maxScore - minScore)) * (height - 2 * padding);
    return { x, y, ...pt };
  });

  const pathStr = points.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

  return (
    <div className="w-full bg-white dark:bg-surface border border-slate-200 dark:border-slate-800 rounded-xl p-5 sm:p-6 shadow-sm mb-6">
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200 dark:border-slate-800">
        <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider font-mono flex items-center space-x-1.5">
          <TrendingUp className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
          <span>AIEO SCORE OVER TIME</span>
        </h3>
      </div>

      <div className="w-full overflow-x-auto">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full max-w-[600px] h-auto select-none"
          role="img"
          aria-label="AIEO Score trend over time"
        >
          {[0, 25, 50, 75, 100].map((val) => {
            const y = height - padding - (val / 100) * (height - 2 * padding);
            return (
              <g key={`y-${val}`}>
                <line
                  x1={padding}
                  y1={y}
                  x2={width - padding}
                  y2={y}
                  className="stroke-slate-200 dark:stroke-slate-800"
                  strokeWidth="1"
                  strokeDasharray="2,2"
                />
                <text
                  x={padding - 6}
                  y={y + 3}
                  textAnchor="end"
                  className="fill-slate-400 text-[9px] font-mono"
                >
                  {val}
                </text>
              </g>
            );
          })}

          <path
            d={pathStr}
            fill="none"
            className="stroke-brand-600 dark:stroke-brand-400"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {points.map((p, idx) => (
            <circle
              key={idx}
              cx={p.x}
              cy={p.y}
              r="3.5"
              className="fill-white dark:fill-slate-900 stroke-brand-600 dark:stroke-brand-400"
              strokeWidth="2"
            />
          ))}
        </svg>
      </div>
    </div>
  );
};
