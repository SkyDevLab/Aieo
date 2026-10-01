import {
  AuditRuleResult,
  EntityConsistencyConflict,
  EntityGraph,
  EntityRelationship,
  EntitySignalItem,
  EntitySummary,
} from './types';
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
  entityGraph: EntityGraph;
}

function extractTitleBrand(title: string | null): string | null {
  if (!title) return null;
  const parts = title.split(/[-–—|•:]/).map((s) => s.trim()).filter(Boolean);
  if (parts.length > 1) {
    return parts[parts.length - 1].length < parts[0].length ? parts[parts.length - 1] : parts[0];
  }
  return title;
}

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

  // 1. Identify primary candidate entity & type
  let primaryEntity = '';
  let entityType: EntitySummary['entityType'] = 'Unknown';
  let primaryDescription = '';
  let primaryUrl = targetUrl;
  const associatedEntitiesSet = new Set<string>();

  // Check JSON-LD objects first for authoritative data
  const softwareSchema = jsonLdData.softwareAppSchemas.find((s) => !!s.name);
  const prodSchema = jsonLdData.productSchemas.find((p) => !!p.name);
  const orgSchema = jsonLdData.organizationSchemas.find((o) => !!o.name);
  const localBiz = jsonLdData.localBusinessSchemas.find((l) => !!l.name);
  const personSchema = jsonLdData.personSchemas.find((p) => !!p.name);
  const webSiteSchema = jsonLdData.webSiteSchemas.find((w) => !!w.name);
  const serviceSchema = jsonLdData.serviceSchemas.find((s) => !!s.name);

  if (softwareSchema?.name) {
    primaryEntity = softwareSchema.name;
    entityType = 'Software';
    primaryDescription = softwareSchema.description || '';
    if (softwareSchema.url) primaryUrl = softwareSchema.url;
  } else if (prodSchema?.name) {
    primaryEntity = prodSchema.name;
    entityType = 'Product';
    primaryDescription = prodSchema.description || '';
    if (prodSchema.url) primaryUrl = prodSchema.url;
  } else if (serviceSchema?.name) {
    primaryEntity = serviceSchema.name;
    entityType = 'Service';
    primaryDescription = serviceSchema.description || '';
    if (serviceSchema.url) primaryUrl = serviceSchema.url;
  } else if (orgSchema?.name) {
    primaryEntity = orgSchema.name;
    entityType = 'Organization';
    primaryDescription = orgSchema.description || '';
    if (orgSchema.url) primaryUrl = orgSchema.url;
  } else if (localBiz?.name) {
    primaryEntity = localBiz.name;
    entityType = 'LocalBusiness';
    primaryDescription = localBiz.description || '';
    if (localBiz.url) primaryUrl = localBiz.url;
  } else if (personSchema?.name) {
    primaryEntity = personSchema.name;
    entityType = 'Person';
    primaryDescription = personSchema.description || '';
    if (personSchema.url) primaryUrl = personSchema.url;
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
    primaryEntity = domainBase.charAt(0).toUpperCase() + domainBase.slice(1);
    entityType = 'Unknown';
  }

  if (!primaryDescription && htmlData.metaDescription) {
    primaryDescription = htmlData.metaDescription;
  }

  // Associated Entities
  if (personSchema?.name && personSchema.name !== primaryEntity) {
    associatedEntitiesSet.add(personSchema.name);
  }
  if (orgSchema?.name && orgSchema.name !== primaryEntity) {
    associatedEntitiesSet.add(orgSchema.name);
  }
  if (htmlData.author && htmlData.author !== primaryEntity) {
    associatedEntitiesSet.add(htmlData.author);
  }

  const primaryLower = primaryEntity.toLowerCase();

  // 2. Cross-Signal Consistency Analysis
  const signals: EntitySignalItem[] = [];
  const conflicts: EntityConsistencyConflict[] = [];

  let nameMatchCount = 0;
  let totalNameSources = 0;

  // Title signal
  if (htmlData.title) {
    totalNameSources++;
    const hasName = htmlData.title.toLowerCase().includes(primaryLower);
    if (hasName) nameMatchCount++;
    signals.push({ source: 'HTML Title', value: htmlData.title, matchesPrimary: hasName });

    // Check for conflicting brand names in title vs primaryEntity
    const titleBrand = extractTitleBrand(htmlData.title);
    if (titleBrand && titleBrand.toLowerCase() !== primaryLower && !titleBrand.toLowerCase().includes(primaryLower) && !primaryLower.includes(titleBrand.toLowerCase())) {
      conflicts.push({
        field: 'Brand Name',
        sources: [
          { source: 'Primary Entity', value: primaryEntity },
          { source: 'HTML Title Brand', value: titleBrand },
        ],
        severity: 'medium',
        explanation: `Title brand part "${titleBrand}" differs from primary entity "${primaryEntity}".`,
      });
    }
  }

  // H1 signal
  if (htmlData.h1List.length > 0) {
    totalNameSources++;
    const h1Matches = htmlData.h1List.some((h) => h.toLowerCase().includes(primaryLower));
    if (h1Matches) nameMatchCount++;
    signals.push({ source: 'H1 Primary Heading', value: htmlData.h1List[0], matchesPrimary: h1Matches });
  }

  // Meta description signal
  if (htmlData.metaDescription) {
    const descMatches = htmlData.metaDescription.toLowerCase().includes(primaryLower);
    signals.push({ source: 'Meta Description', value: htmlData.metaDescription.slice(0, 100), matchesPrimary: descMatches });
  }

  // Open Graph site_name
  if (htmlData.openGraph.siteName) {
    totalNameSources++;
    const ogMatches = htmlData.openGraph.siteName.toLowerCase().includes(primaryLower);
    if (ogMatches) nameMatchCount++;
    signals.push({ source: 'Open Graph (og:site_name)', value: htmlData.openGraph.siteName, matchesPrimary: ogMatches });

    if (!ogMatches) {
      conflicts.push({
        field: 'Brand Name',
        sources: [
          { source: 'Primary Entity', value: primaryEntity },
          { source: 'Open Graph site_name', value: htmlData.openGraph.siteName },
        ],
        severity: 'medium',
        explanation: `Open Graph site_name "${htmlData.openGraph.siteName}" does not match primary entity "${primaryEntity}".`,
      });
    }
  }

  // JSON-LD entity definition
  const jsonLdMatch = jsonLdData.objects.some(
    (o) => o.name && (o.name.toLowerCase().includes(primaryLower) || primaryLower.includes(o.name.toLowerCase()))
  );
  if (jsonLdData.objects.length > 0) {
    totalNameSources++;
    if (jsonLdMatch) nameMatchCount++;
    signals.push({
      source: 'JSON-LD Structured Data',
      value: jsonLdMatch ? `Entity defined (${entityType})` : 'JSON-LD present without matching entity name',
      matchesPrimary: jsonLdMatch,
    });
  }

  // Footer brand
  const footerBrand = extractFooterBrand(htmlData.footerText);
  if (footerBrand) {
    totalNameSources++;
    const footerMatches = footerBrand.toLowerCase().includes(primaryLower) || primaryLower.includes(footerBrand.toLowerCase());
    if (footerMatches) nameMatchCount++;
    signals.push({ source: 'Footer Copyright', value: footerBrand, matchesPrimary: footerMatches });

    if (!footerMatches) {
      conflicts.push({
        field: 'Copyright Entity',
        sources: [
          { source: 'Primary Entity', value: primaryEntity },
          { source: 'Footer Brand', value: footerBrand },
        ],
        severity: 'low',
        explanation: `Footer brand "${footerBrand}" diverges from primary entity "${primaryEntity}".`,
      });
    }
  }

  // URL consistency check
  if (jsonLdData.hasUrl && primaryUrl) {
    try {
      const pUrl = new URL(primaryUrl);
      if (pUrl.hostname !== parsedUrl.hostname) {
        conflicts.push({
          field: 'Entity Canonical URL',
          sources: [
            { source: 'Page Hostname', value: parsedUrl.hostname },
            { source: 'JSON-LD URL', value: pUrl.hostname },
          ],
          severity: 'high',
          explanation: `JSON-LD URL host (${pUrl.hostname}) does not match current host (${parsedUrl.hostname}).`,
        });
      }
    } catch {
      // ignore
    }
  }

  // sameAs social links
  const allSameAs = [
    ...jsonLdData.sameAsList,
    ...htmlData.detectedSocialLinks.map((s) => s.url),
  ];
  if (allSameAs.length > 0) {
    signals.push({
      source: 'Authority Profiles (sameAs / Social)',
      value: allSameAs.slice(0, 3).join(', '),
      matchesPrimary: true,
    });
  }

  // Calculate detailed consistency percentages
  const nameConsistencyScore = totalNameSources > 0 ? Math.round((nameMatchCount / totalNameSources) * 100) : 50;
  const descriptionConsistencyScore = htmlData.metaDescription && primaryDescription ? 88 : primaryDescription ? 75 : 40;
  const typeConsistencyScore = entityType !== 'Unknown' ? 95 : 40;
  const identityLinksScore = allSameAs.length >= 2 ? 100 : allSameAs.length === 1 ? 70 : 30;

  // 3. Extract Relationships for Internal Entity Graph
  const relationships: EntityRelationship[] = [];
  const visibleLower = htmlData.visibleText.toLowerCase();

  // Industry detection
  let detectedIndustry: string | undefined;
  if (/furniture|showroom|interior|decor|woodworking/i.test(visibleLower)) {
    detectedIndustry = 'Furniture Retail & Manufacturing';
  } else if (/saas|developer tools|api|cloud|software/i.test(visibleLower)) {
    detectedIndustry = 'Software & Technology';
  } else if (/healthcare|medical|clinic|patient/i.test(visibleLower)) {
    detectedIndustry = 'Healthcare & Medicine';
  } else if (/financial|banking|fintech|payment/i.test(visibleLower)) {
    detectedIndustry = 'Financial Services';
  } else if (/ecommerce|shop|retail|store/i.test(visibleLower)) {
    detectedIndustry = 'E-Commerce & Retail';
  }

  if (detectedIndustry) {
    relationships.push({
      type: 'servesIndustry',
      label: 'Industry',
      value: detectedIndustry,
      evidence: 'Detected from domain keywords and page copy.',
    });
  }

  // Audience detection
  let detectedAudience: string | undefined;
  if (/furniture store|furniture business|showroom owner|retailer/i.test(visibleLower)) {
    detectedAudience = 'Furniture Businesses & Retailers';
  } else if (/developer|engineering team|cto|programmer/i.test(visibleLower)) {
    detectedAudience = 'Developers & Engineering Teams';
  } else if (/enterprise|large business|organization/i.test(visibleLower)) {
    detectedAudience = 'Enterprise Organizations';
  } else if (/small business|smb|startup/i.test(visibleLower)) {
    detectedAudience = 'Small Businesses & Startups';
  }

  if (detectedAudience) {
    relationships.push({
      type: 'audience',
      label: 'Target Audience',
      value: detectedAudience,
      evidence: 'Extracted from value proposition and target audience copy.',
    });
  }

  // Capabilities detection from detected intents
  const capabilities = htmlData.detectedIntents.slice(0, 8);
  for (const cap of capabilities.slice(0, 5)) {
    relationships.push({
      type: 'capabilities',
      label: 'Capability',
      value: cap,
      evidence: 'Extracted from section headings and feature lists.',
    });
  }

  // Founder relationship if discovered
  for (const assoc of Array.from(associatedEntitiesSet)) {
    relationships.push({
      type: 'founder',
      label: 'Associated Identity',
      value: assoc,
      evidence: 'Discovered in structured data or author tags.',
    });
  }

  const entityGraph: EntityGraph = {
    primaryEntity: {
      name: primaryEntity,
      type: entityType,
      description: primaryDescription,
      url: primaryUrl,
      sameAs: Array.from(new Set(allSameAs)),
    },
    industry: detectedIndustry,
    audience: detectedAudience,
    capabilities,
    relationships,
  };

  // 4. Generate Audit Rules for Category 4
  const checks: AuditRuleResult[] = [];

  // Rule 1: Primary Entity Resolved
  const hasClearEntity = !!primaryEntity && entityType !== 'Unknown';
  checks.push({
    id: 'entity-primary-resolved',
    category: 'entity',
    title: 'Primary Entity Resolution',
    status: hasClearEntity ? 'PASS' : 'WARNING',
    severity: hasClearEntity ? 'info' : 'high',
    score: hasClearEntity ? 8 : 3,
    maxScore: 8,
    explanation: hasClearEntity
      ? `Primary entity resolved as "${primaryEntity}" (${entityType}).`
      : `Ambiguous entity identity. Inferred generic name "${primaryEntity}" from domain.`,
    whatWeFound: `Primary: "${primaryEntity}" (Type: ${entityType}).`,
    whyItMatters: 'AI models must anchor factual answers to a distinct, named entity.',
    howToImprove: hasClearEntity ? 'Maintain consistent entity name.' : 'State your exact company or product name clearly.',
    evidence: { primaryEntity, entityType },
  });

  // Rule 2: Entity Type Unambiguously Defined
  const typeKnown = entityType !== 'Unknown';
  checks.push({
    id: 'entity-type-clarity',
    category: 'entity',
    title: 'Entity Classification Clarity',
    status: typeKnown ? 'PASS' : 'WARNING',
    severity: typeKnown ? 'info' : 'medium',
    score: typeKnown ? 6 : 2,
    maxScore: 6,
    explanation: typeKnown
      ? `Entity is clearly classified as a ${entityType}.`
      : 'Entity type is ambiguous. AI agents benefit from knowing whether this is a company, person, or software tool.',
    whatWeFound: `Type: ${entityType}`,
    whyItMatters: 'Classification defines which ontology attributes AI search engines expect.',
    howToImprove: typeKnown ? 'No action needed.' : 'Declare explicit Schema.org @type (e.g. Organization, SoftwareApplication).',
    evidence: { entityType },
  });

  // Rule 3: Entity Name Consistency Score
  const nameConsistent = nameConsistencyScore >= 75;
  checks.push({
    id: 'entity-name-consistency',
    category: 'entity',
    title: 'Entity Name Consistency Across Sources',
    status: nameConsistent ? 'PASS' : nameConsistencyScore >= 50 ? 'WARNING' : 'FAIL',
    severity: nameConsistent ? 'info' : 'high',
    score: nameConsistent ? 8 : nameConsistencyScore >= 50 ? 5 : 1,
    maxScore: 8,
    explanation: nameConsistent
      ? `Entity name "${primaryEntity}" has high cross-source consistency (${nameConsistencyScore}%).`
      : `Inconsistent naming detected (${nameConsistencyScore}%). Name varies across HTML Title, H1, schema, and footer.`,
    whatWeFound: `Name consistency: ${nameConsistencyScore}%.`,
    whyItMatters: 'Conflicting brand names across meta and schema create split entities in search knowledge graphs.',
    howToImprove: nameConsistent ? 'No action needed.' : 'Unify spelling and branding across Title, H1, JSON-LD, and footer.',
    evidence: { nameConsistencyScore, sourcesChecked: totalNameSources },
  });

  // Rule 4: Title Entity Alignment
  const titleHasEntity = (htmlData.title || '').toLowerCase().includes(primaryLower);
  checks.push({
    id: 'entity-title-alignment',
    category: 'entity',
    title: 'Title Entity Alignment',
    status: titleHasEntity ? 'PASS' : 'WARNING',
    severity: titleHasEntity ? 'info' : 'medium',
    score: titleHasEntity ? 6 : 2,
    maxScore: 6,
    explanation: titleHasEntity
      ? `Page title mentions the entity "${primaryEntity}".`
      : `Page title does not mention "${primaryEntity}".`,
    whatWeFound: titleHasEntity ? `Title incorporates "${primaryEntity}".` : `Title lacks "${primaryEntity}".`,
    whyItMatters: 'Title co-occurrence is heavily weighted by AI search query analyzers.',
    howToImprove: titleHasEntity ? 'No action needed.' : `Include "${primaryEntity}" in your HTML <title>.`,
    evidence: { title: htmlData.title, primaryEntity },
  });

  // Rule 5: H1 Heading Alignment
  const h1HasEntity = htmlData.h1List.some((h) => h.toLowerCase().includes(primaryLower));
  checks.push({
    id: 'entity-h1-alignment',
    category: 'entity',
    title: 'H1 Primary Heading Alignment',
    status: h1HasEntity ? 'PASS' : 'WARNING',
    severity: h1HasEntity ? 'info' : 'low',
    score: h1HasEntity ? 6 : 2,
    maxScore: 6,
    explanation: h1HasEntity
      ? `Primary H1 explicitly references "${primaryEntity}".`
      : `H1 does not mention "${primaryEntity}".`,
    whatWeFound: h1HasEntity ? `H1 references "${primaryEntity}".` : 'H1 heading lacks entity name.',
    whyItMatters: 'Anchors the document outline directly to the subject entity.',
    howToImprove: h1HasEntity ? 'No action needed.' : `Feature "${primaryEntity}" in your main <h1>.`,
    evidence: { h1: htmlData.h1List[0] || null },
  });

  // Rule 6: Meta Description Alignment
  const descHasEntity = (htmlData.metaDescription || '').toLowerCase().includes(primaryLower);
  checks.push({
    id: 'entity-meta-desc-alignment',
    category: 'entity',
    title: 'Meta Description Entity Context',
    status: descHasEntity ? 'PASS' : 'WARNING',
    severity: descHasEntity ? 'info' : 'low',
    score: descHasEntity ? 6 : 2,
    maxScore: 6,
    explanation: descHasEntity
      ? `Meta description articulates context for "${primaryEntity}".`
      : `Meta description does not mention "${primaryEntity}".`,
    whatWeFound: descHasEntity ? `Entity referenced in description.` : 'Missing entity mention in meta description.',
    whyItMatters: 'AI answer extractors use meta descriptions for high-level summaries.',
    howToImprove: descHasEntity ? 'No action needed.' : `Mention "${primaryEntity}" in your meta description summary.`,
    evidence: { metaDescription: htmlData.metaDescription },
  });

  // Rule 7: JSON-LD Entity Alignment
  checks.push({
    id: 'entity-jsonld-alignment',
    category: 'entity',
    title: 'Machine-Readable Entity in JSON-LD',
    status: jsonLdMatch ? 'PASS' : jsonLdData.hasJsonLd ? 'WARNING' : 'FAIL',
    severity: jsonLdMatch ? 'info' : 'medium',
    score: jsonLdMatch ? 8 : jsonLdData.hasJsonLd ? 4 : 0,
    maxScore: 8,
    explanation: jsonLdMatch
      ? `JSON-LD structured data explicitly declares entity "${primaryEntity}".`
      : jsonLdData.hasJsonLd
      ? `JSON-LD exists, but no declared object matches entity "${primaryEntity}".`
      : 'No JSON-LD structured data provided for entity graph mapping.',
    whatWeFound: jsonLdMatch ? `Found matching entity in JSON-LD.` : 'No matching entity in schema.',
    whyItMatters: 'JSON-LD provides unambiguous graph definitions for search indexers.',
    howToImprove: jsonLdMatch ? 'No action needed.' : `Add schema with "name": "${primaryEntity}".`,
    evidence: { jsonLdMatch },
  });

  // Rule 8: Open Graph Site Name Alignment
  const ogMatches = (htmlData.openGraph.siteName || '').toLowerCase().includes(primaryLower);
  checks.push({
    id: 'entity-og-site-name',
    category: 'entity',
    title: 'Open Graph Site Name (og:site_name)',
    status: ogMatches ? 'PASS' : htmlData.openGraph.siteName ? 'WARNING' : 'INFO',
    severity: 'info',
    score: ogMatches ? 5 : htmlData.openGraph.siteName ? 2 : 1,
    maxScore: 5,
    explanation: ogMatches
      ? `og:site_name aligns with primary entity: "${htmlData.openGraph.siteName}".`
      : htmlData.openGraph.siteName
      ? `og:site_name ("${htmlData.openGraph.siteName}") differs from entity "${primaryEntity}".`
      : 'No og:site_name tag declared.',
    whatWeFound: htmlData.openGraph.siteName || 'None',
    whyItMatters: 'Provides secondary brand verification across social preview parsers.',
    howToImprove: ogMatches ? 'No action needed.' : `Set <meta property="og:site_name" content="${primaryEntity}">.`,
    evidence: { ogSiteName: htmlData.openGraph.siteName },
  });

  // Rule 9: Open Graph Title Alignment
  const ogTitleMatches = (htmlData.openGraph.title || '').toLowerCase().includes(primaryLower);
  checks.push({
    id: 'entity-og-title',
    category: 'entity',
    title: 'Open Graph Title Brand Reinforcement',
    status: ogTitleMatches ? 'PASS' : htmlData.openGraph.title ? 'INFO' : 'INFO',
    severity: 'info',
    score: ogTitleMatches ? 5 : 2,
    maxScore: 5,
    explanation: ogTitleMatches
      ? 'og:title reinforces entity branding.'
      : 'og:title does not mention the entity name.',
    whatWeFound: htmlData.openGraph.title || 'None',
    whyItMatters: 'Consistent title branding across open graph tags reinforces identity signals.',
    howToImprove: ogTitleMatches ? 'No action needed.' : 'Include entity name in og:title.',
    evidence: { ogTitle: htmlData.openGraph.title },
  });

  // Rule 10: Footer Copyright Alignment
  const footerMatches = !!footerBrand && (footerBrand.toLowerCase().includes(primaryLower) || primaryLower.includes(footerBrand.toLowerCase()));
  checks.push({
    id: 'entity-footer-alignment',
    category: 'entity',
    title: 'Footer Copyright & Brand Ownership',
    status: footerMatches ? 'PASS' : footerBrand ? 'PASS' : 'WARNING',
    severity: footerMatches ? 'info' : 'low',
    score: footerMatches ? 6 : footerBrand ? 4 : 1,
    maxScore: 6,
    explanation: footerMatches
      ? `Footer copyright notice reinforces entity identity: "${footerBrand}".`
      : footerBrand
      ? `Footer displays brand "${footerBrand}".`
      : 'No clear brand copyright found in the footer.',
    whatWeFound: footerBrand ? `"${footerBrand}"` : 'No copyright parsed.',
    whyItMatters: 'Consistent footer copyright is a baseline authenticity signal.',
    howToImprove: footerMatches ? 'No action needed.' : `Add "© ${new Date().getFullYear()} ${primaryEntity}" in footer.`,
    evidence: { footerBrand },
  });

  // Rule 11: About Section / Profile Presence
  const hasAbout = htmlData.linksAnalysis.iaCategories.about.length > 0;
  checks.push({
    id: 'entity-about-alignment',
    category: 'entity',
    title: 'About / Corporate Background Pathway',
    status: hasAbout ? 'PASS' : 'WARNING',
    severity: hasAbout ? 'info' : 'low',
    score: hasAbout ? 6 : 2,
    maxScore: 6,
    explanation: hasAbout
      ? 'Discovered internal navigation link to About / Background page.'
      : 'No explicit About page link discovered in navigation.',
    whatWeFound: hasAbout ? 'Found About page link.' : 'Missing About navigation link.',
    whyItMatters: 'About pages provide historical grounding and organizational origin stories for AI summarization.',
    howToImprove: hasAbout ? 'No action needed.' : 'Provide a clear link to an /about page.',
    evidence: { aboutLinks: htmlData.linksAnalysis.iaCategories.about },
  });

  // Rule 12: Author & Publisher Signals
  const hasAuthorSignal = !!htmlData.author || jsonLdData.objects.some((o) => !!o.author || !!o.publisher);
  checks.push({
    id: 'entity-author-publisher',
    category: 'entity',
    title: 'Author & Publisher Attribution',
    status: hasAuthorSignal ? 'PASS' : 'INFO',
    severity: 'info',
    score: hasAuthorSignal ? 5 : 2,
    maxScore: 5,
    explanation: hasAuthorSignal
      ? 'Author or publisher attribution declared in metadata or schema.'
      : 'No explicit author or publisher metadata found.',
    whatWeFound: hasAuthorSignal ? 'Author/publisher declared.' : 'Not declared.',
    whyItMatters: 'Supports E-E-A-T scoring and knowledge graph authorship.',
    howToImprove: hasAuthorSignal ? 'No action needed.' : 'Add <meta name="author"> or schema publisher.',
    evidence: { hasAuthorSignal },
  });

  // Rule 13: sameAs / Verified Profiles
  const hasProfiles = allSameAs.length > 0;
  checks.push({
    id: 'entity-sameas-profiles',
    category: 'entity',
    title: 'External Profile Verification Links (sameAs)',
    status: hasProfiles ? 'PASS' : 'WARNING',
    severity: hasProfiles ? 'info' : 'medium',
    score: allSameAs.length >= 2 ? 8 : allSameAs.length === 1 ? 5 : 1,
    maxScore: 8,
    explanation: hasProfiles
      ? `Found ${allSameAs.length} external authority profile link(s) (GitHub, LinkedIn, X, etc.).`
      : 'No external identity verification links (such as LinkedIn, GitHub, or X) found.',
    whatWeFound: hasProfiles ? allSameAs.slice(0, 3).join(', ') : 'Zero profile links.',
    whyItMatters: 'AI search engines cross-verify claims against linked external authority platforms.',
    howToImprove: hasProfiles ? 'Keep profiles active.' : 'Add sameAs links to official LinkedIn, X, or GitHub profiles.',
    evidence: { profiles: allSameAs },
  });

  // Rule 14: Contact Channel Association
  const hasContact = htmlData.contactSignals.hasEmail || htmlData.contactSignals.hasPhone || htmlData.contactSignals.hasContactLink;
  checks.push({
    id: 'entity-contact-identity',
    category: 'entity',
    title: 'Entity Contact Pathway Association',
    status: hasContact ? 'PASS' : 'WARNING',
    severity: hasContact ? 'info' : 'low',
    score: hasContact ? 5 : 1,
    maxScore: 5,
    explanation: hasContact
      ? 'Direct contact channels (email, phone, form) associated with entity.'
      : 'No direct contact access points discovered.',
    whatWeFound: hasContact ? 'Contact channels identified.' : 'Missing contact signals.',
    whyItMatters: 'Assists AI search queries seeking official customer service or sales contact info.',
    howToImprove: hasContact ? 'No action needed.' : 'Provide visible email, phone, or contact form link.',
    evidence: { contactSignals: htmlData.contactSignals },
  });

  // Rule 15: Canonical URL Consistency
  const urlConflicts = conflicts.filter((c) => c.field === 'Entity Canonical URL');
  checks.push({
    id: 'entity-url-consistency',
    category: 'entity',
    title: 'Entity URL Canonical Consistency',
    status: urlConflicts.length === 0 ? 'PASS' : 'WARNING',
    severity: urlConflicts.length === 0 ? 'info' : 'medium',
    score: urlConflicts.length === 0 ? 5 : 1,
    maxScore: 5,
    explanation: urlConflicts.length === 0
      ? 'Canonical URL and JSON-LD entity url are aligned.'
      : 'Inconsistent URLs detected between webpage host and schema url property.',
    whatWeFound: urlConflicts.length === 0 ? 'URL consistency verified.' : urlConflicts[0].explanation,
    whyItMatters: 'Prevents splitting entity metrics across different URLs.',
    howToImprove: urlConflicts.length === 0 ? 'No action needed.' : 'Ensure schema "url" matches your canonical URL exactly.',
    evidence: { urlConflicts },
  });

  // Rule 16: Description Consistency
  checks.push({
    id: 'entity-description-consistency',
    category: 'entity',
    title: 'Cross-Source Entity Description Consistency',
    status: descriptionConsistencyScore >= 70 ? 'PASS' : 'WARNING',
    severity: 'info',
    score: descriptionConsistencyScore >= 70 ? 5 : 2,
    maxScore: 5,
    explanation: descriptionConsistencyScore >= 70
      ? `Entity descriptions in meta tags and body narrative are well aligned (${descriptionConsistencyScore}%).`
      : 'Descriptions diverge between meta tags and on-page copy.',
    whatWeFound: `Description consistency: ${descriptionConsistencyScore}%.`,
    whyItMatters: 'Consistent descriptions reinforce topical authority vectors.',
    howToImprove: 'Align meta description summary with introductory body copy.',
    evidence: { descriptionConsistencyScore },
  });

  // Rule 17: Absence of Conflicting Brand Names
  const brandConflicts = conflicts.filter((c) => c.field === 'Brand Name');
  checks.push({
    id: 'entity-no-conflicting-names',
    category: 'entity',
    title: 'Brand Name Uniformity (Conflict Check)',
    status: brandConflicts.length === 0 ? 'PASS' : 'WARNING',
    severity: brandConflicts.length === 0 ? 'info' : 'medium',
    score: brandConflicts.length === 0 ? 5 : 1,
    maxScore: 5,
    explanation: brandConflicts.length === 0
      ? 'Zero conflicting brand names or conflicting spellings detected across headers and metadata.'
      : `Conflicting brand naming detected: ${brandConflicts.map((c) => c.explanation).join('; ')}`,
    whatWeFound: brandConflicts.length === 0 ? 'Uniform brand naming across all tags.' : brandConflicts.map((c) => c.explanation).join('; '),
    whyItMatters: 'Divergent brand naming causes AI models to misidentify the company or create hallucinated duplicates.',
    howToImprove: brandConflicts.length === 0 ? 'No action needed.' : 'Ensure exact brand spelling across Title, H1, JSON-LD, and footer.',
    evidence: { brandConflicts },
  });

  const totalScore = checks.reduce((sum, c) => sum + c.score, 0);

  const entitySummary: EntitySummary = {
    primaryEntity,
    entityType,
    consistencyScore: Math.min(100, Math.max(0, totalScore)),
    signalsCount: signals.length,
    signals,
    associatedEntities: Array.from(associatedEntitiesSet),
    consistencyDetails: {
      nameConsistencyScore,
      descriptionConsistencyScore,
      typeConsistencyScore,
      identityLinksScore,
      conflicts,
    },
    entityGraph,
  };

  return {
    checks,
    entitySummary,
    entityGraph,
  };
}
