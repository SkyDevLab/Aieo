import { UrlAnalyzer } from '@/components/UrlAnalyzer';
import {
  Bot,
  FileText,
  Boxes,
  Fingerprint,
  MessageSquare,
  ShieldCheck,
  Sparkles,
  Search,
  CheckCircle,
  HelpCircle,
  Terminal,
} from 'lucide-react';

export default function HomePage() {
  return (
    <div className="flex flex-col items-center justify-center w-full">
      {/* Hero Section */}
      <section className="relative w-full pt-16 sm:pt-24 pb-12 sm:pb-16 px-4 sm:px-6 overflow-hidden">
        {/* Subtle background ambient gradients */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-brand-600/10 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute top-10 right-1/4 w-72 h-72 bg-cyan-500/5 blur-[100px] rounded-full pointer-events-none" />

        <div className="max-w-4xl mx-auto text-center relative z-10">
          {/* Badge */}
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-surface-card border border-surface-border text-xs font-medium text-brand-300 mb-6 shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-brand-400" />
            <span>AI Search Readiness & Extraction Audit</span>
          </div>

          {/* Hero Titles */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-white leading-tight">
            AIEO Checker
          </h1>

          <p className="mt-4 text-lg sm:text-xl md:text-2xl text-slate-200 font-medium max-w-2xl mx-auto">
            Check how understandable your website is to AI search engines.
          </p>

          <p className="mt-3 text-sm sm:text-base text-slate-400 max-w-xl mx-auto leading-relaxed">
            Analyze crawlability, structured data, entity clarity, content structure and answer readiness.
          </p>

          {/* Interactive URL Analyzer & Report */}
          <UrlAnalyzer />
        </div>
      </section>

      {/* Educational & Framework Section: 5 Pillars */}
      <section id="how-it-works" className="w-full max-w-5xl mx-auto py-16 px-4 sm:px-6 border-t border-surface-border/60">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-xs font-mono uppercase tracking-widest text-brand-400 font-semibold">
            Audit Architecture
          </h2>
          <h3 className="text-2xl sm:text-3xl font-bold text-slate-100 mt-2">
            The Five Pillars of AIEO Readiness
          </h3>
          <p className="text-xs sm:text-sm text-slate-400 mt-2">
            Generative AI search models (Perplexity, ChatGPT Search, Google AI Overviews) rely on technical access and semantic clarity to ingest web content.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {/* Pillar 1 */}
          <div className="p-6 rounded-2xl bg-surface/80 border border-surface-border hover:border-brand-500/40 transition-all shadow-md">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mb-4">
              <Bot className="w-5 h-5" />
            </div>
            <h4 className="text-base font-semibold text-slate-100 mb-1">
              1. AI Crawlability
            </h4>
            <span className="text-[11px] font-mono text-slate-500 block mb-2">Weight: 20%</span>
            <p className="text-xs text-slate-400 leading-relaxed">
              Verifies HTTPS security, clean HTTP response codes, robots.txt bot rules (GPTBot, ClaudeBot, PerplexityBot), sitemap XML discovery, and canonical stability.
            </p>
          </div>

          {/* Pillar 2 */}
          <div className="p-6 rounded-2xl bg-surface/80 border border-surface-border hover:border-brand-500/40 transition-all shadow-md">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mb-4">
              <FileText className="w-5 h-5" />
            </div>
            <h4 className="text-base font-semibold text-slate-100 mb-1">
              2. Content Structure
            </h4>
            <span className="text-[11px] font-mono text-slate-500 block mb-2">Weight: 20%</span>
            <p className="text-xs text-slate-400 leading-relaxed">
              Evaluates H1/H2 heading hierarchy, semantic HTML5 landmarks (&lt;main&gt;, &lt;article&gt;), meta descriptions, text density, and client-side rendering (CSR) safety.
            </p>
          </div>

          {/* Pillar 3 */}
          <div className="p-6 rounded-2xl bg-surface/80 border border-surface-border hover:border-brand-500/40 transition-all shadow-md">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mb-4">
              <Boxes className="w-5 h-5" />
            </div>
            <h4 className="text-base font-semibold text-slate-100 mb-1">
              3. Structured Data
            </h4>
            <span className="text-[11px] font-mono text-slate-500 block mb-2">Weight: 20%</span>
            <p className="text-xs text-slate-400 leading-relaxed">
              Parses Schema.org JSON-LD to confirm recognized entity types (Organization, Person, WebSite, Article, Product), valid syntax, and authority sameAs links.
            </p>
          </div>

          {/* Pillar 4 */}
          <div className="p-6 rounded-2xl bg-surface/80 border border-surface-border hover:border-brand-500/40 transition-all shadow-md">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center mb-4">
              <Fingerprint className="w-5 h-5" />
            </div>
            <h4 className="text-base font-semibold text-slate-100 mb-1">
              4. Entity Clarity
            </h4>
            <span className="text-[11px] font-mono text-slate-500 block mb-2">Weight: 20%</span>
            <p className="text-xs text-slate-400 leading-relaxed">
              Calculates cross-source entity consistency between page titles, H1 headings, Open Graph, schema definitions, author tags, and external social profiles.
            </p>
          </div>

          {/* Pillar 5 */}
          <div className="p-6 rounded-2xl bg-surface/80 border border-surface-border hover:border-brand-500/40 transition-all shadow-md">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center mb-4">
              <MessageSquare className="w-5 h-5" />
            </div>
            <h4 className="text-base font-semibold text-slate-100 mb-1">
              5. Answer Readiness
            </h4>
            <span className="text-[11px] font-mono text-slate-500 block mb-2">Weight: 20%</span>
            <p className="text-xs text-slate-400 leading-relaxed">
              Uses deterministic heuristics tailored to website classifications (portfolio, company, or product) to evaluate whether fundamental questions are addressable.
            </p>
          </div>

          {/* Technical Integrity */}
          <div className="p-6 rounded-2xl bg-surface/80 border border-surface-border hover:border-brand-500/40 transition-all shadow-md">
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mb-4">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h4 className="text-base font-semibold text-slate-100 mb-1">
              Enterprise SSRF Protection
            </h4>
            <span className="text-[11px] font-mono text-slate-500 block mb-2">Security Core</span>
            <p className="text-xs text-slate-400 leading-relaxed">
              Every audit strictly validates hostnames, resolves IPs against private/internal ranges, caps response buffers, and re-validates redirects to prevent SSRF vulnerabilities.
            </p>
          </div>
        </div>
      </section>

      {/* Product Principles & Transparency Section */}
      <section className="w-full max-w-4xl mx-auto py-12 px-4 sm:px-6 mb-8">
        <div className="p-6 sm:p-8 rounded-3xl bg-surface-card/60 border border-surface-border text-xs sm:text-sm text-slate-300 space-y-4">
          <div className="flex items-center space-x-2 text-brand-300 font-semibold uppercase tracking-wider text-xs">
            <Terminal className="w-4 h-4" />
            <span>Deterministic Scoring Philosophy</span>
          </div>

          <h3 className="text-lg font-bold text-white">
            Transparent Rules Over Black-Box Claims
          </h3>

          <p className="text-slate-400 leading-relaxed">
            AIEO Checker does not claim to predict proprietary algorithmic rankings or guarantee citations in ChatGPT, Claude, Gemini, or Perplexity. Instead, it provides engineers with an objective audit of whether their web architecture offers the clean markup, structured knowledge graphs, and semantic landmarks required by modern automated ingestion pipelines.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <div className="p-3 rounded-xl bg-surface border border-surface-border">
              <span className="font-semibold text-emerald-400 block mb-1">✓ What AIEO Measures</span>
              <p className="text-xs text-slate-400">
                Machine extractability, Schema.org syntax, entity cross-referencing, semantic HTML landmarks, and crawler accessibility.
              </p>
            </div>
            <div className="p-3 rounded-xl bg-surface border border-surface-border">
              <span className="font-semibold text-amber-400 block mb-1">⚠ What AIEO Avoids</span>
              <p className="text-xs text-slate-400">
                Spam keyword stuffing scores, unsubstantiated rank promises, or opaque black-box AI API calls.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
