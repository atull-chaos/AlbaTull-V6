/**
 * Rolodex — Flipping sheets on a circular wheel
 *
 * Cards flip past 90° to show their backside as they scroll away from center.
 * Uses a non-linear tanh curve so the flip is visible and gradual:
 *
 *   - At center (dist=0): flat, face-on (0°)
 *   - At dist=±0.5: ~18° — starting to tilt visibly
 *   - At dist=±1.0: ~35° — clearly tilted, still showing front
 *   - At dist=±1.5: ~50° — significant tilt
 *   - At dist=±2.0: ~62° — very tilted, approaching edge-on
 *   - At dist=±3.0: ~80° — nearly edge-on
 *   - At dist=±4.0: ~93° — just past 90°, showing backside!
 *
 * The flip past 90° happens gradually so you can WATCH it happen.
 */

// --- TUNING CONSTANTS ---
const FLIP_MAX        = 120;    // degrees — max rotation (past 90 shows back)
const FLIP_STEEPNESS  = 0.35;   // gentler flip — you can see the transition
const Y_SPACING       = 160;    // px between card centers vertically
const Z_PER_CARD      = 50;     // px of Z-depth push per card distance
const VISIBLE_CARDS   = 9;      // more cards visible since flip is gentler
const HALF_VISIBLE    = Math.floor(VISIBLE_CARDS / 2);
const SCROLL_PER_CARD = 180;    // px of scroll to advance one card
const PERSPECTIVE     = 1200;   // px — less distortion
const LOOP_BUFFER     = 50;     // multiplier for infinite scroll

function posMod(n, m) {
  return ((n % m) + m) % m;
}

/**
 * Non-linear flip angle using hyperbolic tangent.
 * Creates a FAST flip near center that plateaus further out.
 *
 *   tanh(0) = 0        → center card is flat
 *   tanh(0.85) = 0.69  → one card away: 150 × 0.69 = 104° (past 90°!)
 *   tanh(1.70) = 0.94  → two cards away: 150 × 0.94 = 140°
 *   tanh(2.55) = 0.99  → three cards away: 150 × 0.99 = 148°
 */
function getFlipAngle(dist) {
  const absDist = Math.abs(dist);
  const sign = dist >= 0 ? 1 : -1;
  const angle = FLIP_MAX * Math.tanh(absDist * FLIP_STEEPNESS);
  return sign * angle;
}

