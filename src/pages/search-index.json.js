/**
 * Search Index — Alba Tull V6A
 *
 * Generated at build time as /search-index.json.
 * Contains photo title, slug, category, description, and thumbnail
 * for client-side instant search.
 */
import { fetchAllWithCache, urlFor } from '../lib/sanity.js';

export async function GET() {
  const { photos, categories } = await fetchAllWithCache();

  // Build category name lookup
  const catNames = {};
  for (const c of categories || []) {
    catNames[c.slug] = c.name;
  }

  const index = (photos || []).map(p => ({
    t: p.title || '',                                    // title
    s: p.slug,                                           // slug
    c: p.category?.name || '',                           // category name
    d: (p.description || '').slice(0, 80),               // description snippet
    i: p.image
      ? urlFor(p.image).width(80).height(80).fit('crop').quality(40).auto('format').url()
      : '',                                              // tiny thumbnail
  }));

  return new Response(JSON.stringify(index), {
    headers: { 'Content-Type': 'application/json' },
  });
}
