'use client';

import React, { useState, useRef } from 'react';
import { AuditReport } from '@/lib/audit/types';
import { AuditTargetCard } from './AuditTargetCard';
import { HeroScoreDashboard } from './HeroScoreDashboard';
import { CategoryScoreGrid } from './CategoryScoreGrid';
import { ExecutiveSummary } from './ExecutiveSummary';
import { TopOpportunities } from './TopOpportunities';
import { DashboardTabs, DashboardTabId } from './DashboardTabs';
import { IssuesView } from './IssuesView';
import { SvgEntityGraph } from './SvgEntityGraph';
import { EntityProfileCard } from './EntityProfileCard';
import { EntityMap } from './EntityMap';
import { EntityIntentCoverageSection } from './EntityIntentCoverageSection';
import { ContentHierarchyTree } from './ContentHierarchyTree';
import { SchemaRelationshipTree } from './SchemaRelationshipTree';
import { TechnicalDashboard } from './TechnicalDashboard';
import { TechnicalEvidenceSection } from './TechnicalEvidenceSection';
import { AnswerCoverageGraph } from './AnswerCoverageGraph';
import { EvidenceSignalsSection } from './EvidenceSignalsSection';
import { InformationArchitectureSection } from './InformationArchitectureSection';
import { EvidenceView } from './EvidenceView';
import { ScoreTrendGraph } from './ScoreTrendGraph';
import { MethodologySection } from './MethodologySection';
import { CategoryCard } from './CategoryCard';

interface ReportProps {
  report: AuditReport;
  onReset?: () => void;
}

