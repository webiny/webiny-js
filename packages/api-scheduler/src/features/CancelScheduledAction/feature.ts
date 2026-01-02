import { createFeature } from "@webiny/feature/api";
import { CancelScheduledActionUseCase } from "./CancelScheduledActionUseCase.js";

/**
 * CancelScheduledAction Feature
 *
 * Provides the ability to cancel a scheduled action.
 * Removes both the EventBridge schedule and the CMS entry.
 */
export const CancelScheduledActionFeature = createFeature({
    name: "CancelScheduledAction",
    register(container) {
        container.register(CancelScheduledActionUseCase);
    }
});
