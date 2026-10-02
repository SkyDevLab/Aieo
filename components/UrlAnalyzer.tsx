'use client';

import React, { useState, FormEvent } from 'react';
import {
  Search,
  ArrowRight,
  AlertTriangle,
  Sparkles,
  Shield,
  Zap,
  KeyRound,
  Bot,
  FileText,
  Boxes,
  Fingerprint,
  MessageSquare,
  ShieldCheck,
  CheckCircle2,
  Info,
  HelpCircle,
  Cpu,
  Layers,
} from 'lucide-react';
import { AuditReport } from '@/lib/audit/types';
import { AuditProgressEvent } from '@/lib/audit/orchestrator';
import { AuditProgress } from './AuditProgress';
import { Report } from './Report';
import { FaqSection } from './FaqSection';
import { analytics } from '@/lib/analytics';

const DEMO_URLS = [
  'https://skydevlab.github.io/Portfolio/',
  'https://tanyo.in/',
  'https://vercel.com',
  'https://nextjs.org',
];

export const UrlAnalyzer: React.FC = () => {
  const [urlInput, setUrlInput] = useState('');
  const [analyzingUrl, setAnalyzingUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<AuditReport | null>(null);

  // Real-time progress state
  const [currentStep, setCurrentStep] = useState<AuditProgressEvent['step'] | undefined>(undefined);
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());

  const handleAudit = async (targetUrl: string) => {
    let cleanUrl = targetUrl.trim();
    if (!cleanUrl) {
      setError('Please enter a website URL.');
      return;
    }

    if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
      cleanUrl = `https://${cleanUrl}`;
    }

    let targetHostname = 'unknown';
    try {
      targetHostname = new URL(cleanUrl).hostname;
    } catch {
      // ignore
    }

    analytics.auditUrlSubmitted();
    analytics.auditStarted(targetHostname);

    setError(null);
    setReport(null);
    setLoading(true);
    setAnalyzingUrl(cleanUrl);
    setCompletedSteps(new Set());
    setCurrentStep(undefined);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || ''}/api/analyze?stream=true`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'text/event-stream',
        },
        body: JSON.stringify({ url: cleanUrl, stream: true }),
      });

      if (!response.ok) {
        let errJson: { error?: string } = {};
        try {
          errJson = await response.json();
        } catch {
          // fallback
        }
        const errorMsg = errJson.error || `HTTP ${response.status}: Failed to analyze website.`;
        analytics.auditFailed(errorMsg);
        throw new Error(errorMsg);
      }

      if (!response.body) {
        const errorMsg = 'ReadableStream not supported by browser.';
        analytics.auditFailed(errorMsg);
        throw new Error(errorMsg);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';
      const localCompleted = new Set<string>();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split('\n\n');
        buffer = parts.pop() || '';

        for (const block of parts) {
          const lines = block.split('\n');
          let eventType = '';
          let dataStr = '';

          for (const line of lines) {
            if (line.startsWith('event: ')) {
              eventType = line.slice(7).trim();
            } else if (line.startsWith('data: ')) {
              dataStr = line.slice(6).trim();
            }
          }

          if (eventType === 'progress' && dataStr) {
            try {
              const event: AuditProgressEvent = JSON.parse(dataStr);
              if (currentStep && currentStep !== event.step && currentStep !== 'completed') {
                localCompleted.add(currentStep);
                setCompletedSteps(new Set(localCompleted));
              }
              setCurrentStep(event.step);
            } catch {
              // ignore
            }
          } else if (eventType === 'complete' && dataStr) {
            try {
              const parsedReport: AuditReport = JSON.parse(dataStr);
              localCompleted.add('fetching_page');
              localCompleted.add('checking_robots');
              localCompleted.add('checking_sitemap');
              localCompleted.add('parsing_structured_data');
              localCompleted.add('checking_entity_signals');
              localCompleted.add('calculating_score');
              setCompletedSteps(new Set(localCompleted));
              setCurrentStep('completed');

              setReport(parsedReport);
              setLoading(false);

              // Non-sensitive aggregate analytics
              analytics.auditCompleted({
                score: parsedReport.score,
                categories: {
                  crawlability: parsedReport.categories.crawlability.score,
                  content: parsedReport.categories.content.score,
                  structuredData: parsedReport.categories.structuredData.score,
                  entity: parsedReport.categories.entity.score,
                  answerReadiness: parsedReport.categories.answerReadiness.score,
                },
                durationMs: parsedReport.durationMs,
                totalChecks: parsedReport.summary.totalChecks,
              });
              return;
            } catch {
              // ignore
            }
          } else if (eventType === 'error' && dataStr) {
            try {
              const errPayload = JSON.parse(dataStr);
              const errMsg = errPayload.error || 'Server encountered an error during audit.';
              analytics.auditFailed(errMsg);
              throw new Error(errMsg);
            } catch (e: unknown) {
              const errMsg = e instanceof Error ? e.message : String(e);
              analytics.auditFailed(errMsg);
              throw e instanceof Error ? e : new Error(String(e));
            }
          }
        }
      }

      setLoading(false);
    } catch (err: unknown) {
      setLoading(false);
      const errMsg =
        err instanceof Error
          ? err.message
          : 'Unable to connect to the target website or audit engine.';
      analytics.auditFailed(errMsg);
      setError(errMsg);
    }
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    analytics.ctaClicked('hero_submit');
    handleAudit(urlInput);
  };

  const handleReset = () => {
    setReport(null);
    setError(null);
    setLoading(false);
    setUrlInput('');
  };

  // If report is ready, render the dashboard
  if (report && !loading) {
    return <Report report={report} onReset={handleReset} />;
  }

  return (
    <div className="w-full flex flex-col items-center">
      {/* 1. Hero Section */}
      <section
        id="audit"
        className="relative w-full pt-10 sm:pt-16 pb-12 sm:pb-16 px-4 sm:px-6 scroll-mt-16"
      >
        <div className="max-w-4xl mx-auto text-center relative z-10">
          {/* Badge */}
          <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-300 mb-6 shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
            <span>AI Search Readiness & Entity Clarity Audit</span>
          </div>

          {/* Primary H1 */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight">
            Free Website AIEO Checker
          </h1>

          {/* Subtitle */}
          <p className="mt-4 text-lg sm:text-xl text-slate-700 dark:text-slate-200 font-medium max-w-2xl mx-auto">
            Audit how understandable your website is to AI search and answer engines.
          </p>

          {/* Supporting Text */}
          <p className="mt-2 text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-xl mx-auto leading-relaxed">
            Analyze AI crawlability, content structure, structured data, entity clarity, and answer readiness with a deterministic website audit.
          </p>

          {/* Audit URL Form */}
          <div className="w-full max-w-2xl mx-auto mt-8">
            <form onSubmit={onSubmit} className="relative">
              <div className="relative flex flex-col sm:flex-row items-center gap-2 p-1.5 rounded-xl bg-white dark:bg-surface border border-slate-200 dark:border-slate-800 shadow-sm focus-within:border-brand-500 dark:focus-within:border-brand-400 focus-within:ring-2 focus-within:ring-brand-500/20 transition-all">
                <div className="flex items-center w-full flex-1 px-3">
                  <Search className="w-4 h-4 text-slate-400 mr-2.5 flex-shrink-0" />
                  <input
                    type="text"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    placeholder="https://skydevlab.github.io/Portfolio/"
                    disabled={loading}
                    className="w-full bg-transparent text-slate-900 dark:text-slate-100 placeholder-slate-400 font-mono text-xs sm:text-sm outline-none py-2"
                    aria-label="Website URL to audit"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-lg bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white font-semibold text-xs sm:text-sm transition-colors flex items-center justify-center space-x-1.5 flex-shrink-0 shadow-sm"
                >
                  <span>{loading ? 'Analyzing...' : 'Audit Your Website'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>

            {/* Secondary Action & Feature Badges */}
            <div className="mt-4 flex flex-wrap items-center justify-center gap-5 text-xs text-slate-500 dark:text-slate-400">
              <a
                href="#what-is-aieo"
                onClick={() => analytics.ctaClicked('learn_about_aieo')}
                className="text-brand-600 dark:text-brand-400 font-medium hover:underline inline-flex items-center space-x-1"
              >
                <span>Learn About AIEO</span>
                <span>→</span>
              </a>
              <span className="text-slate-300 dark:text-slate-700">•</span>
              <div className="flex items-center space-x-1.5">
                <Zap className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
                <span>Free forever</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <Shield className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
                <span>No login required</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <KeyRound className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
                <span>No API keys needed</span>
              </div>
            </div>

            {/* Quick Demo Previews */}
            {!loading && (
              <div className="mt-5 flex flex-wrap items-center justify-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                <span className="font-mono text-[11px]">Quick test:</span>
                {DEMO_URLS.map((demo) => (
                  <button
                    key={demo}
                    type="button"
                    onClick={() => {
                      setUrlInput(demo);
                      analytics.ctaClicked(`quick_test_${demo}`);
                      handleAudit(demo);
                    }}
                    className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-mono text-[11px] transition-colors shadow-sm"
                  >
                    {demo.replace('https://', '')}
                  </button>
                ))}
              </div>
            )}

            {/* Transparent Disclaimer */}
            <div className="mt-5 p-3 rounded-lg bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 text-center text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed max-w-xl mx-auto">
              Website AIEO Checker evaluates publicly accessible website signals. It does not measure or guarantee ranking, citation, visibility, or recommendation by any specific AI search system.
            </div>

            {/* Error Banner */}
            {error && (
              <div className="mt-5 p-3.5 rounded-lg bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/60 text-left flex items-start space-x-2.5 text-rose-800 dark:text-rose-200 text-xs">
                <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold block text-rose-900 dark:text-rose-100">
                    Audit Failed
                  </span>
                  <p className="mt-0.5 font-mono text-xs text-rose-700 dark:text-rose-300">
                    {error}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Real-time Progress Display */}
      {loading && (
        <div className="w-full max-w-3xl px-4 sm:px-6 mb-12">
          <AuditProgress
            currentStep={currentStep}
            completedSteps={completedSteps}
            analyzedUrl={analyzingUrl}
          />
        </div>
      )}

      {/* SEO Landing Sections */}
      {!loading && (
        <>
          {/* Section 2: What is AIEO? */}
          <section
            id="what-is-aieo"
            className="w-full max-w-4xl mx-auto py-12 px-4 sm:px-6 border-t border-slate-200 dark:border-slate-800 scroll-mt-16"
          >
            <div className="space-y-4">
              <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-mono border border-slate-200 dark:border-slate-700">
                <Cpu className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
                <span>FOUNDATIONS</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                What is AIEO?
              </h2>
              <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed space-y-3">
                <p>
                  <strong>AIEO (Artificial Intelligence Engine Optimization)</strong> is the systematic engineering practice of structuring public website content, semantic landmarks, and machine-readable data so AI retrieval systems, LLM crawlers (such as GPTBot, ClaudeBot, PerplexityBot), and RAG pipelines can discover, parse, and accurately contextualize your information.
                </p>
                <p>
                  Unlike traditional search engines that index pages primarily to return ranked lists of hyperlinks, generative AI engines synthesize direct answers. If your website has blocked bots in robots.txt, lacks clear entity relationships, or hides content behind client-side rendering bottlenecks, AI models cannot reliably extract answers or attribute information to your brand.
                </p>
              </div>
              <div className="pt-2">
                <a
                  href="#how-it-works"
                  className="text-xs sm:text-sm font-medium text-brand-600 dark:text-brand-400 hover:underline inline-flex items-center space-x-1"
                >
                  <span>Learn how AIEO works</span>
                  <span>→</span>
                </a>
              </div>
            </div>
          </section>

          {/* Section 3: What does Website AIEO Checker analyze? */}
          <section
            id="dimensions"
            className="w-full max-w-5xl mx-auto py-12 px-4 sm:px-6 border-t border-slate-200 dark:border-slate-800 scroll-mt-16"
          >
            <div className="text-center max-w-2xl mx-auto mb-10">
              <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-mono mb-3 border border-slate-200 dark:border-slate-700">
                <Layers className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
                <span>EVALUATION SUITE</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                What does Website AIEO Checker analyze?
              </h2>
              <p className="mt-2 text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                Website AIEO Checker evaluates five core pillars, each representing 20% of your total AIEO readiness score.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* H3: AI Crawlability */}
              <article className="p-5 rounded-xl bg-white dark:bg-surface border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-3">
                    <Bot className="w-4 h-4" />
                  </div>
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-1">
                    AI Crawlability
                  </h3>
                  <span className="text-[10px] font-mono text-slate-400 block mb-2">Weight: 20%</span>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    Checks observable technical signals that affect how machine-readable and discoverable a website is. Evaluates robots.txt rules for AI crawlers (GPTBot, ClaudeBot, PerplexityBot), sitemap XML discovery, HTTPS security, HTTP status codes, canonical URL stability, and informational llms.txt availability.
                  </p>
                </div>
              </article>

              {/* H3: Content Structure */}
              <article className="p-5 rounded-xl bg-white dark:bg-surface border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-3">
                    <FileText className="w-4 h-4" />
                  </div>
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-1">
                    Content Structure
                  </h3>
                  <span className="text-[10px] font-mono text-slate-400 block mb-2">Weight: 20%</span>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    Evaluates headings, page structure and content organization. Verifies logical H1-H3 document hierarchy, semantic HTML5 landmarks (&lt;main&gt;, &lt;article&gt;), meta descriptions, text-to-HTML ratio, and body content completeness required for automated vector embeddings.
                  </p>
                </div>
              </article>

              {/* H3: Structured Data */}
              <article className="p-5 rounded-xl bg-white dark:bg-surface border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-3">
                    <Boxes className="w-4 h-4" />
                  </div>
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-1">
                    Structured Data
                  </h3>
                  <span className="text-[10px] font-mono text-slate-400 block mb-2">Weight: 20%</span>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    Examines machine-readable structured data such as JSON-LD. Confirms presence and schema syntax validity for recognized Schema.org types (Organization, Person, WebSite, Article, Product, FAQPage), author attribution, and external sameAs profile relationships.
                  </p>
                </div>
              </article>

              {/* H3: Entity Clarity */}
              <article className="p-5 rounded-xl bg-white dark:bg-surface border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="w-8 h-8 rounded-lg bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 flex items-center justify-center mb-3">
                    <Fingerprint className="w-4 h-4" />
                  </div>
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-1">
                    Entity Clarity
                  </h3>
                  <span className="text-[10px] font-mono text-slate-400 block mb-2">Weight: 20%</span>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    Evaluates how clearly people, organizations, websites and other entities are represented. Checks cross-source consistency between HTML title, H1, Schema.org names, Open Graph properties, and external social proof links to prevent identity ambiguity in knowledge graphs.
                  </p>
                </div>
              </article>

              {/* H3: Answer Readiness */}
              <article className="p-5 rounded-xl bg-white dark:bg-surface border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="w-8 h-8 rounded-lg bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 flex items-center justify-center mb-3">
                    <MessageSquare className="w-4 h-4" />
                  </div>
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-1">
                    Answer Readiness
                  </h3>
                  <span className="text-[10px] font-mono text-slate-400 block mb-2">Weight: 20%</span>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    Evaluates whether important questions about the website can be answered from its accessible content. Analyzes answer intent coverage across core user queries (What is this? Who created it? How much does it cost? How to contact?) and factual evidence signals.
                  </p>
                </div>
              </article>

              {/* SSRF & Deterministic Security Card */}
              <article className="p-5 rounded-xl bg-white dark:bg-surface border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="w-8 h-8 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center justify-center mb-3">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-1">
                    Deterministic Security Core
                  </h3>
                  <span className="text-[10px] font-mono text-slate-400 block mb-2">Security Standard</span>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    All audits execute in a hardened serverless environment with strict SSRF protections against internal IPs, private loopbacks, and cloud metadata endpoints, protecting both the auditor and target web property.
                  </p>
                </div>
              </article>
            </div>
          </section>

          {/* Section 4: How Website AIEO Checker Works */}
          <section
            id="how-it-works"
            className="w-full max-w-4xl mx-auto py-12 px-4 sm:px-6 border-t border-slate-200 dark:border-slate-800 scroll-mt-16"
          >
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                  How Website AIEO Checker Works
                </h2>
                <p className="mt-2 text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                  A transparent 100% deterministic diagnostic pipeline with zero black-box scoring.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div className="p-4 rounded-xl bg-white dark:bg-surface border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
                  <div className="font-mono text-brand-600 dark:text-brand-400 font-bold text-xs uppercase">
                    01 • Live Fetch & Safety
                  </div>
                  <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
                    Network & Protocol Inspection
                  </h4>
                  <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                    Fetches public HTML, verifies SSL certificates, HTTP response status codes, header configurations, and parses robots.txt directives.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-white dark:bg-surface border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
                  <div className="font-mono text-emerald-600 dark:text-emerald-400 font-bold text-xs uppercase">
                    02 • AST & Schema Parsing
                  </div>
                  <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
                    Structural Analysis
                  </h4>
                  <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                    Cheerio extracts semantic headings and content blocks, while our JSON-LD engine validates Schema.org graphs and entity connections.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-white dark:bg-surface border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
                  <div className="font-mono text-sky-600 dark:text-sky-400 font-bold text-xs uppercase">
                    03 • Heuristic Compilation
                  </div>
                  <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
                    Deterministic Scoring
                  </h4>
                  <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                    Evaluates 101 explainable rules. Every score is backed by direct evidence with pass, warning, or failure diagnostics.
                  </p>
                </div>
              </div>

              <div className="pt-2">
                <a
                  href="#dimensions"
                  className="text-xs sm:text-sm font-medium text-brand-600 dark:text-brand-400 hover:underline inline-flex items-center space-x-1"
                >
                  <span>How the Website AIEO Checker evaluates websites</span>
                  <span>→</span>
                </a>
              </div>
            </div>
          </section>

          {/* Section 5: Why AI Search Readiness Matters */}
          <section className="w-full max-w-4xl mx-auto py-12 px-4 sm:px-6 border-t border-slate-200 dark:border-slate-800">
            <div className="space-y-4">
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                Why AI Search Readiness Matters
              </h2>
              <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed space-y-3">
                <p>
                  Search behavior is experiencing a fundamental transition toward conversational answer engines, such as Perplexity, ChatGPT Search, Claude, and Google AI Overviews. These platforms don&apos;t just index keywords—they extract structured facts and synthesize them into direct answers for users.
                </p>
                <p>
                  Websites that establish clear entity consistency, provide valid Schema.org graphs, maintain clean heading architecture, and explicitly answer foundational queries make it effortless for automated systems to retrieve, quote, and attribute their authoritative content.
                </p>
              </div>
            </div>
          </section>

          {/* Section 6: Free AIEO Website Audit */}
          <section className="w-full max-w-4xl mx-auto py-12 px-4 sm:px-6 border-t border-slate-200 dark:border-slate-800">
            <div className="p-6 sm:p-8 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 space-y-4">
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                Free AIEO Website Audit
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                Website AIEO Checker is committed to open, accessible developer diagnostics. Our platform runs comprehensive multi-category website audits without paywalls, email capture forms, or forced subscriptions. Enter your URL above to receive immediate, transparent feedback.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs">
                <div className="flex items-center space-x-2 text-slate-700 dark:text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                  <span>100% Free Tool</span>
                </div>
                <div className="flex items-center space-x-2 text-slate-700 dark:text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                  <span>No Account Required</span>
                </div>
                <div className="flex items-center space-x-2 text-slate-700 dark:text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                  <span>Instant Results</span>
                </div>
              </div>
            </div>
          </section>

          {/* Section 7: Frequently Asked Questions (FAQ) */}
          <FaqSection />

          {/* Section 8: Start Your Website Audit (Bottom CTA) */}
          <section className="w-full max-w-4xl mx-auto py-12 px-4 sm:px-6 border-t border-slate-200 dark:border-slate-800 mb-8 text-center">
            <div className="p-8 sm:p-10 rounded-2xl bg-white dark:bg-surface border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                Start Your Website Audit
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-xl mx-auto leading-relaxed">
                Test how accessible, extractable, and machine-readable your website content is to modern AI search engines today.
              </p>
              <div className="pt-2">
                <a
                  href="#audit"
                  onClick={() => analytics.ctaClicked('bottom_start_audit')}
                  className="inline-flex items-center space-x-2 px-6 py-3 rounded-lg bg-brand-600 hover:bg-brand-500 text-white font-semibold text-sm transition-colors shadow-sm"
                >
                  <span>Audit Your Website</span>
                  <ArrowRight className="w-4 h-4" />
                </a>
              </div>
            </div>
          </section>
        </>
      )}
    </div>
  );
};
