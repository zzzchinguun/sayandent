import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/lib/i18n/request.ts');

const nextConfig: NextConfig = {
  turbopack: {
    root: '..',
  },
  experimental: {
    // Whole-document 404 for URLs matching no route — required because both
    // route trees ([locale]/ and admin/) own their own <html> root.
    globalNotFound: true,
  },
};

export default withNextIntl(nextConfig);
