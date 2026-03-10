/**
 * Rolodex Live Previews — Alba Tull V6A
 *
 * Plays short video loops on rolodex tiles only when visible.
 * Uses IntersectionObserver for performance — videos outside
 * the viewport are paused. Respects prefers-reduced-motion.
 */

function reducedMotion() {
  return window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
}

function setVideoSource(videoEl, url) {
  if (!url) return;
  if (videoEl.dataset.srcSet === '1') return;
  videoEl.src = url;
  videoEl.dataset.srcSet = '1';
}

async function safePlay(videoEl) {
  try { await videoEl.play(); } catch { /* autoplay may be blocked */ }
}

export function initRolodexLivePreviews() {
  if (reducedMotion()) return;

  const tiles = document.querySelectorAll('.rolo-tile[data-preview]');
  if (!tiles.length) return;

  const io = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      const tile = entry.target;
      const previewUrl = tile.dataset.preview;
      const video = tile.querySelector('video.rolo-video');
      if (!video || !previewUrl) continue;

      if (entry.isIntersecting) {
        setVideoSource(video, previewUrl);
        safePlay(video);
        tile.classList.add('is-live');
      } else {
        video.pause();
        tile.classList.remove('is-live');
      }
    }
  }, { threshold: 0.35 });

  tiles.forEach(t => io.observe(t));
}
