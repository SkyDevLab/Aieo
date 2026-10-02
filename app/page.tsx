import { UrlAnalyzer } from '@/components/UrlAnalyzer';

export default function HomePage() {
  return (
    <div className="flex flex-col items-center justify-center w-full min-h-[calc(100vh-4rem)]">
      <UrlAnalyzer />

      <section
        id="search-intents"
        className="w-full max-w-6xl px-4 sm:px-6 pb-16 pt-4"
        aria-labelledby="search-intents-title"
      >
        <div className="border-t border-slate-200 dark:border-slate-800 pt-10">
          <h2
            id="search-intents-title"
            className="text-xl sm:text-2xl font-semibold text-slate-900 dark:text-white"
          >
            Website AIEO Check, AIEO Checker &amp; AI Search Audit
          </h2>
          <p className="mt-3 max-w-3xl text-sm sm:text-base leading-7 text-slate-600 dark:text-slate-400">
            Website AIEO Checker is a free AIEO website check from SkyDevLab.
            Use it to inspect how clearly a publicly accessible website exposes
            signals that can be parsed by AI search and answer systems.
          </p>

          <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <article className="rounded-xl border border-slate-200 dark:border-slate-800 p-5 bg-white/50 dark:bg-slate-900/40">
              <h3 className="font-semibold text-slate-900 dark:text-white">
                AIEO Website Checker
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">
                Check crawlability, robots directives, sitemaps, metadata,
                structured data, entities, and answer-oriented content signals.
              </p>
            </article>

            <article className="rounded-xl border border-slate-200 dark:border-slate-800 p-5 bg-white/50 dark:bg-slate-900/40">
              <h3 className="font-semibold text-slate-900 dark:text-white">
                AEO &amp; AI Search Readiness
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">
                Review the technical and semantic signals commonly used when
                evaluating whether content is easy for machines to discover,
                parse, and extract.
              </p>
            </article>

            <article className="rounded-xl border border-slate-200 dark:border-slate-800 p-5 bg-white/50 dark:bg-slate-900/40">
              <h3 className="font-semibold text-slate-900 dark:text-white">
                SkyWeb AIEO Checker by SkyDevLab
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">
                SkyWeb AIEO is the SkyDevLab project name associated with this
                free deterministic website audit experience.
              </p>
            </article>
          </div>

          <p className="mt-7 text-xs leading-5 text-slate-500 dark:text-slate-500">
            AIEO Checker reports observable website signals. It does not
            guarantee Google rankings, AI citations, visibility, or
            recommendations by any specific AI system.
          </p>
        </div>
      </section>
    </div>
  );
}
