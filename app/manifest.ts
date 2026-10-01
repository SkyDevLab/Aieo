import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Website AIEO Checker',
    short_name: 'AIEO Checker',
    description:
      'Free website audit tool for AI search readiness, AEO, structured data, entity clarity, and answer readiness.',
    start_url: '/',
    display: 'standalone',
    background_color: '#0B1120',
    theme_color: '#4f46e5',
    icons: [
      {
        src: '/icon.svg',
        sizes: '64x64',
        type: 'image/svg+xml',
      },
    ],
  };
}