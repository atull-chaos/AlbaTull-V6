#!/usr/bin/env node
/**
 * Category Migration Script — V5
 *
 * Changes:
 * 1. Africa → move from Animals to Places
 * 2. Delete "Africa Wildlife" (empty duplicate — just keep "Africa")
 * 3. Basketball → move under Sports (child)
 * 4. Commercial → make standalone (remove parent ref to People)
 * 5. Delete empty standalone duplicates: "Architecture" and "Landscape"
 *    (already covered by "Architecture and Landscapes" under Places)
 *
 * Final structure:
 *   People → Celebrities
 *   Sports → Steelers, Basketball
 *   Animals → Wildlife
 *   Places → Amsterdam, Arch & Landscapes, Aspen, Bora Bora, France,
 *            Greece, Japan, Portugal, St. Barts, Africa
 *   Music  → Guitar, It Might Get Loud
 *   Standalone: Botanical, Cars, Commercial, MISC
 *
 * Run:  node migrate-categories.mjs
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

// Known IDs from Sanity cache
const IDS = {
  places:          'wMvIYWyVOmZB5IH03FqGE9',
  sports:          'FOnRwn15N998eMrPNtAPA4',
  animals:         'wMvIYWyVOmZB5IH03FqG25',
  people:          'wMvIYWyVOmZB5IH03FqFcr',
  africa:          'FOnRwn15N998eMrPNtAQPR',
  africaWildlife:  'drafts.d7b5eab0-b5fe-4a0b-90f8-f1bd8bb1b2db',
  basketball:      'drafts.97d674c6-999b-43f4-aacc-2297374cd299',
  commercial:      'wMvIYWyVOmZB5IH03FqGdN',
  architecture:    'drafts.ff2fc0d2-7ca7-46dc-9813-b201064cfcf1',
  landscape:       'drafts.59d598af-2903-4e9f-955c-43784cb393a5',
};

async function run() {
  console.log('\n  Category Migration — V5\n');

  // 1. Move Africa from Animals → Places
  console.log('  1. Moving Africa → Places...');
  try {
    await client.patch(IDS.africa)
      .set({ parentCategory: { _type: 'reference', _ref: IDS.places } })
      .commit();
    console.log('     ✓ Africa now under Places');
  } catch (e) {
    console.error('     ✗ Failed:', e.message);
  }

  // 2. Delete "Africa Wildlife" (empty duplicate)
  console.log('  2. Deleting "Africa Wildlife" (empty duplicate)...');
  try {
    await client.delete(IDS.africaWildlife);
    console.log('     ✓ Africa Wildlife deleted');
  } catch (e) {
    console.error('     ✗ Failed:', e.message);
    // Try without drafts. prefix in case it was published
    try {
      const altId = IDS.africaWildlife.replace('drafts.', '');
      await client.delete(altId);
      console.log('     ✓ Africa Wildlife deleted (published version)');
    } catch (e2) {
      console.error('     ✗ Also failed:', e2.message);
    }
  }

  // 3. Move Basketball under Sports
  console.log('  3. Moving Basketball → Sports...');
  try {
    await client.patch(IDS.basketball)
      .set({ parentCategory: { _type: 'reference', _ref: IDS.sports } })
      .commit();
    console.log('     ✓ Basketball now under Sports');
  } catch (e) {
    console.error('     ✗ Failed:', e.message);
    // Try without drafts. prefix
    try {
      const altId = IDS.basketball.replace('drafts.', '');
      await client.patch(altId)
        .set({ parentCategory: { _type: 'reference', _ref: IDS.sports } })
        .commit();
      console.log('     ✓ Basketball now under Sports (published version)');
    } catch (e2) {
      console.error('     ✗ Also failed:', e2.message);
    }
  }

  // 4. Make Commercial standalone (remove parent reference to People)
  console.log('  4. Making Commercial standalone...');
  try {
    await client.patch(IDS.commercial)
      .unset(['parentCategory'])
      .commit();
    console.log('     ✓ Commercial is now standalone');
  } catch (e) {
    console.error('     ✗ Failed:', e.message);
  }

  // 5. Clean up empty duplicate standalone categories
  const duplicates = [
    { id: IDS.architecture, name: 'Architecture' },
    { id: IDS.landscape,    name: 'Landscape' },
  ];
  for (const dup of duplicates) {
    console.log(`  5. Deleting empty duplicate "${dup.name}"...`);
    try {
      await client.delete(dup.id);
      console.log(`     ✓ ${dup.name} deleted`);
    } catch (e) {
      console.error(`     ✗ Failed:`, e.message);
      try {
        const altId = dup.id.replace('drafts.', '');
        await client.delete(altId);
        console.log(`     ✓ ${dup.name} deleted (published version)`);
      } catch (e2) {
        console.error(`     ✗ Also failed:`, e2.message);
      }
    }
  }

  // ── Verify final state ──
  console.log('\n  ═══ Final Category Structure ═══\n');
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
    console.log(`  📁 ${p.name} (${kidTotal} photos total)`);
    for (const k of kids) {
      const empty = k.photoCount === 0 ? ' ← empty placeholder' : '';
      console.log(`     └─ ${k.name}: ${k.photoCount}${empty}`);
    }
  }

  console.log('');
  for (const s of standalone) {
    const empty = s.photoCount === 0 ? ' ← empty placeholder' : '';
    console.log(`  ● ${s.name}: ${s.photoCount}${empty}`);
  }

  console.log(`\n  Total: ${cats.length} categories`);
  console.log('\n  Next steps:');
  console.log('    node seed-cache.mjs     # refresh local cache');
  console.log('    npm run deploy          # rebuild site\n');
}

run().catch(err => { console.error('FAILED:', err.message); process.exit(1); });
