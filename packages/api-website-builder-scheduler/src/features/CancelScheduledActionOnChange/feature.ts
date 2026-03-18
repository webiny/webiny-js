import { createFeature } from "@webiny/feature/api";
import { CancelScheduledActionOnPagePublishEventHandler } from "./CancelScheduledActionOnPagePublishEventHandler.js";
import { CancelScheduledActionOnPageUnpublishEventHandler } from "./CancelScheduledActionOnPageUnpublishEventHandler.js";
import { CancelScheduledActionOnPageDeleteEventHandler } from "./CancelScheduledActionOnPageDeleteEventHandler.js";
import { CancelScheduledActionOnRedirectDeleteEventHandler } from "./CancelScheduledActionOnRedirectDeleteEventHandler.js";

/**
 * CancelScheduledActionOnChange Feature
 *
 * Automatically cancels scheduled actions when pages or redirects are manually
 * published, unpublished, or deleted. This ensures scheduled actions
 * don't execute after a user has already performed the action manually.
 */
export const CancelScheduledActionOnChangeFeature = createFeature({
    name: "CancelScheduledActionOnChange",
    register(container) {
        container.register(CancelScheduledActionOnPagePublishEventHandler);
        container.register(CancelScheduledActionOnPageUnpublishEventHandler);
        container.register(CancelScheduledActionOnPageDeleteEventHandler);
        container.register(CancelScheduledActionOnRedirectDeleteEventHandler);
    }
});
