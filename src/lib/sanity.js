/**
 * Sanity CMS Client — Alba Tull Portfolio V6A
 *
 * Read access to Sanity dataset for photos, categories, and site settings.
 * Supports parent/child category hierarchy with continent-based Places,
 * multi-category photo assignments, and sequential displayOrder.
 *
 * Display ordering (managed by seed-cache.mjs on each build):
 *   - Pinned photos (1–12) keep manually set positions
 *   - Remaining photos numbered sequentially (13+) alphabetically
 *
 * Data priority: 1) Live Sanity API → 2) Build cache → 3) Local photos.js
 */
import { createClient } from '@sanity/client';
import imageUrlBuilder from '@sanity/image-url';
import { readCache, writeCache } from './sanity-cache.js';

// ── Client ──────────────────────────────────────────────────────────
export const client = createClient({
  projectId:  import.meta.env.SANITY_PROJECT_ID  || 'vo1f0ucj',
  dataset:    import.meta.env.SANITY_DATASET    || 'production',
  apiVersion: import.meta.env.SANITY_API_VERSION || '2024-01-01',
  token:      import.meta.env.SANITY_READ_TOKEN  || '',
  useCdn:     true,
  requestTagPrefix: 'astro',
  timeout:    5000,
});

// ── Image URL Builder ───────────────────────────────────────────────
const builder = imageUrlBuilder(client);

/**
 * Generate an optimised image URL from a Sanity image reference.
 * Usage: urlFor(photo.image).width(800).url()
 */
export function urlFor(source) {
  return builder.image(source);
}

// ── GROQ Queries ────────────────────────────────────────────────────

/** Fetch all photos, ordered by displayOrder then category then title. */
export async function getAllPhotos() {
  return client.fetch(`
    *[_type == "photo"] | order(coalesce(displayOrder, 9999) asc, category->name asc, title asc) {
      _id,
      title,
      "slug": slug.current,
      description,
      category->{ _id, name, "slug": slug.current },
      "additionalCategories": additionalCategories[]->{ _id, name, "slug": slug.current },
      image,
      audio,
      video,
      featured,
      displayOrder,
      metadata
    }
  `);
}

/** Fetch a single photo by slug, with related photos from same category. */
export async function getPhotoBySlug(slug) {
  return client.fetch(`
    *[_type == "photo" && slug.current == $slug][0] {
      _id,
      title,
      "slug": slug.current,
      description,
      category->{ _id, name, "slug": slug.current },
      "additionalCategories": additionalCategories[]->{ _id, name, "slug": slug.current },
      image,
      audio,
      video,
      featured,
      metadata,
      "related": *[_type == "photo" && category._ref == ^.category._ref && _id != ^._id]
        | order(coalesce(displayOrder, 9999) asc) {
        _id, title, "slug": slug.current, image,
        category->{ name, "slug": slug.current }
      }
    }
  `, { slug });
}

/**
 * Fetch all categories with hierarchy, photo counts, and preview images.
 * Includes parent reference, children, and combined photo counts.
 */
export async function getAllCategories() {
  return client.fetch(`
    *[_type == "category"] | order(order asc, name asc) {
      _id,
      name,
      "slug": slug.current,
      description,
      coverImage,
      archetype,
      archetypeDescription,
      order,
      "isParent": coalesce(isParent, false),
      "parentCategory": parentCategory->{ _id, name, "slug": slug.current },
      "children": *[_type == "category" && parentCategory._ref == ^._id]
        | order(order asc, name asc) {
        _id, name, "slug": slug.current, order,
        "photoCount": count(*[_type == "photo" && (category._ref == ^._id || ^._id in additionalCategories[]._ref)])
      },
      "photoCount": count(*[_type == "photo" && (category._ref == ^._id || ^._id in additionalCategories[]._ref)]),
      "previewPhotos": *[_type == "photo" && (category._ref == ^._id || ^._id in additionalCategories[]._ref)]
        | order(coalesce(displayOrder, 9999) asc, title asc) [0...12] {
        _id, title, "slug": slug.current, image, displayOrder
      }
    }
  `);
}

