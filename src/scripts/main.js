/**
 * Main Bootstrap
 * Initializes all interactive modules.
 */

import { initOverlayRouter } from "./overlay-router.js";
import { initRolodexLivePreviews } from "./rolodex-live.js";
import { initFreezeToStillOnSelect } from "./freeze-frame.js";
import { initPhotoOpenTransition } from "./open-photo.js";

// Core systems
initOverlayRouter();

// Premium motion effects (Phase 2+)
initRolodexLivePreviews();
initFreezeToStillOnSelect();
initPhotoOpenTransition();
