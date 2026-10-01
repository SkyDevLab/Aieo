export interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

export const FAQ_ITEMS: FaqItem[] = [
  {
    id: 'what-is-aieo',
    question: 'What is AIEO?',
    answer:
      'AIEO (Artificial Intelligence Engine Optimization) is the process of optimizing website technical architecture, semantic markup, and factual content so AI search crawlers (such as GPTBot, ClaudeBot, and PerplexityBot) and LLM-driven answer engines can discover, parse, contextualize, and accurately extract information from a website.',
  },
  {
    id: 'aieo-vs-seo',
    question: 'What is the difference between AIEO and SEO?',
    answer:
      'Traditional SEO focuses on search engine ranking algorithms, backlinks, and keyword placement for traditional search engine result pages (SERPs). AIEO focuses on machine extractability, semantic entity clarity, Schema.org structured data, and content organization for retrieval-augmented generation (RAG) and conversational answer engines.',
  },
  {
    id: 'what-is-aeo',
    question: 'What is Answer Engine Optimization?',
    answer:
      'Answer Engine Optimization (AEO) is a focused subset of AIEO aimed at structuring content so AI systems (such as Perplexity, ChatGPT Search, and Google AI Overviews) can directly extract unambiguous, factual answers to specific user questions from your web pages.',
  },
  {
    id: 'how-scoring-works',
    question: 'How does Website AIEO Checker score a website?',
    answer:
      'Website AIEO Checker evaluates 101 deterministic technical rules across 5 balanced dimensions: AI Crawlability, Content Structure, Structured Data, Entity Clarity, and Answer Readiness. Each dimension accounts for 20% of the overall 0–100 score, with zero arbitrary black-box AI API scoring.',
  },
  {
    id: 'is-it-free',
    question: 'Is Website AIEO Checker free?',
    answer:
      'Yes, Website AIEO Checker is completely free to use. There are no account registrations, paywalls, or API key requirements, and audits execute directly on our server-side engine.',
  },
  {
    id: 'guarantee-visibility',
    question: 'Does AIEO guarantee ChatGPT or Gemini visibility?',
    answer:
      'No. Website AIEO Checker evaluates observable website signals and technical readiness. It does not measure, control, or guarantee citation, indexing, ranking, or recommendation by ChatGPT, Gemini, Claude, Perplexity, Google AI Overviews, or any specific AI system.',
  },
  {
    id: 'what-audit-checks',
    question: 'What does an AIEO audit check?',
    answer:
      'An AIEO audit inspects crawler permissions (robots.txt, sitemaps, HTTP response codes, bot directives), document structure (HTML5 landmarks, heading order, text-to-code ratio), structured data (Schema.org JSON-LD validity, recognized entity types), entity clarity (cross-source name, type, and social consistency), and factual answer coverage.',
  },
  {
    id: 'what-is-readiness',
    question: 'What is AI search readiness?',
    answer:
      'AI search readiness measures how seamlessly AI crawlers and LLM retrieval engines can ingest, parse, and cite a website’s content without running into access blocks, client-side rendering gaps, missing metadata, or ambiguous entity identities.',
  },
];
