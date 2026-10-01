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
  ExternalLink,
} from 'lucide-react';
import { AuditReport } from '@/lib/audit/types';
import { AuditProgressEvent } from '@/lib/audit/orchestrator';
import { AuditProgress } from './AuditProgress';
import { Report } from './Report';

const DEMO_URLS = [
  'https://vercel.com',
  'https://github.com',
  'https://nextjs.org',
  'https://react.dev',
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

    setError(null);
    setReport(null);
    setLoading(true);
    setAnalyzingUrl(cleanUrl);
    setCompletedSteps(new Set());
    setCurrentStep(undefined);

    try {
      // Initiate SSE streaming request
      const response = await fetch('/api/analyze?stream=true', {
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
        throw new Error(errJson.error || `HTTP ${response.status}: Failed to analyze website.`);
      }

      if (!response.body) {
        throw new Error('ReadableStream not supported by browser.');
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

              // When a new step starts, mark previously active steps as complete
              if (currentStep && currentStep !== event.step && currentStep !== 'completed') {
                localCompleted.add(currentStep);
                setCompletedSteps(new Set(localCompleted));
              }

              setCurrentStep(event.step);
            } catch {
              // ignore parse errors
            }
          } else if (eventType === 'complete' && dataStr) {
            try {
              const parsedReport: AuditReport = JSON.parse(dataStr);
              // Mark all remaining steps complete
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
              return;
            } catch {
              // ignore
            }
          } else if (eventType === 'error' && dataStr) {
            try {
              const errPayload = JSON.parse(dataStr);
              throw new Error(errPayload.error || 'Server encountered an error during audit.');
            } catch (e: unknown) {
              throw e instanceof Error ? e : new Error(String(e));
            }
          }
        }
      }

      setLoading(false);
    } catch (err: unknown) {
      setLoading(false);
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to connect to the target website or audit engine.'
      );
    }
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    handleAudit(urlInput);
  };

  const handleReset = () => {
    setReport(null);
    setError(null);
    setLoading(false);
    setUrlInput('');
  };

  return (
    <div className="w-full">
      {/* Search Input Section (Shown when no report or in hero) */}
      {!report && (
        <div className="w-full max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <form onSubmit={onSubmit} className="relative mt-8">
            <div className="relative flex flex-col sm:flex-row items-center gap-2 p-2 rounded-2xl bg-surface/90 border border-surface-border shadow-2xl focus-within:border-brand-500/80 focus-within:ring-2 focus-within:ring-brand-500/20 transition-all">
              <div className="flex items-center w-full flex-1 px-3">
                <Search className="w-5 h-5 text-slate-400 mr-3 flex-shrink-0" />
                <input
                  type="text"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  placeholder="https://example.com"
                  disabled={loading}
                  className="w-full bg-transparent text-slate-100 placeholder-slate-500 font-mono text-sm sm:text-base outline-none py-2.5"
                  aria-label="Website URL to audit"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white font-semibold text-sm transition-all shadow-lg shadow-brand-600/30 flex items-center justify-center space-x-2 flex-shrink-0 group cursor-pointer"
              >
                <span>{loading ? 'Analyzing...' : 'Analyze Website'}</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>
          </form>

          {/* Value Props Strip */}
          <div className="mt-5 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-400">
            <div className="flex items-center space-x-2">
              <Zap className="w-3.5 h-3.5 text-brand-400" />
              <span>Free</span>
            </div>
            <div className="flex items-center space-x-2">
              <Shield className="w-3.5 h-3.5 text-brand-400" />
              <span>No login</span>
            </div>
            <div className="flex items-center space-x-2">
              <KeyRound className="w-3.5 h-3.5 text-brand-400" />
              <span>No API key</span>
            </div>
          </div>

          {/* Quick Demo Previews */}
          {!loading && (
            <div className="mt-6 flex flex-wrap items-center justify-center gap-2 text-xs text-slate-500">
              <span className="font-mono">Quick test:</span>
              {DEMO_URLS.map((demo) => (
                <button
                  key={demo}
                  type="button"
                  onClick={() => {
                    setUrlInput(demo);
                    handleAudit(demo);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-surface/80 hover:bg-surface-hover border border-surface-border text-slate-300 font-mono text-[11px] transition-colors"
                >
                  {demo.replace('https://', '')}
                </button>
              ))}
            </div>
          )}

          {/* Error Banner */}
          {error && (
            <div className="mt-6 p-4 rounded-xl bg-rose-950/30 border border-rose-900/60 text-left flex items-start space-x-3 text-rose-200 text-xs sm:text-sm animate-fade-in">
              <AlertTriangle className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
              <div className="min-w-0">
                <span className="font-semibold block text-rose-300">
                  Audit Request Failed
                </span>
                <p className="mt-0.5 text-rose-200/90 leading-relaxed font-mono text-xs">
                  {error}
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Real-time Progress Display */}
      {loading && (
        <AuditProgress
          currentStep={currentStep}
          completedSteps={completedSteps}
          analyzedUrl={analyzingUrl}
        />
      )}

      {/* Finished Audit Report */}
      {report && !loading && (
        <Report report={report} onReset={handleReset} />
      )}
    </div>
  );
};