export const Report: React.FC<ReportProps> = ({ report, onReset }) => {
  const [activeTab, setActiveTab] = useState<DashboardTabId>('overview');
  const tabsContainerRef = useRef<HTMLDivElement>(null);

  const handleSelectTab = (tab: DashboardTabId) => {
    setActiveTab(tab);
  };

  const handleSelectFinding = () => {
    setActiveTab('issues');
    if (tabsContainerRef.current) {
      tabsContainerRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleSelectCategoryFromGrid = (tabId: string) => {
    setActiveTab(tabId as DashboardTabId);
    if (tabsContainerRef.current) {
      tabsContainerRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto py-5 sm:py-6 px-4 sm:px-6">
      {/* 1. Audit Target Card */}
      <AuditTargetCard report={report} onReset={onReset} />

      {/* 2. Hero Dashboard: Left = Score Ring & Summary, Right = Radar Chart */}
      <HeroScoreDashboard report={report} />

      {/* Anchor for tab navigation scrolling */}
      <div ref={tabsContainerRef} />

      {/* 3. Navigation Tabs */}
      <DashboardTabs
        activeTab={activeTab}
        onSelectTab={handleSelectTab}
        issuesCount={report.summary.failures}
        warningsCount={report.summary.warnings}
      />

      {/* 4. Tab Contents */}
      <div className="w-full">
        {/* TAB 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* 5 Compact Category Cards */}
            <CategoryScoreGrid
              categories={report.categories}
              onSelectCategory={handleSelectCategoryFromGrid}
            />

            {/* Executive Summary: What's Strong vs Opportunities */}
            <ExecutiveSummary report={report} />

            {/* Top Opportunities: 01, 02, 03 */}
            <TopOpportunities
              report={report}
              onSelectFinding={handleSelectFinding}
            />

            {/* Entity Overview */}
            <EntityProfileCard entitySummary={report.entitySummary} />

            {/* Answer Coverage */}
            <AnswerCoverageGraph
              score={report.categories.answerReadiness.score}
              answerCoverage={report.answerCoverage}
            />

            {/* Audit History Future Architecture Placeholder */}
            <ScoreTrendGraph />

            {/* Transparent Methodology & Disclaimer */}
            <MethodologySection />
          </div>
        )}

        {/* TAB 2: ISSUES */}
        {activeTab === 'issues' && (
          <div>
            <IssuesView report={report} />
          </div>
        )}

        {/* TAB 3: ENTITY */}
        {activeTab === 'entity' && (
          <div className="space-y-6">
            {/* How the site represents its entity */}
            <EntityProfileCard entitySummary={report.entitySummary} />

            {/* Signature SVG Entity Relationship Graph */}
            <SvgEntityGraph entityGraph={report.entityGraph} />

            {/* Entity Taxonomy Map */}
            <EntityMap graph={report.entityGraph} />

            {/* Entity-Intent Coverage Grid */}
            <EntityIntentCoverageSection intentCoverage={report.entityIntentCoverage} />

            {/* Detailed Category Rules for Entity Clarity */}
            <div className="pt-2">
              <h4 className="text-xs font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400 font-semibold mb-3">
                DETAILED ENTITY CLARITY RULES (17)
              </h4>
              <CategoryCard
                category={report.categories.entity}
                entitySummary={report.entitySummary}
                defaultExpanded={false}
              />
            </div>
          </div>
        )}

        {/* TAB 4: CONTENT */}
        {activeTab === 'content' && (
          <div className="space-y-6">
            {/* Content Hierarchy Tree (H1 → H2 → H3) */}
            <ContentHierarchyTree
              score={report.categories.content.score}
              report={report}
            />

            {/* Detailed Category Rules for Content Structure */}
            <div className="pt-2">
              <h4 className="text-xs font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400 font-semibold mb-3">
                DETAILED CONTENT STRUCTURE RULES (26)
              </h4>
              <CategoryCard
                category={report.categories.content}
                defaultExpanded={false}
              />
            </div>
          </div>
        )}

        {/* TAB 5: SCHEMA */}
        {activeTab === 'schema' && (
          <div className="space-y-6">
            {/* Schema Topology Tree & Properties Explorer */}
            <SchemaRelationshipTree
              score={report.categories.structuredData.score}
              detectedSchemas={report.detectedSchemas}
              report={report}
            />

            {/* Detailed Category Rules for Structured Data */}
            <div className="pt-2">
              <h4 className="text-xs font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400 font-semibold mb-3">
                DETAILED STRUCTURED DATA RULES (18)
              </h4>
              <CategoryCard
                category={report.categories.structuredData}
                detectedSchemas={report.detectedSchemas}
                defaultExpanded={false}
              />
            </div>
          </div>
        )}

        {/* TAB 6: TECHNICAL */}
        {activeTab === 'technical' && (
          <div className="space-y-6">
            {/* Compact Technical Diagnostics (HTTPS, 200, Canonical, Robots, Sitemap, llms.txt) */}
            <TechnicalDashboard report={report} />

            {/* Raw Technical Metrics & DOM Evidence */}
            <TechnicalEvidenceSection evidence={report.technicalEvidence} />

            {/* Detailed Category Rules for AI Crawlability */}
            <div className="pt-2">
              <h4 className="text-xs font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400 font-semibold mb-3">
                DETAILED AI CRAWLABILITY RULES (24)
              </h4>
              <CategoryCard
                category={report.categories.crawlability}
                defaultExpanded={false}
              />
            </div>
          </div>
        )}

        {/* TAB 7: EVIDENCE */}
        {activeTab === 'evidence' && (
          <div className="space-y-6">
            {/* Raw Evidence Repository with JSON-LD Code Block & Copy */}
            <EvidenceView report={report} />

            {/* Answer Readiness Section & Coverage Bar */}
            <AnswerCoverageGraph
              score={report.categories.answerReadiness.score}
              answerCoverage={report.answerCoverage}
            />

            {/* Discovered Navigation Hub Pathways */}
            <InformationArchitectureSection ia={report.informationArchitecture} />

            {/* Factual Evidence Signals Checklist */}
            <EvidenceSignalsSection evidenceSignals={report.evidenceSignals} />

            {/* Detailed Category Rules for Answer Readiness */}
            <div className="pt-2">
              <h4 className="text-xs font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400 font-semibold mb-3">
                DETAILED ANSWER READINESS RULES (16)
              </h4>
              <CategoryCard
                category={report.categories.answerReadiness}
                answerSummary={report.answerCoverage}
                defaultExpanded={false}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
