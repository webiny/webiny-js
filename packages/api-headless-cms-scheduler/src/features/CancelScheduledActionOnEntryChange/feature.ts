import { createFeature } from "@webiny/feature/api";
import { CancelScheduledActionOnPublishHandler } from "./CancelScheduledActionOnPublishHandler.js";
import { CancelScheduledActionOnUnpublishHandler } from "./CancelScheduledActionOnUnpublishHandler.js";
import { CancelScheduledActionOnDeleteHandler } from "./CancelScheduledActionOnDeleteHandler.js";

/**
 * CancelScheduledActionOnEntryChange Feature
 *
 * Automatically cancels scheduled actions when entries are manually
 * published, unpublished, or deleted. This ensures scheduled actions
 * don't execute after a user has already performed the action manually.
 */
export const CancelScheduledActionOnEntryChangeFeature = createFeature({
    name: "CancelScheduledActionOnEntryChange",
    register(container) {
        container.register(CancelScheduledActionOnPublishHandler);
        container.register(CancelScheduledActionOnUnpublishHandler);
        container.register(CancelScheduledActionOnDeleteHandler);
    }
});
