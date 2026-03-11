# Alba Tull V6A — Development Reference Guide

> The "holy grail" document for anyone working on this codebase.
> Last updated: March 11, 2026

## Current Status & What Needs Pushing

**READY TO COMMIT & PUSH (applied locally, not yet deployed):**
- `public/styles/global.css` — Portrait photo sizing v2: added `max-height` + `overflow: hidden` to `.detail-hero` container AND preserved `max-height` + `object-fit: contain` in the 1024px media query override
- `V6A-DEVELOPMENT-GUIDE.md` — This file, fully updated

**TO PUSH FROM YOUR TERMINAL:**
```bash
cd ~/Projects/AlbaTull-V6 && git add public/styles/global.css V6A-DEVELOPMENT-GUIDE.md && git commit -m "Fix portrait photo overflow — constrain hero container and preserve max-height in tablet breakpoint" && git push origin main
```

**CONFIRMED WORKING (already deployed):**
- Two search bars fixed — `.nav-search-mobile { display: none; }` hides mobile search on desktop (commit `a9fcb6a`)
- Gallery dropdown working on Chrome, Safari, Firefox
- Mosaic 3D flip working on Chrome, Safari, Firefox (including color reveal)
- Photo nav arrows — no flash/scroll after repeated clicks
- Mosaic tiles use `<div>` with `data-href` — no URL preview on hover
- Mobile nav — hamburger menu with search inside, Gallery dropdown works on touch
- Experimentations page — shows photos merged from MISC on all code paths

**KNOWN ISSUES TO WATCH AFTER DEPLOY:**
- Photo sizing v2 fix needs visual verification — confirm portrait photos (Architecture 27, Architecture 5/Eiffel Tower, England 55, Ireland 22) fit within the viewport without scrolling
- If the `max-height` makes some images too small on certain screen sizes, consider adjusting the 56px offset or using a percentage-based approach instead

---

---

## Stack

- **Astro v5.18.0** — Static site generator, `output: 'static'`
- **Sanity CMS** — Project ID: `vo1f0ucj`, Dataset: `production`, API Version: `2024-01-01`
- **Netlify** — Hosting, auto-deploy from `main` branch (~4 min builds)
- **Site URL**: `https://albatull.com` (Netlify deploy preview: `shimmering-longma-8b23fd.netlify.app`)

## Data Flow

Three-tier fallback: Live Sanity (8s timeout) -> Build Cache (.sanity-cache.json) -> Local photos.js

The `source` variable returned by `fetchAllWithCache()` tells you which tier loaded:
- `'sanity'` — Live API succeeded (Netlify builds usually get this)
- `'cache'` — API timed out, used local cache file
- `'local'` — No cache available, fallback to photos.js

**Critical**: Code paths that depend on `source` must handle ALL THREE cases. The Experimentations/MISC merge bug happened because the Sanity path called `getPhotosByCategory('experimentations')` which returned 0 photos — the merge logic only existed in the cache path.

## Gallery Ordering

- `public/gallery-order.html` — Sets `displayOrder` 1-12 for pinned photos via Sanity mutations
- `seed-cache.mjs` — Assigns 13+ alphabetically to remaining photos
- `src/pages/collections.astro` — `GALLERY_ORDER` array controls display order on collections page:
  portraiture, wildlife, landscape, places, architecture, botanical, steelers-portraits, cars, music, experimentations, sports

## Category Merges

**Experimentations absorbs Miscellaneous:**
- In Sanity, photos are categorized under "misc" (slug: `misc`)
- "Experimentations" (slug: `experimentations`) has 0 direct photos
- Code merges them in THREE places:
  1. `collections.astro` — Merges MISC photo count + previews into Experimentations tile
  2. `category/[slug].astro` (cache path) — `EXPERIMENTATIONS_EXTRAS = ['misc']` adds to `includeSlugs`
  3. `category/[slug].astro` (Sanity path) — Uses `getPhotosByMultipleCategories(['experimentations', 'misc'])`
  4. `sanity.js` — `getPhotosByMultipleCategories()` function accepts array of slugs

