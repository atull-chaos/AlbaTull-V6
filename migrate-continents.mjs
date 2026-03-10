#!/usr/bin/env node
/**
 * Continent Migration Script — Alba Tull V6A
 *
 * Restructures Places children from individual locations to 7 continents:
 *   North America  ← Aspen, St. Barts
 *   South America  ← (empty placeholder)
 *   Europe         ← Amsterdam, France, Greece, Portugal
 *   Asia           ← Japan, China
 *   Africa         ← Africa (existing photos stay)
 *   Oceania        ← Bora Bora
 *   Antarctica     ← (empty placeholder)
 *
 * Steps:
 *   1. Create 7 continent categories under Places
 *   2. Reassign photos from old place categories to their continent
 *   3. Optionally clean up old place categories (commented out for safety)
 *
 * Run:  node migrate-continents.mjs
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

// ── Known category IDs from Sanity ──────────────────────────────
const PLACES_PARENT_ID = 'wMvIYWyVOmZB5IH03FqGE9';

// Current place category IDs (from cache)
const OLD_PLACES = {
  amsterdam:  'category-amsterdam',
  aspen:      'category-aspen',
  'bora-bora':'category-bora-bora',
  france:     'category-france',
  greece:     'category-greece',
  japan:      'category-japan',
  portugal:   'category-portugal',
  'st-barts': 'category-st-barts',
  africa:     'FOnRwn15N998eMrPNtAQPR',
  // China may not exist yet as a category — we'll check dynamically
};

// ── Continent definitions ───────────────────────────────────────
const CONTINENTS = [
  { name: 'North America',  slug: 'north-america',  order: 10, oldSlugs: ['aspen', 'st-barts'] },
  { name: 'South America',  slug: 'south-america',  order: 20, oldSlugs: [] },
  { name: 'Europe',         slug: 'europe',          order: 30, oldSlugs: ['amsterdam', 'france', 'greece', 'portugal'] },
  { name: 'Asia',           slug: 'asia',            order: 40, oldSlugs: ['japan', 'china'] },
  { name: 'Africa',         slug: 'africa-continent',order: 50, oldSlugs: ['africa'] },
  { name: 'Oceania',        slug: 'oceania',         order: 60, oldSlugs: ['bora-bora'] },
  { name: 'Antarctica',     slug: 'antarctica',      order: 70, oldSlugs: [] },
];

async function run() {
  console.log('\n  ═══ Continent Migration — Alba Tull V6A ═══\n');

  // First, get all current categories to find IDs dynamically
  const allCats = await client.fetch(`
    *[_type == "category"] {
      _id, name, "slug": slug.current,
      "isParent": coalesce(isParent, false),
      "parentSlug": parentCategory->slug.current
    }
  `);
  console.log(`  Found ${allCats.length} existing categories\n`);

  // Build a slug→ID map for all categories under Places
  const placeCatMap = {};
  for (const c of allCats) {
    if (c.parentSlug === 'places' || c.slug === 'places') {
      placeCatMap[c.slug] = c._id;
    }
  }
  // Also check for China (may be standalone or not exist)
  const china = allCats.find(c => c.slug === 'china');
  if (china) placeCatMap['china'] = china._id;
  console.log('  Places categories found:', Object.keys(placeCatMap).join(', '));

  // ── Step 1: Create continent categories ──────────────────────
  console.log('\n  STEP 1: Creating continent categories...\n');
  const continentIds = {};

  for (const cont of CONTINENTS) {
    // Check if it already exists
    const existing = allCats.find(c => c.slug === cont.slug);
    if (existing) {
      console.log(`    ✓ ${cont.name} already exists (${existing._id})`);
      continentIds[cont.slug] = existing._id;
      continue;
    }

    const doc = {
      _type: 'category',
      _id: `continent-${cont.slug}`,
      name: cont.name,
      slug: { _type: 'slug', current: cont.slug },
      order: cont.order,
      parentCategory: { _type: 'reference', _ref: PLACES_PARENT_ID },
    };

    try {
      const result = await client.createOrReplace(doc);
      continentIds[cont.slug] = result._id;
      console.log(`    ✓ Created: ${cont.name} → ${result._id}`);
    } catch (err) {
      console.error(`    ✗ Failed to create ${cont.name}:`, err.message);
    }
  }

  // ── Step 2: Reassign photos to continent categories ──────────
  console.log('\n  STEP 2: Reassigning photos to continents...\n');

  for (const cont of CONTINENTS) {
    if (cont.oldSlugs.length === 0) {
      console.log(`    ${cont.name}: no photos to migrate (placeholder)`);
      continue;
    }

    const targetId = continentIds[cont.slug];
    if (!targetId) {
      console.error(`    ✗ ${cont.name}: no target category ID found, skipping`);
      continue;
    }

    for (const oldSlug of cont.oldSlugs) {
      const oldId = placeCatMap[oldSlug];
      if (!oldId) {
        console.log(`    ${cont.name}: old category "${oldSlug}" not found, skipping`);
        continue;
      }

      // Find all photos in the old category
      const photos = await client.fetch(
        `*[_type == "photo" && category._ref == $oldId]{ _id, title }`,
        { oldId }
      );

      if (photos.length === 0) {
        console.log(`    ${cont.name} ← ${oldSlug}: 0 photos (empty)`);
        continue;
      }

      console.log(`    ${cont.name} ← ${oldSlug}: ${photos.length} photos`);

      // Batch reassign in groups of 50
      for (let i = 0; i < photos.length; i += 50) {
        const batch = photos.slice(i, i + 50);
        const mutations = batch.map(p => ({
          patch: {
            id: p._id,
            set: { category: { _type: 'reference', _ref: targetId } }
          }
        }));

        const result = await client.mutate(mutations);
        console.log(`      Batch ${Math.floor(i/50)+1}: ${batch.length} photos reassigned`);
      }
    }

    // Also check additionalCategories
    for (const oldSlug of cont.oldSlugs) {
      const oldId = placeCatMap[oldSlug];
      if (!oldId) continue;

      const photosWithAdditional = await client.fetch(
        `*[_type == "photo" && $oldId in additionalCategories[]._ref]{ _id, title }`,
        { oldId }
      );

      if (photosWithAdditional.length > 0) {
        console.log(`    ${cont.name}: ${photosWithAdditional.length} photos have "${oldSlug}" in additionalCategories (updating...)`);
        // Replace old ref with continent ref in additionalCategories
        // This is trickier — need to handle array items
        for (const p of photosWithAdditional) {
          const photo = await client.fetch(`*[_id == $id][0]{ additionalCategories }`, { id: p._id });
          if (photo && photo.additionalCategories) {
            const newAdditional = photo.additionalCategories.map(ac => {
              if (ac._ref === oldId) {
                return { _type: 'reference', _ref: targetId, _key: ac._key || targetId.slice(-8) };
              }
              return ac;
            });
            await client.patch(p._id).set({ additionalCategories: newAdditional }).commit();
          }
        }
        console.log(`      ✓ additionalCategories updated`);
      }
    }
  }

  // ── Step 3: Remove old Places children (commented for safety) ──
  console.log('\n  STEP 3: Old place categories to clean up:\n');
  const oldSlugsUsed = CONTINENTS.flatMap(c => c.oldSlugs);
  for (const slug of oldSlugsUsed) {
    const id = placeCatMap[slug];
    if (!id) continue;
    const remainingPhotos = await client.fetch(
      `count(*[_type == "photo" && category._ref == $id])`,
      { id }
    );
    console.log(`    ${slug} (${id}): ${remainingPhotos} photos remaining`);
    if (remainingPhotos === 0) {
      console.log(`      → Safe to delete. Deleting...`);
      try {
        await client.delete(id);
        console.log(`      ✓ Deleted ${slug}`);
      } catch (err) {
        console.error(`      ✗ Failed to delete:`, err.message);
      }
    } else {
      console.log(`      → Still has photos! NOT deleting.`);
    }
  }

  // ── Verify ──
  console.log('\n  ═══ Final Places Structure ═══\n');
  const finalCats = await client.fetch(`
    *[_type == "category" && (
      slug.current == "places" ||
      parentCategory->slug.current == "places"
    )] | order(order asc) {
      name, "slug": slug.current,
      "isParent": coalesce(isParent, false),
      "photoCount": count(*[_type == "photo" && (category._ref == ^._id || ^._id in additionalCategories[]._ref)])
    }
  `);

  for (const c of finalCats) {
    const prefix = c.isParent ? '📁' : '   └─';
    console.log(`  ${prefix} ${c.name}: ${c.photoCount} photos (${c.slug})`);
  }

  console.log('\n  Next steps:');
  console.log('    node seed-cache.mjs     # refresh local cache');
  console.log('    npm run deploy          # rebuild site\n');
}

run().catch(err => {
  console.error('\n  FAILED:', err.message);
  process.exit(1);
});
