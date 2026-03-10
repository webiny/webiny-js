import { createFeature } from "@webiny/feature/api";
import { CancelScheduledActionOnPublishEventHandler } from "./CancelScheduledActionOnPublishEventHandler.js";
import { CancelScheduledActionOnUnpublishEventHandler } from "./CancelScheduledActionOnUnpublishEventHandler.js";
import { CancelScheduledActionOnDeleteEventHandler } from "./CancelScheduledActionOnDeleteEventHandler.js";

/**
 * CancelScheduledActionOnPageChange Feature
 *
 * Automatically cancels scheduled actions when pages are manually
 * published, unpublished, or deleted. This ensures scheduled actions
 * don't execute after a user has already performed the action manually.
 */
export const CancelScheduledActionOnPageChangeFeature = createFeature({
    name: "CancelScheduledActionOnPageChange",
    register(container) {
        container.register(CancelScheduledActionOnPublishEventHandler);
        container.register(CancelScheduledActionOnUnpublishEventHandler);
        container.register(CancelScheduledActionOnDeleteEventHandler);
    }
});
