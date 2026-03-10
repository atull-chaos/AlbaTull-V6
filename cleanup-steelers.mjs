/**
 * Cleanup: Remove steelers category from photos that were moved to steelers-portraits.
 * These photos should ONLY appear under People > Steelers Portraits, not under Sports > Steelers.
 */
import { createClient } from '@sanity/client';
import dotenv from 'dotenv';
dotenv.config();

const client = createClient({
  projectId: process.env.SANITY_PROJECT_ID || 'vo1f0ucj',
  dataset: process.env.SANITY_DATASET || 'production',
  apiVersion: '2024-01-01',
  token: process.env.SANITY_WRITE_TOKEN,
  useCdn: false,
});

async function cleanup() {
  // Find all photos whose primary category is steelers-portraits
  const photos = await client.fetch(`
    *[_type == "photo" && category->slug.current == "steelers-portraits"] {
      _id,
      title,
      "additionalCategories": additionalCategories[]{ _ref, _key, _type }
    }
  `);

  console.log(`Found ${photos.length} photos in Steelers Portraits`);

  let cleaned = 0;
  for (const photo of photos) {
    // Get the steelers category ID so we can remove it from additionalCategories
    const steelersCat = await client.fetch(`*[_type == "category" && slug.current == "steelers"][0]{ _id }`);

    if (photo.additionalCategories && photo.additionalCategories.length > 0) {
      // Filter out the steelers reference from additionalCategories
      const filtered = photo.additionalCategories.filter(ac => ac._ref !== steelersCat._id);

      await client.patch(photo._id)
        .set({ additionalCategories: filtered })
        .commit();

      cleaned++;
      console.log(`  Cleaned: ${photo.title} (removed steelers from additionalCategories)`);
    }
  }

  console.log(`\nDone! Cleaned ${cleaned} photos. They now only appear under People > Steelers Portraits.`);
}

cleanup().catch(err => { console.error('Error:', err.message); process.exit(1); });
