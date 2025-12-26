import { createFeature } from "@webiny/feature/api";
import { RunActionUseCase } from "./RunActionUseCase.js";

/**
 * RunAction Feature
 *
 * Provides the ability to schedule an action for immediate execution
 * without having to manually calculate the schedule date.
 */
export const RunActionFeature = createFeature({
    name: "RunAction",
    register(container) {
        container.register(RunActionUseCase);
    }
});
