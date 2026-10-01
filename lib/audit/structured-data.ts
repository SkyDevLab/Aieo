import { AuditRuleResult } from './types';
import { ParsedJsonLdData } from '../parsers/jsonld';

export interface StructuredDataAuditInput {
  jsonLdData: ParsedJsonLdData;
}

export function auditStructuredData(input: StructuredDataAuditInput): AuditRuleResult[] {
  const { jsonLdData } = input;
  const results: AuditRuleResult[] = [];
  const hasJsonLd = jsonLdData.hasJsonLd;

  // 1. JSON-LD Presence
  results.push({
    id: 'sd-presence',
    category: 'structuredData',
    title: 'JSON-LD Structured Data Presence',
    status: hasJsonLd ? 'PASS' : 'WARNING',
    severity: hasJsonLd ? 'info' : 'high',
    score: hasJsonLd ? 10 : 0,
    maxScore: 10,
    explanation: hasJsonLd
      ? `Found ${jsonLdData.rawBlocksCount} JSON-LD structured data block(s).`
      : 'No JSON-LD structured data detected. Structured data is the primary bridge between human web pages and machine knowledge graphs.',
    whatWeFound: hasJsonLd ? `${jsonLdData.rawBlocksCount} <script type="application/ld+json"> tag(s).` : 'Missing JSON-LD tags.',
    whyItMatters: 'JSON-LD is recommended by Google and major AI engines for explicit entity extraction.',
    howToImprove: hasJsonLd ? 'Keep schema current.' : 'Add a <script type="application/ld+json"> block with appropriate schema.',
    evidence: { blocksCount: jsonLdData.rawBlocksCount },
  });

  // 2. Syntax Validity
  const noParseErrors = jsonLdData.parseErrors.length === 0;
  results.push({
    id: 'sd-syntax',
    category: 'structuredData',
    title: 'JSON-LD Syntax Formatting',
    status: !hasJsonLd ? 'INFO' : noParseErrors ? 'PASS' : 'FAIL',
    severity: !hasJsonLd ? 'info' : noParseErrors ? 'info' : 'critical',
    score: !hasJsonLd ? 0 : noParseErrors ? 8 : 2,
    maxScore: 8,
    explanation: !hasJsonLd
      ? 'No JSON-LD present to validate.'
      : noParseErrors
      ? 'All JSON-LD blocks parsed validly without syntax errors.'
      : `Encountered ${jsonLdData.parseErrors.length} parsing error(s) in JSON-LD markup.`,
    whatWeFound: !hasJsonLd ? 'N/A' : noParseErrors ? 'Clean JSON syntax.' : jsonLdData.parseErrors.join('; '),
    whyItMatters: 'Malformed JSON-LD prevents AI search crawlers from ingesting any entities in that block.',
    howToImprove: noParseErrors ? 'No action needed.' : 'Correct syntax errors such as missing quotes or trailing commas.',
    evidence: { parseErrors: jsonLdData.parseErrors },
  });

  // 3. Schema.org @context
  const hasContext = jsonLdData.hasContext;
  results.push({
    id: 'sd-schema-context',
    category: 'structuredData',
    title: 'Schema Vocabulary (@context)',
    status: !hasJsonLd ? 'INFO' : hasContext ? 'PASS' : 'WARNING',
    severity: hasContext ? 'info' : 'medium',
    score: !hasJsonLd ? 0 : hasContext ? 6 : 2,
    maxScore: 6,
    explanation: !hasJsonLd ? 'No JSON-LD.' : hasContext ? '@context is declared ("https://schema.org").' : 'Missing standard @context.',
    whatWeFound: hasContext ? '@context: "https://schema.org"' : 'Missing @context.',
    whyItMatters: '@context defines the ontology vocabulary used to interpret properties.',
    howToImprove: hasContext ? 'No action needed.' : 'Add "@context": "https://schema.org" to every JSON-LD object.',
    evidence: { hasContext },
  });

  // 4. Schema.org @type
  const hasType = jsonLdData.hasType;
  results.push({
    id: 'sd-schema-type',
    category: 'structuredData',
    title: 'Entity Type Declaration (@type)',
    status: !hasJsonLd ? 'INFO' : hasType ? 'PASS' : 'WARNING',
    severity: hasType ? 'info' : 'medium',
    score: !hasJsonLd ? 0 : hasType ? 6 : 2,
    maxScore: 6,
    explanation: !hasJsonLd ? 'No JSON-LD.' : hasType ? 'Valid @type declaration is present.' : 'Missing @type attribute.',
    whatWeFound: hasType ? `Detected types: ${jsonLdData.detectedTypes.join(', ')}` : 'Missing @type.',
    whyItMatters: '@type instructs machine crawlers which real-world entity category the object belongs to.',
    howToImprove: hasType ? 'No action needed.' : 'Declare a recognized Schema.org type (e.g., Organization, SoftwareApplication).',
    evidence: { detectedTypes: jsonLdData.detectedTypes },
  });

  // 5. Recognized Schema.org Types
  const detectedTypes = jsonLdData.detectedTypes;
  const hasRecognizedTypes = detectedTypes.length > 0;
  results.push({
    id: 'sd-recognized-types',
    category: 'structuredData',
    title: 'Recognized Schema.org Types',
    status: hasRecognizedTypes ? 'PASS' : 'WARNING',
    severity: hasRecognizedTypes ? 'info' : 'medium',
    score: hasRecognizedTypes ? 8 : 0,
    maxScore: 8,
    explanation: hasRecognizedTypes
      ? `Detected ${detectedTypes.length} recognized Schema type(s): ${detectedTypes.join(', ')}.`
      : 'No recognized Schema.org types were detected.',
    whatWeFound: hasRecognizedTypes ? detectedTypes.map((t) => `✓ ${t}`).join(', ') : 'Zero recognized schema types.',
    whyItMatters: 'Recognized schema types link your webpage directly into AI knowledge graphs.',
    howToImprove: hasRecognizedTypes ? 'Ensure detected types match page content.' : 'Add schema matching your business or site type.',
    evidence: { detectedTypes },
  });

  // 6. Schema Node @id URI
  const hasId = jsonLdData.objects.some((o) => !!o.id);
  results.push({
    id: 'sd-entity-id',
    category: 'structuredData',
    title: 'Entity Global Identifier (@id)',
    status: !hasJsonLd ? 'INFO' : hasId ? 'PASS' : 'INFO',
    severity: 'info',
    score: !hasJsonLd ? 0 : hasId ? 5 : 3,
    maxScore: 5,
    explanation: !hasJsonLd
      ? 'No JSON-LD.'
      : hasId
      ? 'Explicit URI @id defined for graph disambiguation.'
      : 'No explicit @id defined (optional, but helpful for knowledge graph linking).',
    whatWeFound: hasId ? 'Found @id URI in schema.' : 'No @id declared.',
    whyItMatters: '@id creates permanent URI nodes in machine knowledge graphs.',
    howToImprove: hasId ? 'No action needed.' : 'Add an "@id": "https://domain.com/#organization" to link entities across pages.',
    evidence: { hasId },
  });

  // 7. Core Entity Name Property
  const hasName = jsonLdData.hasName;
  results.push({
    id: 'sd-name-property',
    category: 'structuredData',
    title: 'Primary Entity Name Property ("name")',
    status: !hasJsonLd ? 'INFO' : hasName ? 'PASS' : 'WARNING',
    severity: hasName ? 'info' : 'medium',
    score: !hasJsonLd ? 0 : hasName ? 6 : 1,
    maxScore: 6,
    explanation: !hasJsonLd ? 'No JSON-LD.' : hasName ? 'Primary entity name declared.' : 'Missing "name" property in schema.',
    whatWeFound: hasName ? 'Found name property.' : 'No "name" property found.',
    whyItMatters: 'AI search bots use name to associate information with the right entity.',
    howToImprove: hasName ? 'No action needed.' : 'Add "name": "Your Brand Name" inside your JSON-LD object.',
    evidence: { hasName },
  });

  // 8. Core Entity Description Property
  const hasDescription = jsonLdData.objects.some((o) => !!o.description);
  results.push({
    id: 'sd-description-property',
    category: 'structuredData',
    title: 'Schema Description Property ("description")',
    status: !hasJsonLd ? 'INFO' : hasDescription ? 'PASS' : 'WARNING',
    severity: hasDescription ? 'info' : 'low',
    score: !hasJsonLd ? 0 : hasDescription ? 6 : 2,
    maxScore: 6,
    explanation: !hasJsonLd ? 'No JSON-LD.' : hasDescription ? 'Schema includes descriptive explanation.' : 'No "description" property in schema.',
    whatWeFound: hasDescription ? 'Description property present.' : 'No description in schema.',
    whyItMatters: 'A machine-readable description clarifies what your product or organization does.',
    howToImprove: hasDescription ? 'No action needed.' : 'Add a concise "description" inside your primary JSON-LD schema.',
    evidence: { hasDescription },
  });

  // 9. Core Entity URL Property
  const hasUrl = jsonLdData.hasUrl;
  results.push({
    id: 'sd-url-property',
    category: 'structuredData',
    title: 'Canonical URL Property ("url")',
    status: !hasJsonLd ? 'INFO' : hasUrl ? 'PASS' : 'WARNING',
    severity: hasUrl ? 'info' : 'medium',
    score: !hasJsonLd ? 0 : hasUrl ? 6 : 1,
    maxScore: 6,
    explanation: !hasJsonLd ? 'No JSON-LD.' : hasUrl ? 'Schema specifies official URL.' : 'Missing "url" property in schema.',
    whatWeFound: hasUrl ? 'Found url property.' : 'Missing "url" property.',
    whyItMatters: 'Associates the machine entity with its official web domain.',
    howToImprove: hasUrl ? 'No action needed.' : 'Add "url": "https://yourdomain.com".',
    evidence: { hasUrl },
  });

  // 10. Core Entity Image / Logo Property
  const hasImage = jsonLdData.objects.some((o) => !!o.image);
  results.push({
    id: 'sd-image-property',
    category: 'structuredData',
    title: 'Visual Representation ("image" / "logo")',
    status: !hasJsonLd ? 'INFO' : hasImage ? 'PASS' : 'INFO',
    severity: 'info',
    score: !hasJsonLd ? 0 : hasImage ? 5 : 2,
    maxScore: 5,
    explanation: !hasJsonLd ? 'No JSON-LD.' : hasImage ? 'Found image/logo property in schema.' : 'No image or logo property defined in schema.',
    whatWeFound: hasImage ? 'Image property defined.' : 'No image property.',
    whyItMatters: 'Used by search engines and AI interfaces to display brand thumbnails.',
    howToImprove: hasImage ? 'No action needed.' : 'Add "image": "https://domain.com/logo.png".',
    evidence: { hasImage },
  });

  // 11. sameAs Authority Links
  const sameAsCount = jsonLdData.sameAsList.length;
  const hasSameAs = sameAsCount > 0;
  results.push({
    id: 'sd-sameas-links',
    category: 'structuredData',
    title: 'Entity Disambiguation Links ("sameAs")',
    status: !hasJsonLd ? 'INFO' : hasSameAs ? 'PASS' : 'WARNING',
    severity: hasSameAs ? 'info' : 'medium',
    score: !hasJsonLd ? 0 : hasSameAs ? 8 : 2,
    maxScore: 8,
    explanation: !hasJsonLd
      ? 'No JSON-LD.'
      : hasSameAs
      ? `Found ${sameAsCount} authority verification link(s) in sameAs.`
      : 'No sameAs links provided. sameAs connects your entity to external verified profiles (LinkedIn, GitHub, Crunchbase, etc.).',
    whatWeFound: hasSameAs ? `${sameAsCount} sameAs link(s): ${jsonLdData.sameAsList.join(', ')}` : 'Zero sameAs links in schema.',
    whyItMatters: 'sameAs tells AI models that this entity is identical to external verified profiles.',
    howToImprove: hasSameAs ? 'Keep external profiles active.' : 'Add "sameAs": ["https://linkedin.com/company/...", "https://x.com/..."] in your schema.',
    evidence: { sameAsList: jsonLdData.sameAsList },
  });

  // 12. Author or Publisher Relationship
  const hasPublisherOrAuthor = jsonLdData.objects.some((o) => !!o.publisher || !!o.author);
  results.push({
    id: 'sd-author-publisher',
    category: 'structuredData',
    title: 'Author / Publisher Relationship',
    status: !hasJsonLd ? 'INFO' : hasPublisherOrAuthor ? 'PASS' : 'INFO',
    severity: 'info',
    score: !hasJsonLd ? 0 : hasPublisherOrAuthor ? 5 : 3,
    maxScore: 5,
    explanation: !hasJsonLd
      ? 'No JSON-LD.'
      : hasPublisherOrAuthor
      ? 'Publisher or author entity relationship is established.'
      : 'No explicit publisher or author relationship defined in schema.',
    whatWeFound: hasPublisherOrAuthor ? 'Found author/publisher relation.' : 'Not declared.',
    whyItMatters: 'Links content to its organizational or individual creator for E-E-A-T grounding.',
    howToImprove: hasPublisherOrAuthor ? 'No action needed.' : 'Include "publisher": { "@type": "Organization", "name": "..." } on WebSite/Article schemas.',
    evidence: { hasPublisherOrAuthor },
  });

  // 13. Brand Property (Product / Software)
  const isProductOrSoftware = jsonLdData.productSchemas.length > 0 || jsonLdData.softwareAppSchemas.length > 0;
  const hasBrand = jsonLdData.objects.some((o) => !!o.brand);
  results.push({
    id: 'sd-brand-property',
    category: 'structuredData',
    title: 'Brand Association Property ("brand")',
    status: !isProductOrSoftware ? 'INFO' : hasBrand ? 'PASS' : 'WARNING',
    severity: 'info',
    score: !isProductOrSoftware ? 4 : hasBrand ? 5 : 2,
    maxScore: 5,
    explanation: !isProductOrSoftware
      ? 'Page is not a product/software schema where brand is expected.'
      : hasBrand
      ? 'Brand property declared for product/software.'
      : 'Product or Software schema is missing a "brand" association.',
    whatWeFound: hasBrand ? 'Brand property defined.' : isProductOrSoftware ? 'Missing brand property.' : 'N/A',
    whyItMatters: 'Clarifies corporate ownership of specific tools and software products.',
    howToImprove: hasBrand || !isProductOrSoftware ? 'No action needed.' : 'Add "brand": { "@type": "Brand", "name": "Your Brand" }.',
    evidence: { hasBrand, isProductOrSoftware },
  });

  // 14. Offers Property (Commercial schemas)
  const hasOffers = jsonLdData.objects.some((o) => !!o.offers);
  results.push({
    id: 'sd-offers-property',
    category: 'structuredData',
    title: 'Commercial Offerings ("offers")',
    status: hasOffers ? 'PASS' : 'INFO',
    severity: 'info',
    score: hasOffers ? 5 : 3,
    maxScore: 5,
    explanation: hasOffers ? 'Found "offers" pricing/plan data in schema.' : 'No "offers" property declared in schema.',
    whatWeFound: hasOffers ? 'Found offers property.' : 'No offers declared.',
    whyItMatters: 'Allows AI shopping and commercial search agents to understand pricing tiers.',
    howToImprove: hasOffers ? 'No action needed.' : 'If offering commercial plans, declare "offers": { "@type": "Offer", "price": "..." }.',
    evidence: { hasOffers },
  });

  // 15. ContactPoint or Address Property
  const hasContactPoint = jsonLdData.objects.some((o) => !!o.contactPoint || !!o.address);
  results.push({
    id: 'sd-contactpoint',
    category: 'structuredData',
    title: 'Contact Point / Address Information',
    status: hasContactPoint ? 'PASS' : 'INFO',
    severity: 'info',
    score: hasContactPoint ? 5 : 3,
    maxScore: 5,
    explanation: hasContactPoint ? 'Found contactPoint or address in schema.' : 'No contactPoint or address property in schema.',
    whatWeFound: hasContactPoint ? 'Found contactPoint / address.' : 'Not declared in schema.',
    whyItMatters: 'Aids local and commercial AI search queries regarding business locations.',
    howToImprove: hasContactPoint ? 'No action needed.' : 'Add "contactPoint": { "@type": "ContactPoint", "telephone": "..." }.',
    evidence: { hasContactPoint },
  });

  // 16. Main Entity Declaration
  const hasMainEntity = jsonLdData.objects.some((o) => !!o.mainEntity || !!o.mainEntityOfPage);
  results.push({
    id: 'sd-main-entity',
    category: 'structuredData',
    title: 'Main Entity Association ("mainEntity")',
    status: hasMainEntity ? 'PASS' : 'INFO',
    severity: 'info',
    score: hasMainEntity ? 5 : 3,
    maxScore: 5,
    explanation: hasMainEntity ? 'Found mainEntity or mainEntityOfPage declaration.' : 'No mainEntity relationship declared.',
    whatWeFound: hasMainEntity ? 'mainEntity declared.' : 'Not declared.',
    whyItMatters: 'Clarifies which entity on the page is the primary subject of the document.',
    howToImprove: hasMainEntity ? 'No action needed.' : 'Include "mainEntity": { "@id": "..." } on WebPage schemas.',
    evidence: { hasMainEntity },
  });

  // 17. Relationship Consistency & Absence of Orphaned Types
  const noConsistencyIssues = jsonLdData.consistencyIssues.length === 0;
  results.push({
    id: 'sd-relationship-consistency',
    category: 'structuredData',
    title: 'Schema Internal Consistency',
    status: !hasJsonLd ? 'INFO' : noConsistencyIssues ? 'PASS' : 'WARNING',
    severity: noConsistencyIssues ? 'info' : 'medium',
    score: !hasJsonLd ? 0 : noConsistencyIssues ? 5 : 1,
    maxScore: 5,
    explanation: !hasJsonLd
      ? 'No schema present.'
      : noConsistencyIssues
      ? 'All schema entities have consistent identity fields.'
      : `Consistency warnings: ${jsonLdData.consistencyIssues.join('; ')}`,
    whatWeFound: noConsistencyIssues ? 'Zero schema consistency errors.' : jsonLdData.consistencyIssues.join('; '),
    whyItMatters: 'Orphaned schema entities without names cause ambiguities in entity graphs.',
    howToImprove: noConsistencyIssues ? 'No action needed.' : 'Ensure all declared schema objects have explicit "name" attributes.',
    evidence: { consistencyIssues: jsonLdData.consistencyIssues },
  });

  // 18. Property Relevance Principle Check
  results.push({
    id: 'sd-relevance-principle',
    category: 'structuredData',
    title: 'Schema Property Relevance',
    status: 'PASS',
    severity: 'info',
    score: 5,
    maxScore: 5,
    explanation: 'Evaluated properties tailored strictly to detected schema types. Irrelevant properties are not penalized.',
    whatWeFound: 'Dynamic schema requirements matched to active entity types.',
    whyItMatters: 'Websites should not be penalized for omitting properties that do not apply to their specific business model.',
    howToImprove: 'Only implement schemas and properties that accurately reflect your actual content.',
    evidence: { principle: 'Relevance tailored to detected types' },
  });

  return results;
}
