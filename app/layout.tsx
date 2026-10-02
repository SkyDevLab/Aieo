import type { Metadata } from 'next';
import Script from 'next/script';
import './globals.css';
import { Header } from '@/components/Header';
import { FAQ_ITEMS } from '@/lib/faq-data';

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || 'https://website-aieo.vercel.app';
const GA_ID = process.env.NEXT_PUBLIC_GA_ID;
const GOOGLE_VERIFICATION =
  process.env.GOOGLE_SITE_VERIFICATION ||
  process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION ||
  'psOM6Z4D_l5Dh8b2KTYQJF3f2Iv1RZfegENEF73rxHY';

const SITE_TITLE = 'Website AIEO Checker — Free AIEO, AEO & AI Search Audit';
const SITE_DESCRIPTION =
  'Free Website AIEO Checker and AIEO check tool by SkyDevLab. Audit AI search readiness, AEO, crawlability, structured data, entity clarity, content structure, and answer readiness.';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: SITE_TITLE,
  description: SITE_DESCRIPTION,
  applicationName: 'Website AIEO Checker',
  category: 'technology',
  authors: [{ name: 'SkyDevLab', url: 'https://skydevlab.github.io/Portfolio/' }],
  creator: 'SkyDevLab',
  publisher: 'SkyDevLab',
  keywords: [
    'AIEO checker',
    'Website AIEO checker',
    'AI search optimization',
    'AI engine optimization',
    'AEO checker',
    'answer engine optimization',
    'AI search readiness',
    'AI crawler audit',
    'structured data checker',
    'entity SEO',
    'AI search audit',
    'free AIEO audit',
    'free AEO checker',
    'website AIEO check',
    'AIEO website check',
    'AIEO website checker',
    'AI search website checker',
    'AI search SEO checker',
    'SkyWeb AIEO',
    'SkyWeb AIEO Checker',
    'SkyDevLab AIEO',
    'website AI readiness',
  ],
  alternates: {
    canonical: SITE_URL,
  },
  verification: {
    google: GOOGLE_VERIFICATION || undefined,
  },
  openGraph: {
    type: 'website',
    url: SITE_URL,
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    siteName: 'Website AIEO Checker',
    images: [
      {
        url: '/opengraph-image',
        width: 1200,
        height: 630,
        alt: 'Website AIEO Checker — AI Search Readiness Audit',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: ['/opengraph-image'],
  },
  icons: {
    icon: '/icon.svg',
    shortcut: '/icon.svg',
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
        '@id': `${SITE_URL}/#website`,
        url: SITE_URL,
        name: 'Website AIEO Checker',
        alternateName: ['AIEO Checker', 'Website AIEO Check', 'SkyWeb AIEO Checker'],
        description:
          'Free website audit tool for AI search readiness and answer engine optimization.',
        publisher: {
          '@id': `${SITE_URL}/#organization`,
        },
      },
      {
        '@type': 'Organization',
        '@id': `${SITE_URL}/#organization`,
        name: 'SkyDevLab',
        url: 'https://skydevlab.github.io/Portfolio/',
        sameAs: ['https://github.com/SkyDevLab'],
      },
      {
        '@type': 'WebApplication',
        '@id': `${SITE_URL}/#webapp`,
        name: 'Website AIEO Checker',
        alternateName: ['AIEO Checker', 'AIEO Website Checker', 'SkyWeb AIEO Checker'],
        applicationCategory: 'DeveloperApplication',
        featureList: [
          'AI search readiness audit',
          'AIEO website check',
          'AEO website audit',
          'AI crawler and robots audit',
          'Structured data and entity audit',
          'Content structure and answer readiness audit',
        ],
        operatingSystem: 'All',
        url: SITE_URL,
        description:
          'Audit your website for AI search readiness, entity clarity, structured data, content structure, and answer readiness.',
        offers: {
          '@type': 'Offer',
          price: '0',
          priceCurrency: 'USD',
        },
        provider: {
          '@id': `${SITE_URL}/#organization`,
        },
      },
      {
        '@type': 'FAQPage',
        '@id': `${SITE_URL}/#faq`,
        mainEntity: FAQ_ITEMS.map((item) => ({
          '@type': 'Question',
          name: item.question,
          acceptedAnswer: {
            '@type': 'Answer',
            text: item.answer,
          },
        })),
      },
    ],
  };

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function() {
  try {
    var stored = localStorage.getItem('aieo_theme');
    var isDark = stored ? stored === 'dark' : (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  } catch(e) {}
})();`,
          }}
        />
        <meta name="google-site-verification" content={GOOGLE_VERIFICATION} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="bg-background text-slate-900 dark:text-slate-100 flex flex-col min-h-screen selection:bg-brand-500 selection:text-white antialiased">
        {GA_ID && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
              strategy="afterInteractive"
            />
            <Script id="google-analytics" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${GA_ID}');
              `}
            </Script>
          </>
        )}

        <div className="w-full h-0.5 bg-gradient-to-r from-brand-600 via-indigo-500 to-cyan-500" />
        <Header />
        <main className="flex-1 flex flex-col">{children}</main>

        <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-surface py-10 mt-auto">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-8 border-b border-slate-200 dark:border-slate-800">
              <div className="space-y-1.5">
                <div className="flex items-center space-x-2">
                  <span className="text-base font-bold text-slate-900 dark:text-white">
                    Website AIEO Checker
                  </span>
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                    Built by SkyDevLab
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-lg leading-relaxed">
                  Audit your website for AI search readiness, entity clarity, structured data, content structure, and answer readiness.
                </p>
              </div>

              <nav aria-label="Footer Navigation" className="flex flex-wrap items-center gap-4 sm:gap-6 text-xs text-slate-600 dark:text-slate-400">
                <a href="https://skydevlab.github.io/Portfolio/" target="_blank" rel="noopener noreferrer" className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors">
                  Website
                </a>
                <a href="https://github.com/SkyDevLab" target="_blank" rel="noopener noreferrer" className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors">
                  GitHub
                </a>
                <a href="#how-it-works" className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors">
                  Methodology
                </a>
                <a href="#faq" className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors">
                  FAQ
                </a>
                <a href="#audit" className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors font-medium text-brand-600 dark:text-brand-400">
                  Audit Website
                </a>
              </nav>
            </div>

            <div className="pt-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-400">
              <p className="max-w-2xl leading-relaxed text-[11px]">
                <strong className="text-slate-700 dark:text-slate-300 font-medium">Disclaimer: </strong>
                Website AIEO Checker evaluates publicly accessible website signals. It does not measure or guarantee ranking, citation, visibility, or recommendation by any specific AI search system.
              </p>
              <div className="font-mono text-[11px] text-slate-500 dark:text-slate-400 whitespace-nowrap">
                Zero AI API dependencies • Open Heuristics
              </div>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
