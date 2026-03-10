#!/usr/bin/env node
/**
 * Seed the Sanity build cache manually.
 * Run this once:  node seed-cache.mjs
 *
 * Pulls all photos, categories, and featured photo directly from
 * the Sanity API and writes them to src/data/.sanity-cache.json.
 * After this, astro build will use the cache if Sanity drops.
 */
import { createClient } from '@sanity/client';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import 'dotenv/config';

const projectId = process.env.SANITY_PROJECT_ID || 'vo1f0ucj';
const dataset   = process.env.SANITY_DATASET   || 'production';
const token     = process.env.SANITY_READ_TOKEN || '';

console.log(`\n  Sanity Cache Seeder`);
console.log(`  Project: ${projectId} / ${dataset}`);
console.log(`  Token:   ${token ? token.slice(0, 8) + '...' : 'MISSING'}\n`);

const client = createClient({
  projectId,
  dataset,
  apiVersion: '2024-01-01',
  token,
  useCdn: true,
  timeout: 30000,
});

async function seed() {
  console.log('  Fetching photos...');
  const photos = await client.fetch(`
    *[_type == "photo"] | order(category->name asc, title asc) {
      _id, title, "slug": slug.current, description,
      category->{name, "slug": slug.current},
      image, audio, video, featured, metadata
    }
  `);
  console.log(`  → ${photos.length} photos`);

  console.log('  Fetching categories...');
  const categories = await client.fetch(`
    *[_type == "category"] | order(name asc) {
      _id, name, "slug": slug.current, description
    }
  `);
  console.log(`  → ${categories.length} categories`);

  console.log('  Fetching featured photo...');
  const featured = await client.fetch(`
    *[_type == "photo" && featured == true][0] {
      _id, title, "slug": slug.current, description,
      category->{name, "slug": slug.current},
      image, metadata
    }
  `);
  console.log(`  → ${featured ? featured.title : 'none set'}`);

  // Write cache
  const cacheDir = join(process.cwd(), 'src', 'data');
  const cacheFile = join(cacheDir, '.sanity-cache.json');

  if (!existsSync(cacheDir)) mkdirSync(cacheDir, { recursive: true });

  const data = {
    timestamp: Date.now(),
    date: new Date().toISOString(),
    photos,
    categories,
    featured,
  };

  writeFileSync(cacheFile, JSON.stringify(data, null, 2), 'utf-8');
  console.log(`\n  Cache saved: ${cacheFile}`);
  console.log(`  ${photos.length} photos, ${categories.length} categories`);
  console.log(`  Now run: npm run deploy\n`);
}

seed().catch(err => {
  console.error('\n  Failed to seed cache:', err.message);
  process.exit(1);
});
