/**
 * Photo Data — 90 photos across 18 categories (5 per category).
 * Expanded from 54 to eliminate gaps during fast scrolling.
 * All Unsplash URLs verified for valid photo IDs.
 * TODO: Replace with Sanity CMS GROQ queries when CMS is configured.
 */

export const PHOTOS = [
  // === AMSTERDAM (5) ===
  { id:'ams1', title:'Canal Reflections', cat:'Amsterdam', slug:'canal-reflections', img:'https://images.unsplash.com/photo-1534351590666-13e3e96b5017?w=800&q=80', desc:'The timeless canals of Amsterdam reflect centuries of history.' },
  { id:'ams2', title:'Night Bridges', cat:'Amsterdam', slug:'night-bridges', img:'https://images.unsplash.com/photo-1512470876302-972faa2aa9a4?w=800&q=80', desc:'Illuminated bridges create ribbons of light across dark waters.' },
  { id:'ams3', title:'Bicycle Culture', cat:'Amsterdam', slug:'bicycle-culture', img:'https://images.unsplash.com/photo-1558441440-d4111d18d48f?w=800&q=80', desc:'Thousands of bicycles line the canals, a symbol of Dutch life.' },
  { id:'ams4', title:'Row Houses', cat:'Amsterdam', slug:'row-houses', img:'https://images.unsplash.com/photo-1576924542622-772281b13aa8?w=800&q=80', desc:'The iconic leaning facades of canal-side row houses.' },
  { id:'ams5', title:'Flower Market', cat:'Amsterdam', slug:'flower-market', img:'https://images.unsplash.com/photo-1583037189850-1921ae7c6c22?w=800&q=80', desc:'Tulips in every color at the floating flower market.' },

  // === ARCHITECTURE AND LANDSCAPES (5) ===
  { id:'arch1', title:'Steel & Glass', cat:'Architecture and Landscapes', slug:'steel-and-glass', img:'https://images.unsplash.com/photo-1487958449943-2429e8be8625?w=800&q=80', desc:'Modern architecture reaching skyward in steel and glass.' },
  { id:'arch2', title:'Ancient Columns', cat:'Architecture and Landscapes', slug:'ancient-columns', img:'https://images.unsplash.com/photo-1555952494-efd681c7e3f9?w=800&q=80', desc:'Classical columns standing testament to ancient engineering.' },
  { id:'arch3', title:'Urban Lines', cat:'Architecture and Landscapes', slug:'urban-lines', img:'https://images.unsplash.com/photo-1486718448742-163732cd1544?w=800&q=80', desc:'The geometry of urban spaces creates unexpected beauty.' },
  { id:'arch4', title:'Bridge Symmetry', cat:'Architecture and Landscapes', slug:'bridge-symmetry', img:'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=800&q=80', desc:'Perfect symmetry in modern bridge engineering.' },
  { id:'arch5', title:'Concrete Curves', cat:'Architecture and Landscapes', slug:'concrete-curves', img:'https://images.unsplash.com/photo-1511818966892-d7d671e672a2?w=800&q=80', desc:'Flowing curves in brutalist concrete design.' },

  // === ASPEN (5) ===
  { id:'asp1', title:'Mountain Dawn', cat:'Aspen', slug:'mountain-dawn', img:'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80', desc:'First light breaks over the Aspen mountains.' },
  { id:'asp2', title:'Golden Aspens', cat:'Aspen', slug:'golden-aspens', img:'https://images.unsplash.com/photo-1508193638397-1c4234db14d8?w=800&q=80', desc:'Fall transforms the aspen groves into rivers of gold.' },
  { id:'asp3', title:'Powder Day', cat:'Aspen', slug:'powder-day', img:'https://images.unsplash.com/photo-1551524559-8af4e6624178?w=800&q=80', desc:'Fresh powder blankets the slopes in pristine white.' },
  { id:'asp4', title:'Alpine Meadow', cat:'Aspen', slug:'alpine-meadow', img:'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=800&q=80', desc:'Wildflowers carpet the high alpine meadows.' },
  { id:'asp5', title:'Maroon Bells', cat:'Aspen', slug:'maroon-bells', img:'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?w=800&q=80', desc:'The iconic twin peaks reflected in still waters.' },

  // === BORA BORA (5) ===
  { id:'bb1', title:'Overwater Bungalow', cat:'Bora Bora', slug:'overwater-bungalow', img:'https://images.unsplash.com/photo-1514282401047-d79a71a590e8?w=800&q=80', desc:'Luxury suspended above crystal-clear lagoon waters.' },
  { id:'bb2', title:'Lagoon Blues', cat:'Bora Bora', slug:'lagoon-blues', img:'https://images.unsplash.com/photo-1589197331516-4d84b72ebde3?w=800&q=80', desc:'Every shade of blue exists in these waters.' },
  { id:'bb3', title:'Mount Otemanu', cat:'Bora Bora', slug:'mount-otemanu', img:'https://images.unsplash.com/photo-1568607689150-17e625c1586e?w=800&q=80', desc:'The volcanic peak rises dramatically from the lagoon.' },
  { id:'bb4', title:'Coral Garden', cat:'Bora Bora', slug:'coral-garden', img:'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800&q=80', desc:'Living coral reefs teeming with tropical fish.' },
  { id:'bb5', title:'Sunset Sail', cat:'Bora Bora', slug:'sunset-sail', img:'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80', desc:'Sailing into a Polynesian sunset.' },

  // === BOTANICAL (5) ===
  { id:'bot1', title:'Orchid Study', cat:'Botanical', slug:'orchid-study', img:'https://images.unsplash.com/photo-1599463740831-a5015ef7b65a?w=800&q=80', desc:'Delicate orchid petals captured in natural light.' },
  { id:'bot2', title:'Fern Patterns', cat:'Botanical', slug:'fern-patterns', img:'https://images.unsplash.com/photo-1459411552884-841db9b3cc2a?w=800&q=80', desc:'The fractal geometry of fern fronds.' },
  { id:'bot3', title:'Morning Bloom', cat:'Botanical', slug:'morning-bloom', img:'https://images.unsplash.com/photo-1455659817273-f96807779a8a?w=800&q=80', desc:'Dew-kissed petals unfurling in morning light.' },
  { id:'bot4', title:'Lotus Pond', cat:'Botanical', slug:'lotus-pond', img:'https://images.unsplash.com/photo-1474557157379-8aa74a6ef541?w=800&q=80', desc:'Sacred lotus floating on tranquil waters.' },
  { id:'bot5', title:'Autumn Leaves', cat:'Botanical', slug:'autumn-leaves', img:'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&q=80', desc:'Nature\'s palette in brilliant fall colors.' },

  // === BOTANICAL AVT (5) ===
  { id:'bavt1', title:'Tropical Canopy', cat:'Botanical AVT', slug:'tropical-canopy', img:'https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?w=800&q=80', desc:'Looking up through layers of tropical foliage.' },
  { id:'bavt2', title:'Succulent Geometry', cat:'Botanical AVT', slug:'succulent-geometry', img:'https://images.unsplash.com/photo-1509423350716-97f9360b4e09?w=800&q=80', desc:'Nature\'s perfect mathematical spirals.' },
  { id:'bavt3', title:'Water Lily', cat:'Botanical AVT', slug:'water-lily', img:'https://images.unsplash.com/photo-1474557157379-8aa74a6ef541?w=800&q=80', desc:'Serenity floating on still waters.' },
  { id:'bavt4', title:'Palm Shadows', cat:'Botanical AVT', slug:'palm-shadows', img:'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80', desc:'Palm fronds casting patterns in the afternoon light.' },
  { id:'bavt5', title:'Moss Detail', cat:'Botanical AVT', slug:'moss-detail', img:'https://images.unsplash.com/photo-1500829243541-74b677fecc30?w=800&q=80', desc:'A miniature forest in emerald green.' },

  // === CARS (5) ===
  { id:'car1', title:'Classic Lines', cat:'Cars', slug:'classic-lines', img:'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800&q=80', desc:'The sculptural beauty of automotive design.' },
  { id:'car2', title:'Engine Detail', cat:'Cars', slug:'engine-detail', img:'https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=800&q=80', desc:'Chrome and steel in mechanical harmony.' },
  { id:'car3', title:'Speed & Light', cat:'Cars', slug:'speed-and-light', img:'https://images.unsplash.com/photo-1542362567-b07e54358753?w=800&q=80', desc:'Motion blur captures the essence of speed.' },
  { id:'car4', title:'Vintage Chrome', cat:'Cars', slug:'vintage-chrome', img:'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=800&q=80', desc:'Gleaming chrome on a perfectly restored classic.' },
  { id:'car5', title:'Racing Heritage', cat:'Cars', slug:'racing-heritage', img:'https://images.unsplash.com/photo-1514867644123-6385d58d3cd4?w=800&q=80', desc:'The raw power and precision of motorsport.' },

  // === CELEBRITY (5) ===
  { id:'cel1', title:'Portrait in Light', cat:'Celebrity', slug:'portrait-in-light', img:'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=800&q=80', desc:'Dramatic studio lighting reveals character.' },
  { id:'cel2', title:'Candid Moment', cat:'Celebrity', slug:'candid-moment', img:'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=800&q=80', desc:'Unguarded moments reveal the most truth.' },
  { id:'cel3', title:'Red Carpet', cat:'Celebrity', slug:'red-carpet', img:'https://images.unsplash.com/photo-1540569014015-19a7be504e3a?w=800&q=80', desc:'Glamour and poise under the spotlight.' },
  { id:'cel4', title:'Studio Session', cat:'Celebrity', slug:'studio-session', img:'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=800&q=80', desc:'The quiet intensity of a studio portrait session.' },
  { id:'cel5', title:'Golden Hour Portrait', cat:'Celebrity', slug:'golden-hour-portrait', img:'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=800&q=80', desc:'Natural light at its most flattering hour.' },

  // === FRANCE (5) ===
  { id:'fr1', title:'Lavender Fields', cat:'France', slug:'lavender-fields', img:'https://images.unsplash.com/photo-1499002238440-d264edd596ec?w=800&q=80', desc:'Purple waves stretching to the horizon in Provence.' },
  { id:'fr2', title:'Parisian Light', cat:'France', slug:'parisian-light', img:'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800&q=80', desc:'The City of Light lives up to its name at dusk.' },
  { id:'fr3', title:'Château Morning', cat:'France', slug:'chateau-morning', img:'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=800&q=80', desc:'Morning mist around a Loire Valley château.' },
  { id:'fr4', title:'Côte d\'Azur', cat:'France', slug:'cote-dazur', img:'https://images.unsplash.com/photo-1533104816931-20fa691ff6ca?w=800&q=80', desc:'Azure waters meet the French Riviera.' },
  { id:'fr5', title:'Vineyard Rows', cat:'France', slug:'vineyard-rows', img:'https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?w=800&q=80', desc:'Endless rows of grapevines in Burgundy.' },

  // === GREECE (5) ===
  { id:'gr1', title:'Santorini Blues', cat:'Greece', slug:'santorini-blues', img:'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=800&q=80', desc:'White and blue against the Aegean Sea.' },
  { id:'gr2', title:'Ancient Ruins', cat:'Greece', slug:'ancient-ruins', img:'https://images.unsplash.com/photo-1555993539-1732b0258235?w=800&q=80', desc:'Columns that have witnessed millennia.' },
  { id:'gr3', title:'Island Sunset', cat:'Greece', slug:'island-sunset', img:'https://images.unsplash.com/photo-1533105079780-92b9be482077?w=800&q=80', desc:'The Mediterranean sun descends in fire.' },
  { id:'gr4', title:'Mykonos Windmills', cat:'Greece', slug:'mykonos-windmills', img:'https://images.unsplash.com/photo-1504512485720-7d83a16ee930?w=800&q=80', desc:'Iconic windmills overlooking the Aegean.' },
  { id:'gr5', title:'Olive Groves', cat:'Greece', slug:'olive-groves', img:'https://images.unsplash.com/photo-1523531294919-4bcd7c65e216?w=800&q=80', desc:'Ancient olive trees on sun-drenched hillsides.' },

  // === GUITARS (5) ===
  { id:'gui1', title:'Strings & Wood', cat:'Guitars', slug:'strings-and-wood', img:'https://images.unsplash.com/photo-1510915361894-db8b60106cb1?w=800&q=80', desc:'The beauty of a handcrafted instrument.' },
  { id:'gui2', title:'Stage Ready', cat:'Guitars', slug:'stage-ready', img:'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&q=80', desc:'Waiting in the wings before the show.' },
  { id:'gui3', title:'Acoustic Soul', cat:'Guitars', slug:'acoustic-soul', img:'https://images.unsplash.com/photo-1558098329-a11cff621064?w=800&q=80', desc:'Warm tones of an acoustic guitar.' },
  { id:'gui4', title:'Fretboard Detail', cat:'Guitars', slug:'fretboard-detail', img:'https://images.unsplash.com/photo-1525201548942-d8732f6617a0?w=800&q=80', desc:'Worn frets tell stories of countless songs played.' },
  { id:'gui5', title:'Electric Blue', cat:'Guitars', slug:'electric-blue', img:'https://images.unsplash.com/photo-1564186763535-ebb21ef5277f?w=800&q=80', desc:'A Fender body gleaming under stage lights.' },

  // === IT MIGHT GET LOUD (5) ===
  { id:'loud1', title:'Amplified', cat:'It Might Get Loud', slug:'amplified', img:'https://images.unsplash.com/photo-1508854710579-5cecc3a9ff17?w=800&q=80', desc:'When music becomes pure energy.' },
  { id:'loud2', title:'Crowd Energy', cat:'It Might Get Loud', slug:'crowd-energy', img:'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=800&q=80', desc:'The electric connection between artist and audience.' },
  { id:'loud3', title:'Backstage', cat:'It Might Get Loud', slug:'backstage', img:'https://images.unsplash.com/photo-1524368535928-5b5e00ddc76b?w=800&q=80', desc:'The quiet intensity before performance.' },
  { id:'loud4', title:'Drum Kit', cat:'It Might Get Loud', slug:'drum-kit', img:'https://images.unsplash.com/photo-1519892300165-cb5542fb47c7?w=800&q=80', desc:'The heartbeat of every band.' },
  { id:'loud5', title:'Vinyl Collection', cat:'It Might Get Loud', slug:'vinyl-collection', img:'https://images.unsplash.com/photo-1483412033650-1015ddeb83d1?w=800&q=80', desc:'Music history pressed into grooves of vinyl.' },

  // === JAPAN (5) ===
  { id:'jp1', title:'Temple Gate', cat:'Japan', slug:'temple-gate', img:'https://images.unsplash.com/photo-1545569341-9eb8b30979d9?w=800&q=80', desc:'A torii gate frames the sacred path.' },
  { id:'jp2', title:'Cherry Blossoms', cat:'Japan', slug:'cherry-blossoms', img:'https://images.unsplash.com/photo-1522383225653-ed111181a951?w=800&q=80', desc:'Sakura season transforms the landscape.' },
  { id:'jp3', title:'Neon Tokyo', cat:'Japan', slug:'neon-tokyo', img:'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=800&q=80', desc:'The electric pulse of Shibuya at night.' },
  { id:'jp4', title:'Zen Garden', cat:'Japan', slug:'zen-garden', img:'https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=800&q=80', desc:'Raked sand and stones in perfect harmony.' },
  { id:'jp5', title:'Mount Fuji', cat:'Japan', slug:'mount-fuji', img:'https://images.unsplash.com/photo-1490806843957-31f4c9a91c65?w=800&q=80', desc:'Japan\'s sacred mountain at dawn.' },

  // === MISC (5) ===
  { id:'misc1', title:'Abstract Light', cat:'Misc', slug:'abstract-light', img:'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?w=800&q=80', desc:'Light itself becomes the subject.' },
  { id:'misc2', title:'Texture Study', cat:'Misc', slug:'texture-study', img:'https://images.unsplash.com/photo-1558591710-4b4a1ae0f04d?w=800&q=80', desc:'Finding beauty in surface details.' },
  { id:'misc3', title:'Shadow Play', cat:'Misc', slug:'shadow-play', img:'https://images.unsplash.com/photo-1553949345-eb786bb3f7ba?w=800&q=80', desc:'Shadows create their own compositions.' },
  { id:'misc4', title:'Reflections', cat:'Misc', slug:'reflections', img:'https://images.unsplash.com/photo-1501436513145-30f24e19fcc8?w=800&q=80', desc:'The world mirrored in unexpected surfaces.' },
  { id:'misc5', title:'Color Theory', cat:'Misc', slug:'color-theory', img:'https://images.unsplash.com/photo-1557672172-298e090bd0f1?w=800&q=80', desc:'Bold colors in natural harmony.' },

  // === PORTUGAL (5) ===
  { id:'pt1', title:'Lisbon Tiles', cat:'Portugal', slug:'lisbon-tiles', img:'https://images.unsplash.com/photo-1555881400-74d7acaacd8b?w=800&q=80', desc:'Azulejo tiles tell stories on every wall.' },
  { id:'pt2', title:'Porto Sunset', cat:'Portugal', slug:'porto-sunset', img:'https://images.unsplash.com/photo-1558370781-d6196949e317?w=800&q=80', desc:'Golden light on the Douro River.' },
  { id:'pt3', title:'Atlantic Coast', cat:'Portugal', slug:'atlantic-coast', img:'https://images.unsplash.com/photo-1536663815808-535e2280d2c2?w=800&q=80', desc:'Where Europe meets the Atlantic.' },
  { id:'pt4', title:'Tram 28', cat:'Portugal', slug:'tram-28', img:'https://images.unsplash.com/photo-1545231027-637d2f6210f8?w=800&q=80', desc:'The iconic yellow tram climbing Lisbon hills.' },
  { id:'pt5', title:'Algarve Cliffs', cat:'Portugal', slug:'algarve-cliffs', img:'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80', desc:'Dramatic sandstone cliffs meeting turquoise waters.' },

  // === ST. BARTS (5) ===
  { id:'sb1', title:'Caribbean Blue', cat:'St. Barts', slug:'caribbean-blue', img:'https://images.unsplash.com/photo-1548574505-5e239809ee19?w=800&q=80', desc:'Crystal waters of the Caribbean.' },
  { id:'sb2', title:'Beach Cove', cat:'St. Barts', slug:'beach-cove', img:'https://images.unsplash.com/photo-1520454974749-611b7248ffdb?w=800&q=80', desc:'A hidden cove of pure tranquility.' },
  { id:'sb3', title:'Yacht Harbor', cat:'St. Barts', slug:'yacht-harbor', img:'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800&q=80', desc:'Luxury vessels in a tropical harbor.' },
  { id:'sb4', title:'Shell Beach', cat:'St. Barts', slug:'shell-beach', img:'https://images.unsplash.com/photo-1519046904884-53103b34b206?w=800&q=80', desc:'Countless shells washed ashore by gentle waves.' },
  { id:'sb5', title:'Island Vista', cat:'St. Barts', slug:'island-vista', img:'https://images.unsplash.com/photo-1506953823976-52e1fdc0149a?w=800&q=80', desc:'Panoramic views from the island hills.' },

  // === STEELERS (5) ===
  { id:'stl1', title:'Game Day', cat:'Steelers', slug:'game-day', img:'https://images.unsplash.com/photo-1566577739112-5180d4bf9390?w=800&q=80', desc:'The energy of game day at the stadium.' },
  { id:'stl2', title:'Stadium Lights', cat:'Steelers', slug:'stadium-lights', img:'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800&q=80', desc:'Under the Friday night lights.' },
  { id:'stl3', title:'Fan Culture', cat:'Steelers', slug:'fan-culture', img:'https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?w=800&q=80', desc:'The passion of devoted fans.' },
  { id:'stl4', title:'Tailgate', cat:'Steelers', slug:'tailgate', img:'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=800&q=80', desc:'Pre-game traditions in the parking lot.' },
  { id:'stl5', title:'Victory Celebration', cat:'Steelers', slug:'victory-celebration', img:'https://images.unsplash.com/photo-1530549387789-4c1017266635?w=800&q=80', desc:'The roar of the crowd after a touchdown.' },

  // === WILDLIFE (5) ===
  { id:'wl1', title:'Eagle in Flight', cat:'Wildlife', slug:'eagle-in-flight', img:'https://images.unsplash.com/photo-1611689102192-1f6e0e52df0a?w=800&q=80', desc:'Majestic wings spread against an open sky.' },
  { id:'wl2', title:'Forest Deer', cat:'Wildlife', slug:'forest-deer', img:'https://images.unsplash.com/photo-1484406566174-9da000fda645?w=800&q=80', desc:'A quiet encounter in the morning woods.' },
  { id:'wl3', title:'Ocean Life', cat:'Wildlife', slug:'ocean-life', img:'https://images.unsplash.com/photo-1518467166778-b88f373ffec7?w=800&q=80', desc:'Beneath the surface, a world of color.' },
  { id:'wl4', title:'Fox at Dusk', cat:'Wildlife', slug:'fox-at-dusk', img:'https://images.unsplash.com/photo-1516934024742-b461fba47600?w=800&q=80', desc:'A red fox pauses in the evening light.' },
  { id:'wl5', title:'Butterfly Wings', cat:'Wildlife', slug:'butterfly-wings', img:'https://images.unsplash.com/photo-1452570053594-1b985d6ea890?w=800&q=80', desc:'Delicate patterns painted by evolution.' },
];

/** Generate a URL-safe slug from a category name */
export function catSlug(cat) {
  return cat.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

/** Get all unique categories with their slugs */
export function getCategories() {
  const seen = new Set();
  return PHOTOS.reduce((acc, p) => {
    if (!seen.has(p.cat)) {
      seen.add(p.cat);
      acc.push({ name: p.cat, slug: catSlug(p.cat) });
    }
    return acc;
  }, []);
}

/** Get photos for a specific category slug */
export function getPhotosByCategory(slug) {
  return PHOTOS.filter(p => catSlug(p.cat) === slug);
}

/** Get a single photo by its slug */
export function getPhotoBySlug(slug) {
  return PHOTOS.find(p => p.slug === slug);
}

/** Get related photos (same category, excluding current) */
export function getRelatedPhotos(photo, limit = 6) {
  return PHOTOS.filter(p => p.cat === photo.cat && p.id !== photo.id).slice(0, limit);
}
