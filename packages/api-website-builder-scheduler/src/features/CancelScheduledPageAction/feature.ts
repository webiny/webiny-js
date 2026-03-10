import { createFeature } from "@webiny/feature/api";
import { CancelScheduledPageActionUseCase } from "./CancelScheduledPageActionUseCase.js";

/**
 * CancelScheduledPageAction Feature
 *
 * Provides the ability to cancel scheduled WB page actions (publish/unpublish).
 */
export const CancelScheduledPageActionFeature = createFeature({
    name: "CancelScheduledPageAction",
    register(container) {
        container.register(CancelScheduledPageActionUseCase);
    }
});
