export interface BotDirective {
  userAgent: string;
  disallowed: string[];
  allowed: string[];
}

export interface ParsedRobotsData {
  exists: boolean;
  status: number;
  url: string;
  rawContent: string;
  isAccessible: boolean;
  hasSyntaxErrors: boolean;
  syntaxErrors: string[];
  blocksAllCrawlers: boolean;
  isHomepageDisallowed: boolean;
  disallowedImportantPaths: string[];
  sitemapsDeclared: string[];
  aiBotsDirectives: {
    bot: string;
    company: string;
    status: 'allowed' | 'disallowed_all' | 'restricted' | 'not_specified';
    details: string;
  }[];
  generalUserAgentPolicy: 'allow_all' | 'block_all' | 'custom' | 'none';
}

const COMMON_AI_BOTS = [
  { name: 'GPTBot', company: 'OpenAI' },
  { name: 'ClaudeBot', company: 'Anthropic' },
  { name: 'PerplexityBot', company: 'Perplexity AI' },
  { name: 'Google-Extended', company: 'Google Gemini' },
  { name: 'CCBot', company: 'Common Crawl' },
  { name: 'Applebot-Extended', company: 'Apple Intelligence' },
  { name: 'Bytespider', company: 'ByteDance' },
  { name: 'Cohere-ai', company: 'Cohere' },
];

const IMPORTANT_PATHS_TO_CHECK = ['/_next/', '/static/', '/assets/', '/css/', '/js/', '/images/'];

export function parseRobotsTxt(
  content: string,
  statusCode: number,
  robotsUrl: string
): ParsedRobotsData {
  const isAccessible = statusCode >= 200 && statusCode < 300;
  if (!isAccessible || !content.trim()) {
    return {
      exists: isAccessible && content.trim().length > 0,
      status: statusCode,
      url: robotsUrl,
      rawContent: content,
      isAccessible,
      hasSyntaxErrors: false,
      syntaxErrors: [],
      blocksAllCrawlers: false,
      isHomepageDisallowed: false,
      disallowedImportantPaths: [],
      sitemapsDeclared: [],
      aiBotsDirectives: [],
      generalUserAgentPolicy: 'none',
    };
  }

  const lines = content.split(/\r?\n/);
  const directives: Record<string, { disallowed: string[]; allowed: string[] }> = {};
  const sitemaps: string[] = [];
  const syntaxErrors: string[] = [];

  let currentAgents: string[] = [];

  for (let idx = 0; idx < lines.length; idx++) {
    let rawLine = lines[idx];
    const commentIdx = rawLine.indexOf('#');
    if (commentIdx !== -1) {
      rawLine = rawLine.slice(0, commentIdx);
    }
    const line = rawLine.trim();
    if (!line) continue;

    const colonIdx = line.indexOf(':');
    if (colonIdx === -1) {
      syntaxErrors.push(`Line ${idx + 1}: Missing colon separator in directive "${line}"`);
      continue;
    }

    const key = line.slice(0, colonIdx).trim().toLowerCase();
    const value = line.slice(colonIdx + 1).trim();

    if (key === 'user-agent') {
      const agent = value.toLowerCase();
      currentAgents.push(agent);
      if (!directives[agent]) {
        directives[agent] = { disallowed: [], allowed: [] };
      }
    } else if (key === 'disallow') {
      if (currentAgents.length === 0) {
        syntaxErrors.push(`Line ${idx + 1}: Disallow directive without preceding User-agent.`);
      }
      for (const agent of currentAgents) {
        directives[agent]?.disallowed.push(value);
      }
    } else if (key === 'allow') {
      if (currentAgents.length === 0) {
        syntaxErrors.push(`Line ${idx + 1}: Allow directive without preceding User-agent.`);
      }
      for (const agent of currentAgents) {
        directives[agent]?.allowed.push(value);
      }
    } else if (key === 'sitemap') {
      if (value) {
        sitemaps.push(value);
      }
    }
  }

  // Check wildcard '*' policy
  const starPolicy = directives['*'];
  let blocksAllCrawlers = false;
  let isHomepageDisallowed = false;
  const disallowedImportantPaths: string[] = [];
  let generalUserAgentPolicy: ParsedRobotsData['generalUserAgentPolicy'] = 'none';

  if (starPolicy) {
    const hasDisallowRoot = starPolicy.disallowed.some((path) => path === '/' || path === '/*');
    const hasAllowRoot = starPolicy.allowed.some((path) => path === '/' || path === '/*');

    if (hasDisallowRoot && !hasAllowRoot) {
      blocksAllCrawlers = true;
      isHomepageDisallowed = true;
      generalUserAgentPolicy = 'block_all';
    } else if (starPolicy.disallowed.length === 0 || (starPolicy.disallowed.length === 1 && starPolicy.disallowed[0] === '')) {
      generalUserAgentPolicy = 'allow_all';
    } else {
      generalUserAgentPolicy = 'custom';
    }

    // Check important asset paths
    for (const imp of IMPORTANT_PATHS_TO_CHECK) {
      if (starPolicy.disallowed.some((d) => d === imp || d.startsWith(imp))) {
        disallowedImportantPaths.push(imp);
      }
    }
  }

  // Check specific AI bot rules
  const aiBotsDirectives: ParsedRobotsData['aiBotsDirectives'] = [];

  for (const bot of COMMON_AI_BOTS) {
    const agentLower = bot.name.toLowerCase();
    const matchedDirective = directives[agentLower];

    if (matchedDirective) {
      const disallowsAll = matchedDirective.disallowed.some((p) => p === '/' || p === '/*');
      const allowsAll = matchedDirective.allowed.some((p) => p === '/' || p === '/*');

      if (disallowsAll && !allowsAll) {
        aiBotsDirectives.push({
          bot: bot.name,
          company: bot.company,
          status: 'disallowed_all',
          details: `Explicitly blocks all crawling for ${bot.name} (${bot.company}).`,
        });
      } else if (matchedDirective.disallowed.length > 0) {
        aiBotsDirectives.push({
          bot: bot.name,
          company: bot.company,
          status: 'restricted',
          details: `Has ${matchedDirective.disallowed.length} restricted path(s) for ${bot.name}.`,
        });
      } else {
        aiBotsDirectives.push({
          bot: bot.name,
          company: bot.company,
          status: 'allowed',
          details: `Explicitly allows ${bot.name} (${bot.company}).`,
        });
      }
    } else {
      aiBotsDirectives.push({
        bot: bot.name,
        company: bot.company,
        status: 'not_specified',
        details: `Follows default wildcard (*) rules.`,
      });
    }
  }

  return {
    exists: true,
    status: statusCode,
    url: robotsUrl,
    rawContent: content,
    isAccessible: true,
    hasSyntaxErrors: syntaxErrors.length > 0,
    syntaxErrors,
    blocksAllCrawlers,
    isHomepageDisallowed,
    disallowedImportantPaths,
    sitemapsDeclared: sitemaps,
    aiBotsDirectives,
    generalUserAgentPolicy,
  };
}
