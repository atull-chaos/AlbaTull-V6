/**
 * Rolodex — Alba Tull V6A
 *
 * Per-card perspective + two-sided faces creating a 3D arc of photos.
 *
 * FIREFOX FIX: No parent perspective or preserve-3d needed.
 *   Each card uses perspective() in its own transform function.
 *   This avoids Firefox's bug where overflow ancestors flatten
 *   the preserve-3d chain.
 *
 * FLICKER FIX: Two-sided cards with backface-visibility: hidden
 *   on both faces. Eliminates z-fighting at the 90° flip point.
 *   Front face = normal image. Back face = rotateX(180deg) image.
 *
 * ROTATION MODEL (0° at center → 180° at edges):
 *   Cards far from center show their BACKSIDE (upside-down image).
 *   As a card scrolls toward center, it flips through 90° and
 *   arrives at 0° showing the FRONT.
 *
 *   Sign inverted so the flip goes TOWARD the viewer:
 *   - Cards above center: negative rotateX → top tilts toward you
 *   - Cards below center: positive rotateX → bottom tilts toward you
 */

// ── Tuning constants ─────────────────────────────────────────────
const RADIUS        = 350;   // px — arc radius for Y positioning
const CARD_GAP_DEG  = 22;    // degrees between card centers on arc
const FLIP_MAX      = 180;   // degrees — full 180° for flat backface
const FLIP_SPEED    = 0.55;  // curve speed: 90° at ~1.3 cards from center
const VISIBLE_CARDS = 11;
const HALF_VISIBLE  = Math.floor(VISIBLE_CARDS / 2);
const SCROLL_SPEED  = 0.5;   // wheel delta multiplier (lower = smoother)
const PERSPECTIVE   = 900;   // px — lower = more dramatic 3D

const CARD_GAP_RAD = CARD_GAP_DEG * Math.PI / 180;

function posMod(n, m) {
  return ((n % m) + m) % m;
}

/**
 * Rotation: approaches ±180° asymptotically.
 * Sign inverted so the flip goes TOWARD the viewer.
 *
 * f(d) = -sign(d) * 180 * (1 - e^(-0.55 * |d|^1.4))
 */
function getFlipAngle(dist) {
  const absDist = Math.abs(dist);
  const sign = dist >= 0 ? 1 : -1;
  const t = 1 - Math.exp(-FLIP_SPEED * Math.pow(absDist, 1.4));
  return -sign * FLIP_MAX * t;
}

