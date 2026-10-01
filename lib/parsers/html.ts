import * as cheerio from 'cheerio';
import { NavLinkItem } from '../audit/types';

export interface HeadingInfo {
  tag: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
  level: number;
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
  metaRobots: {
    raw: string | null;
    hasNoindex: boolean;
    hasNofollow: boolean;
    hasNosnippet: boolean;
    maxSnippet: string | null;
  };
  headings: HeadingInfo[];
  h1List: string[];
  h2List: string[];
  h3List: string[];
  emptyHeadingsCount: number;
  headingOrderValid: boolean;
  skippedHeadingLevels: string[];
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
    phones: string[];
    address?: string;
  };
  linksAnalysis: {
    totalLinks: number;
    internalLinks: NavLinkItem[];
    externalLinks: NavLinkItem[];
    emptyLinksCount: number;
    genericAnchorCount: number;
    suspiciousLinks: string[];
    iaCategories: {
      about: string[];
      pricing: string[];
      products: string[];
      services: string[];
      contact: string[];
      docs: string[];
      blog: string[];
      legal: string[];
    };
  };
  evidenceSignals: {
    hasTestimonials: boolean;
    hasPricing: boolean;
    hasCompanyInfo: boolean;
    hasContactInfo: boolean;
    hasDocumentation: boolean;
    hasCaseStudies: boolean;
    hasCertifications: boolean;
    hasPartners: boolean;
    hasProductScreenshots: boolean;
    snippets: Record<string, string>;
  };
  detectedIntents: string[];
}

const SOCIAL_PATTERNS: { platform: string; regex: RegExp }[] = [
  { platform: 'GitHub', regex: /https?:\/\/(www\.)?github\.com\/([a-zA-Z0-9_-]+)/i },
  { platform: 'LinkedIn', regex: /https?:\/\/(www\.)?linkedin\.com\/(in|company)\/([a-zA-Z0-9_-]+)/i },
  { platform: 'X/Twitter', regex: /https?:\/\/(www\.)?(twitter\.com|x\.com)\/([a-zA-Z0-9_]+)/i },
  { platform: 'YouTube', regex: /https?:\/\/(www\.)?youtube\.com\/(@?[a-zA-Z0-9_-]+)/i },
  { platform: 'Bluesky', regex: /https?:\/\/(www\.)?bsky\.app\/profile\/([a-zA-Z0-9_.-]+)/i },
];

const GENERIC_ANCHOR_TEXTS = new Set([
  'click here',
  'click',
  'here',
  'read more',
  'learn more',
  'more',
  'link',
  'view more',
  'continue',
  'details',
  'check this out',
  'this link',
]);

