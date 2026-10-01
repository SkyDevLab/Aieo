import { AuditRuleResult } from './types';
import { ExtractedHtmlData } from '../parsers/html';

export interface ContentAuditInput {
  htmlData: ExtractedHtmlData;
}

export function auditContent(input: ContentAuditInput): AuditRuleResult[] {
  const { htmlData } = input;
  const results: AuditRuleResult[] = [];

  // 1. Title Tag Existence
  const hasTitle = !!htmlData.title;
  results.push({
    id: 'content-title-exists',
    category: 'content',
    title: 'HTML Page Title Presence',
    status: hasTitle ? 'PASS' : 'FAIL',
    severity: hasTitle ? 'info' : 'critical',
    score: hasTitle ? 6 : 0,
    maxScore: 6,
    explanation: hasTitle ? `Title tag found: "${htmlData.title}"` : 'No <title> tag found.',
    whatWeFound: htmlData.title ? `"${htmlData.title}"` : 'Missing title element.',
    whyItMatters: 'Title tag is the primary semantic identifier for document subject matter.',
    howToImprove: hasTitle ? 'Keep title updated.' : 'Add a <title> element in the document <head>.',
    evidence: { title: htmlData.title },
  });

  // 2. Title Length
  const len = htmlData.titleLength;
  const titleOptimal = hasTitle && len >= 20 && len <= 70;
  results.push({
    id: 'content-title-length',
    category: 'content',
    title: 'Title Length Optimization',
    status: !hasTitle ? 'FAIL' : titleOptimal ? 'PASS' : 'WARNING',
    severity: titleOptimal ? 'info' : 'low',
    score: !hasTitle ? 0 : titleOptimal ? 5 : 3,
    maxScore: 5,
    explanation: !hasTitle
      ? 'No title to measure.'
      : titleOptimal
      ? `Optimal title length (${len} characters).`
      : len < 20
      ? `Short title (${len} characters). Short titles provide minimal context to AI extractors.`
      : `Title is long (${len} characters). It may be truncated in search snippets.`,
    whatWeFound: `${len} characters.`,
    whyItMatters: 'Properly bounded titles avoid truncation in AI summaries and search result displays.',
    howToImprove: titleOptimal ? 'No action needed.' : 'Aim for 25 to 65 characters including brand and primary topic.',
    evidence: { length: len },
  });

  // 3. Title Clarity
  const titleText = (htmlData.title || '').trim().toLowerCase();
  const isGenericTitle =
    titleText === 'home' ||
    titleText === 'index' ||
    titleText === 'untitled' ||
    titleText === 'welcome' ||
    titleText === 'new tab';
  results.push({
    id: 'content-title-clarity',
    category: 'content',
    title: 'Title Topic Clarity',
    status: !hasTitle ? 'FAIL' : !isGenericTitle ? 'PASS' : 'WARNING',
    severity: !isGenericTitle ? 'info' : 'high',
    score: !hasTitle ? 0 : !isGenericTitle ? 4 : 1,
    maxScore: 4,
    explanation: !hasTitle
      ? 'Missing title.'
      : !isGenericTitle
      ? 'Title provides substantive topic branding.'
      : 'Generic placeholder title detected ("Home" or "Untitled").',
    whatWeFound: htmlData.title || 'None',
    whyItMatters: 'AI search engines rely on titles to distinguish between different sites.',
    howToImprove: !isGenericTitle ? 'No action needed.' : 'Replace generic words with your specific product or brand name.',
    evidence: { title: htmlData.title },
  });

  // 4. Meta Description Presence
  const hasDesc = !!htmlData.metaDescription;
  results.push({
    id: 'content-meta-desc-exists',
    category: 'content',
    title: 'Meta Description Presence',
    status: hasDesc ? 'PASS' : 'WARNING',
    severity: hasDesc ? 'info' : 'medium',
    score: hasDesc ? 5 : 0,
    maxScore: 5,
    explanation: hasDesc ? 'Meta description is present.' : 'Missing meta description tag.',
    whatWeFound: hasDesc ? `"${htmlData.metaDescription?.slice(0, 80)}..."` : 'No meta description found.',
    whyItMatters: 'Meta descriptions serve as human-authored summaries for AI retrieval engines.',
    howToImprove: hasDesc ? 'Keep description accurate.' : 'Add <meta name="description" content="...">.',
    evidence: { metaDescription: htmlData.metaDescription },
  });

  // 5. Meta Description Length
  const descLen = htmlData.metaDescriptionLength;
  const descOptimal = hasDesc && descLen >= 70 && descLen <= 170;
  results.push({
    id: 'content-meta-desc-length',
    category: 'content',
    title: 'Meta Description Length',
    status: !hasDesc ? 'WARNING' : descOptimal ? 'PASS' : 'WARNING',
    severity: descOptimal ? 'info' : 'low',
    score: !hasDesc ? 0 : descOptimal ? 4 : 2,
    maxScore: 4,
    explanation: !hasDesc
      ? 'Missing meta description.'
      : descOptimal
      ? `Well-proportioned meta description (${descLen} characters).`
      : descLen < 70
      ? `Short meta description (${descLen} characters). May lack sufficient semantic detail.`
      : `Long meta description (${descLen} characters). May be truncated in search snippets.`,
    whatWeFound: `${descLen} characters.`,
    whyItMatters: 'Descriptions between 70 and 160 characters fit standard search and LLM context cards.',
    howToImprove: descOptimal ? 'No action needed.' : 'Craft a summary between 80 and 160 characters.',
    evidence: { length: descLen },
  });

  // 6. Meta Description Clarity
  const descWords = htmlData.metaDescription ? htmlData.metaDescription.split(/\s+/).length : 0;
  const descClear = descWords >= 8;
  results.push({
    id: 'content-meta-desc-clarity',
    category: 'content',
    title: 'Meta Description Substantiveness',
    status: !hasDesc ? 'INFO' : descClear ? 'PASS' : 'WARNING',
    severity: descClear ? 'info' : 'low',
    score: !hasDesc ? 1 : descClear ? 3 : 1,
    maxScore: 3,
    explanation: !hasDesc
      ? 'No description present.'
      : descClear
      ? `Meta description contains substantive narrative (${descWords} words).`
      : 'Meta description is too brief to provide clear semantic meaning.',
    whatWeFound: `${descWords} words in description.`,
    whyItMatters: 'Detailed summaries give conversational AI engines grounding context.',
    howToImprove: descClear ? 'No action needed.' : 'Provide a complete sentence describing your primary offerings.',
    evidence: { wordCount: descWords },
  });

  // 7. Primary H1 Presence
  const h1Count = htmlData.h1List.length;
  const hasH1 = h1Count > 0;
  results.push({
    id: 'content-h1-exists',
    category: 'content',
    title: 'H1 Primary Heading Presence',
    status: hasH1 ? 'PASS' : 'FAIL',
    severity: hasH1 ? 'info' : 'critical',
    score: hasH1 ? 6 : 0,
    maxScore: 6,
    explanation: hasH1 ? `Primary H1 tag detected: "${htmlData.h1List[0]}"` : 'No H1 heading detected on the page.',
    whatWeFound: hasH1 ? `Found ${h1Count} H1(s).` : 'Zero <h1> tags.',
    whyItMatters: 'H1 headings define the top-level entity or subject matter of the document outline.',
    howToImprove: hasH1 ? 'Ensure H1 describes page core subject.' : 'Add exactly one <h1> element.',
    evidence: { h1Count, primaryH1: htmlData.h1List[0] || null },
  });

  // 8. Single Unique H1
  const h1Single = h1Count === 1;
  results.push({
    id: 'content-h1-single',
    category: 'content',
    title: 'Singular H1 Architecture',
    status: !hasH1 ? 'FAIL' : h1Single ? 'PASS' : 'WARNING',
    severity: h1Single ? 'info' : 'medium',
    score: !hasH1 ? 0 : h1Single ? 4 : 2,
    maxScore: 4,
    explanation: h1Single
      ? 'Single unique H1 maintains a clean hierarchical outline.'
      : `Found ${h1Count} H1 headings. Multiple H1s can confuse automated outline extractors.`,
    whatWeFound: `${h1Count} H1 heading(s) found.`,
    whyItMatters: 'A single H1 provides unambiguous subject anchoring for document tree models.',
    howToImprove: h1Single ? 'No action needed.' : 'Use only one <h1> and downgrade secondary headings to <h2>.',
    evidence: { h1List: htmlData.h1List },
  });

  // 9. H1 Descriptive Quality
  const firstH1Text = htmlData.h1List[0] || '';
  const h1Descriptive = firstH1Text.length >= 8 && firstH1Text.split(/\s+/).length >= 2;
  results.push({
    id: 'content-h1-quality',
    category: 'content',
    title: 'H1 Descriptive Quality',
    status: !hasH1 ? 'INFO' : h1Descriptive ? 'PASS' : 'WARNING',
    severity: h1Descriptive ? 'info' : 'low',
    score: !hasH1 ? 0 : h1Descriptive ? 4 : 2,
    maxScore: 4,
    explanation: !hasH1
      ? 'No H1 found.'
      : h1Descriptive
      ? `H1 is descriptive: "${firstH1Text}".`
      : `H1 is very brief ("${firstH1Text}"). More descriptive phrasing helps AI crawlers.`,
    whatWeFound: `"${firstH1Text}" (${firstH1Text.length} chars).`,
    whyItMatters: 'Descriptive H1s communicate clear topical intent.',
    howToImprove: h1Descriptive ? 'No action needed.' : 'Expand H1 to describe what your page or product offers.',
    evidence: { h1Text: firstH1Text },
  });

  // 10. H2 Hierarchy
  const h2Count = htmlData.h2List.length;
  const hasH2 = h2Count >= 2;
  results.push({
    id: 'content-h2-hierarchy',
    category: 'content',
    title: 'H2 Subheading Structure',
    status: hasH2 ? 'PASS' : h2Count === 1 ? 'PASS' : 'WARNING',
    severity: hasH2 ? 'info' : 'low',
    score: hasH2 ? 5 : h2Count === 1 ? 3 : 1,
    maxScore: 5,
    explanation: hasH2
      ? `Found ${h2Count} H2 subheadings providing topical sections.`
      : h2Count === 1
      ? 'Only 1 H2 subheading found.'
      : 'Few or no H2 subheadings detected.',
    whatWeFound: `${h2Count} H2 subheadings discovered.`,
    whyItMatters: 'H2 subheadings segment documents into semantic chunks for RAG embedding generation.',
    howToImprove: hasH2 ? 'Maintain descriptive subheadings.' : 'Break content down into sections with clear <h2> titles.',
    evidence: { h2Count, sampleH2: htmlData.h2List.slice(0, 3) },
  });

  // 11. H3 Hierarchy
  const h3Count = htmlData.h3List.length;
  results.push({
    id: 'content-h3-hierarchy',
    category: 'content',
    title: 'H3 Granular Subheadings',
    status: h3Count > 0 ? 'PASS' : 'INFO',
    severity: 'info',
    score: h3Count > 0 ? 3 : 2,
    maxScore: 3,
    explanation: h3Count > 0
      ? `Detected ${h3Count} H3 subheadings for granular topic categorization.`
      : 'No H3 subheadings found (acceptable for shorter pages).',
    whatWeFound: `${h3Count} H3 headings.`,
    whyItMatters: 'H3 tags structure subsections for detailed question-and-answer retrieval.',
    howToImprove: 'Use H3s when sub-topics require further breakdown under an H2.',
    evidence: { h3Count },
  });

  // 12. Heading Order Validity (No skipped levels)
  const headingOrderValid = htmlData.headingOrderValid;
  results.push({
    id: 'content-heading-order',
    category: 'content',
    title: 'Heading Hierarchy Sequence',
    status: headingOrderValid ? 'PASS' : 'WARNING',
    severity: headingOrderValid ? 'info' : 'low',
    score: headingOrderValid ? 4 : 2,
    maxScore: 4,
    explanation: headingOrderValid
      ? 'Headings follow logical sequential order (no skipped heading levels).'
      : `Heading levels skip abruptly in the document outline: ${htmlData.skippedHeadingLevels.slice(0, 2).join('; ')}`,
    whatWeFound: headingOrderValid ? 'Logical heading tree.' : htmlData.skippedHeadingLevels.join('; '),
    whyItMatters: 'Skipping heading levels (e.g. H1 directly to H4) degrades accessibility and machine outline trees.',
    howToImprove: headingOrderValid ? 'No action needed.' : 'Nest headings sequentially (H1 -> H2 -> H3).',
    evidence: { skippedHeadingLevels: htmlData.skippedHeadingLevels },
  });

  // 13. Empty Headings Check
  const emptyHeadings = htmlData.emptyHeadingsCount;
  results.push({
    id: 'content-empty-headings',
    category: 'content',
    title: 'Heading Tag Cleanliness (Empty Headings)',
    status: emptyHeadings === 0 ? 'PASS' : 'WARNING',
    severity: emptyHeadings === 0 ? 'info' : 'low',
    score: emptyHeadings === 0 ? 3 : 1,
    maxScore: 3,
    explanation: emptyHeadings === 0
      ? 'All heading tags contain visible text content.'
      : `Found ${emptyHeadings} empty heading tag(s).`,
    whatWeFound: emptyHeadings === 0 ? 'Zero empty heading tags.' : `${emptyHeadings} empty heading tag(s).`,
    whyItMatters: 'Empty heading tags pollute the DOM outline and degrade screen reader navigation.',
    howToImprove: emptyHeadings === 0 ? 'No action needed.' : 'Remove empty <h*> tags used strictly for spacing.',
    evidence: { emptyHeadingsCount: emptyHeadings },
  });

  // 14. Title & H1 Complementarity
  const firstH1Clean = (htmlData.h1List[0] || '').trim().toLowerCase();
  const isDuplicateTitleH1 = !!titleText && !!firstH1Clean && titleText === firstH1Clean;
  results.push({
    id: 'content-title-h1-variance',
    category: 'content',
    title: 'Title & H1 Complementary Phrasing',
    status: isDuplicateTitleH1 ? 'WARNING' : 'PASS',
    severity: isDuplicateTitleH1 ? 'low' : 'info',
    score: isDuplicateTitleH1 ? 2 : 4,
    maxScore: 4,
    explanation: isDuplicateTitleH1
      ? 'Title and H1 are verbatim duplicates. Complementary phrasing provides richer semantic signals.'
      : 'Title and H1 provide distinct, complementary topical signals.',
    whatWeFound: isDuplicateTitleH1 ? 'Title and H1 are identical.' : 'Title and H1 use differentiated phrasing.',
    whyItMatters: 'Using the title for broader site branding and H1 for the specific on-page topic expands semantic coverage.',
    howToImprove: isDuplicateTitleH1 ? 'Append your brand name to the Title while keeping H1 focused.' : 'No action needed.',
    evidence: { title: htmlData.title, h1: htmlData.h1List[0] || null },
  });

  // 15. HTML Language Attribute
  const hasLang = !!htmlData.language;
  results.push({
    id: 'content-lang',
    category: 'content',
    title: 'HTML Language Declaration',
    status: hasLang ? 'PASS' : 'WARNING',
    severity: hasLang ? 'info' : 'medium',
    score: hasLang ? 5 : 1,
    maxScore: 5,
    explanation: hasLang
      ? `HTML language declared: <html lang="${htmlData.language}">.`
      : 'Missing lang attribute on <html> element.',
    whatWeFound: hasLang ? `lang="${htmlData.language}"` : 'No lang attribute found.',
    whyItMatters: 'Declaring language allows AI tokenizers and voice assistants to use the appropriate language models.',
    howToImprove: hasLang ? 'No action needed.' : 'Add lang="en" (or appropriate language code) to <html>.',
    evidence: { language: htmlData.language },
  });

  // 16. Semantic Main Landmark
  const hasMain = htmlData.hasMainTag || htmlData.hasArticleTag;
  results.push({
    id: 'content-main-landmark',
    category: 'content',
    title: 'Main Content Landmark (<main> / <article>)',
    status: hasMain ? 'PASS' : 'WARNING',
    severity: hasMain ? 'info' : 'medium',
    score: hasMain ? 5 : 1,
    maxScore: 5,
    explanation: hasMain
      ? `Found semantic container (${[htmlData.hasMainTag ? '<main>' : null, htmlData.hasArticleTag ? '<article>' : null].filter(Boolean).join(', ')}).`
      : 'No <main> or <article> tag found. Content relies on generic <div> wrappers.',
    whatWeFound: hasMain ? 'Semantic main landmark present.' : 'Missing <main> tag.',
    whyItMatters: 'AI readability scrapers use <main> to filter out repetitive headers, footers, and cookie banners.',
    howToImprove: hasMain ? 'No action needed.' : 'Wrap core page content within a single <main> element.',
    evidence: { hasMainTag: htmlData.hasMainTag, hasArticleTag: htmlData.hasArticleTag },
  });

  // 17. Structural Semantic Tags
  const semanticCount = htmlData.semanticTagsFound.length;
  const goodSemantics = semanticCount >= 3;
  results.push({
    id: 'content-semantic-tags',
    category: 'content',
    title: 'Semantic HTML5 Structural Tags',
    status: goodSemantics ? 'PASS' : 'WARNING',
    severity: goodSemantics ? 'info' : 'low',
    score: goodSemantics ? 5 : semanticCount >= 1 ? 3 : 1,
    maxScore: 5,
    explanation: goodSemantics
      ? `Rich semantic layout detected (${htmlData.semanticTagsFound.join(', ')}).`
      : `Sparse semantic tags. Only found: ${htmlData.semanticTagsFound.join(', ') || 'none'}.`,
    whatWeFound: `Found: ${htmlData.semanticTagsFound.join(', ') || 'generic <div> wrappers only'}.`,
    whyItMatters: 'Semantic elements help machines understand document architecture without executing CSS stylesheets.',
    howToImprove: goodSemantics ? 'No action needed.' : 'Use <header>, <nav>, <section>, and <footer>.',
    evidence: { semanticTags: htmlData.semanticTagsFound },
  });

  // 18. Visible Text Word Count
  const words = htmlData.wordCount;
  const goodWords = words >= 200;
  const modWords = words >= 80;
  results.push({
    id: 'content-word-count',
    category: 'content',
    title: 'Readable Body Text Depth',
    status: goodWords ? 'PASS' : modWords ? 'PASS' : 'WARNING',
    severity: goodWords ? 'info' : 'medium',
    score: goodWords ? 5 : modWords ? 3 : 1,
    maxScore: 5,
    explanation: goodWords
      ? `Substantial text body extracted (${words} words).`
      : modWords
      ? `Moderate text body extracted (${words} words).`
      : `Thin text body extracted (${words} words). AI search engines need text to formulate answers.`,
    whatWeFound: `${words} visible words extracted from body.`,
    whyItMatters: 'AI answer engines require sufficient textual depth to summarize and cite facts.',
    howToImprove: goodWords ? 'No action needed.' : 'Expand page sections with informative, explanatory copy.',
    evidence: { wordCount: words },
  });

  // 19. Text-to-HTML Ratio
  const ratio = htmlData.textToHtmlRatio;
  const goodRatio = ratio >= 8;
  results.push({
    id: 'content-text-ratio',
    category: 'content',
    title: 'Text-to-HTML Density Ratio',
    status: goodRatio ? 'PASS' : 'WARNING',
    severity: goodRatio ? 'info' : 'low',
    score: goodRatio ? 4 : 2,
    maxScore: 4,
    explanation: goodRatio
      ? `Healthy text-to-HTML ratio of ${ratio}%.`
      : `Low text-to-HTML ratio (${ratio}%). Significant markup compared to readable text.`,
    whatWeFound: `Text accounts for ${ratio}% of total markup.`,
    whyItMatters: 'Excessive DOM markup dilutes semantic relevance and slows down crawler parsers.',
    howToImprove: goodRatio ? 'No action needed.' : 'Remove unused inline scripts, large inline SVGs, and redundant wrapper divs.',
    evidence: { textToHtmlRatio: ratio, totalBytes: htmlData.rawHtmlLength },
  });

  // 20. Client-Side Rendering Dependency
  const isCsr = htmlData.isClientRenderedSuspect;
  results.push({
    id: 'content-csr-dependency',
    category: 'content',
    title: 'Server-Rendered Static Content',
    status: isCsr ? 'WARNING' : 'PASS',
    severity: isCsr ? 'high' : 'info',
    score: isCsr ? 1 : 5,
    maxScore: 5,
    explanation: isCsr
      ? `Potential client-side rendering dependency: ${htmlData.clientRenderedReason || 'Page relies heavily on JavaScript execution.'}`
      : 'Page delivers readable static HTML without requiring JavaScript execution.',
    whatWeFound: isCsr ? (htmlData.clientRenderedReason || 'CSR container detected with minimal static text.') : 'Content delivered directly in initial HTML.',
    whyItMatters: 'Many AI crawlers and indexing pipelines do not run headless Chromium browsers due to compute costs.',
    howToImprove: isCsr ? 'Implement Server-Side Rendering (SSR) or Static Site Generation (SSG).' : 'No action needed.',
    evidence: { isClientRenderedSuspect: isCsr, reason: htmlData.clientRenderedReason },
  });

  // 21. Empty Links Check
  const emptyLinks = htmlData.linksAnalysis.emptyLinksCount;
  results.push({
    id: 'content-empty-links',
    category: 'content',
    title: 'Link Anchor Tag Hygiene',
    status: emptyLinks === 0 ? 'PASS' : 'WARNING',
    severity: emptyLinks === 0 ? 'info' : 'low',
    score: emptyLinks === 0 ? 3 : 1,
    maxScore: 3,
    explanation: emptyLinks === 0
      ? 'All links contain inner text or aria-labels.'
      : `Found ${emptyLinks} empty link(s) without text or accessible labels.`,
    whatWeFound: emptyLinks === 0 ? 'Zero empty links.' : `${emptyLinks} empty link tag(s).`,
    whyItMatters: 'Empty links create dead ends for screen readers and link-traversing bots.',
    howToImprove: emptyLinks === 0 ? 'No action needed.' : 'Add descriptive text or aria-label attributes to icon-only links.',
    evidence: { emptyLinksCount: emptyLinks },
  });

  // 22. Descriptive Anchor Text Quality
  const genericAnchors = htmlData.linksAnalysis.genericAnchorCount;
  results.push({
    id: 'content-anchor-text-quality',
    category: 'content',
    title: 'Descriptive Anchor Text Quality',
    status: genericAnchors <= 2 ? 'PASS' : 'WARNING',
    severity: genericAnchors <= 2 ? 'info' : 'low',
    score: genericAnchors <= 2 ? 3 : 1,
    maxScore: 3,
    explanation: genericAnchors <= 2
      ? 'Links use descriptive context rather than generic phrases like "click here".'
      : `Found ${genericAnchors} link(s) using non-descriptive anchor text ("click here", "read more").`,
    whatWeFound: `${genericAnchors} generic anchor text link(s).`,
    whyItMatters: 'Descriptive anchor text tells AI crawlers what destination pages are about.',
    howToImprove: genericAnchors <= 2 ? 'No action needed.' : 'Replace "click here" with descriptive text such as "Explore our furniture inventory software".',
    evidence: { genericAnchorCount: genericAnchors },
  });

  // 23. Open Graph Title
  const hasOgTitle = !!htmlData.openGraph.title;
  results.push({
    id: 'content-og-title',
    category: 'content',
    title: 'Open Graph Title (og:title)',
    status: hasOgTitle ? 'PASS' : 'WARNING',
    severity: hasOgTitle ? 'info' : 'low',
    score: hasOgTitle ? 2 : 0,
    maxScore: 2,
    explanation: hasOgTitle ? `og:title declared: "${htmlData.openGraph.title}"` : 'Missing og:title tag.',
    whatWeFound: htmlData.openGraph.title ? `"${htmlData.openGraph.title}"` : 'None',
    whyItMatters: 'Social card titles provide secondary confirmation of entity topic for modern bots.',
    howToImprove: hasOgTitle ? 'No action needed.' : 'Add <meta property="og:title" content="...">.',
    evidence: { ogTitle: htmlData.openGraph.title },
  });

  // 24. Open Graph Description
  const hasOgDesc = !!htmlData.openGraph.description;
  results.push({
    id: 'content-og-description',
    category: 'content',
    title: 'Open Graph Description (og:description)',
    status: hasOgDesc ? 'PASS' : 'WARNING',
    severity: hasOgDesc ? 'info' : 'low',
    score: hasOgDesc ? 2 : 0,
    maxScore: 2,
    explanation: hasOgDesc ? 'og:description is declared.' : 'Missing og:description tag.',
    whatWeFound: hasOgDesc ? `"${htmlData.openGraph.description?.slice(0, 60)}..."` : 'None',
    whyItMatters: 'Open Graph descriptions reinforce on-page summaries across social and conversational surfaces.',
    howToImprove: hasOgDesc ? 'No action needed.' : 'Add <meta property="og:description" content="...">.',
    evidence: { ogDescription: htmlData.openGraph.description },
  });

  // 25. Open Graph URL
  const hasOgUrl = !!htmlData.openGraph.url;
  results.push({
    id: 'content-og-url',
    category: 'content',
    title: 'Open Graph Canonical URL (og:url)',
    status: hasOgUrl ? 'PASS' : 'INFO',
    severity: 'info',
    score: hasOgUrl ? 2 : 1,
    maxScore: 2,
    explanation: hasOgUrl ? `og:url declared: ${htmlData.openGraph.url}` : 'No og:url declared.',
    whatWeFound: htmlData.openGraph.url || 'None',
    whyItMatters: 'og:url establishes the canonical social graph identity of the resource.',
    howToImprove: hasOgUrl ? 'No action needed.' : 'Add <meta property="og:url" content="..."> matching canonical.',
    evidence: { ogUrl: htmlData.openGraph.url },
  });

  // 26. Document / Page Type
  const hasPageType = !!htmlData.openGraph.type;
  results.push({
    id: 'content-page-type',
    category: 'content',
    title: 'Document Type Declaration (og:type)',
    status: hasPageType ? 'PASS' : 'INFO',
    severity: 'info',
    score: hasPageType ? 2 : 1,
    maxScore: 2,
    explanation: hasPageType ? `og:type declared: "${htmlData.openGraph.type}"` : 'og:type not declared.',
    whatWeFound: htmlData.openGraph.type || 'None',
    whyItMatters: 'Declaring website, article, or product helps categorize page purpose.',
    howToImprove: hasPageType ? 'No action needed.' : 'Add <meta property="og:type" content="website">.',
    evidence: { ogType: htmlData.openGraph.type },
  });

  return results;
}
