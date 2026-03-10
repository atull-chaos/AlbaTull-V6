/**
 * Repeating-Frame Transition — Alba Tull V6A
 *
 * Creates a fan of image frames that animate from the clicked tile's
 * position to the detail hero image position. Each frame reveals via
 * alternating clip-paths with staggered timing, creating the signature
 * "repeating card" opening effect.
 *
 * Respects prefers-reduced-motion.
 */

function reducedMotion() {
  return window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function easeInOut(t) {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

function makeFrame(srcUrl, srcRect) {
  const el = document.createElement('div');
  el.className = 'rt-frame';
  el.style.left = `${srcRect.left}px`;
  el.style.top = `${srcRect.top}px`;
  el.style.width = `${srcRect.width}px`;
  el.style.height = `${srcRect.height}px`;
  el.style.backgroundImage = `url("${srcUrl}")`;
  return el;
}

function getRect(el) {
  const r = el.getBoundingClientRect();
  return { left: r.left, top: r.top, width: r.width, height: r.height };
}

/**
 * Run the repeating-frame transition.
 * @param {Object} options
 * @param {HTMLElement} options.fromEl  - Source element (tile/thumbnail)
 * @param {HTMLElement} options.toEl    - Destination element (hero image)
 * @param {string}      options.imgUrl  - Still image URL for frames
 * @param {number}      [options.frames=11]   - Number of repeating frames
 * @param {number}      [options.duration=560] - Duration in ms per frame
 */
export async function runRepeatTransition({
  fromEl,
  toEl,
  imgUrl,
  frames = 11,
  duration = 560
}) {
  if (!fromEl || !toEl || !imgUrl) return;
  if (reducedMotion()) return;

  const srcRect = getRect(fromEl);
  const dstRect = getRect(toEl);

  // Create the transition layer
  const layer = document.createElement('div');
  layer.className = 'rt-layer';
  document.body.appendChild(layer);

  // Create staggered frames
  const movers = [];
  for (let i = 0; i < frames; i++) {
    const f = makeFrame(imgUrl, srcRect);
    // Alternate clip direction: even → reveal from left, odd → from right
    f.style.clipPath = (i % 2 === 0) ? 'inset(0 100% 0 0)' : 'inset(0 0 0 100%)';
    f.style.opacity = '0.95';
    layer.appendChild(f);
    movers.push(f);
  }

  const start = performance.now();
  const stagger = 28; // ms between each frame's start
  const total = duration + stagger * (frames - 1);

  return new Promise((resolve) => {
    function tick(now) {
      const elapsed = now - start;

      for (let i = 0; i < movers.length; i++) {
        const local = elapsed - i * stagger;
        const tRaw = Math.min(Math.max(local / duration, 0), 1);
        const t = easeInOut(tRaw);

        // Interpolate position and size
        const left = lerp(srcRect.left, dstRect.left, t);
        const top = lerp(srcRect.top, dstRect.top, t);
        const width = lerp(srcRect.width, dstRect.width, t);
        const height = lerp(srcRect.height, dstRect.height, t);

        const el = movers[i];
        el.style.left = `${left}px`;
        el.style.top = `${top}px`;
        el.style.width = `${width}px`;
        el.style.height = `${height}px`;

        // Reveal via clip-path
        el.style.clipPath = (i % 2 === 0)
          ? `inset(0 ${Math.round(100 - t * 100)}% 0 0)`
          : `inset(0 0 0 ${Math.round(100 - t * 100)}%)`;
      }

      if (elapsed < total) {
        requestAnimationFrame(tick);
      } else {
        layer.remove();
        resolve();
      }
    }
    requestAnimationFrame(tick);
  });
}
