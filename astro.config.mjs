// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://www.oilmends.com',
  integrations: [
    sitemap({
      filter: (page) => !page.includes('/404'),
      changefreq: 'weekly',
      priority: 0.7,
      serialize(item) {
        if (item.url.endsWith('.com/')) item.priority = 1.0; // homepage
        return item;
      },
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
});
