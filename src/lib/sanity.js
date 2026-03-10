/**
 * Sanity CMS Client — Alba Tull Portfolio V5
 *
 * Provides read access to the Sanity dataset for photos, categories,
 * and site settings. Supports parent/child category hierarchy and
 * multi-category photo assignments.
 *
 * Falls back to build cache → local data when Sanity is unavailable.
 *
 * Data priority:  1) Live Sanity API  →  2) Build cache  →  3) Local photos.js
 */
import { createClient } from '@sanity/client';
import imageUrlBuilder from '@sanity/image-url';
import { readCache, writeCache } from './sanity-cache.js';

// ── Client ─────────────────────────────────────────────────────────
export const client = createClient({
  projectId: import.meta.env.SANITY_PROJECT_ID || 'vo1f0ucj',
  dataset:   import.meta.env.SANITY_DATASET   || 'production',
  apiVersion: import.meta.env.SANITY_API_VERSION || '2024-01-01',
  token:     import.meta.env.SANITY_READ_TOKEN || '',
  useCdn:    true,
  requestTagPrefix: 'astro',
  timeout:   5000,
});

// ── Image URL Builder ──────────────────────────────────────────────
const builder = imageUrlBuilder(client);

/**
 * Generate an optimised image URL from a Sanity image reference.
 * Usage:  urlFor(photo.image).width(800).url()
 */
export function urlFor(source) {
  return builder.image(source);
}

// ── GROQ Queries ───────────────────────────────────────────────────

/**
 * Fetch all photos, ordered by category then title.
 * Includes primary category + additionalCategories for multi-category support.
 */
export async function getAllPhotos() {
  return client.fetch(`
    *[_type == "photo"] | order(category->name asc, title asc) {
      _id,
      title,
      "slug": slug.current,
      description,
      category->{_id, name, "slug": slug.current},
      "additionalCategories": additionalCategories[]->{_id, name, "slug": slug.current},
      image,
      audio,
      video,
      featured,
      metadata
    }
  `);
}

/**
 * Fetch a single photo by its slug, with related photos from same category.
 */
export async function getPhotoBySlug(slug) {
  return client.fetch(`
    *[_type == "photo" && slug.current == $slug][0] {
      _id,
      title,
      "slug": slug.current,
      description,
      category->{_id, name, "slug": slug.current},
      "additionalCategories": additionalCategories[]->{_id, name, "slug": slug.current},
      image,
      audio,
      video,
      featured,
      metadata,
      "related": *[_type == "photo" && category._ref == ^.category._ref && _id != ^._id] {
        _id, title, "slug": slug.current, image, category->{name, "slug": slug.current}
      }
    }
  `, { slug });
}

/**
 * Fetch all categories with hierarchy info, photo counts, and previews.
 * Includes parent reference, children sub-query, and combined photo counts.
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
      "parentCategory": parentCategory->{_id, name, "slug": slug.current},
      "children": *[_type == "category" && parentCategory._ref == ^._id] | order(order asc, name asc) {
        _id, name, "slug": slug.current, order,
        "photoCount": count(*[_type == "photo" && (category._ref == ^._id || ^._id in additionalCategories[]._ref)])
      },
      "photoCount": count(*[_type == "photo" && (category._ref == ^._id || ^._id in additionalCategories[]._ref)]),
      "previewPhotos": *[_type == "photo" && (category._ref == ^._id || ^._id in additionalCategories[]._ref)] | order(title asc) [0...12] {
        _id, title, "slug": slug.current, image
      }
    }
  `);
}

/**
 * Fetch photos for a specific category (by slug).
 * Matches both primary category and additionalCategories.
 */
export async function getPhotosByCategory(categorySlug) {
  return client.fetch(`
    *[_type == "photo" && (
      category->slug.current == $categorySlug ||
      $categorySlug in additionalCategories[]->slug.current
    )] | order(title asc) {
      _id,
      title,
      "slug": slug.current,
      description,
      image,
      audio,
      video,
      featured,
      category->{name, "slug": slug.current},
      "additionalCategories": additionalCategories[]->{name, "slug": slug.current}
    }
  `, { categorySlug });
}

/**
 * Fetch photos for a parent category (all children combined).
 * Gets photos from all child categories of the given parent.
 */
export async function getPhotosByParentCategory(parentSlug) {
  return client.fetch(`
    *[_type == "photo" && (
      category->parentCategory->slug.current == $parentSlug ||
      category->slug.current == $parentSlug ||
      $parentSlug in additionalCategories[]->parentCategory->slug.current
    )] | order(title asc) {
      _id,
      title,
      "slug": slug.current,
      description,
      image,
      audio,
      video,
      featured,
      category->{name, "slug": slug.current},
      "additionalCategories": additionalCategories[]->{name, "slug": slug.current}
    }
  `, { parentSlug });
}

/**
 * Fetch the featured "Picture of the Moment" photo.
 */
export async function getFeaturedPhoto() {
  return client.fetch(`
    *[_type == "photo" && featured == true][0] {
      _id,
      title,
      "slug": slug.current,
      description,
      image,
      category->{name, "slug": slug.current}
    }
  `);
}

// ── Cached Fetch Wrappers ───────────────────────────────────────
// Try Sanity first, update cache on success, fall back to cache on failure.

let _fetchPromise = null;
export function fetchAllWithCache() {
  if (!_fetchPromise) {
    _fetchPromise = _doFetchAllWithCache();
  }
  return _fetchPromise;
}

async function _doFetchAllWithCache() {
  // 1) Try live Sanity with a hard 8-second race timeout
  try {
    const sanityFetch = Promise.all([
      getAllPhotos(),
      getAllCategories(),
      getFeaturedPhoto()
    ]);
    const hardTimeout = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Hard timeout: Sanity unreachable after 8s')), 8000)
    );
    const [photos, categories, featured] = await Promise.race([sanityFetch, hardTimeout]);

    if (photos && photos.length > 0) {
      writeCache({ photos, categories, featured });
      console.log(`[sanity] Live fetch: ${photos.length} photos, ${categories.length} categories`);
      return { photos, categories, featured, source: 'sanity' };
    }
  } catch (e) {
    console.warn(`[sanity] Live fetch failed: ${e.message}`);
  }

  // 2) Try build cache
  const cached = readCache();
  if (cached) {
    console.log(`[sanity] Using build cache: ${cached.photos.length} photos`);
    return {
      photos: cached.photos,
      categories: cached.categories,
      featured: cached.featured,
      source: 'cache'
    };
  }

  // 3) No cache available
  console.warn('[sanity] No cache available, falling back to local data');
  return { photos: null, categories: null, featured: null, source: 'local' };
}
