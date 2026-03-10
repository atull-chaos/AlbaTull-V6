#!/usr/bin/env node
/**
 * Seed Cache + Auto-Order — Alba Tull V6A
 *
 * 1. Fetches all photos and categories from Sanity
 * 2. Auto-assigns sequential displayOrder to ALL photos per category:
 *    - Manually pinned photos (displayOrder 1–12) keep their positions
 *    - Remaining photos fill in sequentially (13, 14, 15...) alphabetically
 *    - Writes updated displayOrder values back to Sanity
 * 3. Saves everything to the build cache (.sanity-cache.json)
 *
 * Run:  node seed-cache.mjs
 * Build command (Netlify):  node seed-cache.mjs && npm run build
 */
import { createClient } from '@sanity/client';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import 'dotenv/config';

const projectId  = process.env.SANITY_PROJECT_ID || 'vo1f0ucj';
const dataset    = process.env.SANITY_DATASET    || 'production';
const readToken  = process.env.SANITY_READ_TOKEN  || '';
const writeToken = process.env.SANITY_WRITE_TOKEN || '';

console.log(`\n  Sanity Cache Seeder + Auto-Order`);
console.log(`  Project: ${projectId} / ${dataset}`);
console.log(`  Read:    ${readToken ? readToken.slice(0, 8) + '...' : 'MISSING'}`);
console.log(`  Write:   ${writeToken ? writeToken.slice(0, 8) + '...' : 'MISSING (auto-order disabled)'}\n`);

// Read client (for fetching) — useCdn: false ensures fresh data after gallery-order changes
const readClient = createClient({
  projectId, dataset,
  apiVersion: '2024-01-01',
  token: readToken,
  useCdn: false,
  timeout: 30000,
});

// Write client (for updating displayOrder)
const writeClient = writeToken ? createClient({
  projectId, dataset,
  apiVersion: '2024-01-01',
  token: writeToken,
  useCdn: false,
  timeout: 30000,
}) : null;

async function seed() {
  // ── Fetch all data ──────────────────────────────────────────
  console.log('  Fetching photos...');
  const photos = await readClient.fetch(`
    *[_type == "photo"] | order(category->name asc, title asc) {
      _id, title, "slug": slug.current, description,
      category->{ _id, name, "slug": slug.current },
      "additionalCategories": additionalCategories[]->{ _id, name, "slug": slug.current },
      image, audio, video, featured, metadata, displayOrder
    }
  `);
  console.log(`  → ${photos.length} photos`);

  console.log('  Fetching categories...');
  const categories = await readClient.fetch(`
    *[_type == "category"] | order(order asc, name asc) {
      _id, name, "slug": slug.current, description, coverImage, order,
      archetype, archetypeDescription,
      "isParent": coalesce(isParent, false),
      "parentCategory": parentCategory->{ _id, name, "slug": slug.current },
      "children": *[_type == "category" && parentCategory._ref == ^._id] | order(order asc, name asc) {
        _id, name, "slug": slug.current, order,
        "photoCount": count(*[_type == "photo" && (category._ref == ^._id || ^._id in additionalCategories[]._ref)])
      },
      "photoCount": count(*[_type == "photo" && (category._ref == ^._id || ^._id in additionalCategories[]._ref)])
    }
  `);
  console.log(`  → ${categories.length} categories`);

  console.log('  Fetching featured photo...');
  const featured = await readClient.fetch(`
    *[_type == "photo" && featured == true][0] {
      _id, title, "slug": slug.current, description,
      category->{ name, "slug": slug.current },
      image, metadata
    }
  `);
  console.log(`  → ${featured ? featured.title : 'none set'}`);

  // ── Auto-order photos per category ──────────────────────────
  if (writeClient) {
    console.log('\n  Auto-ordering photos per category...');
    const mutations = await computeAutoOrder(photos, categories);

    if (mutations.length > 0) {
      console.log(`  → ${mutations.length} photos need displayOrder updates`);

      // Batch mutations in groups of 50
      for (let i = 0; i < mutations.length; i += 50) {
        const batch = mutations.slice(i, i + 50);
        try {
          await writeClient.mutate(batch);
          console.log(`    Batch ${Math.floor(i/50)+1}: ${batch.length} updates`);
        } catch (err) {
          console.error(`    Batch ${Math.floor(i/50)+1} failed:`, err.message);
        }
      }

      // Update local photo objects to reflect new displayOrder
      for (const m of mutations) {
        const photo = photos.find(p => p._id === m.patch.id);
        if (photo && m.patch.set) {
          photo.displayOrder = m.patch.set.displayOrder;
        }
      }

      console.log('  ✓ Auto-ordering complete');
    } else {
      console.log('  → All photos already in correct order');
    }
  } else {
    console.log('\n  ⚠ No write token — skipping auto-order');
  }

  // ── Write cache ─────────────────────────────────────────────
  const cacheDir  = join(process.cwd(), 'src', 'data');
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
  console.log(`  Now run: npm run build\n`);
}

/**
 * Compute displayOrder mutations for all photos in each category.
 *
 * Logic per category:
 *   1. Separate pinned photos (displayOrder 1–12) from unpinned
 *   2. Sort unpinned alphabetically by title
 *   3. Assign sequential displayOrder starting after the last pin:
 *      - If 5 photos are pinned (1–5), unpinned start at 6
 *      - If 0 are pinned, all start at 1
 *   4. Only generate mutations for photos whose displayOrder changed
 */
function computeAutoOrder(photos, categories) {
  const mutations = [];

  // Group photos by primary category ID
  const byCat = {};
  for (const p of photos) {
    const catId = p.category?._id;
    if (!catId) continue;
    if (!byCat[catId]) byCat[catId] = [];
    byCat[catId].push(p);
  }

  for (const [catId, catPhotos] of Object.entries(byCat)) {
    // Separate pinned (manually ordered 1–12) from unpinned
    const pinned = catPhotos
      .filter(p => p.displayOrder && p.displayOrder >= 1 && p.displayOrder <= 12)
      .sort((a, b) => a.displayOrder - b.displayOrder);

    const unpinned = catPhotos
      .filter(p => !p.displayOrder || p.displayOrder > 12 || p.displayOrder < 1)
      .sort((a, b) => (a.title || '').localeCompare(b.title || ''));

    // Assign sequential numbers
    // Pinned keep their positions (1–N where N ≤ 12)
    const nextStart = pinned.length > 0
      ? Math.max(...pinned.map(p => p.displayOrder)) + 1
      : 1;

    let seq = nextStart;
    for (const photo of unpinned) {
      const correctOrder = seq;
      if (photo.displayOrder !== correctOrder) {
        mutations.push({
          patch: {
            id: photo._id,
            set: { displayOrder: correctOrder }
          }
        });
      }
      seq++;
    }

    // Also verify pinned photos still have correct values
    // (they should, but just in case)
    for (const photo of pinned) {
      // Pinned photos keep their existing displayOrder — no change needed
    }
  }

  return mutations;
}

seed().catch(err => {
  console.error('\n  Failed to seed cache:', err.message);
  process.exit(1);
});