export function parseHtml(html: string, baseUrl?: string): ExtractedHtmlData {
  const $ = cheerio.load(html);

  // Parse Meta Robots
  const robotsMeta =
    $('meta[name="robots" i]').attr('content')?.toLowerCase() ||
    $('meta[name="googlebot" i]').attr('content')?.toLowerCase() ||
    null;

  let hasNoindex = false;
  let hasNofollow = false;
  let hasNosnippet = false;
  let maxSnippet: string | null = null;

  if (robotsMeta) {
    hasNoindex = robotsMeta.includes('noindex');
    hasNofollow = robotsMeta.includes('nofollow');
    hasNosnippet = robotsMeta.includes('nosnippet');
    const snippetMatch = robotsMeta.match(/max-snippet:(-?\d+)/);
    if (snippetMatch) maxSnippet = snippetMatch[1];
  }

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

  // Headings analysis & sequence verification
  const headings: HeadingInfo[] = [];
  const h1List: string[] = [];
  const h2List: string[] = [];
  const h3List: string[] = [];
  let emptyHeadingsCount = 0;
  const skippedHeadingLevels: string[] = [];

  let lastHeadingLevel = 0;

  $('h1, h2, h3, h4, h5, h6').each((_, el) => {
    const tagName = el.tagName.toLowerCase() as HeadingInfo['tag'];
    const level = parseInt(tagName.charAt(1), 10);
    const text = $(el).text().trim();
    const isEmpty = text.length === 0;

    if (isEmpty) {
      emptyHeadingsCount++;
    }

    headings.push({ tag: tagName, level, text, isEmpty });

    if (tagName === 'h1' && !isEmpty) h1List.push(text);
    if (tagName === 'h2' && !isEmpty) h2List.push(text);
    if (tagName === 'h3' && !isEmpty) h3List.push(text);

    // Check heading order skipping (e.g. H1 directly to H3 or H4)
    if (lastHeadingLevel > 0 && level > lastHeadingLevel + 1) {
      skippedHeadingLevels.push(`Skipped from H${lastHeadingLevel} to H${level} ("${text.slice(0, 30)}")`);
    }
    lastHeadingLevel = level;
  });

  const headingOrderValid = skippedHeadingLevels.length === 0;

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
  const seenSocialUrls = new Set<string>();

  // Links & Information Architecture Analysis
  let emptyLinksCount = 0;
  let genericAnchorCount = 0;
  const internalNavLinks: NavLinkItem[] = [];
  const externalNavLinks: NavLinkItem[] = [];
  const suspiciousLinks: string[] = [];

  const iaCategories = {
    about: [] as string[],
    pricing: [] as string[],
    products: [] as string[],
    services: [] as string[],
    contact: [] as string[],
    docs: [] as string[],
    blog: [] as string[],
    legal: [] as string[],
  };

  let parsedBaseDomain = '';
  if (baseUrl) {
    try {
      parsedBaseDomain = new URL(baseUrl).hostname.replace(/^www\./, '');
    } catch {
      parsedBaseDomain = '';
    }
  }

  $('a[href]').each((_, el) => {
    const rawHref = $(el).attr('href')?.trim() || '';
    const linkText = $(el).text().replace(/\s+/g, ' ').trim();
    const ariaLabel = $(el).attr('aria-label')?.trim();
    const effectiveText = linkText || ariaLabel || '';

    // Check empty link
    if (!effectiveText) {
      emptyLinksCount++;
    } else if (GENERIC_ANCHOR_TEXTS.has(effectiveText.toLowerCase())) {
      genericAnchorCount++;
    }

    // Check social profiles
    for (const item of SOCIAL_PATTERNS) {
      if (item.regex.test(rawHref) && !seenSocialUrls.has(rawHref)) {
        seenSocialUrls.add(rawHref);
        detectedSocialLinks.push({ platform: item.platform, url: rawHref });
      }
    }

    // Check internal vs external
    let isInternal = false;
    let fullUrl = rawHref;

    if (rawHref.startsWith('/') || rawHref.startsWith('#') || rawHref.startsWith('./')) {
      isInternal = true;
      if (baseUrl) {
        try {
          fullUrl = new URL(rawHref, baseUrl).toString();
        } catch {
          fullUrl = rawHref;
        }
      }
    } else if (rawHref.startsWith('http://') || rawHref.startsWith('https://')) {
      try {
        const parsed = new URL(rawHref);
        const host = parsed.hostname.replace(/^www\./, '');
        if (parsedBaseDomain && (host === parsedBaseDomain || host.endsWith(`.${parsedBaseDomain}`))) {
          isInternal = true;
        }
      } catch {
        isInternal = false;
      }
    } else if (rawHref.startsWith('javascript:') || rawHref.startsWith('data:')) {
      suspiciousLinks.push(rawHref);
      return;
    }

    // Categorize IA Link
    const textLower = effectiveText.toLowerCase();
    const hrefLower = rawHref.toLowerCase();
    let category: NavLinkItem['category'] = 'Other';

    if (hrefLower.includes('about') || textLower.includes('about') || textLower.includes('who we are')) {
      category = 'About';
      iaCategories.about.push(effectiveText || fullUrl);
    } else if (hrefLower.includes('pricing') || hrefLower.includes('plan') || textLower.includes('pricing')) {
      category = 'Pricing';
      iaCategories.pricing.push(effectiveText || fullUrl);
    } else if (hrefLower.includes('product') || hrefLower.includes('feature') || textLower.includes('product')) {
      category = 'Products';
      iaCategories.products.push(effectiveText || fullUrl);
    } else if (hrefLower.includes('service') || hrefLower.includes('solution') || textLower.includes('service')) {
      category = 'Services';
      iaCategories.services.push(effectiveText || fullUrl);
    } else if (hrefLower.includes('contact') || hrefLower.includes('support') || textLower.includes('contact')) {
      category = 'Contact';
      iaCategories.contact.push(effectiveText || fullUrl);
    } else if (hrefLower.includes('doc') || hrefLower.includes('guide') || hrefLower.includes('api') || textLower.includes('documentation')) {
      category = 'Documentation';
      iaCategories.docs.push(effectiveText || fullUrl);
    } else if (hrefLower.includes('blog') || hrefLower.includes('article') || hrefLower.includes('news') || textLower.includes('blog')) {
      category = 'Blog';
      iaCategories.blog.push(effectiveText || fullUrl);
    } else if (hrefLower.includes('privacy') || hrefLower.includes('terms') || hrefLower.includes('legal') || textLower.includes('privacy')) {
      category = 'Legal';
      iaCategories.legal.push(effectiveText || fullUrl);
    }

    const item: NavLinkItem = {
      category,
      label: effectiveText || rawHref,
      url: fullUrl,
      isExternal: !isInternal,
    };

    if (isInternal) {
      internalNavLinks.push(item);
    } else {
      externalNavLinks.push(item);
    }
  });

  // Contact signals
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  const foundEmails = Array.from(new Set(rawVisibleText.match(emailRegex) || []));
  const phoneRegex = /(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g;
  const foundPhones = Array.from(new Set(rawVisibleText.match(phoneRegex) || []));

  const hasEmail = foundEmails.length > 0 || $('a[href^="mailto:"]').length > 0;
  const hasPhone = foundPhones.length > 0 || $('a[href^="tel:"]').length > 0;
  const hasContactLink = iaCategories.contact.length > 0;

  // Evidence Signals Detection
  const pageHtmlLower = html.toLowerCase();
  const visibleLower = rawVisibleText.toLowerCase();

  const hasTestimonials =
    /testimonial|reviews|what clients say|what customers say|customer feedback/i.test(pageHtmlLower) ||
    /testimonial|client quote|customer review/i.test(visibleLower);

  const hasPricing =
    iaCategories.pricing.length > 0 ||
    /pricing plans|\/month|\/mo|\$|\₹|€|starting at|per user/i.test(visibleLower);

  const hasCompanyInfo =
    iaCategories.about.length > 0 ||
    /about us|our story|founded in|incorporated in|company overview/i.test(visibleLower);

  const hasContactInfo = hasEmail || hasPhone || hasContactLink;

  const hasDocumentation =
    iaCategories.docs.length > 0 ||
    /documentation|developer docs|api reference|getting started guide/i.test(visibleLower);

  const hasCaseStudies =
    /case stud|customer success|portfolio|our work|success stories/i.test(visibleLower) ||
    /case-stud|case_stud|portfolio/i.test(pageHtmlLower);

  const hasCertifications =
    /certified|certification|accredited|iso 27001|soc 2|award-winning/i.test(visibleLower);

  const hasPartners =
    /partners|trusted by|our clients|integrations|featured in/i.test(visibleLower);

  const hasProductScreenshots =
    $('img[alt*="screenshot" i], img[alt*="dashboard" i], img[alt*="interface" i], img[alt*="preview" i]').length > 0;

  // Extract Salient Intent Concepts
  const detectedIntentsSet = new Set<string>();

  // Extract from Headings
  for (const h of headings) {
    if (h.text.length >= 4 && h.text.length <= 50 && !h.isEmpty) {
      const cleaned = h.text.replace(/[^a-zA-Z0-9\s-]/g, '').trim();
      if (cleaned.length > 3) {
        detectedIntentsSet.add(cleaned);
      }
    }
  }

  // Add specific detected feature domains
  const DOMAIN_CONCEPTS = [
    'inventory management',
    'furniture retail',
    'showroom management',
    'store management',
    'billing & invoicing',
    'crm & leads',
    'production tracking',
    'reporting & analytics',
    'pos / point of sale',
    'e-commerce integration',
    'catalog management',
    'supply chain',
    'multi-store sync',
  ];

  for (const concept of DOMAIN_CONCEPTS) {
    if (visibleLower.includes(concept) || pageHtmlLower.includes(concept.replace(/\s+/g, '-'))) {
      detectedIntentsSet.add(concept.charAt(0).toUpperCase() + concept.slice(1));
    }
  }

  // CSR detection heuristic
  let isClientRenderedSuspect = false;
  let clientRenderedReason: string | undefined;

  const hasSpaContainer = $('#root, #__next, #app, [id="app"], app-root').length > 0;
  const noscriptText = $('noscript').text().toLowerCase();
  const mentionsJsRequirement =
    noscriptText.includes('javascript') ||
    noscriptText.includes('enable js') ||
    noscriptText.includes('run this app');

  if (hasSpaContainer && wordCount < 60) {
    isClientRenderedSuspect = true;
    clientRenderedReason =
      'Single-page application container found with extremely low raw HTML word count (<60 words). Critical content likely relies on client-side JS.';
  } else if (mentionsJsRequirement && wordCount < 80) {
    isClientRenderedSuspect = true;
    clientRenderedReason =
      'Page displays a JavaScript requirement notice in <noscript> and contains minimal static content.';
  } else if (wordCount < 40 && $('script[src]').length > 2) {
    isClientRenderedSuspect = true;
    clientRenderedReason =
      'Very low initial text content (<40 words) accompanied by client script tags.';
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
    metaRobots: {
      raw: robotsMeta,
      hasNoindex,
      hasNofollow,
      hasNosnippet,
      maxSnippet,
    },
    headings,
    h1List,
    h2List,
    h3List,
    emptyHeadingsCount,
    headingOrderValid,
    skippedHeadingLevels,
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
      phones: foundPhones.slice(0, 3),
    },
    linksAnalysis: {
      totalLinks: internalNavLinks.length + externalNavLinks.length,
      internalLinks: internalNavLinks.slice(0, 40),
      externalLinks: externalNavLinks.slice(0, 20),
      emptyLinksCount,
      genericAnchorCount,
      suspiciousLinks,
      iaCategories,
    },
    evidenceSignals: {
      hasTestimonials,
      hasPricing,
      hasCompanyInfo,
      hasContactInfo,
      hasDocumentation,
      hasCaseStudies,
      hasCertifications,
      hasPartners,
      hasProductScreenshots,
      snippets: {
        testimonials: hasTestimonials ? 'Customer testimonials / client feedback discovered' : '',
        pricing: hasPricing ? 'Transparent pricing tiers or billing information located' : '',
        company: hasCompanyInfo ? 'Company profile and operational background identified' : '',
        contact: hasContactInfo ? 'Direct email, phone, or inquiry channels found' : '',
        docs: hasDocumentation ? 'Documentation or guide references located' : '',
      },
    },
    detectedIntents: Array.from(detectedIntentsSet).slice(0, 15),
  };
}
