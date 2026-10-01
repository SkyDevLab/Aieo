import * as cheerio from 'cheerio';

export interface HeadingInfo {
  tag: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
  text: string;
  isEmpty: boolean;
}

export interface ExtractedHtmlData {
  title: string | null;
  titleLength: number;
  metaDescription: string | null;
  metaDescriptionLength: number;
  openGraph: {
    title: string | null;
    description: string | null;
    siteName: string | null;
    type: string | null;
    url: string | null;
  };
  author: string | null;
  canonicalUrl: string | null;
  language: string | null;
  headings: HeadingInfo[];
  h1List: string[];
  h2List: string[];
  h3List: string[];
  emptyHeadingsCount: number;
  hasMainTag: boolean;
  hasArticleTag: boolean;
  hasNavTag: boolean;
  hasHeaderTag: boolean;
  hasFooterTag: boolean;
  hasSectionTag: boolean;
  semanticTagsFound: string[];
  visibleText: string;
  wordCount: number;
  rawHtmlLength: number;
  textToHtmlRatio: number; // percentage 0 - 100
  isClientRenderedSuspect: boolean;
  clientRenderedReason?: string;
  detectedSocialLinks: { platform: string; url: string }[];
  footerText: string;
  contactSignals: {
    hasEmail: boolean;
    hasPhone: boolean;
    hasContactLink: boolean;
    emails: string[];
  };
}

const SOCIAL_PATTERNS: { platform: string; regex: RegExp }[] = [
  { platform: 'GitHub', regex: /https?:\/\/(www\.)?github\.com\/([a-zA-Z0-9_-]+)/i },
  { platform: 'LinkedIn', regex: /https?:\/\/(www\.)?linkedin\.com\/(in|company)\/([a-zA-Z0-9_-]+)/i },
  { platform: 'X/Twitter', regex: /https?:\/\/(www\.)?(twitter\.com|x\.com)\/([a-zA-Z0-9_]+)/i },
  { platform: 'YouTube', regex: /https?:\/\/(www\.)?youtube\.com\/(@?[a-zA-Z0-9_-]+)/i },
  { platform: 'Bluesky', regex: /https?:\/\/(www\.)?bsky\.app\/profile\/([a-zA-Z0-9_.-]+)/i },
];

