import { createFeature } from "@webiny/feature/api";
import { CancelScheduledEntryActionUseCase } from "./CancelScheduledEntryActionUseCase.js";

/**
 * CancelScheduledEntryAction Feature
 *
 * Provides the ability to cancel scheduled CMS entry actions (publish/unpublish).
 */
export const CancelScheduledEntryActionFeature = createFeature({
    name: "CancelScheduledEntryAction",
    register(container) {
        container.register(CancelScheduledEntryActionUseCase);
    }
});
