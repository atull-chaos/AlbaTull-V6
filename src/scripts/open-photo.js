/**
 * Photo Open Transition Hook
 * Connects the repeating-frame transition to the overlay router.
 * When a photo tile is clicked, waits for the overlay hero image to appear,
 * then runs the transition from tile position → hero position.
 *
 * Improvement over the original: preloads the image on hover to eliminate
 * the delay between click and transition start.
 */

import { runRepeatTransition } from "./repeat-transition.js";

function waitFor(selector, root = document, timeoutMs = 1500) {
  const start = performance.now();
  return new Promise((resolve, reject) => {
    (function check() {
      const el = root.querySelector(selector);
      if (el) return resolve(el);
      if (performance.now() - start > timeoutMs) return reject(new Error("timeout"));
      requestAnimationFrame(check);
    })();
  });
}

// Preload still image on hover so transition starts instantly on click
function preloadOnHover() {
  document.addEventListener("pointerenter", (e) => {
    const a = e.target.closest('a[data-overlay-link][data-kind="photo"]');
    if (!a) return;
    const imgUrl = a.dataset.still || a.querySelector("img")?.src;
    if (imgUrl) {
      const preload = new Image();
      preload.src = imgUrl;
    }
  }, true);
}

export function initPhotoOpenTransition() {
  preloadOnHover();

  document.addEventListener("click", async (e) => {
    const a = e.target.closest('a[data-overlay-link][data-kind="photo"]');
    if (!a) return;

    const fromEl = a.querySelector(".rolo-media, .grid-media, img, video") || a;
    const imgUrl = a.dataset.still || a.querySelector("img")?.src;
    if (!imgUrl) return;

    try {
      // Wait for the overlay to load and the hero image to appear
      const heroImg = await waitFor("[data-hero-img]");
      await runRepeatTransition({ fromEl, toEl: heroImg, imgUrl });
    } catch {
      // Timeout or error — overlay still opens, just without the fancy transition
    }
  });
}
