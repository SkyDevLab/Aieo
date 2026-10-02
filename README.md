# Website AIEO Checker — Free AI Search & AEO Website Audit Tool

[![GitHub](https://img.shields.io/badge/GitHub-SkyDevLab%2FAieo-181717?logo=github)](https://github.com/SkyDevLab/Aieo)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

**Project:** [SkyDevLab/Aieo](https://github.com/SkyDevLab/Aieo) · **Author:** [Surya Pratap Singh / SkyDevLab](https://github.com/SkyDevLab)

> **Audit your website for AI search readiness, entity clarity, structured data, content structure, and answer readiness.**  
> Built by **SkyDevLab**

Free, production-ready website auditor that analyzes website crawlability, structured data, entity clarity, content structure, and answer readiness for AI search crawlers and retrieval-augmented generation (RAG) pipelines.

---

## ⚠️ Important Disclaimer
**Website AIEO Checker evaluates publicly accessible technical and content signals.**  
It does **NOT** measure, promise, or predict whether ChatGPT, Gemini, Claude, Perplexity, Google AI Overviews, etc., will cite, rank, or recommend a website. The score represents technical + semantic signals that make a website easier for automated AI systems to crawl, parse, disambiguate, and extract information from.

---

## 🚀 Key Features

- **Zero AI API Dependency:** 100% deterministic rule engine built with Cheerio and TypeScript. No OpenAI, Anthropic, or Gemini API keys needed.
- **SSRF Enterprise Protection:** Strictly validates URL schemes, rejects credentials, resolves hostnames, and blocks private/loopback/link-local/cloud metadata IPs (e.g. `127.0.0.1`, `10.0.0.0/8`, `169.254.169.254`, `::1`). Re-validates every redirect hop up to 5 max redirects and limits body buffers.
- **Five-Pillar Weighted Score (100 pts total):**
  1. **AI Crawlability (20%):** HTTPS protocol, HTTP status 200, robots.txt accessibility, general and AI bot directives (GPTBot, ClaudeBot, PerplexityBot, CCBot, Google-Extended), XML sitemaps, canonical tags, and optional `llms.txt` checks.
  2. **Content Structure (20%):** Page title length, meta description quality, single H1 presence, H2/H3 heading hierarchy, language attribute, semantic HTML5 landmarks (`<main>`, `<article>`, `<nav>`), text-to-HTML density, and client-side rendering (CSR) dependency detection.
  3. **Structured Data (20%):** Schema.org JSON-LD parsing, `@context` and `@type` validity, core entity detection (Organization, Person, WebSite, Article, Product, FAQPage), identity attributes (`name`, `url`), and `sameAs` authority verification links.
  4. **Entity Clarity (20%):** Cross-source entity disambiguation between Title, H1, meta tags, visible text, JSON-LD, Open Graph, author metadata, footer branding, and external social profiles. Calculates an **Entity Consistency Score**.
  5. **Answer Readiness (20%):** Deterministic heuristic evaluation of core user questions tailored to detected site classification (developer portfolio, company, product/SaaS, or general).
- **Real-Time Streaming Progress:** Server-Sent Events (SSE) streaming updates the UI stage-by-stage with zero simulated or fake delays.
- **Developer-Focused SaaS Interface:** Sleek dark-mode aesthetic with accessible contrast, clear typography, and expandable cards detailing:
  - *[What we found]*
  - *[Why it matters]*
  - *[How to improve]*

---

## 🛠️ Tech Stack

- **Framework:** [Next.js](https://nextjs.org/) (App Router, Node.js runtime)
- **Language:** [TypeScript](https://www.typescriptlang.org/)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/)
- **HTML Parser:** [Cheerio](https://cheerio.js.org/)
- **Icons:** [Lucide React](https://lucide.dev/)
- **Database:** None (Stateless MVP)
- **Auth:** None (Free & Open)

---

## 📂 Project Architecture

```
├── app/
│   ├── api/
│   │   └── analyze/
│   │       └── route.ts         # POST /api/analyze (JSON & SSE streaming)
│   ├── globals.css              # Dark theme styling & scrollbars
│   ├── layout.tsx               # Root layout, branding, and JSON-LD schema
│   ├── page.tsx                 # Home page hero & framework architecture
│   ├── robots.ts                # Robots metadata for the checker
│   └── sitemap.ts               # Sitemap metadata
├── components/
│   ├── AuditProgress.tsx        # Real-time multi-stage audit progress
│   ├── CategoryCard.tsx         # Expandable category score & details card
│   ├── CheckResult.tsx          # Individual rule result card with recommendations
│   ├── Report.tsx               # Complete report layout with filtering
│   ├── ScoreCard.tsx            # Score hero, rating, and quick matrix
│   └── UrlAnalyzer.tsx          # Interactive URL input & state management
├── lib/
│   ├── audit/
│   │   ├── answer-readiness.ts  # Deterministic question coverage heuristics
│   │   ├── content.ts           # HTML structure & semantic landmarks audit
│   │   ├── crawlability.ts      # Crawlability, robots.txt, sitemap audit
│   │   ├── entity.ts            # Entity consistency & disambiguation engine
│   │   ├── orchestrator.ts      # Concurrent fetcher & audit coordinator
│   │   ├── scoring.ts           # 100-point weighted score compiler
│   │   ├── structured-data.ts   # JSON-LD Schema.org parser & validator
│   │   └── types.ts             # Comprehensive TypeScript audit interfaces
│   ├── parsers/
│   │   ├── html.ts              # Cheerio-based HTML DOM parser
│   │   ├── jsonld.ts            # JSON-LD graph flattener & extractor
│   │   ├── robots.ts            # Robots.txt parser with AI bot detection
│   │   └── sitemap.ts           # XML sitemap validator
│   └── security/
│       └── url-validation.ts    # SSRF protection, IP filtering, & safeFetch
└── public/
    └── llms.txt                 # Optional LLM documentation convention
```

---

## ⚖️ Scoring Calculation Explained

The audit produces a score from **0 to 100**, calculated using five weighted categories (20 points each):

$$\text{Final Score} = (\text{Crawlability} \times 0.20) + (\text{Content} \times 0.20) + (\text{StructuredData} \times 0.20) + (\text{Entity} \times 0.20) + (\text{AnswerReadiness} \times 0.20)$$

### 1. AI Crawlability (100 category points $\rightarrow$ 20% weight)
- HTTPS encryption enabled: `+15`
- HTTP 200 response status: `+15`
- robots.txt accessible: `+15`
- General crawlers permitted (no wildcard block): `+20`
- AI bot directives review (GPTBot, ClaudeBot, etc.): `+5`
- XML Sitemap accessible & valid: `+15`
- Canonical URL defined & valid: `+15`
- *llms.txt check: Informational only (`INFO`), does not penalize score.*

### 2. Content Structure (100 category points $\rightarrow$ 20% weight)
- Title tag presence & optimal length (20–70 chars): `+12`
- Meta description presence & length (70–170 chars): `+12`
- Single primary H1 heading: `+12`
- H2/H3 heading hierarchy & subheadings: `+10`
- Heading tag hygiene (no empty tags): `+6`
- Title & H1 complementarity (not identical): `+6`
- HTML `lang` attribute declared: `+8`
- Main semantic container (`<main>` or `<article>`): `+10`
- Semantic HTML tags (`<nav>`, `<header>`, `<footer>`, `<section>`): `+10`
- Text content depth (word count $\ge$ 250): `+10`
- Text-to-HTML ratio ($\ge$ 10%): `+10`
- Server-rendered content (no CSR-only dependency): `+10`

### 3. Structured Data (100 category points $\rightarrow$ 20% weight)
- JSON-LD blocks present: `+20`
- JSON-LD syntax valid without parse errors: `+15`
- Standard Schema.org `@context` & `@type`: `+15`
- Recognized Schema type detected (Person, Organization, WebSite, etc.): `+20`
- Core entity properties (`name` & `url`): `+15`
- `sameAs` authority verification links: `+15`

### 4. Entity Clarity (100 category points $\rightarrow$ 20% weight)
- Clear primary entity resolved: `+20`
- Title entity alignment: `+15`
- Machine-readable entity in JSON-LD: `+15`
- External authority profiles (sameAs / GitHub / LinkedIn): `+15`
- Visible content entity context (body mentions): `+15`
- Author & publisher metadata: `+10`
- Footer copyright & brand consistency: `+10`

### 5. Answer Readiness (100 category points $\rightarrow$ 20% weight)
- Tailored to site classification (e.g., Portfolio, Company, or Product).
- 5 core domain questions evaluated deterministically via headings and content: `20 pts each` (high confidence = 20, medium = 16, partial = 12, missing = 0).

### Qualitative Rating Scale
- **85 – 100:** Excellent AI Search Readiness
- **70 – 84:** Good AI Search Readiness
- **55 – 69:** Fair AI Search Readiness
- **40 – 54:** Needs Improvement
- **0 – 39:** Poor AI Search Readiness

---

## 💻 Local Development & Running

### Prerequisites
- Node.js `v20.x` or later
- npm `10.x` or later

### Installation
```bash
# Clone the repository
git clone https://github.com/SkyDevLab/Aieo.git
cd Aieo

# Install dependencies
npm install
```

### Running Locally
```bash
# Start Next.js development server
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### Running Quality Checks & Tests
```bash
# Run TypeScript typechecks
npm run typecheck

# Run Next.js ESLint
npm run lint

# Run end-to-end audit heuristics & SSRF security tests
npm test

# Build for production
npm run build

# Start production server
npm start
```

---

## 🔒 Security & SSRF Defenses

1. **Protocol Restriction:** Only `http:` and `https:` URLs are accepted.
2. **Credential Ban:** URLs containing embedded user credentials (`user:pass@host`) are rejected.
3. **Private Hostname Blocking:** Rejects `localhost`, `*.local`, `*.internal`, `*.lan`.
4. **DNS & IP Filtering:** Resolves the hostname via DNS and blocks:
   - Loopback (`127.0.0.0/8`, `::1`)
   - RFC 1918 Private networks (`10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`)
   - Link-local & Cloud Metadata (`169.254.0.0/16`, including AWS/GCP `169.254.169.254`)
   - Shared address space / CGNAT (`100.64.0.0/10`)
   - IPv6 Unique Local (`fc00::/7`) and Link-local (`fe80::/10`)
5. **Redirect Re-validation:** Every HTTP redirect hop (up to 5 max) is re-validated through the full SSRF pipeline before the next request is made.
6. **Streaming Size Limit:** Body responses are streamed with an early abort cap (2.5MB max) to protect server memory.
7. **Timeout Protection:** Configurable timeouts (8s for main page, 4-5s for auxiliary files) prevent hanging connections.
8. **No Client JS Execution:** HTML is analyzed purely via static DOM parsing (Cheerio). No untrusted JavaScript is executed on the server.

---

## 📄 License & Credits

- **Product:** Website AIEO Checker
- **Brand:** SkyDevLab
- **License:** MIT License
