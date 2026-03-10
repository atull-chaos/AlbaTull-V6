/**
 * Sanity Build Cache — Alba Tull Portfolio
 *
 * After each successful Sanity fetch during build, saves the data
 * to a local JSON cache file. On subsequent builds, if Sanity is
 * unreachable, the cache is used instead — preventing the dreaded
 * "0 pages built in 25ms" failure.
 *
 * Cache location: src/data/.sanity-cache.json
 */
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

// Use process.cwd() for reliable path resolution inside Astro's build pipeline
const PROJECT_ROOT = process.cwd();
const CACHE_DIR = join(PROJECT_ROOT, 'src', 'data');
const CACHE_FILE = join(CACHE_DIR, '.sanity-cache.json');

/**
 * Read the cached Sanity data from disk.
 * Returns null if no cache exists or it's corrupted.
 */
export function readCache() {
  try {
    if (!existsSync(CACHE_FILE)) return null;
    const raw = readFileSync(CACHE_FILE, 'utf-8');
    const data = JSON.parse(raw);
    // Sanity check: must have photos array
    if (!data || !Array.isArray(data.photos) || data.photos.length === 0) {
      return null;
    }
    const age = Date.now() - (data.timestamp || 0);
    const ageHours = (age / 1000 / 60 / 60).toFixed(1);
    console.log(`[sanity-cache] Found cache with ${data.photos.length} photos, ${data.categories?.length || 0} categories (${ageHours}h old)`);
    return data;
  } catch (e) {
    console.warn('[sanity-cache] Failed to read cache:', e.message);
    return null;
  }
}

/**
 * Write Sanity data to the cache file.
 * Called after every successful Sanity fetch.
 */
export function writeCache({ photos, categories, featured }) {
  try {
    if (!existsSync(CACHE_DIR)) {
      mkdirSync(CACHE_DIR, { recursive: true });
    }
    const data = {
      timestamp: Date.now(),
      date: new Date().toISOString(),
      photos: photos || [],
      categories: categories || [],
      featured: featured || null
    };
    console.log(`[sanity-cache] Writing to: ${CACHE_FILE}`);
    writeFileSync(CACHE_FILE, JSON.stringify(data, null, 2), 'utf-8');
    console.log(`[sanity-cache] Saved ${data.photos.length} photos, ${data.categories.length} categories to cache`);
  } catch (e) {
    console.warn('[sanity-cache] Failed to write cache:', e.message, 'Path:', CACHE_FILE);
  }
}
