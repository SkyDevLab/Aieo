import * as cheerio from 'cheerio';

export interface RawJsonLdObject {
  raw: unknown;
  context?: string;
  type?: string;
  name?: string;
  url?: string;
  sameAs?: string[];
  description?: string;
  author?: unknown;
  publisher?: unknown;
  hasErrors?: boolean;
}

export interface ParsedJsonLdData {
  hasJsonLd: boolean;
  rawBlocksCount: number;
  parseErrors: string[];
  objects: RawJsonLdObject[];
  detectedTypes: string[];
  hasContext: boolean;
  hasType: boolean;
  hasName: boolean;
  hasUrl: boolean;
  sameAsList: string[];
  personSchemas: RawJsonLdObject[];
  organizationSchemas: RawJsonLdObject[];
  webSiteSchemas: RawJsonLdObject[];
  webPageSchemas: RawJsonLdObject[];
  articleSchemas: RawJsonLdObject[];
  productSchemas: RawJsonLdObject[];
  faqPageSchemas: RawJsonLdObject[];
  breadcrumbSchemas: RawJsonLdObject[];
  localBusinessSchemas: RawJsonLdObject[];
  consistencyIssues: string[];
}

const SUPPORTED_TYPES = [
  'Person',
  'Organization',
  'WebSite',
  'WebPage',
  'Article',
  'NewsArticle',
  'BlogPosting',
  'Product',
  'FAQPage',
  'BreadcrumbList',
  'LocalBusiness',
  'SoftwareApplication',
] as const;

/**
 * Normalizes Schema.org type names (e.g. "https://schema.org/Person" -> "Person")
 */
function normalizeType(typeStr: unknown): string[] {
  if (!typeStr) return [];
  if (Array.isArray(typeStr)) {
    return typeStr.flatMap((t) => normalizeType(t));
  }
  if (typeof typeStr === 'string') {
    const cleaned = typeStr.split(/[\/#]/).pop() || typeStr;
    return [cleaned.trim()];
  }
  return [];
}

/**
 * Safely extracts string array for sameAs
 */
function extractSameAs(sameAsVal: unknown): string[] {
  if (!sameAsVal) return [];
  if (typeof sameAsVal === 'string') return [sameAsVal];
  if (Array.isArray(sameAsVal)) {
    return sameAsVal.filter((s): s is string => typeof s === 'string' && s.length > 0);
  }
  return [];
}

/**
 * Recursively flattens JSON-LD nodes (handles @graph, nested items, etc.)
 */
function flattenJsonLdNodes(item: unknown, collected: RawJsonLdObject[]) {
  if (!item || typeof item !== 'object') return;

  if (Array.isArray(item)) {
    for (const sub of item) {
      flattenJsonLdNodes(sub, collected);
    }
    return;
  }

  const record = item as Record<string, unknown>;

  // Handle @graph array
  if (Array.isArray(record['@graph'])) {
    flattenJsonLdNodes(record['@graph'], collected);
  }

  const types = normalizeType(record['@type']);
  const context = typeof record['@context'] === 'string' ? record['@context'] : undefined;
  const name = typeof record['name'] === 'string' ? record['name'] : undefined;
  const url = typeof record['url'] === 'string' ? record['url'] : undefined;
  const description = typeof record['description'] === 'string' ? record['description'] : undefined;
  const sameAs = extractSameAs(record['sameAs']);

  if (types.length > 0 || name || url) {
    for (const type of types.length > 0 ? types : ['Thing']) {
      collected.push({
        raw: record,
        context,
        type,
        name,
        url,
        sameAs,
        description,
        author: record['author'],
        publisher: record['publisher'],
      });
    }
  }

  // Also inspect child objects like mainEntity, publisher, author
  for (const key of Object.keys(record)) {
    if (['author', 'publisher', 'mainEntity', 'creator'].includes(key)) {
      flattenJsonLdNodes(record[key], collected);
    }
  }
}

export function parseJsonLd(html: string): ParsedJsonLdData {
  const $ = cheerio.load(html);
  const scripts = $('script[type="application/ld+json"]');

  const rawBlocksCount = scripts.length;
  const parseErrors: string[] = [];
  const flattened: RawJsonLdObject[] = [];

  scripts.each((i, el) => {
    const rawContent = $(el).text().trim();
    if (!rawContent) return;

    try {
      const parsed = JSON.parse(rawContent);
      flattenJsonLdNodes(parsed, flattened);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown JSON syntax error';
      parseErrors.push(`Block #${i + 1}: Failed to parse JSON-LD (${message})`);
    }
  });

  const detectedTypesSet = new Set<string>();
  const sameAsSet = new Set<string>();
  let hasContext = false;
  let hasType = false;
  let hasName = false;
  let hasUrl = false;

  for (const obj of flattened) {
    if (obj.context) hasContext = true;
    if (obj.type) {
      hasType = true;
      detectedTypesSet.add(obj.type);
    }
    if (obj.name) hasName = true;
    if (obj.url) hasUrl = true;
    if (obj.sameAs) {
      for (const s of obj.sameAs) sameAsSet.add(s);
    }
  }

  const detectedTypes = Array.from(detectedTypesSet);
  const sameAsList = Array.from(sameAsSet);

  const personSchemas = flattened.filter((o) => o.type === 'Person');
  const organizationSchemas = flattened.filter((o) =>
    o.type === 'Organization' || o.type === 'LocalBusiness' || o.type === 'Corporation'
  );
  const webSiteSchemas = flattened.filter((o) => o.type === 'WebSite');
  const webPageSchemas = flattened.filter((o) => o.type === 'WebPage');
  const articleSchemas = flattened.filter((o) =>
    ['Article', 'NewsArticle', 'BlogPosting'].includes(o.type || '')
  );
  const productSchemas = flattened.filter((o) => o.type === 'Product');
  const faqPageSchemas = flattened.filter((o) => o.type === 'FAQPage');
  const breadcrumbSchemas = flattened.filter((o) => o.type === 'BreadcrumbList');
  const localBusinessSchemas = flattened.filter((o) => o.type === 'LocalBusiness');

  // Consistency checks
  const consistencyIssues: string[] = [];

  // Check if Person or Organization schemas lack names
  for (const p of personSchemas) {
    if (!p.name) {
      consistencyIssues.push('A Person schema is declared without a "name" property.');
    }
  }
  for (const org of organizationSchemas) {
    if (!org.name) {
      consistencyIssues.push('An Organization schema is declared without a "name" property.');
    }
  }

  return {
    hasJsonLd: rawBlocksCount > 0,
    rawBlocksCount,
    parseErrors,
    objects: flattened,
    detectedTypes,
    hasContext: hasContext || (flattened.length > 0 && flattened.some((o) => !!o.context)),
    hasType,
    hasName,
    hasUrl,
    sameAsList,
    personSchemas,
    organizationSchemas,
    webSiteSchemas,
    webPageSchemas,
    articleSchemas,
    productSchemas,
    faqPageSchemas,
    breadcrumbSchemas,
    localBusinessSchemas,
    consistencyIssues,
  };
}
