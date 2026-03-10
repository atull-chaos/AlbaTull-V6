/**
 * fix-people.mjs
 *
 * Detaches Portraiture and Steelers Portraits from the "People" parent category,
 * making them standalone categories. Then deletes the empty People parent.
 *
 * Category IDs (from Sanity):
 *   People (parent):       wMvIYWyVOmZB5IH03FqFcr   (0 photos, isParent: true)
 *   Portraiture (child):   category-celebrities        (125 photos, slug: portraiture)
 *   Steelers Portraits:    category-steelers-portraits  (64 photos)
 *
 * Run: node fix-people.mjs
 */
import { createClient } from '@sanity/client';
import 'dotenv/config';

const client = createClient({
  projectId: process.env.SANITY_PROJECT_ID || 'vo1f0ucj',
  dataset: process.env.SANITY_DATASET || 'production',
  apiVersion: process.env.SANITY_API_VERSION || '2024-01-01',
  token: process.env.SANITY_WRITE_TOKEN,
  useCdn: false,
});

const PEOPLE_ID = 'wMvIYWyVOmZB5IH03FqFcr';
const PORTRAITURE_ID = 'category-celebrities';
const STEELERS_PORTRAITS_ID = 'category-steelers-portraits';

async function main() {
  console.log('Step 1: Detaching Portraiture from People parent...');
  await client
    .patch(PORTRAITURE_ID)
    .unset(['parentCategory'])
    .commit();
  console.log('  Done — Portraiture is now standalone.');

  console.log('Step 2: Detaching Steelers Portraits from People parent...');
  await client
    .patch(STEELERS_PORTRAITS_ID)
    .unset(['parentCategory'])
    .commit();
  console.log('  Done — Steelers Portraits is now standalone.');

  console.log('Step 3: Deleting empty People parent category...');
  await client.delete(PEOPLE_ID);
  console.log('  Done — People category deleted.');

  console.log('\nAll done. Portraiture and Steelers Portraits are now top-level categories.');
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
