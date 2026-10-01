'use client';

import React from 'react';
import {
  LayoutDashboard,
  AlertTriangle,
  Fingerprint,
  FileText,
  Boxes,
  Cpu,
  FileCode,
} from 'lucide-react';

export type DashboardTabId =
  | 'overview'
  | 'issues'
  | 'entity'
  | 'content'
  | 'schema'
  | 'technical'
  | 'evidence';

interface DashboardTabsProps {
  activeTab: DashboardTabId;
  onSelectTab: (tab: DashboardTabId) => void;
  issuesCount: number;
  warningsCount: number;
}

export const DashboardTabs: React.FC<DashboardTabsProps> = ({
  activeTab,
  onSelectTab,
  issuesCount,
  warningsCount,
}) => {
  const tabs: {
    id: DashboardTabId;
    label: string;
    icon: React.ElementType;
    badge?: number;
  }[] = [
    {
      id: 'overview',
      label: 'Overview',
      icon: LayoutDashboard,
    },
    {
      id: 'issues',
      label: 'Issues',
      icon: AlertTriangle,
      badge: issuesCount + warningsCount,
    },
    {
      id: 'entity',
      label: 'Entity',
      icon: Fingerprint,
    },
    {
      id: 'content',
      label: 'Content',
      icon: FileText,
    },
    {
      id: 'schema',
      label: 'Schema',
      icon: Boxes,
    },
    {
      id: 'technical',
      label: 'Technical',
      icon: Cpu,
    },
    {
      id: 'evidence',
      label: 'Evidence',
      icon: FileCode,
    },
  ];

  return (
    <div className="w-full mb-6 sticky top-14 z-40 bg-slate-50/90 dark:bg-slate-950/90 backdrop-blur-md py-1 border-b border-slate-200 dark:border-slate-800">
      <nav
        className="flex items-center space-x-1 sm:space-x-2 overflow-x-auto no-scrollbar py-1"
        aria-label="Report navigation"
      >
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onSelectTab(tab.id)}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors flex-shrink-0 ${
                isActive
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-800/60'
              }`}
            >
              <Icon className="w-3.5 h-3.5 flex-shrink-0" />
              <span>{tab.label}</span>
              {tab.badge !== undefined && tab.badge > 0 && (
                <span
                  className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full font-bold ml-1 ${
                    isActive
                      ? 'bg-white/20 dark:bg-slate-900/20 text-white dark:text-slate-900'
                      : 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300'
                  }`}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
};
