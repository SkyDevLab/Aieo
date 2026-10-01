import { AuditRuleResult, EntitySignalItem, EntitySummary } from './types';
import { ExtractedHtmlData } from '../parsers/html';
import { ParsedJsonLdData } from '../parsers/jsonld';

export interface EntityAuditInput {
  targetUrl: string;
  htmlData: ExtractedHtmlData;
  jsonLdData: ParsedJsonLdData;
}

export interface EntityAuditOutput {
  checks: AuditRuleResult[];
  entitySummary: EntitySummary;
}

/**
 * Extracts a candidate brand or entity name from a page title (e.g. "Home — SkyDevLab" -> "SkyDevLab")
 */
function extractTitleBrand(title: string | null): string | null {
  if (!title) return null;
  const parts = title.split(/[-–—|•:]/).map((s) => s.trim()).filter(Boolean);
  if (parts.length > 1) {
    // Usually the brand is either the last part ("Feature - Acme") or the first ("Acme: The platform")
    return parts[parts.length - 1].length < parts[0].length ? parts[parts.length - 1] : parts[0];
  }
  return title;
}

/**
 * Extracts copyright brand from footer (e.g. "© 2026 SkyDevLab Inc." -> "SkyDevLab")
 */
function extractFooterBrand(footerText: string): string | null {
  if (!footerText) return null;
  const match = footerText.match(/(?:©|copyright|\(c\))\s*(?:\d{4})?\s*([a-zA-Z0-9\s&._-]+?)(?:,|\.|\bAll rights|\bReserved|$)/i);
  if (match && match[1]) {
    const brand = match[1].trim();
    if (brand.length >= 2 && brand.length <= 40) {
      return brand;
    }
  }
  return null;
}

