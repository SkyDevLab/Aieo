import { AuditRuleResult } from './types';
import { ParsedJsonLdData } from '../parsers/jsonld';

export interface StructuredDataAuditInput {
  jsonLdData: ParsedJsonLdData;
}

export function auditStructuredData(input: StructuredDataAuditInput): AuditRuleResult[] {
  const { jsonLdData } = input;
  const results: AuditRuleResult[] = [];

  // 1. JSON-LD Presence
  const hasJsonLd = jsonLdData.hasJsonLd;
  results.push({
    id: 'sd-presence',
    category: 'structuredData',
    title: 'JSON-LD Structured Data Presence',
    status: hasJsonLd ? 'PASS' : 'WARNING',
    severity: hasJsonLd ? 'info' : 'high',
    score: hasJsonLd ? 20 : 0,
    maxScore: 20,
    explanation: hasJsonLd
      ? `Found ${jsonLdData.rawBlocksCount} JSON-LD structured data block(s).`
      : 'No JSON-LD structured data detected. Structured data is the primary bridge between human web pages and machine knowledge graphs.',
    whatWeFound: hasJsonLd
      ? `${jsonLdData.rawBlocksCount} <script type="application/ld+json"> tag(s) located.`
      : 'No <script type="application/ld+json"> tags found on the page.',
    whyItMatters:
      'JSON-LD is the format recommended by Google, Schema.org, and leading AI engines for unambiguous entity extraction and knowledge graph construction.',
    howToImprove: hasJsonLd
      ? 'Ensure all structured data is accurate and synchronized with page content.'
      : 'Add a <script type="application/ld+json"> block with appropriate schema (e.g., Organization, WebSite, or Person).',
  });

  // 2. Syntax & Parsing Validity
  const noParseErrors = jsonLdData.parseErrors.length === 0;
  const parseScore = hasJsonLd ? (noParseErrors ? 15 : 5) : 0;
  results.push({
    id: 'sd-syntax',
    category: 'structuredData',
    title: 'JSON-LD Syntax & Formatting',
    status: !hasJsonLd ? 'INFO' : noParseErrors ? 'PASS' : 'FAIL',
    severity: !hasJsonLd ? 'info' : noParseErrors ? 'info' : 'critical',
    score: parseScore,
    maxScore: 15,
    explanation: !hasJsonLd
      ? 'No JSON-LD to validate.'
      : noParseErrors
      ? 'All JSON-LD blocks parsed validly without syntax errors.'
      : `Encountered ${jsonLdData.parseErrors.length} parsing error(s) in JSON-LD markup.`,
    whatWeFound: !hasJsonLd
      ? 'N/A'
      : noParseErrors
      ? 'Valid JSON syntax across all blocks.'
      : jsonLdData.parseErrors.join('; '),
    whyItMatters:
      'Malformed JSON-LD prevents AI search crawlers from reading any entities inside that block.',
    howToImprove: noParseErrors
      ? 'Keep schema validated using the Schema.org validator.'
      : 'Fix syntax issues such as trailing commas, unescaped quotation marks, or malformed brackets in JSON-LD.',
  });

  // 3. Schema.org @context and @type Definitions
  const hasContext = jsonLdData.hasContext;
  const hasType = jsonLdData.hasType;
  const contextAndTypeScore = hasJsonLd ? (hasContext && hasType ? 15 : hasType ? 10 : 0) : 0;

  results.push({
    id: 'sd-context-type',
    category: 'structuredData',
    title: 'Schema Vocabulary (@context & @type)',
    status: !hasJsonLd ? 'INFO' : hasContext && hasType ? 'PASS' : 'WARNING',
    severity: !hasJsonLd ? 'info' : hasContext && hasType ? 'info' : 'medium',
    score: contextAndTypeScore,
    maxScore: 15,
    explanation: !hasJsonLd
      ? 'No JSON-LD present.'
      : hasContext && hasType
      ? 'Standard Schema.org @context and valid entity @type declarations are present.'
      : 'JSON-LD is missing either standard @context ("https://schema.org") or @type declarations.',
    whatWeFound: !hasJsonLd
      ? 'N/A'
      : `@context present: ${hasContext ? 'Yes' : 'No'}; @type declared: ${hasType ? 'Yes' : 'No'}.`,
    whyItMatters:
      '@context and @type declare which ontology vocabulary AI engines should use to interpret the object attributes.',
    howToImprove: hasContext && hasType
      ? 'Continue using standardized schema vocabulary.'
      : 'Add "@context": "https://schema.org" and a recognized "@type" to every JSON-LD object.',
  });

  // 4. Detected Recognized Entity Types
  const detectedTypes = jsonLdData.detectedTypes;
  const hasRecognizedTypes = detectedTypes.length > 0;
  const recognizedScore = hasRecognizedTypes ? 20 : 0;

  results.push({
    id: 'sd-detected-types',
    category: 'structuredData',
    title: 'Recognized Schema.org Types',
    status: hasRecognizedTypes ? 'PASS' : 'WARNING',
    severity: hasRecognizedTypes ? 'info' : 'medium',
    score: recognizedScore,
    maxScore: 20,
    explanation: hasRecognizedTypes
      ? `Detected ${detectedTypes.length} recognized Schema type(s): ${detectedTypes.join(', ')}.`
      : 'No recognized Schema.org types (such as WebSite, Organization, Person, Article, Product, or FAQPage) were detected.',
    whatWeFound: hasRecognizedTypes
      ? `Types found: ${detectedTypes.map((t) => `✓ ${t}`).join(', ')}.`
      : 'Zero recognized Schema types found.',
    whyItMatters:
      'Recognized Schema types map your page into machine-readable knowledge graphs (e.g. Google Knowledge Graph, Perplexity entities).',
    howToImprove: hasRecognizedTypes
      ? 'Ensure the detected schema types accurately reflect your page contents. Note: not every site requires every schema type.'
      : 'Select the most relevant schema for your site: Organization or LocalBusiness for companies, Person for individual portfolios, WebSite for homepages.',
  });

  // 5. Entity Identity Attributes (Name & URL)
  const hasName = jsonLdData.hasName;
  const hasUrl = jsonLdData.hasUrl;
  const nameUrlScore = hasJsonLd ? (hasName && hasUrl ? 15 : hasName || hasUrl ? 8 : 0) : 0;

  results.push({
    id: 'sd-identity-attributes',
    category: 'structuredData',
    title: 'Core Entity Properties (name & url)',
    status: !hasJsonLd ? 'INFO' : hasName && hasUrl ? 'PASS' : 'WARNING',
    severity: !hasJsonLd ? 'info' : hasName && hasUrl ? 'info' : 'medium',
    score: nameUrlScore,
    maxScore: 15,
    explanation: !hasJsonLd
      ? 'No JSON-LD present.'
      : hasName && hasUrl
      ? 'Primary entity properties ("name" and "url") are properly populated.'
      : 'Structured data is missing either the "name" or "url" property, which are vital for entity disambiguation.',
    whatWeFound: !hasJsonLd
      ? 'N/A'
      : `Property "name": ${hasName ? 'Present' : 'Missing'}; Property "url": ${hasUrl ? 'Present' : 'Missing'}.`,
    whyItMatters:
      'AI systems use name and canonical URL properties to anchor nodes in entity knowledge bases.',
    howToImprove: hasName && hasUrl
      ? 'Ensure name and url match your canonical web address exactly.'
      : 'Add explicit "name": "Your Brand/Name" and "url": "https://..." fields inside your primary JSON-LD entity.',
  });

  // 6. Authority Links (sameAs)
  const sameAsCount = jsonLdData.sameAsList.length;
  const hasPersonOrOrg = jsonLdData.personSchemas.length > 0 || jsonLdData.organizationSchemas.length > 0;
  const sameAsOk = sameAsCount > 0;

  let sameAsScore = 0;
  let sameAsStatus: AuditRuleResult['status'] = 'PASS';
  let sameAsExplanation = '';

  if (!hasJsonLd) {
    sameAsStatus = 'INFO';
    sameAsScore = 0;
    sameAsExplanation = 'No structured data present to evaluate sameAs links.';
  } else if (sameAsOk) {
    sameAsStatus = 'PASS';
    sameAsScore = 15;
    sameAsExplanation = `Found ${sameAsCount} authority sameAs verification link(s) (${jsonLdData.sameAsList.slice(0, 3).join(', ')}${sameAsCount > 3 ? '...' : ''}).`;
  } else if (hasPersonOrOrg) {
    sameAsStatus = 'WARNING';
    sameAsScore = 5;
    sameAsExplanation = 'Person or Organization schema is present, but lacks "sameAs" links pointing to authoritative profiles (GitHub, LinkedIn, Wikipedia, etc.).';
  } else {
    sameAsStatus = 'INFO';
    sameAsScore = 10;
    sameAsExplanation = 'No Person or Organization schema declared where sameAs links would typically be expected.';
  }

  results.push({
    id: 'sd-same-as',
    category: 'structuredData',
    title: 'Entity Disambiguation Links (sameAs)',
    status: sameAsStatus,
    severity: sameAsStatus === 'WARNING' ? 'medium' : 'info',
    score: sameAsScore,
    maxScore: 15,
    explanation: sameAsExplanation,
    whatWeFound: sameAsOk
      ? `${sameAsCount} sameAs link(s): ${jsonLdData.sameAsList.join(', ')}.`
      : hasPersonOrOrg
      ? 'Person/Organization schema exists with no sameAs array.'
      : 'No sameAs links detected.',
    whyItMatters:
      'The "sameAs" property directly instructs AI models that this entity is identical to external verified profiles (e.g. LinkedIn, GitHub, Wikidata, Twitter).',
    howToImprove: sameAsOk
      ? 'Keep external profiles active and consistent.'
      : 'Add a "sameAs": ["https://github.com/...", "https://linkedin.com/in/..."] array inside your Person or Organization schema.',
  });

  return results;
}
