import { createFeature } from "@webiny/feature/api";
import { ExecuteScheduledActionUseCase } from "./ExecuteScheduledActionUseCase.js";

/**
 * ExecuteScheduledAction Feature
 *
 * Provides the ability to execute a scheduled action when triggered by EventBridge.
 * Finds the appropriate handler and executes it, then cleans up the schedule entry.
 */
export const ExecuteScheduledActionFeature = createFeature({
    name: "ExecuteScheduledAction",
    register(container) {
        container.register(ExecuteScheduledActionUseCase);
    }
});
