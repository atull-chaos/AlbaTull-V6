/**
 * Fix Wildlife Category
 *
 * 1. Remove parentCategory from Wildlife (make it standalone)
 * 2. Delete the "Animals" parent category (it has 0 photos)
 */
import { createClient } from '@sanity/client';
import 'dotenv/config';

const client = createClient({
  projectId:  process.env.SANITY_PROJECT_ID  || 'vo1f0ucj',
  dataset:    process.env.SANITY_DATASET     || 'production',
  apiVersion: process.env.SANITY_API_VERSION || '2024-01-01',
  token:      process.env.SANITY_WRITE_TOKEN,
  useCdn:     false,
});

async function main() {
  console.log('1. Removing parentCategory from Wildlife...');
  await client.patch('category-wildlife')
    .unset(['parentCategory', 'isParent'])
    .commit();
  console.log('   Done — Wildlife is now a standalone category.');

  console.log('2. Deleting "Animals" parent category (0 photos)...');
  await client.delete('wMvIYWyVOmZB5IH03FqG25');
  console.log('   Done — Animals category deleted.');

  console.log('\nAll done. Wildlife is now standalone.');
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
