/**
 * Overlay + Route Router
 * Opens photo/video detail in a lightbox overlay while updating the URL
 * via History API so links are shareable. Supports direct visits too.
 */

const OVERLAY_ID = "stage-overlay";
const $ = (sel, root = document) => root.querySelector(sel);

function saveScroll() {
  return { x: window.scrollX, y: window.scrollY };
}

function restoreScroll(pos) {
  window.scrollTo(pos.x, pos.y);
}

async function fetchFragment(url) {
  const u = new URL(url, window.location.origin);
  u.searchParams.set("fragment", "1");
  const res = await fetch(u.toString(), { headers: { "X-Overlay": "1" } });
  if (!res.ok) throw new Error(`Failed to load ${u}`);
  return await res.text();
}

export function initOverlayRouter() {
  const overlay = document.getElementById(OVERLAY_ID);
  if (!overlay) return;

  const closeEls = overlay.querySelectorAll("[data-overlay-close]");
  const body = $("[data-overlay-body]", overlay);

  let lastScroll = null;
  let lastUrl = null;
  let isOpen = false;

  async function openOverlay(url, { push = true } = {}) {
    if (!lastScroll) lastScroll = saveScroll();
    if (!lastUrl) lastUrl = window.location.pathname + window.location.search;

    overlay.classList.add("is-open");
    overlay.setAttribute("aria-hidden", "false");
    document.documentElement.classList.add("overlay-open");
    isOpen = true;

    body.innerHTML = `<div class="overlay-loading" style="display:flex;align-items:center;justify-content:center;height:100%;color:#999;">Loading...</div>`;

    try {
      body.innerHTML = await fetchFragment(url);
    } catch (err) {
      body.innerHTML = `<div style="padding:40px;color:#999;">Failed to load content.</div>`;
      console.error(err);
    }

    if (push) {
      history.pushState({ overlay: true, url, lastUrl, lastScroll }, "", url);
    }
  }

  function closeOverlay({ pop = false } = {}) {
    overlay.classList.remove("is-open");
    overlay.setAttribute("aria-hidden", "true");
    document.documentElement.classList.remove("overlay-open");
    isOpen = false;

    const state = history.state;
    const backTo = state?.lastUrl || lastUrl;
    if (!pop && backTo) history.pushState({}, "", backTo);

    const pos = state?.lastScroll || lastScroll;
    if (pos) restoreScroll(pos);

    lastScroll = null;
    lastUrl = null;
  }

  // Intercept clicks on overlay links
  document.addEventListener("click", (e) => {
    const a = e.target.closest("a[data-overlay-link]");
    if (!a) return;
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    openOverlay(a.getAttribute("href"), { push: true }).catch(console.error);
  });

  // Close handlers
  closeEls.forEach((el) => el.addEventListener("click", () => closeOverlay()));
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && isOpen) closeOverlay();
  });

  // Back/forward browser navigation
  window.addEventListener("popstate", () => {
    const path = window.location.pathname;
    const isDetail = path.startsWith("/photo/") || path.startsWith("/video/");
    if (isDetail && !isOpen) {
      openOverlay(path + window.location.search, { push: false }).catch(console.error);
    }
    if (!isDetail && isOpen) {
      closeOverlay({ pop: true });
    }
  });

  // Handle direct visits to /photo/slug or /video/slug
  const startPath = window.location.pathname;
  if (startPath.startsWith("/photo/") || startPath.startsWith("/video/")) {
    openOverlay(startPath + window.location.search, { push: false }).catch(console.error);
  }

  // Expose for programmatic use
  window.__overlay = { open: openOverlay, close: closeOverlay };
}
