import { AuditRuleResult } from './types';
import { ExtractedHtmlData } from '../parsers/html';

export interface ContentAuditInput {
  htmlData: ExtractedHtmlData;
}

export function auditContent(input: ContentAuditInput): AuditRuleResult[] {
  const { htmlData } = input;
  const results: AuditRuleResult[] = [];

  // 1. Title Tag & Length
  const hasTitle = !!htmlData.title;
  const len = htmlData.titleLength;
  const titleOptimal = hasTitle && len >= 20 && len <= 70;
  const titleTooShort = hasTitle && len < 20;
  const titleTooLong = hasTitle && len > 70;

  const titleScore = titleOptimal ? 12 : hasTitle ? (titleTooShort ? 8 : 9) : 0;
  results.push({
    id: 'content-title',
    category: 'content',
    title: 'HTML Page Title',
    status: titleOptimal ? 'PASS' : hasTitle ? 'WARNING' : 'FAIL',
    severity: hasTitle ? (titleOptimal ? 'info' : 'low') : 'critical',
    score: titleScore,
    maxScore: 12,
    explanation: hasTitle
      ? titleOptimal
        ? `Page title is present and well-proportioned (${len} characters): "${htmlData.title}".`
        : titleTooShort
        ? `Page title is brief (${len} chars): "${htmlData.title}". Short titles provide limited context to AI agents.`
        : `Page title is somewhat lengthy (${len} chars): "${htmlData.title}". It may be truncated in search results.`
      : 'No <title> tag found on the page.',
    whatWeFound: htmlData.title
      ? `"${htmlData.title}" (${len} characters).`
      : 'Missing <title> tag.',
    whyItMatters:
      'The HTML title is the primary identifier used by search engines and AI models to categorize the topic and identity of a webpage.',
    howToImprove: hasTitle
      ? 'Target between 30 and 65 characters, clearly conveying the brand and primary topic.'
      : 'Add a descriptive <title> tag in the <head> section of your HTML document.',
  });

  // 2. Meta Description
  const hasDesc = !!htmlData.metaDescription;
  const descLen = htmlData.metaDescriptionLength;
  const descOptimal = hasDesc && descLen >= 70 && descLen <= 170;
  const descShort = hasDesc && descLen < 70;

  const descScore = descOptimal ? 12 : hasDesc ? (descShort ? 8 : 10) : 0;
  results.push({
    id: 'content-meta-description',
    category: 'content',
    title: 'Meta Description',
    status: descOptimal ? 'PASS' : hasDesc ? 'WARNING' : 'WARNING',
    severity: hasDesc ? (descOptimal ? 'info' : 'low') : 'medium',
    score: descScore,
    maxScore: 12,
    explanation: hasDesc
      ? descOptimal
        ? `Meta description provides informative summary context (${descLen} characters).`
        : descShort
        ? `Meta description is short (${descLen} characters). It may leave out relevant semantic context.`
        : `Meta description is lengthy (${descLen} characters).`
      : 'No meta description found. Search and AI crawlers must synthesize summaries without developer guidance.',
    whatWeFound: htmlData.metaDescription
      ? `"${htmlData.metaDescription.slice(0, 100)}${descLen > 100 ? '...' : ''}" (${descLen} chars).`
      : 'No meta description or og:description tag detected.',
    whyItMatters:
      'Meta descriptions provide human-authored contextual summaries that AI search snippets and RAG systems rely on as authoritative high-level abstracts.',
    howToImprove: hasDesc
      ? 'Refine your description between 80-160 characters with clear, concise, actionable information.'
      : 'Add a <meta name="description" content="..."> tag highlighting the page purpose, offerings, and audience.',
  });

  // 3. H1 Heading & Multi-H1
  const h1Count = htmlData.h1List.length;
  const h1Single = h1Count === 1;
  const h1Multiple = h1Count > 1;

  const h1Score = h1Single ? 12 : h1Multiple ? 8 : 0;
  results.push({
    id: 'content-h1',
    category: 'content',
    title: 'Primary Heading (H1)',
    status: h1Single ? 'PASS' : h1Multiple ? 'WARNING' : 'FAIL',
    severity: h1Single ? 'info' : h1Multiple ? 'medium' : 'high',
    score: h1Score,
    maxScore: 12,
    explanation: h1Single
      ? `Single, clear primary H1 detected: "${htmlData.h1List[0]}".`
      : h1Multiple
      ? `Multiple (${h1Count}) H1 elements detected. While HTML5 permits this, a single H1 clarifies primary subject matter for AI parsers.`
      : 'No H1 heading detected on the page. Missing a primary topic anchor.',
    whatWeFound:
      h1Count === 0
        ? 'No <h1> elements found.'
        : `Found ${h1Count} H1 heading(s): ${htmlData.h1List.map((t) => `"${t}"`).join(' | ')}`,
    whyItMatters:
      'The H1 heading establishes the core subject entity and topical focus of the document in semantic HTML document outline trees.',
    howToImprove:
      h1Count === 0
        ? 'Add exactly one <h1> element clearly identifying the core subject of the page.'
        : h1Multiple
        ? 'Consolidate down to one overarching <h1> tag and convert subordinate section headings to <h2>.'
        : 'Your H1 structure is ideal.',
  });

  // 4. Heading Hierarchy & Subheadings (H2/H3)
  const h2Count = htmlData.h2List.length;
  const h3Count = htmlData.h3List.length;
  const hasSubheadings = h2Count >= 2;
  const headingHierarchyScore = hasSubheadings ? 10 : h2Count === 1 ? 7 : 4;

  results.push({
    id: 'content-hierarchy',
    category: 'content',
    title: 'Content Heading Structure (H2/H3)',
    status: hasSubheadings ? 'PASS' : 'WARNING',
    severity: hasSubheadings ? 'info' : 'low',
    score: headingHierarchyScore,
    maxScore: 10,
    explanation: hasSubheadings
      ? `Well-structured heading tree with ${h2Count} H2 and ${h3Count} H3 subheadings.`
      : h2Count === 1
      ? 'Only 1 H2 subheading found. Sub-topics could be more explicitly broken down.'
      : 'Few or no H2 subheadings found. AI parsers benefit from clear section delimiters.',
    whatWeFound: `Discovered ${h2Count} H2 headings and ${h3Count} H3 headings.`,
    whyItMatters:
      'Hierarchical subheadings (H2, H3) allow AI retrieval engines (RAG) to segment documents into topical semantic chunks with clear parent context.',
    howToImprove: hasSubheadings
      ? 'Maintain logical nesting (do not skip heading levels like H1 directly to H4).'
      : 'Structure your long-form content with descriptive <h2> sections answering specific sub-topics.',
  });

  // 5. Empty Headings Check
  const emptyCount = htmlData.emptyHeadingsCount;
  const noEmptyHeadings = emptyCount === 0;
  results.push({
    id: 'content-empty-headings',
    category: 'content',
    title: 'Heading Tag Hygiene',
    status: noEmptyHeadings ? 'PASS' : 'WARNING',
    severity: noEmptyHeadings ? 'info' : 'low',
    score: noEmptyHeadings ? 6 : 2,
    maxScore: 6,
    explanation: noEmptyHeadings
      ? 'No empty or whitespace-only heading tags detected.'
      : `Found ${emptyCount} empty heading tag(s). Empty headings add noise to accessibility trees and semantic outlines.`,
    whatWeFound: noEmptyHeadings
      ? 'All heading tags contain visible text.'
      : `${emptyCount} heading tag(s) had no inner text content.`,
    whyItMatters:
      'Empty heading tags degrade DOM cleanliness and can confuse automated parsers assembling document outlines.',
    howToImprove: noEmptyHeadings
      ? 'Keep headings meaningful and concise.'
      : 'Remove empty <h*> tags or ensure headings are not used strictly for visual CSS spacing.',
  });

  // 6. Duplicate Title and H1
  const titleText = (htmlData.title || '').trim().toLowerCase();
  const firstH1 = (htmlData.h1List[0] || '').trim().toLowerCase();
  const isDuplicate = !!titleText && !!firstH1 && titleText === firstH1;

  results.push({
    id: 'content-title-h1-variance',
    category: 'content',
    title: 'Title and H1 Complementarity',
    status: isDuplicate ? 'WARNING' : 'PASS',
    severity: isDuplicate ? 'low' : 'info',
    score: isDuplicate ? 3 : 6,
    maxScore: 6,
    explanation: isDuplicate
      ? 'Page title and H1 heading are identical. Providing complementary phrasing gives AI engines broader semantic context.'
      : 'Title and H1 are distinct, providing complementary contextual signals.',
    whatWeFound: isDuplicate
      ? `Title and H1 are both identical: "${htmlData.h1List[0]}".`
      : `Title and H1 provide differentiated phrasing.`,
    whyItMatters:
      'Using the Title for broader brand/site context while using the H1 for the specific on-page topic provides richer semantic vectors.',
    howToImprove: isDuplicate
      ? 'Append your brand name to the Title (e.g. "Primary Topic — Brand") while keeping the H1 focused purely on the topic.'
      : 'Maintain this clear separation between document title and primary on-page heading.',
  });

  // 7. HTML Language Attribute
  const hasLang = !!htmlData.language;
  results.push({
    id: 'content-language',
    category: 'content',
    title: 'HTML Language Declaration',
    status: hasLang ? 'PASS' : 'WARNING',
    severity: hasLang ? 'info' : 'medium',
    score: hasLang ? 8 : 2,
    maxScore: 8,
    explanation: hasLang
      ? `HTML language attribute is declared: <html lang="${htmlData.language}">.`
      : 'Missing "lang" attribute on the <html> element.',
    whatWeFound: hasLang
      ? `lang="${htmlData.language}" declared on <html> root.`
      : 'No lang attribute found on <html> element.',
    whyItMatters:
      'The lang attribute enables language models and search engines to reliably select the correct tokenizer, lemmatizer, and semantic models.',
    howToImprove: hasLang
      ? 'Ensure the declared language matches the primary content language of the page.'
      : 'Add lang="en" (or your appropriate BCP 47 language code) to your <html> root element.',
  });

  // 8. Main Semantic Landmark
  const hasMain = htmlData.hasMainTag || htmlData.hasArticleTag;
  results.push({
    id: 'content-main-landmark',
    category: 'content',
    title: 'Main Semantic Landmark (<main> / <article>)',
    status: hasMain ? 'PASS' : 'WARNING',
    severity: hasMain ? 'info' : 'medium',
    score: hasMain ? 10 : 3,
    maxScore: 10,
    explanation: hasMain
      ? `Semantic container detected: ${[htmlData.hasMainTag ? '<main>' : null, htmlData.hasArticleTag ? '<article>' : null].filter(Boolean).join(' and ')}.`
      : 'No <main> or <article> tag found. AI parsers rely on semantic landmarks to isolate substantive content from navigation boilerplate.',
    whatWeFound: hasMain
      ? `Found ${htmlData.hasMainTag ? '<main>' : ''}${htmlData.hasArticleTag ? ' <article>' : ''} elements.`
      : 'Content is structured inside non-semantic <div> elements without a <main> landmark.',
    whyItMatters:
      'AI web scrapers and readability extractors use <main> and <article> tags to discard repetitive headers, sidebars, and cookie banners.',
    howToImprove: hasMain
      ? 'Ensure all primary content resides inside your <main> container.'
      : 'Wrap the primary central body content of your page within a single <main> element.',
  });

  // 9. Semantic HTML Tags
  const semanticCount = htmlData.semanticTagsFound.length;
  const goodSemantics = semanticCount >= 3;
  results.push({
    id: 'content-semantic-tags',
    category: 'content',
    title: 'Semantic HTML Structure',
    status: goodSemantics ? 'PASS' : 'WARNING',
    severity: goodSemantics ? 'info' : 'low',
    score: goodSemantics ? 10 : semanticCount >= 1 ? 6 : 2,
    maxScore: 10,
    explanation: goodSemantics
      ? `Rich semantic layout detected: ${htmlData.semanticTagsFound.join(', ')}.`
      : `Sparse semantic markup. Only found: ${htmlData.semanticTagsFound.join(', ') || 'none'}.`,
    whatWeFound: `Detected semantic tags: ${htmlData.semanticTagsFound.join(', ') || 'only generic <div>s'}.`,
    whyItMatters:
      'Semantic tags (<header>, <nav>, <main>, <section>, <footer>) help AI agents understand document architecture without executing visual CSS.',
    howToImprove: goodSemantics
      ? 'Continue using modern semantic HTML elements.'
      : 'Replace generic <div> wrappers with appropriate semantic elements like <nav>, <section>, <header>, and <footer>.',
  });

  // 10. Text Content Availability (Word Count)
  const words = htmlData.wordCount;
  const goodWordCount = words >= 250;
  const moderateWordCount = words >= 100;
  const wordScore = goodWordCount ? 10 : moderateWordCount ? 7 : 3;

  results.push({
    id: 'content-word-count',
    category: 'content',
    title: 'Text Content Availability',
    status: goodWordCount ? 'PASS' : moderateWordCount ? 'PASS' : 'WARNING',
    severity: goodWordCount ? 'info' : 'medium',
    score: wordScore,
    maxScore: 10,
    explanation: goodWordCount
      ? `Sufficient text body detected (${words} words) for semantic context extraction.`
      : moderateWordCount
      ? `Moderate text body detected (${words} words). Sufficient for landing pages, though in-depth content aids AI indexing.`
      : `Sparse visible text detected (${words} words). AI search engines need textual context to generate answers.`,
    whatWeFound: `${words} visible words extracted from body.`,
    whyItMatters:
      'AI systems rely on comprehensive textual explanations to answer user inquiries. Thin pages provide insufficient context for RAG embeddings.',
    howToImprove: goodWordCount
      ? 'Ensure content remains directly relevant to your target topic.'
      : 'Expand key sections with explanatory copy describing your value proposition, solutions, and details.',
  });

  // 11. Text-to-HTML Ratio
  const ratio = htmlData.textToHtmlRatio;
  const goodRatio = ratio >= 10;
  const moderateRatio = ratio >= 5;
  const ratioScore = goodRatio ? 10 : moderateRatio ? 7 : 3;

  results.push({
    id: 'content-text-ratio',
    category: 'content',
    title: 'Text-to-HTML Ratio',
    status: goodRatio ? 'PASS' : 'WARNING',
    severity: goodRatio ? 'info' : 'low',
    score: ratioScore,
    maxScore: 10,
    explanation: goodRatio
      ? `Healthy text-to-HTML ratio of ${ratio}%. Content is concise and not overwhelmed by markup.`
      : `Low text-to-HTML ratio of ${ratio}%. The page contains significant markup relative to the amount of readable text.`,
    whatWeFound: `Text represents ${ratio}% of total page markup (${htmlData.rawHtmlLength.toLocaleString()} bytes total HTML).`,
    whyItMatters:
      'High code bloat with minimal text dilutes semantic relevance and slows down AI parser processing speeds.',
    howToImprove: goodRatio
      ? 'Maintain clean markup and avoid excessive inline scripts or styles.'
      : 'Clean up unnecessary inline scripts, SVG definitions, and nested div wrappers to improve text density.',
  });

  // 12. Client-Side Rendering (CSR) Heuristic
  const isCsrSuspect = htmlData.isClientRenderedSuspect;
  results.push({
    id: 'content-csr-dependency',
    category: 'content',
    title: 'Server-Rendered Static Content',
    status: isCsrSuspect ? 'WARNING' : 'PASS',
    severity: isCsrSuspect ? 'high' : 'info',
    score: isCsrSuspect ? 3 : 10,
    maxScore: 10,
    explanation: isCsrSuspect
      ? `Possible client-side rendering dependency: ${htmlData.clientRenderedReason || 'Page appears to rely on JavaScript to render its main content.'}`
      : 'Page delivers readable static HTML content without requiring client-side JavaScript execution.',
    whatWeFound: isCsrSuspect
      ? (htmlData.clientRenderedReason || 'Empty application root or JS requirement detected.')
      : 'Substantive HTML content is delivered directly in initial server response.',
    whyItMatters:
      'Many AI crawlers and automated indexing pipelines do not execute full JavaScript browser rendering engines due to cost, making client-only content invisible.',
    howToImprove: isCsrSuspect
      ? 'Implement Server-Side Rendering (SSR) or Static Site Generation (SSG) in frameworks like Next.js, Nuxt, or Astro.'
      : 'Continue serving pre-rendered or static HTML for all public indexable pages.',
  });

  return results;
}