export function initRolodex(photos, {
  scrollContainerSel = '.rolodex-scroll',
  spacerSel = '.rolodex-spacer',
  wrapperSel = '.rolodex-perspective',
  onPhotoChange = null,
  onCardClick = null
} = {}) {
  const scrollContainer = document.querySelector(scrollContainerSel);
  const spacer = document.querySelector(spacerSel);
  const wrapper = document.querySelector(wrapperSel);
  if (!scrollContainer || !spacer || !wrapper || !photos.length) return;

  const total = photos.length;

  // Perspective on wrapper
  wrapper.style.perspective = `${PERSPECTIVE}px`;
  wrapper.style.perspectiveOrigin = '50% 50%';
  wrapper.style.transformStyle = 'preserve-3d';

  // Infinite scroll space
  const totalScrollItems = total * LOOP_BUFFER;
  const totalScrollHeight = totalScrollItems * SCROLL_PER_CARD;
  spacer.style.height = `${totalScrollHeight}px`;

  const startScroll = Math.floor(totalScrollItems / 2) * SCROLL_PER_CARD;
  scrollContainer.scrollTop = startScroll - (startScroll % (total * SCROLL_PER_CARD));

  // Create sheet DOM elements
  const cards = [];
  for (let i = 0; i < VISIBLE_CARDS; i++) {
    const sheet = document.createElement('div');
    sheet.className = 'rolo-card';
    sheet.innerHTML = `
      <div class="rolo-media">
        <img class="rolo-img" src="" alt="" loading="lazy">
      </div>
      <div class="rolo-label"></div>
    `;
    wrapper.appendChild(sheet);
    cards.push(sheet);
  }

  let currentIndex = -1;

  function update() {
    const scrollTop = scrollContainer.scrollTop;
    const floatIndex = scrollTop / SCROLL_PER_CARD;
    const baseIndex = Math.floor(floatIndex);
    const fraction = floatIndex - baseIndex;

    const centerPhotoIdx = posMod(baseIndex, total);

    if (centerPhotoIdx !== currentIndex) {
      currentIndex = centerPhotoIdx;
      if (onPhotoChange) onPhotoChange(currentIndex, photos[currentIndex]);
    }

    for (let slot = 0; slot < VISIBLE_CARDS; slot++) {
      const offset = slot - HALF_VISIBLE;
      const sheet = cards[slot];
      const photoIdx = posMod(baseIndex + offset, total);
      const photo = photos[photoIdx];

      sheet.style.visibility = 'visible';

      // Distance from center (fractional card-units)
      const dist = offset - fraction;
      const absDist = Math.abs(dist);

      // --- FLIP ROTATION (non-linear) ---
      // This is the key: rapid flip near center, plateaus further out
      const rotDeg = getFlipAngle(dist);

      // --- VERTICAL POSITION ---
      // Linear spacing so cards are evenly spread vertically
      const y = dist * Y_SPACING;

      // --- DEPTH ---
      // Push non-center cards back in Z
      const z = -absDist * Z_PER_CARD;

      // Apply transform
      sheet.style.transform =
        `translateY(${y}px) translateZ(${z}px) rotateX(${rotDeg}deg)`;

      // Transform origin: center of card
      sheet.style.transformOrigin = 'center center';

      // Z-index: center card on top, further cards behind
      sheet.style.zIndex = Math.round(100 - absDist * 10);

      // Clickable only near center
      sheet.style.pointerEvents = absDist < 0.6 ? 'auto' : 'none';

      // Opacity: fully visible near center, fade far cards
      let opacity;
      if (absDist < 2) {
        opacity = 1;
      } else if (absDist < 3.5) {
        opacity = 1 - (absDist - 2) / 1.5;
      } else {
        opacity = 0;
      }
      sheet.style.opacity = Math.max(0, opacity);

      // Update image
      const img = sheet.querySelector('.rolo-img');
      if (img && img.getAttribute('src') !== photo.img) {
        img.src = photo.img;
        img.alt = photo.title;
      }

      // Label — only show near center
      const label = sheet.querySelector('.rolo-label');
      if (label) {
        label.textContent = photo.cat;
        label.style.opacity = absDist < 0.8 ? 1 : 0;
      }

      // Click
      sheet.onclick = () => {
        if (onCardClick) onCardClick(photoIdx, photo);
      };
    }

    // Infinite scroll: jump back to middle when near edges
    const oneLoop = total * SCROLL_PER_CARD;
    if (scrollTop < oneLoop * 5) {
      scrollContainer.scrollTop = scrollTop + oneLoop * (LOOP_BUFFER / 2);
    } else if (scrollTop > totalScrollHeight - oneLoop * 5) {
      scrollContainer.scrollTop = scrollTop - oneLoop * (LOOP_BUFFER / 2);
    }
  }

  let ticking = false;
  scrollContainer.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(() => {
        update();
        ticking = false;
      });
      ticking = true;
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
      e.preventDefault();
      scrollContainer.scrollBy({ top: -SCROLL_PER_CARD, behavior: 'smooth' });
    }
    if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
      e.preventDefault();
      scrollContainer.scrollBy({ top: SCROLL_PER_CARD, behavior: 'smooth' });
    }
  });

  update();

  return {
    scrollTo(index) {
      const currentScroll = scrollContainer.scrollTop;
      const currentBase = Math.floor(currentScroll / SCROLL_PER_CARD);
      const currentPhoto = posMod(currentBase, total);
      const diff = index - currentPhoto;
      const shortDiff = ((diff + Math.floor(total / 2)) % total) - Math.floor(total / 2);
      scrollContainer.scrollBy({ top: shortDiff * SCROLL_PER_CARD, behavior: 'smooth' });
    },
    getCurrentIndex() { return currentIndex; }
  };
}
