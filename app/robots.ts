import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/'],
      },
      {
        userAgent: ['GPTBot', 'ClaudeBot', 'PerplexityBot', 'CCBot', 'Google-Extended'],
        allow: '/',
      },
    ],
    sitemap: 'https://aieo-checker.skydevlab.com/sitemap.xml',
  };
}