export function auditEntity(input: EntityAuditInput): EntityAuditOutput {
  const { targetUrl, htmlData, jsonLdData } = input;
  const parsedUrl = new URL(targetUrl);
  const domainBase = parsedUrl.hostname.replace(/^www\./, '').split('.')[0];

  // 1. Identify primary candidate entity
  let primaryEntity: string = '';
  let entityType: EntitySummary['entityType'] = 'Unknown';
  const associatedEntitiesSet = new Set<string>();

  // Check JSON-LD
  const mainOrg = jsonLdData.organizationSchemas.find((o) => !!o.name);
  const mainPerson = jsonLdData.personSchemas.find((p) => !!p.name);
  const mainProduct = jsonLdData.productSchemas.find((p) => !!p.name);
  const mainWebSite = jsonLdData.webSiteSchemas.find((w) => !!w.name);

  if (mainPerson?.name) {
    primaryEntity = mainPerson.name;
    entityType = 'Person';
    if (mainOrg?.name) associatedEntitiesSet.add(mainOrg.name);
  } else if (mainOrg?.name) {
    primaryEntity = mainOrg.name;
    entityType = 'Organization';
  } else if (mainProduct?.name) {
    primaryEntity = mainProduct.name;
    entityType = 'Product';
  } else if (htmlData.openGraph.siteName) {
    primaryEntity = htmlData.openGraph.siteName;
    entityType = 'Organization';
  } else if (htmlData.author) {
    primaryEntity = htmlData.author;
    entityType = 'Person';
  } else if (extractTitleBrand(htmlData.title)) {
    primaryEntity = extractTitleBrand(htmlData.title)!;
    entityType = 'WebSite';
  } else {
    // Fallback to domain name
    primaryEntity = domainBase.charAt(0).toUpperCase() + domainBase.slice(1);
    entityType = 'Unknown';
  }

  // Check for secondary/associated entity
  if (htmlData.author && htmlData.author !== primaryEntity) {
    associatedEntitiesSet.add(htmlData.author);
  }
  if (mainPerson?.name && mainPerson.name !== primaryEntity) {
    associatedEntitiesSet.add(mainPerson.name);
  }
  if (mainOrg?.name && mainOrg.name !== primaryEntity) {
    associatedEntitiesSet.add(mainOrg.name);
  }

  const primaryLower = primaryEntity.toLowerCase();

  // 2. Collect signals across sources
  const signals: EntitySignalItem[] = [];

  // Signal: Title
  const titleHasEntity = (htmlData.title || '').toLowerCase().includes(primaryLower);
  if (htmlData.title) {
    signals.push({
      source: 'HTML Title',
      value: htmlData.title,
      matchesPrimary: titleHasEntity,
    });
  }

  // Signal: Open Graph site_name
  if (htmlData.openGraph.siteName) {
    const ogMatches = htmlData.openGraph.siteName.toLowerCase().includes(primaryLower);
    signals.push({
      source: 'Open Graph (og:site_name)',
      value: htmlData.openGraph.siteName,
      matchesPrimary: ogMatches,
    });
  }

  // Signal: Primary H1
  if (htmlData.h1List.length > 0) {
    const h1Matches = htmlData.h1List.some((h) => h.toLowerCase().includes(primaryLower));
    signals.push({
      source: 'Primary Heading (H1)',
      value: htmlData.h1List[0],
      matchesPrimary: h1Matches,
    });
  }

  // Signal: Meta Author
  if (htmlData.author) {
    const authorMatches = htmlData.author.toLowerCase().includes(primaryLower);
    signals.push({
      source: 'Author Metadata',
      value: htmlData.author,
      matchesPrimary: authorMatches,
    });
  }

  // Signal: JSON-LD definition
  const jsonLdMatch = jsonLdData.objects.some(
    (o) => o.name && (o.name.toLowerCase().includes(primaryLower) || primaryLower.includes(o.name.toLowerCase()))
  );
  if (jsonLdData.objects.length > 0) {
    signals.push({
      source: 'JSON-LD Structured Data',
      value: jsonLdMatch ? `Entity defined (${entityType})` : 'JSON-LD present without matching entity name',
      matchesPrimary: jsonLdMatch,
    });
  }

  // Signal: sameAs links
  const sameAsCount = jsonLdData.sameAsList.length + htmlData.detectedSocialLinks.length;
  if (sameAsCount > 0) {
    const sources = [
      ...jsonLdData.sameAsList,
      ...htmlData.detectedSocialLinks.map((s) => `${s.platform}: ${s.url}`),
    ];
    signals.push({
      source: 'External Authority Profiles (sameAs/Social)',
      value: sources.slice(0, 3).join(', '),
      matchesPrimary: true,
    });
  }

  // Signal: Footer Brand
  const footerBrand = extractFooterBrand(htmlData.footerText);
  if (footerBrand) {
    const footerMatches = footerBrand.toLowerCase().includes(primaryLower) || primaryLower.includes(footerBrand.toLowerCase());
    signals.push({
      source: 'Footer Copyright / Identity',
      value: footerBrand,
      matchesPrimary: footerMatches,
    });
  }

  // 3. Compute Entity Consistency Rules & Score
  const checks: AuditRuleResult[] = [];

  // Rule 1: Clear Entity Name (20 pts)
  const hasClearEntity = !!primaryEntity && entityType !== 'Unknown';
  checks.push({
    id: 'entity-name-identified',
    category: 'entity',
    title: 'Primary Entity Identification',
    status: hasClearEntity ? 'PASS' : 'WARNING',
    severity: hasClearEntity ? 'info' : 'high',
    score: hasClearEntity ? 20 : 8,
    maxScore: 20,
    explanation: hasClearEntity
      ? `Clear primary entity resolved: "${primaryEntity}" (${entityType}).`
      : `Ambiguous entity identity. Resolved generic name "${primaryEntity}" from domain.`,
    whatWeFound: `Primary Subject: "${primaryEntity}" (Type: ${entityType}).`,
    whyItMatters:
      'AI models must ground claims to a distinct real-world entity (person, company, or software tool) to cite authoritative sources.',
    howToImprove: hasClearEntity
      ? 'Ensure your entity name remains consistent across all branding touchpoints.'
      : 'Clearly declare your organization, product, or personal brand name in the page title, H1, and structured data.',
  });

  // Rule 2: Consistent Title Branding (15 pts)
  checks.push({
    id: 'entity-title-consistency',
    category: 'entity',
    title: 'Title Entity Alignment',
    status: titleHasEntity ? 'PASS' : 'WARNING',
    severity: titleHasEntity ? 'info' : 'medium',
    score: titleHasEntity ? 15 : 5,
    maxScore: 15,
    explanation: titleHasEntity
      ? `Page title explicitly incorporates the entity name "${primaryEntity}".`
      : `Page title does not mention "${primaryEntity}". AI crawlers look for title co-occurrence to confirm entity relevance.`,
    whatWeFound: titleHasEntity
      ? `Title mentions "${primaryEntity}".`
      : `Title "${htmlData.title || 'None'}" lacks primary entity name "${primaryEntity}".`,
    whyItMatters:
      'Search snippets and AI query handlers heavily weight the co-occurrence of the query entity and page title.',
    howToImprove: titleHasEntity
      ? 'Maintain concise title branding.'
      : `Include "${primaryEntity}" in your HTML <title> (e.g. "Primary Topic | ${primaryEntity}").`,
  });

  // Rule 3: Structured Data Entity Definition (15 pts)
  checks.push({
    id: 'entity-jsonld-definition',
    category: 'entity',
    title: 'Machine-Readable Entity in JSON-LD',
    status: jsonLdMatch ? 'PASS' : jsonLdData.hasJsonLd ? 'WARNING' : 'FAIL',
    severity: jsonLdMatch ? 'info' : 'medium',
    score: jsonLdMatch ? 15 : jsonLdData.hasJsonLd ? 6 : 0,
    maxScore: 15,
    explanation: jsonLdMatch
      ? `JSON-LD explicitly declares entity "${primaryEntity}" with appropriate Schema.org type.`
      : jsonLdData.hasJsonLd
      ? `JSON-LD is present, but no object explicitly matches entity name "${primaryEntity}".`
      : 'No JSON-LD structured data provided to define this entity for machine knowledge graphs.',
    whatWeFound: jsonLdMatch
      ? `Matching JSON-LD entity definition found.`
      : jsonLdData.hasJsonLd
      ? `JSON-LD types found (${jsonLdData.detectedTypes.join(', ')}), but name "${primaryEntity}" was not linked.`
      : 'Missing JSON-LD entity markup.',
    whyItMatters:
      'JSON-LD provides an explicit graph node definition with canonical properties, eliminating ambiguous entity guesses.',
    howToImprove: jsonLdMatch
      ? 'Ensure all schema properties (logo, url, description) are filled.'
      : `Add an "@type": "${entityType !== 'Unknown' ? entityType : 'Organization'}" schema with "name": "${primaryEntity}".`,
  });

  // Rule 4: Authority Profile Links (sameAs / Social Verification) (15 pts)
  const hasAuthorityLinks = sameAsCount > 0;
  const sameAsScore = sameAsCount >= 2 ? 15 : sameAsCount === 1 ? 10 : 0;
  checks.push({
    id: 'entity-authority-links',
    category: 'entity',
    title: 'External Identity Verification (sameAs / Profiles)',
    status: hasAuthorityLinks ? 'PASS' : 'WARNING',
    severity: hasAuthorityLinks ? 'info' : 'medium',
    score: sameAsScore,
    maxScore: 15,
    explanation: hasAuthorityLinks
      ? `Discovered ${sameAsCount} external authority profile link(s) linking this entity to third-party platforms.`
      : 'No authoritative external links (such as GitHub, LinkedIn, X, or Wikidata) detected on the page or in schema.',
    whatWeFound: hasAuthorityLinks
      ? `Found ${sameAsCount} external profile link(s) (${[...jsonLdData.sameAsList, ...htmlData.detectedSocialLinks.map((s) => s.platform)].slice(0, 4).join(', ')}).`
      : 'Zero external authority profile links discovered.',
    whyItMatters:
      'AI search engines cross-reference external platforms (LinkedIn, GitHub, Crunchbase, Wikipedia) to verify entity credibility and avoid hallucination.',
    howToImprove: hasAuthorityLinks
      ? 'Keep external profiles active, public, and mutually backlinking.'
      : 'Add visible links to official profiles (GitHub, LinkedIn, Twitter/X) and list them in the schema "sameAs" array.',
  });

  // Rule 5: Visible Entity Description & Context (15 pts)
  const visibleTextLower = htmlData.visibleText.toLowerCase();
  const descHasEntity = (htmlData.metaDescription || '').toLowerCase().includes(primaryLower);
  const textMentionsCount = (visibleTextLower.match(new RegExp(`\\b${primaryLower.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'g')) || []).length;
  const hasGoodEntityContext = descHasEntity || textMentionsCount >= 2;
  const contextScore = hasGoodEntityContext ? 15 : textMentionsCount === 1 ? 10 : 4;

  checks.push({
    id: 'entity-visible-context',
    category: 'entity',
    title: 'Visible Content Entity Context',
    status: hasGoodEntityContext ? 'PASS' : 'WARNING',
    severity: hasGoodEntityContext ? 'info' : 'low',
    score: contextScore,
    maxScore: 15,
    explanation: hasGoodEntityContext
      ? `Entity "${primaryEntity}" is naturally referenced ${textMentionsCount} time(s) with supporting contextual text.`
      : `Sparse visible mentions of entity "${primaryEntity}". Clear body references help AI engines confirm topical authority.`,
    whatWeFound: `Entity name appears ${textMentionsCount} time(s) in body text; Meta description mentions entity: ${descHasEntity ? 'Yes' : 'No'}.`,
    whyItMatters:
      'AI answer extractors verify that the entity is substantiated by surrounding descriptive paragraphs.',
    howToImprove: hasGoodEntityContext
      ? 'Ensure copy clearly communicates what the entity does.'
      : `Provide a concise introductory sentence stating who or what ${primaryEntity} is and what value it offers.`,
  });

  // Rule 6: Author / Organization Metadata Signals (10 pts)
  const hasAuthorSignal = !!htmlData.author || !!htmlData.openGraph.siteName;
  checks.push({
    id: 'entity-author-signal',
    category: 'entity',
    title: 'Author & Publisher Metadata',
    status: hasAuthorSignal ? 'PASS' : 'WARNING',
    severity: hasAuthorSignal ? 'info' : 'low',
    score: hasAuthorSignal ? 10 : 3,
    maxScore: 10,
    explanation: hasAuthorSignal
      ? `Author/publisher metadata detected: ${[htmlData.author ? `author="${htmlData.author}"` : null, htmlData.openGraph.siteName ? `og:site_name="${htmlData.openGraph.siteName}"` : null].filter(Boolean).join(', ')}.`
      : 'No author or publisher metadata found in meta tags or Open Graph properties.',
    whatWeFound: hasAuthorSignal
      ? `Found author/site_name meta tags.`
      : 'Missing <meta name="author"> and og:site_name tags.',
    whyItMatters:
      'AI search bots use author and publisher tags for E-E-A-T (Experience, Expertise, Authoritativeness, Trustworthiness) scoring.',
    howToImprove: hasAuthorSignal
      ? 'Keep author and publisher metadata consistent across pages.'
      : 'Add <meta name="author" content="..."> and <meta property="og:site_name" content="..."> in the document head.',
  });

  // Rule 7: Footer & Brand Consistency (10 pts)
  const hasFooterMatch = !!footerBrand && (footerBrand.toLowerCase().includes(primaryLower) || primaryLower.includes(footerBrand.toLowerCase()));
  checks.push({
    id: 'entity-footer-consistency',
    category: 'entity',
    title: 'Footer Copyright & Brand Anchor',
    status: hasFooterMatch ? 'PASS' : footerBrand ? 'PASS' : 'WARNING',
    severity: hasFooterMatch ? 'info' : 'low',
    score: hasFooterMatch ? 10 : footerBrand ? 7 : 3,
    maxScore: 10,
    explanation: hasFooterMatch
      ? `Footer reinforces entity identity: "${footerBrand}".`
      : footerBrand
      ? `Footer displays brand "${footerBrand}".`
      : 'No clear brand copyright or legal entity statement located in the footer.',
    whatWeFound: footerBrand
      ? `Footer statement: "${footerBrand}".`
      : 'No copyright or brand identifier parsed from footer.',
    whyItMatters:
      'Consistent footer branding is a baseline trust signal used by crawlers to verify legitimate website ownership.',
    howToImprove: hasFooterMatch
      ? 'Ensure annual copyright year and business registration match official records.'
      : `Include a standard "© ${new Date().getFullYear()} ${primaryEntity}" notice in your <footer>.`,
  });

  const totalScore = checks.reduce((sum, c) => sum + c.score, 0);

  return {
    checks,
    entitySummary: {
      primaryEntity,
      entityType,
      consistencyScore: Math.min(100, Math.max(0, totalScore)),
      signalsCount: signals.length,
      signals,
      associatedEntities: Array.from(associatedEntitiesSet),
    },
  };
}