/** Fetch photos for a specific category (by slug). Matches primary + additional. */
export async function getPhotosByCategory(categorySlug) {
  return client.fetch(`
    *[_type == "photo" && (
      category->slug.current == $categorySlug ||
      $categorySlug in additionalCategories[]->slug.current
    )] | order(coalesce(displayOrder, 9999) asc, title asc) {
      _id,
      title,
      "slug": slug.current,
      description,
      image,
      audio,
      video,
      featured,
      displayOrder,
      category->{ name, "slug": slug.current },
      "additionalCategories": additionalCategories[]->{ name, "slug": slug.current }
    }
  `, { categorySlug });
}

/** Fetch photos matching ANY of several category slugs. Used for merged categories. */
export async function getPhotosByMultipleCategories(categorySlugs) {
  return client.fetch(`
    *[_type == "photo" && (
      category->slug.current in $categorySlugs ||
      count((additionalCategories[]->slug.current)[@ in $categorySlugs]) > 0
    )] | order(coalesce(displayOrder, 9999) asc, title asc) {
      _id,
      title,
      "slug": slug.current,
      description,
      image,
      audio,
      video,
      featured,
      displayOrder,
      category->{ name, "slug": slug.current },
      "additionalCategories": additionalCategories[]->{ name, "slug": slug.current }
    }
  `, { categorySlugs });
}

/** Fetch photos for a parent category (aggregates all children). */
export async function getPhotosByParentCategory(parentSlug) {
  return client.fetch(`
    *[_type == "photo" && (
      category->parentCategory->slug.current == $parentSlug ||
      category->slug.current == $parentSlug ||
      $parentSlug in additionalCategories[]->parentCategory->slug.current
    )] | order(coalesce(displayOrder, 9999) asc, title asc) {
      _id,
      title,
      "slug": slug.current,
      description,
      image,
      audio,
      video,
      featured,
      displayOrder,
      category->{ name, "slug": slug.current },
      "additionalCategories": additionalCategories[]->{ name, "slug": slug.current }
    }
  `, { parentSlug });
}

/** Fetch all published live videos, ordered by displayOrder. */
export async function getLiveVideos() {
  return client.fetch(`
    *[_type == "liveVideo" && published == true] | order(coalesce(displayOrder, 100) asc, title asc) {
      _id,
      title,
      subtitle,
      videoFile,
      videoUrl,
      poster,
      posterUrl,
      flipOffset,
      displayOrder
    }
  `);
}

/** Fetch the featured "Picture of the Moment" photo. */
export async function getFeaturedPhoto() {
  return client.fetch(`
    *[_type == "photo" && featured == true][0] {
      _id,
      title,
      "slug": slug.current,
      description,
      image,
      category->{ name, "slug": slug.current }
    }
  `);
}

// ── Cached Fetch — Singleton Pattern ────────────────────────────────
let _fetchPromise = null;

export function fetchAllWithCache() {
  if (!_fetchPromise) {
    _fetchPromise = _doFetchAllWithCache();
  }
  return _fetchPromise;
}

async function _doFetchAllWithCache() {
  // 1) Try live Sanity with 8-second hard timeout
  try {
    const sanityFetch = Promise.all([
      getAllPhotos(),
      getAllCategories(),
      getFeaturedPhoto()
    ]);
    const hardTimeout = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Sanity unreachable after 8s')), 8000)
    );
    const [photos, categories, featured] = await Promise.race([sanityFetch, hardTimeout]);

    if (photos && photos.length > 0) {
      writeCache({ photos, categories, featured });
      console.log(`[sanity] Live: ${photos.length} photos, ${categories.length} categories`);
      return { photos, categories, featured, source: 'sanity' };
    }
  } catch (e) {
    console.warn(`[sanity] Live fetch failed: ${e.message}`);
  }

  // 2) Try build cache
  const cached = readCache();
  if (cached) {
    console.log(`[sanity] Cache: ${cached.photos.length} photos`);
    return {
      photos:     cached.photos,
      categories: cached.categories,
      featured:   cached.featured,
      source:     'cache'
    };
  }

  // 3) No cache available — fall back to local data
  console.warn('[sanity] No cache, falling back to local data');
  return { photos: null, categories: null, featured: null, source: 'local' };
}
