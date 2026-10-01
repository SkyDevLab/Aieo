'use client';

import React from 'react';
import {
  Bot,
  FileText,
  Boxes,
  Fingerprint,
  MessageSquare,
  ArrowRight,
} from 'lucide-react';
import { AuditReport, AuditCategory } from '@/lib/audit/types';

interface CategoryScoreGridProps {
  categories: AuditReport['categories'];
  onSelectCategory: (tabId: string) => void;
}

export const CategoryScoreGrid: React.FC<CategoryScoreGridProps> = ({
  categories,
  onSelectCategory,
}) => {
  const cards = [
    {
      id: 'crawlability' as AuditCategory,
      tabId: 'technical',
      name: 'AI Crawlability',
      score: categories.crawlability.score,
      pass: categories.crawlability.statusBreakdown.pass,
      warning: categories.crawlability.statusBreakdown.warning,
      icon: Bot,
      color: '#4f46e5',
    },
    {
      id: 'content' as AuditCategory,
      tabId: 'content',
      name: 'Content Structure',
      score: categories.content.score,
      pass: categories.content.statusBreakdown.pass,
      warning: categories.content.statusBreakdown.warning,
      icon: FileText,
      color: '#10b981',
    },
    {
      id: 'structuredData' as AuditCategory,
      tabId: 'schema',
      name: 'Structured Data',
      score: categories.structuredData.score,
      pass: categories.structuredData.statusBreakdown.pass,
      warning: categories.structuredData.statusBreakdown.warning,
      icon: Boxes,
      color: '#d97706',
    },
    {
      id: 'entity' as AuditCategory,
      tabId: 'entity',
      name: 'Entity Clarity',
      score: categories.entity.score,
      pass: categories.entity.statusBreakdown.pass,
      warning: categories.entity.statusBreakdown.warning,
      icon: Fingerprint,
      color: '#7c3aed',
    },
    {
      id: 'answerReadiness' as AuditCategory,
      tabId: 'evidence',
      name: 'Answer Readiness',
      score: categories.answerReadiness.score,
      pass: categories.answerReadiness.statusBreakdown.pass,
      warning: categories.answerReadiness.statusBreakdown.warning,
      icon: MessageSquare,
      color: '#0284c7',
    },
  ];

  return (
    <div className="w-full mb-6">
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3.5">
        {cards.map((card) => {
          const Icon = card.icon;

          return (
            <div
              key={card.id}
              onClick={() => onSelectCategory(card.tabId)}
              className="group p-4 rounded-xl bg-white dark:bg-surface border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-all cursor-pointer shadow-sm flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{
                      backgroundColor: `${card.color}15`,
                      color: card.color,
                    }}
                  >
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400">
                    20% wt
                  </span>
                </div>

                <h4 className="text-xs font-semibold text-slate-800 dark:text-slate-200 mb-1 truncate">
                  {card.name}
                </h4>

                <div className="flex items-baseline space-x-1 font-mono my-1">
                  <span className="text-xl font-bold text-slate-900 dark:text-white">
                    {card.score}
                  </span>
                  <span className="text-xs text-slate-400 dark:text-slate-500">
                    / 100
                  </span>
                </div>

                {/* Thin minimal progress bar */}
                <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 my-2 overflow-hidden">
                  <div
                    className="h-1.5 rounded-full transition-all duration-500"
                    style={{
                      width: `${card.score}%`,
                      backgroundColor: card.color,
                    }}
                  />
                </div>

                <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400 mb-2">
                  <span>{card.pass} passed</span>
                  {card.warning > 0 && (
                    <span className="text-amber-600 dark:text-amber-400 ml-1">
                      · {card.warning} warnings
                    </span>
                  )}
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] font-medium text-slate-500 dark:text-slate-400 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                <span>View details</span>
                <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