export function initRolodex(photos, {
  wrapperSel = '.rolodex-perspective',
  onPhotoChange = null,
  onCardClick = null
} = {}) {
  const wrapper = document.querySelector(wrapperSel);
  if (!wrapper || !photos.length) return;

  const total = photos.length;

  // Per-card perspective — no parent preserve-3d needed (Firefox fix)
  wrapper.style.perspective = 'none';
  wrapper.style.transformStyle = 'flat';

  // Create two-sided sheet DOM elements
  const cards = [];
  for (let i = 0; i < VISIBLE_CARDS; i++) {
    const sheet = document.createElement('div');
    sheet.className = 'rolo-card';
    sheet.innerHTML = `
      <div class="rolo-face rolo-front">
        <div class="rolo-media">
          <img class="rolo-img" src="" alt="" loading="lazy">
        </div>
        <div class="rolo-label"></div>
      </div>
      <div class="rolo-face rolo-back">
        <div class="rolo-media">
          <img class="rolo-img" src="" alt="" loading="lazy">
        </div>
      </div>
    `;
    wrapper.appendChild(sheet);
    cards.push(sheet);
  }

  // ── Virtual scroll state ───────────────────────────────────────
  let scrollPos = 0;
  let targetPos = 0;
  let currentIndex = -1;
  let animating = false;

  function update() {
    const floatIndex = scrollPos;
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

      // Arc positioning (Y only)
      const arcAngle = dist * CARD_GAP_RAD;
      const y = RADIUS * Math.sin(arcAngle);

      // Depth scale — simulate translateZ via scale
      const z = RADIUS * Math.cos(arcAngle) - RADIUS;
      const depthScale = PERSPECTIVE / (PERSPECTIVE + Math.abs(z));

      // 180° flip rotation
      const rotDeg = getFlipAngle(dist);

      // Per-card perspective: perspective → position → scale → rotate
      sheet.style.transform =
        `perspective(${PERSPECTIVE}px) translateY(${y}px) scale(${depthScale.toFixed(4)}) rotateX(${rotDeg}deg)`;
      sheet.style.transformOrigin = 'center center';

      // Z-index: center on top
      sheet.style.zIndex = Math.round(50 + 50 * Math.cos(arcAngle));

      // Clickable only near center
      sheet.style.pointerEvents = absDist < 0.6 ? 'auto' : 'none';

      // Opacity: keep all cards visible until far edges
      let opacity;
      if (absDist < 4) {
        opacity = 1;
      } else if (absDist < 5) {
        opacity = 1 - (absDist - 4);
      } else {
        opacity = 0;
      }
      sheet.style.opacity = Math.max(0, opacity);

      // Update both front and back images (same image on both sides)
      const frontImg = sheet.querySelector('.rolo-front .rolo-img');
      const backImg = sheet.querySelector('.rolo-back .rolo-img');
      if (frontImg && frontImg.getAttribute('src') !== photo.img) {
        frontImg.src = photo.img;
        frontImg.alt = photo.title;
      }
      if (backImg && backImg.getAttribute('src') !== photo.img) {
        backImg.src = photo.img;
        backImg.alt = photo.title;
      }

      // Label (front face only, visible near center)
      const label = sheet.querySelector('.rolo-front .rolo-label');
      if (label) {
        label.textContent = photo.cat;
        label.style.opacity = absDist < 0.8 ? 1 : 0;
      }

      // Click handler
      sheet.onclick = () => {
        if (onCardClick) onCardClick(photoIdx, photo);
      };
    }
  }

  // ── Smooth animation loop ──────────────────────────────────────
  function animate() {
    const diff = targetPos - scrollPos;
    if (Math.abs(diff) < 0.001) {
      scrollPos = targetPos;
      animating = false;
      update();
      return;
    }
    scrollPos += diff * 0.18;
    update();
    requestAnimationFrame(animate);
  }

  function startAnimation() {
    if (!animating) {
      animating = true;
      requestAnimationFrame(animate);
    }
  }

  // ── Wheel event (replaces native scroll for Firefox compat) ────
  const column = wrapper.closest('.rolodex-column') || wrapper.parentElement;
  column.addEventListener('wheel', (e) => {
    e.preventDefault();
    const delta = (e.deltaY || 0) * SCROLL_SPEED / 100;
    targetPos += delta;
    startAnimation();
  }, { passive: false });

  // ── Keyboard ───────────────────────────────────────────────────
  document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
      e.preventDefault();
      targetPos += 1;
      startAnimation();
    }
    if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
      e.preventDefault();
      targetPos -= 1;
      startAnimation();
    }
  });

  // ── Touch support ──────────────────────────────────────────────
  let touchStartY = 0;
  let touchStartPos = 0;
  column.addEventListener('touchstart', (e) => {
    touchStartY = e.touches[0].clientY;
    touchStartPos = targetPos;
  }, { passive: true });

  column.addEventListener('touchmove', (e) => {
    e.preventDefault();
    const touchY = e.touches[0].clientY;
    const diff = touchStartY - touchY;
    targetPos = touchStartPos + diff / 120;
    startAnimation();
  }, { passive: false });

  // Initial render
  update();

  return {
    scrollTo(index) {
      const currentPhoto = posMod(Math.floor(scrollPos), total);
      const diff = index - currentPhoto;
      const shortDiff = ((diff + Math.floor(total / 2)) % total) - Math.floor(total / 2);
      targetPos += shortDiff;
      startAnimation();
    },
    getCurrentIndex() { return currentIndex; }
  };
}
