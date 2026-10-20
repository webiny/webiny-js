import { SAVE_FAILURE_PREFIX } from "./duplicateBannerMessage.js";
import type { SaveBannerState } from "./SaveBannerState.js";

// The plain banner for a failure with nothing more to point at (R276, Q43).
export const toMessageBanner = (message: string): SaveBannerState => {
    return { kind: "message", message: `${SAVE_FAILURE_PREFIX}${message}` };
};
