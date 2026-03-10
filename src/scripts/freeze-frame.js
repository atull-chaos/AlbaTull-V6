/**
 * Freeze-to-Still — Alba Tull V6A
 *
 * When a photo tile is clicked, captures the current video frame
 * as a canvas snapshot, then crossfades to the still image before
 * the detail overlay opens. Ensures the transition always starts
 * from a still image for a consistent signature look.
 */

function snapshotVideoToCanvas(videoEl) {
  const w = videoEl.videoWidth;
  const h = videoEl.videoHeight;
  if (!w || !h) return null;

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(videoEl, 0, 0, w, h);
  return canvas;
}

function freezeTileToStill(tile) {
  const img = tile.querySelector('img.rolo-img');
  const video = tile.querySelector('video.rolo-video');
  const media = tile.querySelector('.rolo-media');
  if (!img) return;

  // If video is playing and has frames, snapshot it
  if (video && video.readyState >= 2) {
    const canvas = snapshotVideoToCanvas(video);
    if (canvas && media) {
      canvas.className = 'rolo-freeze';
      media.appendChild(canvas);
      video.pause();
      video.style.opacity = '0';
      img.style.opacity = '1';
      // Remove canvas after crossfade completes
      setTimeout(() => canvas.remove(), 200);
      return;
    }
  }

  // Fallback: just swap to still
  if (video) {
    video.pause();
    video.style.opacity = '0';
  }
  img.style.opacity = '1';
}

export function initFreezeToStillOnSelect() {
  document.addEventListener('click', (e) => {
    const tile = e.target.closest('.rolo-tile, .grid-tile');
    if (!tile) return;
    if (tile.dataset.kind !== 'photo') return;
    freezeTileToStill(tile);
  });
}
