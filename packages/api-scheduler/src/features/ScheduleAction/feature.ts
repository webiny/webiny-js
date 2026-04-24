import { createFeature } from "@webiny/feature/api";
import { ScheduleActionUseCase } from "./ScheduleActionUseCase.js";

/**
 * ScheduleAction Feature
 *
 * Provides the ability to schedule actions for future execution.
 * Handles both creating new schedules and updating existing ones (reschedule).
 */
export const ScheduleActionFeature = createFeature({
    name: "ScheduleAction",
    register(container) {
        container.register(ScheduleActionUseCase);
    }
});
