/**
 * Main Bootstrap — Alba Tull V6A
 *
 * Initializes all interactive modules on page load.
 * Each module is self-contained and fails gracefully if its
 * DOM targets are not present on the current page.
 */

import { initOverlayRouter } from './overlay-router.js';
import { initRolodexLivePreviews } from './rolodex-live.js';
import { initFreezeToStillOnSelect } from './freeze-frame.js';
import { initPhotoOpenTransition } from './open-photo.js';

// Core: lightbox overlay with History API routing
initOverlayRouter();

// Motion effects
initRolodexLivePreviews();
initFreezeToStillOnSelect();
initPhotoOpenTransition();