export function parseHtml(html: string, baseUrl?: string): ExtractedHtmlData {
  const $ = cheerio.load(html);

  // Remove non-content elements before computing visible text
  const cloned = cheerio.load(html);
  cloned('script, style, noscript, svg, iframe, object, embed').remove();
  const rawVisibleText = cloned('body').text().replace(/\s+/g, ' ').trim();
  const words = rawVisibleText ? rawVisibleText.split(/\s+/).filter(Boolean) : [];
  const wordCount = words.length;

  const rawHtmlLength = html.length;
  const textLength = rawVisibleText.length;
  const textToHtmlRatio = rawHtmlLength > 0 ? (textLength / rawHtmlLength) * 100 : 0;

  // Title
  const titleTag = $('title').first().text().trim();
  const title = titleTag || null;
  const titleLength = title ? title.length : 0;

  // Meta description
  const metaDesc =
    $('meta[name="description" i]').attr('content')?.trim() ||
    $('meta[property="og:description" i]').attr('content')?.trim() ||
    null;

  // Open Graph
  const openGraph = {
    title: $('meta[property="og:title" i]').attr('content')?.trim() || null,
    description: $('meta[property="og:description" i]').attr('content')?.trim() || null,
    siteName: $('meta[property="og:site_name" i]').attr('content')?.trim() || null,
    type: $('meta[property="og:type" i]').attr('content')?.trim() || null,
    url: $('meta[property="og:url" i]').attr('content')?.trim() || null,
  };

  // Author
  const author =
    $('meta[name="author" i]').attr('content')?.trim() ||
    $('meta[name="creator" i]').attr('content')?.trim() ||
    $('meta[name="publisher" i]').attr('content')?.trim() ||
    null;

  // Canonical URL
  const canonicalHref = $('link[rel="canonical" i]').attr('href')?.trim() || null;
  let canonicalUrl = canonicalHref;
  if (canonicalHref && baseUrl) {
    try {
      canonicalUrl = new URL(canonicalHref, baseUrl).toString();
    } catch {
      canonicalUrl = canonicalHref;
    }
  }

  // Language attribute
  const language = $('html').attr('lang')?.trim() || null;

  // Headings analysis
  const headings: HeadingInfo[] = [];
  const h1List: string[] = [];
  const h2List: string[] = [];
  const h3List: string[] = [];
  let emptyHeadingsCount = 0;

  $('h1, h2, h3, h4, h5, h6').each((_, el) => {
    const tagName = el.tagName.toLowerCase() as HeadingInfo['tag'];
    const text = $(el).text().trim();
    const isEmpty = text.length === 0;

    if (isEmpty) {
      emptyHeadingsCount++;
    }

    headings.push({ tag: tagName, text, isEmpty });

    if (tagName === 'h1' && !isEmpty) h1List.push(text);
    if (tagName === 'h2' && !isEmpty) h2List.push(text);
    if (tagName === 'h3' && !isEmpty) h3List.push(text);
  });

  // Semantic landmarks
  const hasMainTag = $('main').length > 0;
  const hasArticleTag = $('article').length > 0;
  const hasNavTag = $('nav').length > 0;
  const hasHeaderTag = $('header').length > 0;
  const hasFooterTag = $('footer').length > 0;
  const hasSectionTag = $('section').length > 0;

  const semanticTagsFound: string[] = [];
  if (hasMainTag) semanticTagsFound.push('<main>');
  if (hasArticleTag) semanticTagsFound.push('<article>');
  if (hasHeaderTag) semanticTagsFound.push('<header>');
  if (hasNavTag) semanticTagsFound.push('<nav>');
  if (hasFooterTag) semanticTagsFound.push('<footer>');
  if (hasSectionTag) semanticTagsFound.push('<section>');

  // Footer text
  const footerText = $('footer').text().replace(/\s+/g, ' ').trim();

  // Social links extraction
  const detectedSocialLinks: { platform: string; url: string }[] = [];
  const seenUrls = new Set<string>();

  $('a[href]').each((_, el) => {
    const href = $(el).attr('href')?.trim();
    if (!href) return;

    for (const item of SOCIAL_PATTERNS) {
      if (item.regex.test(href) && !seenUrls.has(href)) {
        seenUrls.add(href);
        detectedSocialLinks.push({ platform: item.platform, url: href });
      }
    }
  });

  // Contact signals
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  const foundEmails = Array.from(new Set(rawVisibleText.match(emailRegex) || []));
  const hasEmail = foundEmails.length > 0 || $('a[href^="mailto:"]').length > 0;
  const hasPhone = $('a[href^="tel:"]').length > 0 || /(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/.test(rawVisibleText);
  const hasContactLink = $('a[href*="contact" i]').length > 0;

  // CSR detection heuristic:
  // SPA shells (React, Vue, Angular) often deliver near-empty HTML body with a single container div
  let isClientRenderedSuspect = false;
  let clientRenderedReason: string | undefined;

  const hasSpaContainer =
    $('#root, #__next, #app, [id="app"], app-root').length > 0;
  const noscriptText = $('noscript').text().toLowerCase();
  const mentionsJsRequirement =
    noscriptText.includes('javascript') ||
    noscriptText.includes('enable js') ||
    noscriptText.includes('run this app');

  if (hasSpaContainer && wordCount < 60) {
    isClientRenderedSuspect = true;
    clientRenderedReason =
      'Single-page application container found (#root/#app) with extremely low raw HTML word count (<60 words). Critical content likely relies on client-side JavaScript execution.';
  } else if (mentionsJsRequirement && wordCount < 80) {
    isClientRenderedSuspect = true;
    clientRenderedReason =
      'Page displays a JavaScript requirement notice in <noscript> and contains minimal static content. AI crawlers may not execute client-side bundles.';
  } else if (wordCount < 40 && $('script[src]').length > 2) {
    isClientRenderedSuspect = true;
    clientRenderedReason =
      'Very low initial text content (<40 words) accompanied by heavy JavaScript script tags, indicating potential client-rendered hydration dependency.';
  }

  return {
    title,
    titleLength,
    metaDescription: metaDesc,
    metaDescriptionLength: metaDesc ? metaDesc.length : 0,
    openGraph,
    author,
    canonicalUrl,
    language,
    headings,
    h1List,
    h2List,
    h3List,
    emptyHeadingsCount,
    hasMainTag,
    hasArticleTag,
    hasNavTag,
    hasHeaderTag,
    hasFooterTag,
    hasSectionTag,
    semanticTagsFound,
    visibleText: rawVisibleText,
    wordCount,
    rawHtmlLength,
    textToHtmlRatio: Number(textToHtmlRatio.toFixed(2)),
    isClientRenderedSuspect,
    clientRenderedReason,
    detectedSocialLinks,
    footerText,
    contactSignals: {
      hasEmail,
      hasPhone,
      hasContactLink,
      emails: foundEmails.slice(0, 3),
    },
  };
}
