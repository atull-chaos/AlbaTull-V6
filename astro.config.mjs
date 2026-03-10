/**
 * Astro Configuration — Alba Tull V6A
 *
 * Static site generation for Netlify deployment.
 * Site: https://albatull.com
 */
import { defineConfig } from 'astro/config';

export default defineConfig({
  output: 'static',
  site: 'https://albatull.com',
  build: {
    assets: '_assets'
  },
  vite: {
    build: {
      cssMinify: true,
      minify: true
    }
  }
});
