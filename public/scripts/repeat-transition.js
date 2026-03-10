/**
 * Repeating-Frame (Fan) Transition — GSAP-powered
 *
 * Creates the signature "fan" of image frames that animate from clicked tile
 * to the detail overlay hero. Inspired by Tympanus RepeatingImageTransition.
 *
 * Uses GSAP timelines with:
 *   - Configurable clip-path direction (top-bottom, bottom-top, left-right, right-left)
 *   - Multiple mover frames with staggered enter/exit
 *   - Smooth easing on all transitions
 *   - Optional wobble and rotation for organic feel
 *   - Sine wave or linear path motion
 */

function reducedMotion() {
  return window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
}

const lerp = (a, b, t) => a + (b - a) * t;

// Default config — matches the Tympanus reference defaults
const defaultConfig = {
  clipPathDirection: 'top-bottom',
  steps: 6,
  stepDuration: 0.35,
  stepInterval: 0.05,
  moverPauseBeforeExit: 0.14,
  rotationRange: 0,
  wobbleStrength: 0,
  panelRevealEase: 'sine.inOut',
  moverEnterEase: 'sine.in',
  moverExitEase: 'sine',
  panelRevealDurationFactor: 2,
  moverBlendMode: false,
  pathMotion: 'linear',
  sineAmplitude: 50,
  sineFrequency: Math.PI,
};

/**
 * Get clip-path strings for a given animation direction.
 */
function getClipPaths(direction) {
  switch (direction) {
    case 'bottom-top':
      return {
        from:   'inset(0% 0% 100% 0%)',
        reveal: 'inset(0% 0% 0% 0%)',
        hide:   'inset(100% 0% 0% 0%)',
      };
    case 'left-right':
      return {
        from:   'inset(0% 100% 0% 0%)',
        reveal: 'inset(0% 0% 0% 0%)',
        hide:   'inset(0% 0% 0% 100%)',
      };
    case 'right-left':
      return {
        from:   'inset(0% 0% 0% 100%)',
        reveal: 'inset(0% 0% 0% 0%)',
        hide:   'inset(0% 100% 0% 0%)',
      };
    case 'top-bottom':
    default:
      return {
        from:   'inset(100% 0% 0% 0%)',
        reveal: 'inset(0% 0% 0% 0%)',
        hide:   'inset(0% 0% 100% 0%)',
      };
  }
}

/**
 * Generate interpolated motion path between start and end rects.
 */
function generateMotionPath(startRect, endRect, steps, config) {
  const path = [];
  const fullSteps = steps + 2; // include start/end anchors

  const startCenter = {
    x: startRect.left + startRect.width / 2,
    y: startRect.top + startRect.height / 2,
  };
  const endCenter = {
    x: endRect.left + endRect.width / 2,
    y: endRect.top + endRect.height / 2,
  };

  for (let i = 0; i < fullSteps; i++) {
    const t = i / (fullSteps - 1);
    const width = lerp(startRect.width, endRect.width, t);
    const height = lerp(startRect.height, endRect.height, t);
    const centerX = lerp(startCenter.x, endCenter.x, t);
    const centerY = lerp(startCenter.y, endCenter.y, t);

    // Sine wave offset for organic motion
    const sineOffset = config.pathMotion === 'sine'
      ? Math.sin(t * config.sineFrequency) * config.sineAmplitude
      : 0;

    // Random wobble for slight organic variation
    const wobbleX = (Math.random() - 0.5) * config.wobbleStrength;
    const wobbleY = (Math.random() - 0.5) * config.wobbleStrength;

    path.push({
      left: centerX - width / 2 + wobbleX,
      top: centerY - height / 2 + sineOffset + wobbleY,
      width,
      height,
    });
  }

  // Return only the intermediate steps (skip start/end anchor points)
  return path.slice(1, -1);
}

/**
 * Run the GSAP-powered repeating-frame (fan) transition.
 *
 * @param {Object} options
 * @param {HTMLElement} options.fromEl   - Source element (tile/thumbnail)
 * @param {HTMLElement} options.toEl     - Destination element (hero image)
 * @param {string}      options.imgUrl   - Image URL for the frames
 * @param {Object}      [options.config] - Per-transition config overrides
 */
export async function runRepeatTransition({ fromEl, toEl, imgUrl, config: overrides = {} }) {
  if (!fromEl || !toEl || !imgUrl) return;
  if (reducedMotion()) return;
  if (typeof gsap === 'undefined') {
    console.warn('GSAP not loaded, skipping fan transition');
    return;
  }

  const config = { ...defaultConfig, ...overrides };
  const clipPaths = getClipPaths(config.clipPathDirection);

  const startRect = fromEl.getBoundingClientRect();
  const endRect = toEl.getBoundingClientRect();

  // Generate the intermediate positions for movers
  const path = generateMotionPath(startRect, endRect, config.steps, config);

  // Create a container for all movers
  const container = document.createElement('div');
  container.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:10000;';
  document.body.appendChild(container);

  // Create and animate each mover frame
  path.forEach((step, index) => {
    const mover = document.createElement('div');
    mover.style.cssText = `
      position: fixed;
      background-image: url("${imgUrl}");
      background-size: cover;
      background-position: center;
      border-radius: 4px;
      will-change: clip-path, opacity;
      left: ${step.left}px;
      top: ${step.top}px;
      width: ${step.width}px;
      height: ${step.height}px;
      z-index: ${10000 + index};
      clip-path: ${clipPaths.from};
    `;

    // Optional rotation
    if (config.rotationRange > 0) {
      const rot = (Math.random() - 0.5) * 2 * config.rotationRange;
      mover.style.transform = `rotate(${rot}deg)`;
    }

    // Optional blend mode
    if (config.moverBlendMode) {
      mover.style.mixBlendMode = config.moverBlendMode;
    }

    container.appendChild(mover);

    const delay = index * config.stepInterval;

    // GSAP timeline for this mover: enter (reveal) → pause → exit (hide)
    gsap.timeline({ delay })
      .fromTo(mover,
        { opacity: 0.4, clipPath: clipPaths.hide },
        {
          opacity: 1,
          clipPath: clipPaths.reveal,
          duration: config.stepDuration,
          ease: config.moverEnterEase,
        }
      )
      .to(mover, {
        clipPath: clipPaths.from,
        duration: config.stepDuration,
        ease: config.moverExitEase,
      }, `+=${config.moverPauseBeforeExit}`);
  });

  // Calculate total animation time and schedule cleanup
  const totalTime =
    config.steps * config.stepInterval +
    config.stepDuration * 2 +
    config.moverPauseBeforeExit +
    0.1; // small buffer

  return new Promise((resolve) => {
    gsap.delayedCall(totalTime, () => {
      container.remove();
      resolve();
    });
  });
}
