import { createFeature } from "@webiny/feature/api";
import { GetScheduledActionUseCase } from "./GetScheduledActionUseCase.js";

/**
 * GetScheduledAction Feature
 *
 * Provides the ability to retrieve a scheduled action by ID.
 * Used for checking if schedules exist and displaying schedule details.
 */
export const GetScheduledActionFeature = createFeature({
    name: "GetScheduledAction",
    register(container) {
        container.register(GetScheduledActionUseCase);
    }
});
