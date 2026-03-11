#!/usr/bin/env node
/**
 * Generate Search Index — Alba Tull V6A
 *
 * Reads the Sanity cache and writes public/search-index.json
 * containing photo title, slug, category, description, and thumbnail URL.
 * Runs as a prebuild step before Astro.
 */
import { readFileSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

// ── Read Sanity cache ───────────────────────────────────────────
const cachePath = resolve(ROOT, 'src/data/.sanity-cache.json');
let data;
try {
  data = JSON.parse(readFileSync(cachePath, 'utf8'));
} catch (e) {
  console.log('[search-index] No cache file found, skipping search index generation');
  process.exit(0);
}

const photos = data.photos || [];
const PROJECT_ID = 'vo1f0ucj';
const DATASET = 'production';

// ── Build Sanity image URL (simplified — no client needed) ──────
function thumbUrl(image) {
  if (!image?.asset?._ref) return '';
  // Parse asset ref: image-{id}-{width}x{height}-{format}
  const ref = image.asset._ref;
  const parts = ref.replace('image-', '').split('-');
  const id = parts[0];
  const dims = parts[1]; // e.g. "2048x1433"
  const fmt = parts[2];  // e.g. "jpg"
  return `https://cdn.sanity.io/images/${PROJECT_ID}/${DATASET}/${id}-${dims}.${fmt}?w=80&h=80&fit=crop&q=40&auto=format`;
}

// ── Build index ─────────────────────────────────────────────────
const index = photos.map(p => ({
  t: p.title || '',                          // title
  s: p.slug,                                 // slug
  c: p.category?.name || '',                 // category name
  d: (p.description || '').slice(0, 80),     // description snippet
  i: thumbUrl(p.image),                      // tiny thumbnail
}));

// ── Write output ────────────────────────────────────────────────
const outPath = resolve(ROOT, 'public/search-index.json');
writeFileSync(outPath, JSON.stringify(index));
console.log(`[search-index] Generated ${index.length} entries → public/search-index.json`);