Parent categories (People, Animals) are excluded from collections page — their children appear individually.

---

## Lessons Learned: What Worked and What Didn't

### Mosaic 3D Flip Card

**WHAT WORKS:**
- CSS 3D flip using `perspective` on parent, `transform-style: preserve-3d` on inner container, `backface-visibility: hidden` on both faces, `transform: rotateY(180deg)` on hover
- Front face: desaturated + blue overlay. Back face: full color. Hover flips to reveal color.

**CRITICAL CROSS-BROWSER FIXES:**

1. **Firefox requires explicit transform on front face** (Mozilla Bug #1201471):
   Firefox ignores `backface-visibility: hidden` on elements that don't have a transform set. The front face must have `transform: rotateX(0deg)` even though it's a no-op. Without this, Firefox shows both faces simultaneously and the flip doesn't work.

2. **`-webkit-` prefixes are required** for Safari:
   - `-webkit-perspective`
   - `-webkit-transform-style: preserve-3d`
   - `-webkit-transform: rotateY(180deg)`
   - `-webkit-backface-visibility: hidden`
   - `-webkit-transition: -webkit-transform ...`

3. **`overflow: hidden` on `.mosaic-face` is needed** for proper rendering. Removing it breaks the visual in some browsers.

4. **Filter transition fallback**: The front face image has `transition: filter 0.5s ease` and the `::after` overlay has `transition: opacity 0.5s ease`. On hover, both transition to full color. This provides a universal fallback — even if the 3D flip fails in some browser, the color still reveals via filter/overlay transition.

**WHAT DIDN'T WORK:**
- Relying solely on `opacity/visibility` for show/hide (unreliable with flex layouts)
- Removing `overflow: hidden` from `.mosaic-face` (broke rendering in some browsers)
- Using 3D flip without `-webkit-` prefixes (broke Safari)
- Using 3D flip without `transform: rotateX(0deg)` on front face (broke Firefox)

### Image Protection Shields

**CRITICAL**: `.img-shield` overlays must NOT be applied to `.mosaic-cell` elements. The shield div sits outside the `.mosaic-flip-inner` 3D context and blocks the hover-triggered flip from rendering correctly. The mosaic cells are protected by all other layers (right-click blocking, drag prevention, etc.) — they don't need individual shields.

The `addShields()` selector must be: `.gallery-tile, .grid-tile, .collection-thumb, .detail-hero`
**NOT**: `.gallery-tile, .grid-tile, .mosaic-cell, .collection-thumb, .detail-hero`

### Photo Navigation (Prev/Next Arrows)

**WHAT WORKS:**
- Custom in-place content swap: intercept arrow clicks, fetch next page via `fetch()`, extract `<main>` content, swap `innerHTML`, update URL via `history.pushState()`
- Script lives in `BaseLayout.astro` AFTER `</main>` tag — never inside `<main>`

**WHAT DIDN'T WORK:**
- **Astro ClientRouter (View Transitions)** — Made the flash WORSE. It intercepted all `<a>` clicks before custom handlers could process them, and its DOM teardown/rebuild caused the gallery flash. Was added then completely removed.
- **Script inside `<main>`** — When the swap replaced `currentMain.innerHTML`, the `<script is:inline>` tag was re-injected and re-executed, creating duplicate event listeners. After ~5 swaps, multiple handlers would fire and one wouldn't `preventDefault` fast enough, causing browser navigation (gallery flash). Fix: move script outside `<main>`.
- **`<script>` without `is:inline`** — Astro silently strips non-inline scripts inside conditional JSX during bundling. The script tag must have `is:inline` directive.
- **Astro's `.json.js` page endpoint for search index** — Failed on user's Mac with "Cannot find module" error. Replaced with a prebuild Node script (`scripts/generate-search-index.mjs`).

### Nav Bar & Gallery Dropdown

**WHAT WORKS:**
- Gallery dropdown: `<div class="nav-dropdown">` containing trigger link and `.nav-dropdown-menu`
- `display: none` on menu by default, `display: block` on `:hover` and `.is-open`
- JS click handler toggles `.is-open` class on all devices (click, not just hover)
- Invisible `::before` bridge (15px tall) between trigger and menu prevents hover gap
- Desktop: hover OR click to open. Mobile: click only (hamburger menu).

**WHAT DIDN'T WORK:**
- **`opacity: 0; visibility: hidden` for hiding dropdown** — Unreliable within flex layouts. The dropdown content rendered even when "hidden" because flex item sizing still applied. Use `display: none` instead.
- **`.nav-links a` selector** — This matches ALL `<a>` tags inside nav-links, including dropdown menu items. Caused dropdown links to render as inline nav-bar text across the page. Must use `.nav-links > a` (direct children only).
- **Mobile search bar with `order: -1; width: 100%`** — Pushed the hamburger button off-screen and created a huge search bar spanning the full width. Fix: hide `.nav-search` on mobile, add separate `.nav-search-mobile` inside the hamburger menu panel.

### Mosaic Tiles: `<a>` vs `<div>`

**WHAT WORKS:**
- `<div>` elements with `data-href` attribute + JS click handler for navigation
- No URL preview in browser status bar on hover

**WHAT DIDN'T WORK:**
- `<a>` elements show the destination URL in the browser's bottom-left corner on hover. This is native browser behavior and cannot be suppressed with CSS.

---

### Photo Detail Sizing (Portrait vs Landscape)

**WHAT WORKS:**
- Three orientation modes detected from Sanity asset ref dimensions: `landscape` (ratio > 1.2), `portrait` (ratio < 0.85), `square` (0.85–1.2)
- Landscape images: stacked layout, `max-height: 75vh; object-fit: contain;` — always fits screen
- Portrait/square images: BOTH the `.detail-hero` container AND `.detail-hero img` need `max-height: calc(100vh - 56px)`. The container also needs `overflow: hidden`. The image needs `object-fit: contain`.
- The `object-fit: contain` ensures no cropping — the full image is always visible
- Orientation detection: `getOrientation()` in `photo/[slug].astro` parses the Sanity asset `_ref` string (format: `image-{id}-{WxH}-{ext}`)
- The `@media (max-width: 1024px)` breakpoint ALSO needs `max-height` and `object-fit: contain` on `.detail-hero img` — without it, the tablet/responsive override resets `height: auto` and loses the constraint

**WHAT DIDN'T WORK:**
- Portrait `.detail-hero img` with only `width: 100%; height: auto;` and no max-height — tall portrait images extended far beyond the viewport, forcing users to scroll to see the full photo
- Adding `max-height` only to `.detail-hero img` without constraining the `.detail-hero` container — the flex child (`flex: 0 0 58%`) could still grow in height, and `height: auto` on the img could override `max-height` in some layout contexts
- Missing `max-height` in the `@media (max-width: 1024px)` breakpoint — the responsive rule at line ~1842 reset `.detail-hero img` to `height: auto` without preserving the viewport cap, so the fix only worked on screens wider than 1024px
- The 56px offset accounts for the nav bar height; without it the image bottom is clipped behind the fold

---

## File Architecture

### Key Files

| File | Purpose |
|------|---------|
| `src/layouts/BaseLayout.astro` | Shell: nav bar, footer, image protection, photo nav swap script, search, mobile nav |
| `src/pages/index.astro` | Homepage mosaic with crossfade engine |
| `src/pages/collections.astro` | Gallery page with GALLERY_ORDER array |
| `src/pages/category/[slug].astro` | Category page with subcategory tabs |
| `src/pages/photo/[slug].astro` | Photo detail page with prev/next nav data |
| `src/lib/sanity.js` | Sanity client, GROQ queries, cached fetch |
| `src/lib/sanity-cache.js` | Read/write .sanity-cache.json |
| `public/styles/global.css` | All CSS (single file) |
| `public/gallery-order.html` | Drag-and-drop gallery ordering tool |
| `scripts/generate-search-index.mjs` | Prebuild script for search-index.json |
| `seed-cache.mjs` | Seeds displayOrder values in Sanity |

### Build Pipeline

```
npm run build:
  1. node scripts/generate-search-index.mjs  (creates public/search-index.json)
  2. astro build                              (generates static site in dist/)
```

Netlify runs: `node seed-cache.mjs && npm run build`

---

## Git Configuration

- **User**: `user.email="albavt92@gmail.com"`, `user.name="Alba Tull"`
- **Push**: VM cannot push — user must run `git push origin main` from their terminal
- **NEVER** add Claude/Anthropic references in commits or code

---

## CSS Specificity Gotchas

1. `.nav-links a` — Use `.nav-links > a` to avoid matching dropdown/nested links
2. `.img-shield` on `.mosaic-cell` — Breaks 3D flip. Exclude mosaic cells from shields.
3. `opacity/visibility` for show/hide — Unreliable with flex. Use `display: none/block`.
4. Mobile `order: -1` on search — Disrupts flex layout. Hide entirely on mobile instead.
5. `@media (max-width: 768px)` — This is where mobile overrides live. Search bar, hamburger, dropdown all have mobile-specific rules here.

## Mosaic Configuration

```javascript
const MOSAIC_CONFIG = {
  minCells:    3,       // Min cells to crossfade per cycle
  maxCells:    4,       // Max cells to crossfade per cycle
  intervalMs:  3000,    // 3 second interval (was 2500)
  staggerMs:   400,     // Stagger between each cell
  fadeDurMs:   1400,    // CSS fade duration
  startDelay:  500,     // 500ms before first cycle (was full interval)
  videoCells:  3        // Number of video cells
};
```

Uses Fisher-Yates shuffled queue so every tile gets refreshed before any repeats.

## Quick Reference: Common Tasks

**Refresh Sanity cache locally:**
```bash
rm src/data/.sanity-cache.json && npm run build
```

**Push changes (from user's terminal, not VM):**
```bash
cd ~/Projects/AlbaTull-V6 && git push origin main
```

**Force browser to load fresh CSS:**
Cmd + Shift + R (Mac) or Ctrl + Shift + R (Windows)

**Check photo count in built category page:**
```bash
grep -c 'grid-tile' dist/category/experimentations/index.html
```

**Verify swap script is outside `<main>`:**
```bash
python3 -c "
html = open('dist/photo/africa-1/index.html').read()
main_end = html.index('</main>')
print('swapToPhoto after main:', 'swapToPhoto' in html[main_end:])
"
```

---

## Continuation Notes (for next Cowork session)

If picking up from here, the assistant should:

1. **Check if the photo sizing fix has been pushed** — Run `git log --oneline -3` and look for a commit about "portrait photo height" or "viewport". If not present, the commit command above needs to be run first.

2. **Verify photo sizing after deploy** — Open tall portrait photos (Architecture 27, Architecture 5, England 55, Ireland 22) and confirm they fit within the viewport without scrolling. The nav bar is 56px tall.

3. **Nav structure recap** — Two search inputs exist in the HTML: `.nav-search` (desktop, between logo and nav-links) and `.nav-search-mobile` (inside `.nav-links` hamburger menu). The mobile one is hidden on desktop via `display: none`. On mobile (< 768px), the desktop one is hidden and the mobile one shows only when the hamburger menu is open (`.nav-links.is-open .nav-search-mobile { display: block }`).

4. **Image orientation detection** — The `getOrientation()` function in `photo/[slug].astro` parses Sanity's asset `_ref` string to extract dimensions. Format: `image-{hash}-{WxH}-{ext}`. Ratio > 1.2 = landscape, < 0.85 = portrait, else square. This determines the CSS class on `.detail-layout` which controls the page layout.

5. **Three code paths** — Always remember: Sanity, cache, and local. Any feature that touches photo data MUST work across all three. The Experimentations/MISC merge is the canonical example of what goes wrong when you only handle one path.

6. **Commit rules** — NEVER include Claude/Anthropic references. Git config: user.email="albavt92@gmail.com", user.name="Alba Tull". VM cannot push — user runs `git push origin main` from their own terminal.
