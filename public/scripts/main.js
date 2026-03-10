/**
 * Main Bootstrap — V5
 * Initializes interactive modules.
 * No overlay system — all navigation is standard page links.
 */

import { initRolodexLivePreviews } from "./rolodex-live.js";
import { initFreezeToStillOnSelect } from "./freeze-frame.js";

// Motion effects
initRolodexLivePreviews();
initFreezeToStillOnSelect();
