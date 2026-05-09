import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';
import tailwind from '@astrojs/tailwind';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://argentinaaldia.com',
  output: 'static',
  adapter: cloudflare({ imageService: 'compile' }),
  integrations: [
    tailwind({ applyBaseStyles: false }),
    sitemap(),
  ],
  trailingSlash: 'never',
  build: {
    format: 'directory',
  },
});
