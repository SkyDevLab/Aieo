'use client';

import React from 'react';

interface ScoreRingProps {
  score: number;
  size?: number;
  strokeWidth?: number;
}

export const ScoreRing: React.FC<ScoreRingProps> = ({
  score,
  size = 170,
  strokeWidth = 10,
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clampedScore = Math.max(0, Math.min(100, score));
  const strokeDashoffset = circumference - (clampedScore / 100) * circumference;

  // Rating brackets:
  // 0–39 = poor, 40–59 = needs improvement, 60–79 = good, 80–89 = very good, 90–100 = excellent
  const getRatingInfo = (s: number) => {
    if (s >= 90) {
      return {
        label: 'EXCELLENT',
        strokeColor: '#10b981', // emerald-500
        textColor: 'text-emerald-600 dark:text-emerald-400',
        badgeClass: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
      };
    }
    if (s >= 80) {
      return {
        label: 'VERY GOOD',
        strokeColor: '#4f46e5', // brand-600
        textColor: 'text-brand-600 dark:text-brand-400',
        badgeClass: 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800',
      };
    }
    if (s >= 60) {
      return {
        label: 'GOOD',
        strokeColor: '#0284c7', // sky-600
        textColor: 'text-sky-600 dark:text-sky-400',
        badgeClass: 'bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-800',
      };
    }
    if (s >= 40) {
      return {
        label: 'NEEDS IMPROVEMENT',
        strokeColor: '#d97706', // amber-600
        textColor: 'text-amber-600 dark:text-amber-400',
        badgeClass: 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800',
      };
    }
    return {
      label: 'POOR',
      strokeColor: '#dc2626', // red-600
      textColor: 'text-rose-600 dark:text-rose-400',
      badgeClass: 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800',
    };
  };

  const rating = getRatingInfo(clampedScore);

  return (
    <div className="relative flex flex-col items-center justify-center">
      <div
        className="relative flex items-center justify-center select-none"
        style={{ width: size, height: size }}
        role="meter"
        aria-valuenow={clampedScore}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`AIEO Readiness Score: ${clampedScore} out of 100 (${rating.label})`}
      >
        <svg
          width={size}
          height={size}
          className="rotate-[-90deg] transition-all duration-700 ease-out"
        >
          {/* Subtle track background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            className="stroke-slate-200 dark:stroke-slate-800"
            strokeWidth={strokeWidth}
            fill="transparent"
          />

          {/* Minimal progress circle without heavy neon blur */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={rating.strokeColor}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
            style={{
              transition: 'stroke-dashoffset 0.8s ease-out',
            }}
          />
        </svg>

        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
          <div className="flex items-baseline justify-center space-x-0.5">
            <span className={`text-4xl sm:text-5xl font-extrabold font-mono tracking-tight ${rating.textColor}`}>
              {clampedScore}
            </span>
            <span className="text-xs font-mono text-slate-400 dark:text-slate-500 font-medium">
              /100
            </span>
          </div>
          <span
            className={`mt-1 px-2 py-0.5 rounded text-[10px] font-bold font-mono tracking-wider border ${rating.badgeClass}`}
          >
            {rating.label}
          </span>
        </div>
      </div>
    </div>
  );
};
