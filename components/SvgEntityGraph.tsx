'use client';

import React from 'react';
import { Fingerprint } from 'lucide-react';
import { EntityGraph } from '@/lib/audit/types';

interface SvgEntityGraphProps {
  entityGraph?: EntityGraph;
}

export const SvgEntityGraph: React.FC<SvgEntityGraphProps> = ({ entityGraph }) => {
  if (!entityGraph || !entityGraph.primaryEntity || !entityGraph.primaryEntity.name) {
    return (
      <div className="w-full p-8 text-center rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 text-slate-500 text-xs">
        <Fingerprint className="w-6 h-6 text-slate-400 mx-auto mb-2 opacity-60" />
        <p className="font-semibold text-slate-700 dark:text-slate-300">
          Not enough relationship data detected.
        </p>
      </div>
    );
  }

  const primaryName = entityGraph.primaryEntity.name;
  const primaryType = entityGraph.primaryEntity.type || 'Entity';

  const rawCaps = entityGraph.capabilities || [];
  const cleanProjects = Array.from(
    new Set(
      rawCaps.filter(
        (c) =>
          c &&
          c.length > 2 &&
          !['SOFTWARE', 'ENGINEER', 'SELECTED', 'WORK', 'HOME'].includes(c.toUpperCase())
      )
    )
  ).slice(0, 4);

  const authorityProfiles = (entityGraph.primaryEntity.sameAs || [])
    .map((url) => {
      try {
        const u = new URL(url);
        if (u.hostname.includes('github.com')) return { name: 'GitHub', url };
        if (u.hostname.includes('linkedin.com')) return { name: 'LinkedIn', url };
        if (u.hostname.includes('twitter.com') || u.hostname.includes('x.com')) return { name: 'X', url };
        return { name: u.hostname.replace('www.', ''), url };
      } catch {
        return null;
      }
    })
    .filter((p): p is { name: string; url: string } => p !== null)
    .slice(0, 3);

  const hasRelationships =
    cleanProjects.length > 0 ||
    authorityProfiles.length > 0 ||
    Boolean(entityGraph.industry) ||
    (entityGraph.relationships && entityGraph.relationships.length > 0);

  if (!hasRelationships) {
    return (
      <div className="w-full p-8 text-center rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 text-slate-500 text-xs">
        <Fingerprint className="w-6 h-6 text-slate-400 mx-auto mb-2 opacity-60" />
        <p className="font-semibold text-slate-700 dark:text-slate-300">
          Not enough relationship data detected.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full bg-white dark:bg-surface border border-slate-200 dark:border-slate-800 rounded-xl p-6 sm:p-7 shadow-sm mb-6">
      <div className="pb-3 mb-5 border-b border-slate-200 dark:border-slate-800">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider font-mono">
          ENTITY RELATIONSHIP GRAPH
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Deterministic relationship nodes detected between entity, domain, projects, and profiles.
        </p>
      </div>

      {/* SVG Canvas - Thin lines, subtle borders, no neon glow */}
      <div className="relative w-full overflow-x-auto py-2 flex justify-center">
        <svg
          viewBox="0 0 700 320"
          className="w-full max-w-[700px] min-w-[560px] h-auto select-none"
          role="img"
          aria-label={`Entity graph for ${primaryName} (${primaryType})`}
        >
          {/* Connectors from Root (350, 50) */}
          <path
            d="M 350 65 C 350 110, 140 110, 140 150"
            fill="none"
            className="stroke-slate-300 dark:stroke-slate-700"
            strokeWidth="1.25"
          />
          <path
            d="M 350 65 L 350 150"
            fill="none"
            className="stroke-slate-300 dark:stroke-slate-700"
            strokeWidth="1.25"
          />
          <path
            d="M 350 65 C 350 110, 560 110, 560 150"
            fill="none"
            className="stroke-slate-300 dark:stroke-slate-700"
            strokeWidth="1.25"
          />

          {/* Connectors from Projects (350, 195) to Project items */}
          {cleanProjects.length > 0 && (
            <>
              <path
                d="M 350 195 C 350 225, 270 225, 270 250"
                fill="none"
                className="stroke-slate-300 dark:stroke-slate-700"
                strokeWidth="1.25"
              />
              <path
                d="M 350 195 C 350 225, 430 225, 430 250"
                fill="none"
                className="stroke-slate-300 dark:stroke-slate-700"
                strokeWidth="1.25"
              />
            </>
          )}

          {/* Root Node: Primary Entity (350, 40) */}
          <g>
            <rect
              x="250"
              y="15"
              width="200"
              height="50"
              rx="8"
              className="fill-white dark:fill-slate-900 stroke-brand-600 dark:stroke-brand-500"
              strokeWidth="1.5"
            />
            <text
              x="350"
              y="37"
              textAnchor="middle"
              className="fill-slate-900 dark:fill-white"
              fontSize="13"
              fontWeight="bold"
              fontFamily="sans-serif"
            >
              {primaryName.length > 22 ? `${primaryName.slice(0, 20)}...` : primaryName}
            </text>
            <text
              x="350"
              y="53"
              textAnchor="middle"
              className="fill-slate-500 dark:fill-slate-400"
              fontSize="10"
              fontFamily="monospace"
            >
              {primaryType}
            </text>
          </g>

          {/* Level 2 Left: Industry & Context (140, 150) */}
          <g>
            <rect
              x="45"
              y="150"
              width="190"
              height="45"
              rx="6"
              className="fill-white dark:fill-slate-900 stroke-slate-300 dark:stroke-slate-700"
              strokeWidth="1"
            />
            <text
              x="140"
              y="168"
              textAnchor="middle"
              className="fill-slate-500 dark:fill-slate-400"
              fontSize="9"
              fontWeight="bold"
              fontFamily="monospace"
            >
              INDUSTRY / SECTOR
            </text>
            <text
              x="140"
              y="183"
              textAnchor="middle"
              className="fill-slate-900 dark:fill-slate-100"
              fontSize="11"
              fontWeight="600"
              fontFamily="sans-serif"
            >
              {entityGraph.industry || 'Technology'}
            </text>
          </g>

          {/* Level 2 Center: Projects Hub (350, 150) */}
          <g>
            <rect
              x="255"
              y="150"
              width="190"
              height="45"
              rx="6"
              className="fill-white dark:fill-slate-900 stroke-slate-300 dark:stroke-slate-700"
              strokeWidth="1"
            />
            <text
              x="350"
              y="168"
              textAnchor="middle"
              className="fill-slate-500 dark:fill-slate-400"
              fontSize="9"
              fontWeight="bold"
              fontFamily="monospace"
            >
              PROJECTS & CAPABILITIES
            </text>
            <text
              x="350"
              y="183"
              textAnchor="middle"
              className="fill-slate-900 dark:fill-slate-100"
              fontSize="11"
              fontWeight="600"
              fontFamily="sans-serif"
            >
              {cleanProjects.length > 0 ? `${cleanProjects.length} Verified Projects` : 'Core Products'}
            </text>
          </g>

          {/* Level 2 Right: Authority Links (560, 150) */}
          <g>
            <rect
              x="465"
              y="150"
              width="190"
              height="45"
              rx="6"
              className="fill-white dark:fill-slate-900 stroke-slate-300 dark:stroke-slate-700"
              strokeWidth="1"
            />
            <text
              x="560"
              y="168"
              textAnchor="middle"
              className="fill-slate-500 dark:fill-slate-400"
              fontSize="9"
              fontWeight="bold"
              fontFamily="monospace"
            >
              PROFILES & SAMEAS
            </text>
            <text
              x="560"
              y="183"
              textAnchor="middle"
              className="fill-slate-900 dark:fill-slate-100"
              fontSize="11"
              fontWeight="600"
              fontFamily="sans-serif"
            >
              {authorityProfiles.map((p) => p.name).join(' · ') || 'Verified Profiles'}
            </text>
          </g>

          {/* Level 3: Projects Sub-nodes */}
          {cleanProjects.length > 0 && (
            <>
              <g>
                <rect
                  x="195"
                  y="250"
                  width="150"
                  height="36"
                  rx="6"
                  className="fill-slate-50 dark:fill-slate-800/80 stroke-slate-200 dark:stroke-slate-700"
                  strokeWidth="1"
                />
                <text
                  x="270"
                  y="273"
                  textAnchor="middle"
                  className="fill-slate-800 dark:fill-slate-200"
                  fontSize="10"
                  fontFamily="sans-serif"
                >
                  {cleanProjects[0].length > 18 ? `${cleanProjects[0].slice(0, 16)}...` : cleanProjects[0]}
                </text>
              </g>

              <g>
                <rect
                  x="355"
                  y="250"
                  width="150"
                  height="36"
                  rx="6"
                  className="fill-slate-50 dark:fill-slate-800/80 stroke-slate-200 dark:stroke-slate-700"
                  strokeWidth="1"
                />
                <text
                  x="430"
                  y="273"
                  textAnchor="middle"
                  className="fill-slate-800 dark:fill-slate-200"
                  fontSize="10"
                  fontFamily="sans-serif"
                >
                  {cleanProjects[1]
                    ? cleanProjects[1].length > 18
                      ? `${cleanProjects[1].slice(0, 16)}...`
                      : cleanProjects[1]
                    : 'Tools'}
                </text>
              </g>
            </>
          )}
        </svg>
      </div>

      {/* Accessible Text Representation */}
      <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800">
        <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400 font-bold block mb-1">
          ACCESSIBLE TEXT EQUIVALENT
        </span>
        <ul className="text-xs text-slate-600 dark:text-slate-400 space-y-0.5 list-disc list-inside">
          <li>
            Primary Entity: <strong className="text-slate-900 dark:text-slate-200">{primaryName}</strong> ({primaryType})
          </li>
          <li>Industry: {entityGraph.industry || 'Technology'}</li>
          {cleanProjects.length > 0 && <li>Discovered Projects: {cleanProjects.join(', ')}</li>}
          {authorityProfiles.length > 0 && <li>Profiles: {authorityProfiles.map((p) => p.name).join(', ')}</li>}
        </ul>
      </div>
    </div>
  );
};
