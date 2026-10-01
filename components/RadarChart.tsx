'use client';

import React, { useState } from 'react';
import { Bot, FileText, Boxes, Fingerprint, MessageSquare } from 'lucide-react';

interface RadarDimension {
  id: string;
  name: string;
  score: number;
  icon: React.ElementType;
  color: string;
}

interface RadarChartProps {
  scores: {
    crawlability: number;
    content: number;
    structuredData: number;
    entity: number;
    answerReadiness: number;
  };
}

export const RadarChart: React.FC<RadarChartProps> = ({ scores }) => {
  const [activeDimension, setActiveDimension] = useState<string | null>(null);

  const dimensions: RadarDimension[] = [
    {
      id: 'crawlability',
      name: 'AI Crawlability',
      score: scores.crawlability,
      icon: Bot,
      color: '#4f46e5', // indigo-600
    },
    {
      id: 'content',
      name: 'Content Structure',
      score: scores.content,
      icon: FileText,
      color: '#10b981', // emerald-500
    },
    {
      id: 'structuredData',
      name: 'Structured Data',
      score: scores.structuredData,
      icon: Boxes,
      color: '#d97706', // amber-600
    },
    {
      id: 'answerReadiness',
      name: 'Answer Readiness',
      score: scores.answerReadiness,
      icon: MessageSquare,
      color: '#0284c7', // sky-600
    },
    {
      id: 'entity',
      name: 'Entity Clarity',
      score: scores.entity,
      icon: Fingerprint,
      color: '#7c3aed', // purple-600
    },
  ];

  // SVG Chart Geometry - Minimal, restrained, thin lines
  const size = 260;
  const center = size / 2;
  const radius = 90;
  const levels = [25, 50, 75, 100];
  const numAxes = dimensions.length;

  const getCoordinates = (values: number[]) => {
    return values.map((val, idx) => {
      const angle = (idx * 2 * Math.PI) / numAxes - Math.PI / 2;
      const r = (val / 100) * radius;
      const x = center + r * Math.cos(angle);
      const y = center + r * Math.sin(angle);
      return { x, y, angle };
    });
  };

  const dataPoints = getCoordinates(dimensions.map((d) => d.score));
  const polygonPointsStr = dataPoints.map((pt) => `${pt.x},${pt.y}`).join(' ');
  const outerPoints = getCoordinates(Array(numAxes).fill(100));

  return (
    <div className="w-full flex flex-col md:flex-row items-center justify-between gap-4">
      {/* Minimal SVG Radar */}
      <div className="flex items-center justify-center relative select-none">
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="max-w-[260px] max-h-[260px] overflow-visible"
          role="img"
          aria-label={`Radar chart showing AIEO scores: Crawlability ${scores.crawlability}, Content ${scores.content}, Structured Data ${scores.structuredData}, Answer Readiness ${scores.answerReadiness}, Entity Clarity ${scores.entity}`}
        >
          {/* Subtle Concentric Guide Pentagons */}
          {levels.map((level) => {
            const gridPts = getCoordinates(Array(numAxes).fill(level));
            const ptsStr = gridPts.map((p) => `${p.x},${p.y}`).join(' ');
            return (
              <polygon
                key={`grid-${level}`}
                points={ptsStr}
                fill="none"
                className="stroke-slate-200 dark:stroke-slate-800"
                strokeWidth="1"
              />
            );
          })}

          {/* Thin Spokes */}
          {outerPoints.map((pt, idx) => (
            <line
              key={`spoke-${idx}`}
              x1={center}
              y1={center}
              x2={pt.x}
              y2={pt.y}
              className="stroke-slate-200 dark:stroke-slate-800"
              strokeWidth="1"
            />
          ))}

          {/* Minimal Data Polygon with restrained fill */}
          <polygon
            points={polygonPointsStr}
            fill="#4f46e5"
            fillOpacity="0.12"
            stroke="#4f46e5"
            strokeWidth="1.75"
            strokeLinejoin="round"
            className="transition-all duration-500 ease-out"
          />

          {/* Restrained Vertex Dots */}
          {dataPoints.map((pt, idx) => {
            const dim = dimensions[idx];
            const isHovered = activeDimension === dim.id;
            return (
              <g
                key={`pt-${dim.id}`}
                className="cursor-pointer"
                onMouseEnter={() => setActiveDimension(dim.id)}
                onMouseLeave={() => setActiveDimension(null)}
                tabIndex={0}
                role="button"
                aria-label={`${dim.name}: ${dim.score}`}
                onFocus={() => setActiveDimension(dim.id)}
                onBlur={() => setActiveDimension(null)}
              >
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r={isHovered ? 4.5 : 3}
                  className="fill-white dark:fill-slate-900"
                  stroke={dim.color}
                  strokeWidth="2"
                />
              </g>
            );
          })}
        </svg>
      </div>

      {/* Accessible Values List Alongside */}
      <div className="w-full md:w-56 space-y-1.5 text-xs font-mono">
        {dimensions.map((dim) => {
          const isHovered = activeDimension === dim.id;

          return (
            <div
              key={dim.id}
              onMouseEnter={() => setActiveDimension(dim.id)}
              onMouseLeave={() => setActiveDimension(null)}
              className={`flex items-center justify-between p-1.5 px-2 rounded-md transition-colors ${
                isHovered
                  ? 'bg-slate-100 dark:bg-slate-800/80 font-semibold'
                  : 'hover:bg-slate-50 dark:hover:bg-slate-800/40 text-slate-700 dark:text-slate-300'
              }`}
            >
              <div className="flex items-center space-x-2 truncate">
                <span
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ backgroundColor: dim.color }}
                />
                <span className="truncate text-slate-800 dark:text-slate-200 text-[11px]">
                  {dim.name}
                </span>
              </div>
              <span className="font-bold text-slate-900 dark:text-white pl-2">
                {dim.score}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
