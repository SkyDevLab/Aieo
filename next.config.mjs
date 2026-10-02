/** @type {import('next').NextConfig} */
const isGitHubPages = process.env.GITHUB_PAGES === 'true';

const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  ...(isGitHubPages
    ? {
        output: 'export',
        basePath: '/Aieo',
        assetPrefix: '/Aieo/',
      }
    : {}),
};

export default nextConfig;
