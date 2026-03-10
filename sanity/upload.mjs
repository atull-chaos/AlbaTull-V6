#!/usr/bin/env node
/**
 * Bulk Upload Script — Alba Tull Portfolio
 *
 * Reads photos from a local folder structure and uploads them to Sanity CMS.
 *
 * Expected folder structure:
 *   <root>/
 *     Amsterdam/
 *       Amsterdam 1.jpg
 *       Amsterdam 2.jpg
 *     Botanical/
 *       Botanical 1.jpg
 *     ...
 *
 * Usage:
 *   node sanity/upload.mjs "/path/to/Website (JPEGs)"
 *
 * Environment variables (from .env in project root):
 *   SANITY_PROJECT_ID  — Sanity project ID
 *   SANITY_DATASET     — Dataset name (default: "production")
 *   SANITY_WRITE_TOKEN — Editor API token (read+write)
 */

import { createClient } from '@sanity/client';
import fs from 'fs';
import path from 'path';
import { config } from 'dotenv';

// ── Load .env ──────────────────────────────────────────────────────
config({ path: path.resolve(process.cwd(), '.env') });

const PROJECT_ID  = process.env.SANITY_PROJECT_ID;
const DATASET     = process.env.SANITY_DATASET || 'production';
const WRITE_TOKEN = process.env.SANITY_WRITE_TOKEN;

if (!PROJECT_ID || !WRITE_TOKEN) {
  console.error('Missing SANITY_PROJECT_ID or SANITY_WRITE_TOKEN in .env');
  process.exit(1);
}

// ── Sanity Client (write mode) ─────────────────────────────────────
const client = createClient({
  projectId:  PROJECT_ID,
  dataset:    DATASET,
  apiVersion: '2024-01-01',
  token:      WRITE_TOKEN,
  useCdn:     false,  // mutations need the live API
});

// ── Helpers ────────────────────────────────────────────────────────
function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function isImage(filename) {
  return /\.(jpe?g|png|webp|tiff?)$/i.test(filename);
}

/** Pause to respect Sanity rate limits */
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ── Main ───────────────────────────────────────────────────────────
async function main() {
  const sourceDir = process.argv[2];

  if (!sourceDir) {
    console.error('Usage: node sanity/upload.mjs "/path/to/photos"');
    process.exit(1);
  }

  if (!fs.existsSync(sourceDir)) {
    console.error(`Source directory not found: ${sourceDir}`);
    process.exit(1);
  }

  console.log(`\n📂 Source: ${sourceDir}`);
  console.log(`📡 Sanity: ${PROJECT_ID} / ${DATASET}\n`);

  // ── 1. Discover categories (top-level folders) ───────────────────
  const folders = fs.readdirSync(sourceDir, { withFileTypes: true })
    .filter((d) => d.isDirectory() && !d.name.startsWith('.'))
    .map((d) => d.name)
    .sort();

  console.log(`Found ${folders.length} categories: ${folders.join(', ')}\n`);

  // ── 2. Create/update category documents ──────────────────────────
  const categoryMap = {}; // slug → Sanity _id

  for (let i = 0; i < folders.length; i++) {
    const name = folders[i];
    const slug = slugify(name);
    const docId = `category-${slug}`;

    console.log(`  📁 Category ${i + 1}/${folders.length}: ${name}`);

    const doc = {
      _id: docId,
      _type: 'category',
      name: name,
      slug: { _type: 'slug', current: slug },
      order: (i + 1) * 10,
    };

    await client.createOrReplace(doc);
    categoryMap[name] = docId;
  }

  console.log(`\n✅ ${folders.length} categories synced.\n`);

  // ── 3. Upload photos ─────────────────────────────────────────────
  let totalUploaded = 0;
  let totalSkipped  = 0;
  let totalErrors   = 0;

  for (const folder of folders) {
    const folderPath = path.join(sourceDir, folder);
    const files = fs.readdirSync(folderPath)
      .filter(isImage)
      .sort();

    console.log(`\n📁 ${folder} (${files.length} images)`);

    for (let i = 0; i < files.length; i++) {
      const filename = files[i];
      const filePath = path.join(folderPath, filename);
      const titleRaw = path.basename(filename, path.extname(filename));
      const slug = slugify(titleRaw);
      const docId = `photo-${slug}`;

      process.stdout.write(`  📷 ${i + 1}/${files.length} ${titleRaw} ... `);

      try {
        // Check if photo already exists
        const existing = await client.getDocument(docId);
        if (existing && existing.image) {
          console.log('⏭️  already uploaded');
          totalSkipped++;
          continue;
        }

        // Upload image asset
        const imageBuffer = fs.readFileSync(filePath);
        const asset = await client.assets.upload('image', imageBuffer, {
          filename: filename,
          contentType: 'image/jpeg',
        });

        // Create photo document
        const doc = {
          _id: docId,
          _type: 'photo',
          title: titleRaw,
          slug: { _type: 'slug', current: slug },
          image: {
            _type: 'image',
            asset: { _type: 'reference', _ref: asset._id },
          },
          category: { _type: 'reference', _ref: categoryMap[folder] },
          featured: false,
          description: '',
        };

        await client.createOrReplace(doc);
        console.log('✅');
        totalUploaded++;

        // Rate limit: ~2 uploads/sec to stay within Sanity limits
        await sleep(500);
      } catch (err) {
        console.log(`❌ ${err.message}`);
        totalErrors++;
      }
    }
  }

  // ── Summary ──────────────────────────────────────────────────────
  console.log('\n' + '═'.repeat(50));
  console.log(`  ✅ Uploaded: ${totalUploaded}`);
  console.log(`  ⏭️  Skipped:  ${totalSkipped}`);
  console.log(`  ❌ Errors:   ${totalErrors}`);
  console.log(`  📊 Total:    ${totalUploaded + totalSkipped + totalErrors}`);
  console.log('═'.repeat(50) + '\n');
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
