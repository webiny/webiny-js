import { createFeature } from "@webiny/feature/api";
import { GetTargetScheduledActionUseCase } from "./GetTargetScheduledActionUseCase.js";

/**
 * GetTargetScheduledAction Feature
 *
 * Provides the ability to retrieve a target scheduled action by ID.
 * Used for checking if schedules exist and displaying schedule details.
 */
export const GetTargetScheduledActionFeature = createFeature({
    name: "GetTargetScheduledAction",
    register(container) {
        container.register(GetTargetScheduledActionUseCase);
    }
});
