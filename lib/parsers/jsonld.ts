import * as cheerio from 'cheerio';

export interface RawJsonLdObject {
  raw: Record<string, unknown>;
  id?: string;
  context?: string;
  type?: string;
  name?: string;
  description?: string;
  url?: string;
  image?: string;
  sameAs?: string[];
  author?: unknown;
  publisher?: unknown;
  brand?: unknown;
  offers?: unknown;
  aggregateRating?: unknown;
  address?: unknown;
  contactPoint?: unknown;
  mainEntity?: unknown;
  mainEntityOfPage?: unknown;
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
  blogPostingSchemas: RawJsonLdObject[];
  productSchemas: RawJsonLdObject[];
  serviceSchemas: RawJsonLdObject[];
  softwareAppSchemas: RawJsonLdObject[];
  faqPageSchemas: RawJsonLdObject[];
  breadcrumbSchemas: RawJsonLdObject[];
  localBusinessSchemas: RawJsonLdObject[];
  eventSchemas: RawJsonLdObject[];
  courseSchemas: RawJsonLdObject[];
  profilePageSchemas: RawJsonLdObject[];
  consistencyIssues: string[];
}

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

function extractSameAs(sameAsVal: unknown): string[] {
  if (!sameAsVal) return [];
  if (typeof sameAsVal === 'string') return [sameAsVal];
  if (Array.isArray(sameAsVal)) {
    return sameAsVal.filter((s): s is string => typeof s === 'string' && s.length > 0);
  }
  return [];
}

function extractImage(imageVal: unknown): string | undefined {
  if (typeof imageVal === 'string') return imageVal;
  if (imageVal && typeof imageVal === 'object') {
    const rec = imageVal as Record<string, unknown>;
    if (typeof rec['url'] === 'string') return rec['url'];
  }
  return undefined;
}

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
  const id = typeof record['@id'] === 'string' ? record['@id'] : undefined;
  const name = typeof record['name'] === 'string' ? record['name'] : undefined;
  const description = typeof record['description'] === 'string' ? record['description'] : undefined;
  const url = typeof record['url'] === 'string' ? record['url'] : undefined;
  const image = extractImage(record['image']);
  const sameAs = extractSameAs(record['sameAs']);

  if (types.length > 0 || name || url || id) {
    for (const type of types.length > 0 ? types : ['Thing']) {
      collected.push({
        raw: record,
        id,
        context,
        type,
        name,
        description,
        url,
        image,
        sameAs,
        author: record['author'],
        publisher: record['publisher'],
        brand: record['brand'],
        offers: record['offers'],
        aggregateRating: record['aggregateRating'],
        address: record['address'],
        contactPoint: record['contactPoint'],
        mainEntity: record['mainEntity'],
        mainEntityOfPage: record['mainEntityOfPage'],
      });
    }
  }

  // Inspect nested properties that often house sub-entities
  for (const key of ['author', 'publisher', 'mainEntity', 'creator', 'founder', 'brand', 'serviceArea']) {
    if (record[key]) {
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
    o.type === 'Organization' || o.type === 'Corporation' || o.type === 'EducationalOrganization'
  );
  const localBusinessSchemas = flattened.filter((o) =>
    o.type === 'LocalBusiness' || o.type?.endsWith('Store') || o.type?.endsWith('Restaurant')
  );
  const webSiteSchemas = flattened.filter((o) => o.type === 'WebSite');
  const webPageSchemas = flattened.filter((o) => o.type === 'WebPage');
  const articleSchemas = flattened.filter((o) =>
    ['Article', 'NewsArticle', 'TechArticle'].includes(o.type || '')
  );
  const blogPostingSchemas = flattened.filter((o) => o.type === 'BlogPosting');
  const productSchemas = flattened.filter((o) => o.type === 'Product');
  const serviceSchemas = flattened.filter((o) => o.type === 'Service');
  const softwareAppSchemas = flattened.filter((o) =>
    o.type === 'SoftwareApplication' || o.type === 'WebApplication' || o.type === 'MobileApplication'
  );
  const faqPageSchemas = flattened.filter((o) => o.type === 'FAQPage');
  const breadcrumbSchemas = flattened.filter((o) => o.type === 'BreadcrumbList');
  const eventSchemas = flattened.filter((o) => o.type === 'Event');
  const courseSchemas = flattened.filter((o) => o.type === 'Course');
  const profilePageSchemas = flattened.filter((o) => o.type === 'ProfilePage');

  // Consistency checks
  const consistencyIssues: string[] = [];

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
  for (const prod of productSchemas) {
    if (!prod.name) {
      consistencyIssues.push('A Product schema is declared without a "name" property.');
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
    blogPostingSchemas,
    productSchemas,
    serviceSchemas,
    softwareAppSchemas,
    faqPageSchemas,
    breadcrumbSchemas,
    localBusinessSchemas,
    eventSchemas,
    courseSchemas,
    profilePageSchemas,
    consistencyIssues,
  };
}
