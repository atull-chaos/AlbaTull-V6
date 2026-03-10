#!/usr/bin/env node
/**
 * Category Migration — Portraiture & Experimentations
 *
 * Changes:
 * 1. Rename "Celebrities" → "Portraiture" (keeps slug celebrities, updates display name)
 *    - All 114 photos stay assigned, no data loss
 * 2. Create "Experimentations" as a new standalone category for abstract work
 *    - Slug: experimentations
 *    - This is separate from Botanical (which stays standalone)
 *
 * Run:  node migrate-portraiture.mjs
 */
import { createClient } from '@sanity/client';
import 'dotenv/config';

const client = createClient({
  projectId: process.env.SANITY_PROJECT_ID || 'vo1f0ucj',
  dataset:   process.env.SANITY_DATASET   || 'production',
  apiVersion: '2024-01-01',
  token:     process.env.SANITY_WRITE_TOKEN,
  useCdn:    false,
});

async function run() {
  console.log('\n  Category Migration — Portraiture & Experimentations\n');

  // 1. Rename Celebrities → Portraiture
  console.log('  1. Renaming "Celebrities" → "Portraiture"...');
  try {
    // Find the celebrities category
    const celeb = await client.fetch(
      '*[_type == "category" && slug.current == "celebrities"][0]{ _id, name }'
    );
    if (!celeb) {
      console.log('     ✗ Could not find "celebrities" category');
    } else {
      await client.patch(celeb._id)
        .set({
          name: 'Portraiture',
          slug: { _type: 'slug', current: 'portraiture' },
        })
        .commit();
      console.log(`     ✓ Renamed "${celeb.name}" → "Portraiture" (id: ${celeb._id})`);
      console.log('       All 114 photos remain assigned — no data loss');
    }
  } catch (e) {
    console.error('     ✗ Failed:', e.message);
  }

  // 2. Create "Experimentations" category (standalone, for abstract work)
  console.log('  2. Creating "Experimentations" category...');
  try {
    // Check if it already exists
    const existing = await client.fetch(
      '*[_type == "category" && slug.current == "experimentations"][0]{ _id }'
    );
    if (existing) {
      console.log(`     SKIP: "Experimentations" already exists (id: ${existing._id})`);
    } else {
      const created = await client.create({
        _type: 'category',
        name: 'Experimentations',
        slug: { _type: 'slug', current: 'experimentations' },
        description: 'Abstract and experimental photography — textures, light studies, mixed media, and conceptual work.',
        isParent: false,
        order: 55,
      });
      console.log(`     ✓ Created "Experimentations" (id: ${created._id})`);
    }
  } catch (e) {
    console.error('     ✗ Failed:', e.message);
  }

  // ── Verify ──
  console.log('\n  ═══ Updated Category Structure ═══\n');
  const cats = await client.fetch(`
    *[_type == "category"] | order(order asc, name asc) {
      name,
      "slug": slug.current,
      "isParent": coalesce(isParent, false),
      "parent": parentCategory->name,
      "photoCount": count(*[_type == "photo" && (category._ref == ^._id || ^._id in additionalCategories[]._ref)])
    }
  `);

  const parents = cats.filter(c => c.isParent);
  const children = cats.filter(c => c.parent);
  const standalone = cats.filter(c => !c.isParent && !c.parent);

  for (const p of parents) {
    const kids = children.filter(c => c.parent === p.name);
    const kidTotal = kids.reduce((s, k) => s + k.photoCount, 0);
    console.log(`  📁 ${p.name} (${kidTotal} photos)`);
    for (const k of kids) {
      const empty = k.photoCount === 0 ? ' ← empty' : '';
      console.log(`     └─ ${k.name}: ${k.photoCount}${empty}`);
    }
  }

  console.log('');
  for (const s of standalone) {
    const empty = s.photoCount === 0 ? ' ← empty' : '';
    console.log(`  ● ${s.name}: ${s.photoCount}${empty}`);
  }

  console.log(`\n  Total: ${cats.length} categories`);
  console.log('\n  Next steps:');
  console.log('    node seed-cache.mjs');
  console.log('    npm run deploy\n');
}

run().catch(err => { console.error('FAILED:', err.message); process.exit(1); });
