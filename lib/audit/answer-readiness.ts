import {
  AnswerQuestionEvaluation,
  AnswerReadinessSummary,
  AuditRuleResult,
} from './types';
import { ExtractedHtmlData } from '../parsers/html';
import { ParsedJsonLdData } from '../parsers/jsonld';
import { EntitySummary } from './types';

export interface AnswerReadinessInput {
  htmlData: ExtractedHtmlData;
  jsonLdData: ParsedJsonLdData;
  entitySummary: EntitySummary;
}

export interface AnswerReadinessOutput {
  checks: AuditRuleResult[];
  summary: AnswerReadinessSummary;
}

const TECH_KEYWORDS = [
  'javascript', 'typescript', 'python', 'react', 'next.js', 'node.js', 'vue', 'angular',
  'tailwind', 'css', 'html', 'sql', 'postgres', 'mongodb', 'docker', 'kubernetes', 'aws',
  'gcp', 'azure', 'git', 'rust', 'golang', 'c++', 'java', 'graphql', 'rest api', 'ai', 'llm'
];

export function auditAnswerReadiness(input: AnswerReadinessInput): AnswerReadinessOutput {
  const { htmlData, jsonLdData, entitySummary } = input;
  const visibleLower = htmlData.visibleText.toLowerCase();
  const headingsLower = htmlData.headings.map((h) => h.text.toLowerCase());
  const allHeadingsJoined = headingsLower.join(' ');

  // 1. Detect site type heuristic
  let siteType: AnswerReadinessSummary['detectedSiteType'] = 'general';

  const isPersonSchema = jsonLdData.personSchemas.length > 0;
  const isOrgSchema = jsonLdData.organizationSchemas.length > 0;
  const isProductSchema = jsonLdData.productSchemas.length > 0;

  const hasPortfolioKeywords =
    /portfolio|about me|my projects|resume|cv|full-stack|frontend developer|software engineer|web developer/i.test(
      visibleLower
    ) ||
    /portfolio|projects|skills|experience|about me/i.test(allHeadingsJoined);

  const hasProductKeywords =
    /pricing|free trial|get started|features|saas|download|app store|documentation|plans/i.test(
      allHeadingsJoined
    ) || /pricing tiers|monthly billing|annual billing/i.test(visibleLower);

  const hasCompanyKeywords =
    /about us|our team|services|solutions|clients|careers|enterprise|contact us/i.test(
      allHeadingsJoined
    );

  if (isPersonSchema || (entitySummary.entityType === 'Person' && hasPortfolioKeywords)) {
    siteType = 'developer_portfolio';
  } else if (isProductSchema || hasProductKeywords) {
    siteType = 'product_saas';
  } else if (isOrgSchema || hasCompanyKeywords) {
    siteType = 'company';
  } else if (hasPortfolioKeywords) {
    siteType = 'developer_portfolio';
  } else {
    siteType = 'company'; // Default to company / organization inquiries
  }

  const evaluations: AnswerQuestionEvaluation[] = [];

  // Question evaluations based on detected type
  if (siteType === 'developer_portfolio') {
    // Q1: Who is this?
    const hasNameInH1 = htmlData.h1List.some((h) =>
      h.toLowerCase().includes(entitySummary.primaryEntity.toLowerCase())
    );
    const hasIntro =
      /i am|i'm|my name is|hi,|hello,/i.test(visibleLower) || hasNameInH1;
    evaluations.push({
      question: 'Who is this person?',
      answered: hasIntro || !!entitySummary.primaryEntity,
      confidence: hasNameInH1 ? 'high' : hasIntro ? 'medium' : 'low',
      evidence: hasNameInH1
        ? `Primary identity declared in H1: "${htmlData.h1List[0]}".`
        : entitySummary.primaryEntity
        ? `Identified as "${entitySummary.primaryEntity}".`
        : 'No clear introductory statement or personal name declared.',
    });

    // Q2: What does this person do?
    const roleMatch = visibleLower.match(
      /\b(software engineer|developer|designer|full-stack|frontend|backend|architect|creator|founder|student|consultant)\b/i
    );
    evaluations.push({
      question: 'What does this person do / their role?',
      answered: !!roleMatch,
      confidence: roleMatch ? 'high' : 'none',
      evidence: roleMatch
        ? `Professional role mentioned: "${roleMatch[0]}".`
        : 'Could not detect an explicit professional title or engineering specialty.',
    });

    // Q3: What technologies or skills do they use?
    const foundTech = TECH_KEYWORDS.filter((tech) => visibleLower.includes(tech));
    const hasSkillsHeading = /skills|technologies|tools|stack|expertise/i.test(allHeadingsJoined);
    evaluations.push({
      question: 'What technologies and skills do they use?',
      answered: foundTech.length >= 3 || hasSkillsHeading,
      confidence: foundTech.length >= 5 ? 'high' : foundTech.length >= 2 ? 'medium' : 'none',
      evidence:
        foundTech.length > 0
          ? `Detected ${foundTech.length} tech stack keyword(s): ${foundTech.slice(0, 6).join(', ')}${foundTech.length > 6 ? '...' : ''}.`
          : 'No standard technology stack keywords or skills section identified.',
    });

    // Q4: What projects have they built?
    const hasProjectsHeading = /projects|work|creations|case studies|portfolio|open source/i.test(
      allHeadingsJoined
    );
    const mentionsGithub = htmlData.detectedSocialLinks.some((l) => l.platform === 'GitHub');
    evaluations.push({
      question: 'What projects have they built?',
      answered: hasProjectsHeading || mentionsGithub,
      confidence: hasProjectsHeading ? 'high' : mentionsGithub ? 'medium' : 'none',
      evidence: hasProjectsHeading
        ? 'Dedicated projects/work section identified in headings.'
        : mentionsGithub
        ? 'GitHub profile linked for project review.'
        : 'No distinct projects showcase or portfolio section located.',
    });

    // Q5: Where can they be found or contacted?
    const contactOk =
      htmlData.contactSignals.hasEmail ||
      htmlData.contactSignals.hasContactLink ||
      htmlData.detectedSocialLinks.length > 0;
    evaluations.push({
      question: 'Where can they be found or contacted?',
      answered: contactOk,
      confidence: contactOk ? 'high' : 'none',
      evidence: contactOk
        ? `Contact channels found: ${[
            htmlData.contactSignals.hasEmail ? 'Email' : null,
            htmlData.contactSignals.hasContactLink ? 'Contact Form' : null,
            htmlData.detectedSocialLinks.length > 0
              ? `${htmlData.detectedSocialLinks.length} Social Profiles`
              : null,
          ]
            .filter(Boolean)
            .join(', ')}.`
        : 'No direct contact methods or social links discovered.',
    });
  } else if (siteType === 'product_saas') {
    // Q1: What is the product?
    const hasProductTitle = !!htmlData.title || htmlData.h1List.length > 0;
    evaluations.push({
      question: 'What is the product name and identity?',
      answered: hasProductTitle,
      confidence: hasProductTitle ? 'high' : 'none',
      evidence: hasProductTitle
        ? `Product identified as "${entitySummary.primaryEntity}".`
        : 'No prominent product branding or H1 found.',
    });

    // Q2: What does it do / value proposition?
    const hasValueProp =
      (htmlData.metaDescription && htmlData.metaDescription.length > 30) ||
      htmlData.wordCount > 120;
    evaluations.push({
      question: 'What does the product do?',
      answered: !!hasValueProp,
      confidence: hasValueProp ? 'high' : 'low',
      evidence: hasValueProp
        ? 'Value proposition articulated in meta description and body text.'
        : 'Sparse descriptive text explaining the core utility of the product.',
    });

    // Q3: Who is it for?
    const audienceMatch = visibleLower.match(
      /\b(for developers|for teams|for designers|for enterprise|for creators|built for|designed for|who use|startups)\b/i
    );
    evaluations.push({
      question: 'Who is the product intended for?',
      answered: !!audienceMatch,
      confidence: audienceMatch ? 'high' : 'low',
      evidence: audienceMatch
        ? `Target audience indicated by phrasing: "${audienceMatch[0]}".`
        : 'No explicit target audience qualification detected.',
    });

    // Q4: What are its main features?
    const hasFeatures =
      /features|capabilities|how it works|specifications|benefits/i.test(allHeadingsJoined) ||
      htmlData.h2List.length >= 3;
    evaluations.push({
      question: 'What are its main features or capabilities?',
      answered: hasFeatures,
      confidence: hasFeatures ? 'high' : 'none',
      evidence: hasFeatures
        ? 'Distinct feature breakdowns identified across section subheadings.'
        : 'Feature details are limited or not structured under clear subheadings.',
    });

    // Q5: How to get started or contact?
    const hasCta =
      /sign up|get started|try free|pricing|download|docs|documentation|demo/i.test(
        visibleLower
      ) || htmlData.contactSignals.hasContactLink;
    evaluations.push({
      question: 'How do users get started or reach support?',
      answered: hasCta,
      confidence: hasCta ? 'high' : 'none',
      evidence: hasCta
        ? 'Onboarding call-to-actions (Get Started / Pricing / Docs) detected.'
        : 'Clear onboarding or contact pathways were not identified.',
    });
  } else {
    // Company / Organization
    // Q1: What is the company?
    const hasCompany = !!entitySummary.primaryEntity;
    evaluations.push({
      question: 'What is the company or organization name?',
      answered: hasCompany,
      confidence: hasCompany ? 'high' : 'none',
      evidence: hasCompany
        ? `Entity recognized: "${entitySummary.primaryEntity}".`
        : 'Could not clearly determine organization name.',
    });

    // Q2: What does it offer?
    const hasOffer =
      /services|solutions|products|offerings|platform|what we do/i.test(allHeadingsJoined) ||
      htmlData.wordCount > 150;
    evaluations.push({
      question: 'What does the company offer?',
      answered: hasOffer,
      confidence: hasOffer ? 'high' : 'low',
      evidence: hasOffer
        ? 'Offerings and capabilities outlined in page content and headings.'
        : 'Limited description of services or core offerings found.',
    });

    // Q3: Who is it for?
    const hasAudience =
      /clients|industries|customers|who we serve|case studies|enterprises|businesses/i.test(
        visibleLower
      );
    evaluations.push({
      question: 'Who does the company serve?',
      answered: hasAudience,
      confidence: hasAudience ? 'high' : 'low',
      evidence: hasAudience
        ? 'Target audience and customer segments referenced in content.'
        : 'Specific client verticals or target customer segments were not highlighted.',
    });

    // Q4: What problem does it solve?
    const hasProblem =
      htmlData.wordCount >= 200 &&
      (htmlData.metaDescription || '').length >= 50;
    evaluations.push({
      question: 'What problem or need does it solve?',
      answered: hasProblem,
      confidence: hasProblem ? 'medium' : 'low',
      evidence: hasProblem
        ? 'Comprehensive narrative and descriptive meta tags explain business value.'
        : 'Value proposition could be more explicitly detailed.',
    });

    // Q5: How can it be contacted?
    const contactOk =
      htmlData.contactSignals.hasContactLink ||
      htmlData.contactSignals.hasEmail ||
      htmlData.contactSignals.hasPhone;
    evaluations.push({
      question: 'How can the company be contacted?',
      answered: contactOk,
      confidence: contactOk ? 'high' : 'none',
      evidence: contactOk
        ? `Contact access points found (${[
            htmlData.contactSignals.hasEmail ? 'Email' : null,
            htmlData.contactSignals.hasPhone ? 'Phone' : null,
            htmlData.contactSignals.hasContactLink ? 'Contact Link' : null,
          ]
            .filter(Boolean)
            .join(', ')}).`
        : 'No direct contact methods or links found.',
    });
  }

  // Convert evaluations into 5 audit checks (20 pts each = 100 max)
  const checks: AuditRuleResult[] = evaluations.map((item, idx) => {
    const isAnswered = item.answered;
    const score = item.confidence === 'high' ? 20 : item.confidence === 'medium' ? 16 : isAnswered ? 12 : 0;
    const status = score >= 16 ? 'PASS' : score > 0 ? 'WARNING' : 'WARNING';

    return {
      id: `answer-q${idx + 1}`,
      category: 'answerReadiness',
      title: `Query Readiness: "${item.question}"`,
      status,
      severity: status === 'PASS' ? 'info' : 'medium',
      score,
      maxScore: 20,
      explanation: isAnswered
        ? `Heuristic signals indicate this core question is addressable from page content (${item.confidence} confidence).`
        : `Heuristic analysis could not identify clear answers to: "${item.question}".`,
      whatWeFound: item.evidence,
      whyItMatters:
        'AI answer engines (Perplexity, ChatGPT Search, Gemini) directly attempt to extract direct answers to fundamental user questions when summarizing a website.',
      howToImprove: isAnswered
        ? 'Ensure answers remain concise, factual, and placed near descriptive headings.'
        : `Add a dedicated section or paragraph directly answering "${item.question}".`,
      data: {
        isHeuristic: true,
        confidence: item.confidence,
      },
    };
  });

  return {
    checks,
    summary: {
      detectedSiteType: siteType,
      questions: evaluations,
    },
  };
}
