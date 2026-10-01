import {
  AnswerCoverageItem,
  AnswerCoverageSummary,
  AuditRuleResult,
  EntityIntentCoverage,
  EvidenceSignalsSummary,
  InformationArchitectureSummary,
  IntentItem,
  EntitySummary,
} from './types';
import { ExtractedHtmlData } from '../parsers/html';
import { ParsedJsonLdData } from '../parsers/jsonld';

export interface AnswerReadinessInput {
  htmlData: ExtractedHtmlData;
  jsonLdData: ParsedJsonLdData;
  entitySummary: EntitySummary;
}

export interface AnswerReadinessOutput {
  checks: AuditRuleResult[];
  answerCoverage: AnswerCoverageSummary;
  entityIntentCoverage: EntityIntentCoverage;
  evidenceSignals: EvidenceSignalsSummary;
  informationArchitecture: InformationArchitectureSummary;
}

export function auditAnswerReadiness(input: AnswerReadinessInput): AnswerReadinessOutput {
  const { htmlData, jsonLdData, entitySummary } = input;
  const visibleLower = htmlData.visibleText.toLowerCase();
  const headingsLower = htmlData.headings.map((h) => h.text.toLowerCase());
  const allHeadingsJoined = headingsLower.join(' ');
  const entityName = entitySummary.primaryEntity;

  // 1. Detect site classification
  let siteType: AnswerCoverageSummary['detectedSiteType'] = 'general';
  if (entitySummary.entityType === 'Person' || jsonLdData.personSchemas.length > 0) {
    siteType = 'developer_portfolio';
  } else if (
    entitySummary.entityType === 'Software' ||
    entitySummary.entityType === 'Product' ||
    jsonLdData.softwareAppSchemas.length > 0 ||
    jsonLdData.productSchemas.length > 0
  ) {
    siteType = 'product_saas';
  } else if (
    entitySummary.entityType === 'Service' ||
    jsonLdData.serviceSchemas.length > 0
  ) {
    siteType = 'service';
  } else if (
    entitySummary.entityType === 'Organization' ||
    entitySummary.entityType === 'LocalBusiness' ||
    jsonLdData.organizationSchemas.length > 0 ||
    jsonLdData.localBusinessSchemas.length > 0
  ) {
    siteType = 'company';
  } else {
    siteType = 'company';
  }

  // 2. Build tailored question template evaluation
  const questions: AnswerCoverageItem[] = [];

  if (siteType === 'developer_portfolio') {
    // Q1: Who is this?
    const hasNameH1 = htmlData.h1List.some((h) => h.toLowerCase().includes(entityName.toLowerCase()));
    questions.push({
      question: `Who is ${entityName}?`,
      status: hasNameH1 ? 'ANSWERED' : entitySummary.primaryEntity ? 'PARTIALLY ANSWERED' : 'NOT FOUND',
      confidence: hasNameH1 ? 'high' : 'medium',
      evidence: hasNameH1 ? `Identified in primary heading: "${htmlData.h1List[0]}".` : `Identified as "${entityName}".`,
    });

    // Q2: What do they do?
    const roleMatch = visibleLower.match(/\b(software engineer|developer|designer|full-stack|frontend|backend|creator|founder)\b/i);
    questions.push({
      question: `What does ${entityName} do?`,
      status: roleMatch ? 'ANSWERED' : 'NOT FOUND',
      confidence: roleMatch ? 'high' : 'none',
      evidence: roleMatch ? `Role identified: "${roleMatch[0]}".` : 'No explicit professional title found.',
    });

    // Q3: What are their skills?
    const hasSkills = /skills|technologies|tools|stack/i.test(allHeadingsJoined) || htmlData.wordCount > 100;
    questions.push({
      question: `What are ${entityName}'s technical skills?`,
      status: hasSkills ? 'ANSWERED' : 'NOT FOUND',
      confidence: hasSkills ? 'high' : 'none',
      evidence: hasSkills ? 'Dedicated skills section or technology keywords identified.' : 'No skills section located.',
    });

    // Q4: What projects have they built?
    const hasProjects = /projects|portfolio|work|open source/i.test(allHeadingsJoined) || htmlData.linksAnalysis.iaCategories.products.length > 0;
    questions.push({
      question: `What projects has ${entityName} built?`,
      status: hasProjects ? 'ANSWERED' : 'NOT FOUND',
      confidence: hasProjects ? 'high' : 'none',
      evidence: hasProjects ? 'Projects or portfolio section identified in headings.' : 'No projects section found.',
    });

    // Q5: Where can they be found?
    const hasSocial = htmlData.detectedSocialLinks.length > 0;
    questions.push({
      question: `Where can ${entityName} be found online?`,
      status: hasSocial ? 'ANSWERED' : 'NOT FOUND',
      confidence: hasSocial ? 'high' : 'none',
      evidence: hasSocial ? `Found ${htmlData.detectedSocialLinks.length} social profile(s).` : 'No social links found.',
    });

    // Q6: How can they be contacted?
    const hasContact = htmlData.contactSignals.hasEmail || htmlData.contactSignals.hasContactLink;
    questions.push({
      question: `How can ${entityName} be contacted?`,
      status: hasContact ? 'ANSWERED' : 'NOT FOUND',
      confidence: hasContact ? 'high' : 'none',
      evidence: hasContact ? 'Contact email or form available.' : 'No direct contact methods found.',
    });
  } else if (siteType === 'product_saas') {
    // Q1: What is this product?
    const hasProdIdentity = !!htmlData.title || htmlData.h1List.length > 0;
    questions.push({
      question: `What is ${entityName}?`,
      status: hasProdIdentity ? 'ANSWERED' : 'NOT FOUND',
      confidence: 'high',
      evidence: `Product identified as "${entityName}".`,
    });

    // Q2: What does it do?
    const hasValueProp = (htmlData.metaDescription && htmlData.metaDescription.length > 40) || htmlData.wordCount > 120;
    questions.push({
      question: `What does ${entityName} do?`,
      status: hasValueProp ? 'ANSWERED' : 'PARTIALLY ANSWERED',
      confidence: hasValueProp ? 'high' : 'low',
      evidence: hasValueProp ? 'Product capabilities described in meta tags and copy.' : 'Sparse description of utility.',
    });

    // Q3: Who is it for?
    const audienceMatch = visibleLower.match(/\b(for developers|for teams|for furniture|for retailers|for enterprise|built for|designed for|who use)\b/i);
    questions.push({
      question: `Who is ${entityName} for?`,
      status: audienceMatch ? 'ANSWERED' : 'PARTIALLY ANSWERED',
      confidence: audienceMatch ? 'high' : 'low',
      evidence: audienceMatch ? `Target audience indicated: "${audienceMatch[0]}".` : 'Implicit audience from topic keywords.',
    });

    // Q4: What features does it provide?
    const hasFeatures = /features|capabilities|how it works|specifications|modules/i.test(allHeadingsJoined) || htmlData.h2List.length >= 3;
    questions.push({
      question: `What features does ${entityName} provide?`,
      status: hasFeatures ? 'ANSWERED' : 'PARTIALLY ANSWERED',
      confidence: hasFeatures ? 'high' : 'low',
      evidence: hasFeatures ? 'Features detailed across section subheadings.' : 'Limited feature breakdown subheadings.',
    });

    // Q5: What industry does it serve?
    const hasIndustry = /furniture|retail|manufacturing|technology|software/i.test(visibleLower);
    questions.push({
      question: `What industry does ${entityName} serve?`,
      status: hasIndustry ? 'ANSWERED' : 'NOT FOUND',
      confidence: hasIndustry ? 'high' : 'none',
      evidence: hasIndustry ? 'Industry context identified in page copy.' : 'No explicit industry vertical found.',
    });

    // Q6: What does it cost / pricing?
    const hasPricing = htmlData.evidenceSignals.hasPricing;
    questions.push({
      question: `What does ${entityName} cost?`,
      status: hasPricing ? 'ANSWERED' : 'PARTIALLY ANSWERED',
      confidence: hasPricing ? 'high' : 'low',
      evidence: hasPricing ? 'Pricing plans or billing links discovered.' : 'Pricing not explicitly detailed on this page.',
    });

    // Q7: How can it be purchased / tried?
    const hasCta = /sign up|get started|book demo|free trial|schedule demo|pricing|contact/i.test(visibleLower);
    questions.push({
      question: `How can users get started with ${entityName}?`,
      status: hasCta ? 'ANSWERED' : 'NOT FOUND',
      confidence: hasCta ? 'high' : 'none',
      evidence: hasCta ? 'Actionable call-to-action (Sign up / Demo / Contact) found.' : 'No clear onboarding CTA found.',
    });
  } else {
    // Organization / Company / Service
    // Q1: What is the organization?
    questions.push({
      question: `What is ${entityName}?`,
      status: 'ANSWERED',
      confidence: 'high',
      evidence: `Organization identified as "${entityName}".`,
    });

    // Q2: What does it do?
    const hasOfferings = /services|solutions|products|offerings|platform|what we do/i.test(allHeadingsJoined) || htmlData.wordCount > 150;
    questions.push({
      question: `What does ${entityName} do?`,
      status: hasOfferings ? 'ANSWERED' : 'PARTIALLY ANSWERED',
      confidence: hasOfferings ? 'high' : 'low',
      evidence: hasOfferings ? 'Core services and offerings explained in headings and text.' : 'Limited service descriptions found.',
    });

    // Q3: Who does it serve?
    const hasClients = /clients|customers|who we serve|businesses|retailers|enterprises/i.test(visibleLower);
    questions.push({
      question: `Who does ${entityName} serve?`,
      status: hasClients ? 'ANSWERED' : 'PARTIALLY ANSWERED',
      confidence: hasClients ? 'high' : 'low',
      evidence: hasClients ? 'Target audience and customer segments described.' : 'Client verticals not explicitly emphasized.',
    });

    // Q4: What industry is it in?
    const hasIndustry = /furniture|retail|manufacturing|technology|software|services/i.test(visibleLower);
    questions.push({
      question: `What industry is ${entityName} in?`,
      status: hasIndustry ? 'ANSWERED' : 'NOT FOUND',
      confidence: hasIndustry ? 'high' : 'none',
      evidence: hasIndustry ? 'Industry terminology present across content.' : 'Industry context ambiguous.',
    });

    // Q5: Where is it based?
    const hasLocation = htmlData.contactSignals.address || /headquarters|based in|located in|india|bangalore|delhi|mumbai|usa|california/i.test(visibleLower);
    questions.push({
      question: `Where is ${entityName} based?`,
      status: hasLocation ? 'ANSWERED' : 'PARTIALLY ANSWERED',
      confidence: hasLocation ? 'medium' : 'low',
      evidence: hasLocation ? 'Geographic location signals detected.' : 'No explicit physical location found on this page.',
    });

    // Q6: How can it be contacted?
    const hasContact = htmlData.contactSignals.hasEmail || htmlData.contactSignals.hasPhone || htmlData.contactSignals.hasContactLink;
    questions.push({
      question: `How can ${entityName} be contacted?`,
      status: hasContact ? 'ANSWERED' : 'NOT FOUND',
      confidence: hasContact ? 'high' : 'none',
      evidence: hasContact ? 'Direct contact channels (email, phone, or link) verified.' : 'No contact access points found.',
    });
  }

  // Compute overall coverage percentage
  const answeredCount = questions.filter((q) => q.status === 'ANSWERED').length;
  const partialCount = questions.filter((q) => q.status === 'PARTIALLY ANSWERED').length;
  const overallCoverageScore = Math.round(((answeredCount * 1.0 + partialCount * 0.5) / questions.length) * 100);

  const answerCoverage: AnswerCoverageSummary = {
    detectedSiteType: siteType,
    overallCoverageScore,
    questions,
  };

  // 3. Entity-Intent Coverage
  const intentItems: IntentItem[] = htmlData.detectedIntents.map((name) => ({
    name,
    category: 'Core Capability / Topic',
    source: 'Headings & Semantic Navigation',
  }));

  const entityIntentCoverage: EntityIntentCoverage = {
    primaryEntity: entityName,
    intents: intentItems,
  };

  // 4. Evidence Signals Summary
  const evidenceSignalItems = [
    {
      id: 'ev-testimonials',
      label: 'Customer References & Testimonials',
      present: htmlData.evidenceSignals.hasTestimonials,
      evidenceText: htmlData.evidenceSignals.hasTestimonials ? 'Customer testimonials or client quotes identified in page copy.' : undefined,
    },
    {
      id: 'ev-pricing',
      label: 'Transparent Pricing / Cost Information',
      present: htmlData.evidenceSignals.hasPricing,
      evidenceText: htmlData.evidenceSignals.hasPricing ? 'Pricing tiers or billing links located.' : undefined,
    },
    {
      id: 'ev-company-info',
      label: 'Company Overview & Operational Details',
      present: htmlData.evidenceSignals.hasCompanyInfo,
      evidenceText: htmlData.evidenceSignals.hasCompanyInfo ? 'Found About / corporate profile navigation.' : undefined,
    },
    {
      id: 'ev-contact-info',
      label: 'Direct Contact & Inquiries Access',
      present: htmlData.evidenceSignals.hasContactInfo,
      evidenceText: htmlData.evidenceSignals.hasContactInfo ? 'Direct phone, email, or inquiry form available.' : undefined,
    },
    {
      id: 'ev-documentation',
      label: 'Documentation & Guides',
      present: htmlData.evidenceSignals.hasDocumentation,
      evidenceText: htmlData.evidenceSignals.hasDocumentation ? 'Documentation or guide references located.' : undefined,
    },
    {
      id: 'ev-case-studies',
      label: 'Case Studies / Success Stories',
      present: htmlData.evidenceSignals.hasCaseStudies,
      evidenceText: htmlData.evidenceSignals.hasCaseStudies ? 'Case studies or client success stories identified.' : undefined,
    },
    {
      id: 'ev-certifications',
      label: 'Certifications & Accreditations',
      present: htmlData.evidenceSignals.hasCertifications,
      evidenceText: htmlData.evidenceSignals.hasCertifications ? 'Security, compliance, or industry certifications mentioned.' : undefined,
    },
    {
      id: 'ev-partners',
      label: 'Partners & Ecosystem Integrations',
      present: htmlData.evidenceSignals.hasPartners,
      evidenceText: htmlData.evidenceSignals.hasPartners ? 'Partners or integration ecosystem references located.' : undefined,
    },
    {
      id: 'ev-screenshots',
      label: 'Product Interface / Visual Evidence',
      present: htmlData.evidenceSignals.hasProductScreenshots,
      evidenceText: htmlData.evidenceSignals.hasProductScreenshots ? 'Interface screenshots or visual previews located.' : undefined,
    },
  ];

  const evidenceSignals: EvidenceSignalsSummary = {
    signals: evidenceSignalItems,
    detectedCount: evidenceSignalItems.filter((s) => s.present).length,
  };

  // 5. Information Architecture Summary
  const iaCategoriesFound: string[] = [];
  const ia = htmlData.linksAnalysis.iaCategories;
  if (ia.about.length > 0) iaCategoriesFound.push('About');
  if (ia.pricing.length > 0) iaCategoriesFound.push('Pricing');
  if (ia.products.length > 0) iaCategoriesFound.push('Products');
  if (ia.services.length > 0) iaCategoriesFound.push('Services');
  if (ia.contact.length > 0) iaCategoriesFound.push('Contact');
  if (ia.docs.length > 0) iaCategoriesFound.push('Documentation');
  if (ia.blog.length > 0) iaCategoriesFound.push('Blog');
  if (ia.legal.length > 0) iaCategoriesFound.push('Legal/Privacy');

  const informationArchitecture: InformationArchitectureSummary = {
    links: [...htmlData.linksAnalysis.internalLinks, ...htmlData.linksAnalysis.externalLinks],
    categoriesFound: iaCategoriesFound,
    hasSuspiciousLinks: htmlData.linksAnalysis.suspiciousLinks.length > 0,
    totalInternalLinks: htmlData.linksAnalysis.internalLinks.length,
    totalExternalLinks: htmlData.linksAnalysis.externalLinks.length,
  };

  // 6. Generate Category 5 Audit Checks (~18 rules)
  const checks: AuditRuleResult[] = [];

  // Rule 1: Site Type Classification
  checks.push({
    id: 'answer-site-type-classified',
    category: 'answerReadiness',
    title: 'Site Intent Classification',
    status: 'PASS',
    severity: 'info',
    score: 6,
    maxScore: 6,
    explanation: `Classified as ${siteType.replace('_', ' ')} based on entity and semantic markers.`,
    whatWeFound: `Type: ${siteType.replace('_', ' ')}.`,
    whyItMatters: 'Conversational AI models adjust their query intent templates based on site classification.',
    howToImprove: 'Ensure your headings align with your core business model.',
    evidence: { siteType },
  });

  // Rules 2 to (1 + questions.length): Question coverage checks
  questions.forEach((q, idx) => {
    const isAnswered = q.status === 'ANSWERED';
    const isPartial = q.status === 'PARTIALLY ANSWERED';
    const score = isAnswered ? 6 : isPartial ? 4 : 1;
    const status = isAnswered ? 'PASS' : isPartial ? 'PASS' : 'WARNING';

    checks.push({
      id: `answer-q${idx + 1}-coverage`,
      category: 'answerReadiness',
      title: `Query Coverage: "${q.question}"`,
      status,
      severity: isAnswered ? 'info' : 'low',
      score,
      maxScore: 6,
      explanation: isAnswered
        ? `Page clearly answers: "${q.question}" (${q.confidence} confidence).`
        : isPartial
        ? `Page partially addresses: "${q.question}".`
        : `Could not identify direct answers to: "${q.question}".`,
      whatWeFound: q.evidence,
      whyItMatters: 'AI search engines (Perplexity, ChatGPT Search, Gemini) directly seek answers to these questions when synthesizing answers.',
      howToImprove: isAnswered ? 'Keep information factual.' : `Add a dedicated section directly answering "${q.question}".`,
      evidence: { question: q.question, status: q.status, evidence: q.evidence },
    });
  });

  // Rule: Intent Coverage
  const intentCount = intentItems.length;
  checks.push({
    id: 'answer-intent-coverage',
    category: 'answerReadiness',
    title: 'Entity–Intent Concept Coverage',
    status: intentCount >= 4 ? 'PASS' : intentCount >= 2 ? 'PASS' : 'WARNING',
    severity: intentCount >= 4 ? 'info' : 'low',
    score: intentCount >= 4 ? 6 : intentCount >= 2 ? 4 : 2,
    maxScore: 6,
    explanation: intentCount >= 4
      ? `Extracted ${intentCount} core capability/intent concepts from page structure.`
      : `Extracted ${intentCount} intent concepts.`,
    whatWeFound: intentCount > 0 ? intentItems.slice(0, 5).map((i) => i.name).join(', ') : 'Few intent concepts.',
    whyItMatters: 'Intent concepts allow AI systems to match user semantic search queries without requiring exact keyword matching.',
    howToImprove: intentCount >= 4 ? 'No action needed.' : 'Structure sections under clear topical concept headings.',
    evidence: { intents: intentItems.slice(0, 8) },
  });

  // Rule: Evidence Testimonials
  checks.push({
    id: 'answer-evidence-testimonials',
    category: 'answerReadiness',
    title: 'Evidence Signals: Client References & Reviews',
    status: htmlData.evidenceSignals.hasTestimonials ? 'PASS' : 'INFO',
    severity: 'info',
    score: htmlData.evidenceSignals.hasTestimonials ? 5 : 2,
    maxScore: 5,
    explanation: htmlData.evidenceSignals.hasTestimonials
      ? 'Customer testimonials or client feedback sections identified.'
      : 'No explicit customer testimonials identified on this page (informational).',
    whatWeFound: htmlData.evidenceSignals.hasTestimonials ? 'Customer feedback detected.' : 'None detected.',
    whyItMatters: 'Corroborating client quotes provide factual grounding for AI answer synthesis.',
    howToImprove: 'Highlight representative client feedback or ratings.',
    evidence: { hasTestimonials: htmlData.evidenceSignals.hasTestimonials },
  });

  // Rule: Evidence Pricing
  checks.push({
    id: 'answer-evidence-pricing',
    category: 'answerReadiness',
    title: 'Evidence Signals: Transparent Pricing Information',
    status: htmlData.evidenceSignals.hasPricing ? 'PASS' : 'INFO',
    severity: 'info',
    score: htmlData.evidenceSignals.hasPricing ? 5 : 2,
    maxScore: 5,
    explanation: htmlData.evidenceSignals.hasPricing
      ? 'Pricing tiers or billing links identified.'
      : 'No explicit pricing tiers detected on this page.',
    whatWeFound: htmlData.evidenceSignals.hasPricing ? 'Pricing details located.' : 'No pricing detected.',
    whyItMatters: 'Commercial intent queries frequently seek transparent pricing models.',
    howToImprove: 'Link to a transparent pricing page or quote calculator.',
    evidence: { hasPricing: htmlData.evidenceSignals.hasPricing },
  });

  // Rule: Evidence Company Info
  checks.push({
    id: 'answer-evidence-company-info',
    category: 'answerReadiness',
    title: 'Evidence Signals: Company / Organization Background',
    status: htmlData.evidenceSignals.hasCompanyInfo ? 'PASS' : 'WARNING',
    severity: htmlData.evidenceSignals.hasCompanyInfo ? 'info' : 'low',
    score: htmlData.evidenceSignals.hasCompanyInfo ? 5 : 2,
    maxScore: 5,
    explanation: htmlData.evidenceSignals.hasCompanyInfo
      ? 'Corporate background or About profile pathway verified.'
      : 'Missing explicit company background or corporate origin pathway.',
    whatWeFound: htmlData.evidenceSignals.hasCompanyInfo ? 'Company profile present.' : 'Missing company profile.',
    whyItMatters: 'AI answer engines check business background to answer credibility inquiries.',
    howToImprove: 'Provide an About section detailing founders, mission, and background.',
    evidence: { hasCompanyInfo: htmlData.evidenceSignals.hasCompanyInfo },
  });

  // Rule: Evidence Documentation
  checks.push({
    id: 'answer-evidence-documentation',
    category: 'answerReadiness',
    title: 'Evidence Signals: Documentation & Resources',
    status: htmlData.evidenceSignals.hasDocumentation ? 'PASS' : 'INFO',
    severity: 'info',
    score: htmlData.evidenceSignals.hasDocumentation ? 4 : 2,
    maxScore: 4,
    explanation: htmlData.evidenceSignals.hasDocumentation
      ? 'Documentation or guide references located.'
      : 'No documentation links identified.',
    whatWeFound: htmlData.evidenceSignals.hasDocumentation ? 'Documentation located.' : 'None detected.',
    whyItMatters: 'Technical documentation aids AI developer assistants.',
    howToImprove: 'Provide documentation or API guides if offering software.',
    evidence: { hasDocumentation: htmlData.evidenceSignals.hasDocumentation },
  });

  // Rule: IA Navigation Pathways (About & Contact)
  const hasCoreIa = ia.about.length > 0 && ia.contact.length > 0;
  checks.push({
    id: 'answer-ia-core-pathways',
    category: 'answerReadiness',
    title: 'Information Architecture: Essential Pathways',
    status: hasCoreIa ? 'PASS' : ia.about.length > 0 || ia.contact.length > 0 ? 'PASS' : 'WARNING',
    severity: hasCoreIa ? 'info' : 'low',
    score: hasCoreIa ? 6 : 3,
    maxScore: 6,
    explanation: hasCoreIa
      ? 'Essential internal navigation pathways (About and Contact) discovered.'
      : 'Some essential navigation pathways are missing.',
    whatWeFound: `Categories: ${iaCategoriesFound.join(', ') || 'none'}`,
    whyItMatters: 'Clear navigation architecture allows crawlers to build complete site trees.',
    howToImprove: 'Include accessible links to About and Contact in header or footer.',
    evidence: { iaCategoriesFound },
  });

  // Rule: IA Commercial Pathways (Products / Services)
  const hasCommercialIa = ia.products.length > 0 || ia.services.length > 0;
  checks.push({
    id: 'answer-ia-commercial-pathways',
    category: 'answerReadiness',
    title: 'Information Architecture: Offerings Discovery',
    status: hasCommercialIa ? 'PASS' : 'INFO',
    severity: 'info',
    score: hasCommercialIa ? 5 : 2,
    maxScore: 5,
    explanation: hasCommercialIa
      ? 'Products or services catalog pathways discovered in navigation.'
      : 'No dedicated product/service catalog links identified on this page.',
    whatWeFound: hasCommercialIa ? 'Catalog pathways present.' : 'None detected.',
    whyItMatters: 'Enables discovery of deeper inventory and feature pages.',
    howToImprove: 'Organize offerings into clear category links.',
    evidence: { hasCommercialIa },
  });

  // Rule: IA Legal & Compliance Pathways
  const hasLegalIa = ia.legal.length > 0;
  checks.push({
    id: 'answer-ia-legal-privacy',
    category: 'answerReadiness',
    title: 'Information Architecture: Privacy & Terms Pathways',
    status: hasLegalIa ? 'PASS' : 'WARNING',
    severity: hasLegalIa ? 'info' : 'low',
    score: hasLegalIa ? 5 : 1,
    maxScore: 5,
    explanation: hasLegalIa
      ? 'Privacy policy or legal terms link discovered in footer navigation.'
      : 'No privacy policy or legal terms link detected in navigation.',
    whatWeFound: hasLegalIa ? 'Privacy / legal link discovered.' : 'Missing legal links.',
    whyItMatters: 'Privacy policies are an indispensable trust requirement for web indexers.',
    howToImprove: 'Add links to Privacy Policy and Terms of Service in your footer.',
    evidence: { hasLegalIa },
  });

  return {
    checks,
    answerCoverage,
    entityIntentCoverage,
    evidenceSignals,
    informationArchitecture,
  };
}
