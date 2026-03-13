import { createFeature } from "@webiny/feature/api";
import { CancelScheduledActionOnPublishEventHandler } from "./CancelScheduledActionOnPublishEventHandler.js";
import { CancelScheduledActionOnUnpublishEventHandler } from "./CancelScheduledActionOnUnpublishEventHandler.js";
import { CancelScheduledActionOnEntryDeleteEventHandler } from "./CancelScheduledActionOnEntryDeleteEventHandler.js";
import { CancelScheduledActionOnRevisionDeleteEventHandler } from "./CancelScheduledActionOnRevisionDeleteEventHandler.js";

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
        container.register(CancelScheduledActionOnPublishEventHandler);
        container.register(CancelScheduledActionOnUnpublishEventHandler);
        container.register(CancelScheduledActionOnEntryDeleteEventHandler);
        container.register(CancelScheduledActionOnRevisionDeleteEventHandler);
    }
});
