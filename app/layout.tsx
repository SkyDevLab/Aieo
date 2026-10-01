import type { Metadata } from 'next';
import './globals.css';
import { Cpu, ExternalLink } from 'lucide-react';

export const metadata: Metadata = {
  metadataBase: new URL('https://aieo-checker.skydevlab.com'),
  title: 'AIEO Checker — AI Engine Optimization & AI Search Readiness Audit',
  description:
    'Free AIEO checker that analyzes website crawlability, structured data, entity clarity, content structure and AI search readiness.',
  applicationName: 'AIEO Checker',
  authors: [{ name: 'Surya Pratap Singh', url: 'https://skydevlab.com' }],
  creator: 'Surya Pratap Singh',
  publisher: 'SkyDevLab',
  keywords: [
    'AIEO',
    'AI Engine Optimization',
    'AI Search Readiness',
    'Perplexity SEO',
    'ChatGPT Search',
    'Google AI Overviews',
    'JSON-LD Audit',
    'Entity Clarity',
    'Robots.txt AI Crawlers',
    'llms.txt',
  ],
  alternates: {
    canonical: 'https://aieo-checker.skydevlab.com',
  },
  openGraph: {
    type: 'website',
    url: 'https://aieo-checker.skydevlab.com',
    title: 'AIEO Checker — AI Engine Optimization & AI Search Readiness Audit',
    description:
      'Free AIEO checker that analyzes website crawlability, structured data, entity clarity, content structure and AI search readiness.',
    siteName: 'AIEO Checker',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AIEO Checker — AI Engine Optimization & AI Search Readiness Audit',
    description:
      'Analyze website crawlability, structured data, entity clarity, content structure and answer readiness for AI search engines.',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        '@id': 'https://aieo-checker.skydevlab.com/#website',
        url: 'https://aieo-checker.skydevlab.com',
        name: 'AIEO Checker',
        description:
          'Free AIEO checker that analyzes website crawlability, structured data, entity clarity, content structure and AI search readiness.',
        publisher: {
          '@id': 'https://aieo-checker.skydevlab.com/#organization',
        },
      },
      {
        '@type': 'Organization',
        '@id': 'https://aieo-checker.skydevlab.com/#organization',
        name: 'SkyDevLab',
        url: 'https://skydevlab.com',
        founder: {
          '@type': 'Person',
          name: 'Surya Pratap Singh',
        },
      },
    ],
  };

  return (
    <html lang="en" className="dark">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="bg-background text-slate-100 flex flex-col min-h-screen selection:bg-brand-500 selection:text-white antialiased">
        {/* Top subtle gradient accent line */}
        <div className="w-full h-1 bg-gradient-to-r from-brand-600 via-indigo-500 to-cyan-400" />

        {/* Global Navigation Header */}
        <header className="border-b border-surface-border/80 bg-surface/50 backdrop-blur-md sticky top-0 z-50">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-indigo-700 flex items-center justify-center text-white shadow-md shadow-brand-500/20">
                <Cpu className="w-5 h-5" />
              </div>
              <div className="flex items-baseline space-x-2">
                <span className="text-base sm:text-lg font-bold tracking-tight text-white">
                  AIEO Checker
                </span>
                <span className="hidden sm:inline-block text-[11px] font-mono px-2 py-0.5 rounded bg-brand-950/60 text-brand-300 border border-brand-800/40">
                  v1.0 MVP
                </span>
              </div>
            </div>

            <div className="flex items-center space-x-4 text-xs">
              <span className="text-slate-400 hidden md:inline-flex items-center space-x-1.5">
                <span>Built by</span>
                <span className="font-semibold text-slate-200">SkyDevLab</span>
              </span>
              <a
                href="#how-it-works"
                className="text-slate-400 hover:text-slate-200 transition-colors font-medium hidden sm:inline-block"
              >
                Framework
              </a>
              <span className="px-2.5 py-1 rounded-lg bg-surface-card border border-surface-border text-slate-300 font-mono text-[11px]">
                Deterministic Engine
              </span>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col">{children}</main>

        {/* Footer */}
        <footer className="border-t border-surface-border/80 bg-surface/80 py-10 mt-auto">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col md:flex-row items-center justify-between gap-6 text-xs text-slate-400">
            <div className="space-y-1 text-center md:text-left">
              <div className="text-sm font-semibold text-slate-200">
                AIEO Checker by SkyDevLab
              </div>
              <div>
                Built by <span className="text-slate-300 font-medium">Surya Pratap Singh</span>
              </div>
              <p className="text-[11px] text-slate-500 max-w-md pt-1">
                Deterministic technical & semantic audit engine for artificial intelligence search crawlers and RAG extractors.
              </p>
            </div>

            <div className="text-center md:text-right space-y-1">
              <div className="text-[11px] text-slate-500 max-w-sm">
                AIEO Checker evaluates publicly accessible technical signals. It does not guarantee rankings or recommendations by any AI system.
              </div>
              <div className="text-[11px] text-slate-400 font-mono pt-1">
                Zero AI API dependencies • Open Heuristics • SSRF Protected
              </div>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
