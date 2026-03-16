import { createFeature } from "@webiny/feature/api";
import { ScheduleActionFeature } from "./ScheduleAction/feature.js";
import { GetScheduledActionFeature } from "./GetScheduledAction/feature.js";
import { GetTargetScheduledActionFeature } from "./GetTargetScheduledAction/feature.js";
import { ListScheduledActionsFeature } from "./ListScheduledActions/feature.js";
import { CancelScheduledActionFeature } from "./CancelScheduledAction/feature.js";
import { ExecuteScheduledActionFeature } from "./ExecuteScheduledAction/feature.js";

/**
 * Main Scheduler Feature
 *
 * Registers all scheduler use cases and the composite handler.
 * Individual handler implementations are registered by consumer packages
 * (e.g., api-headless-cms-scheduler registers CMS-specific handlers).
 */
export const SchedulerFeature = createFeature({
    name: "Scheduler",
    register(container) {
        // Register all features
        ScheduleActionFeature.register(container);
        GetScheduledActionFeature.register(container);
        GetTargetScheduledActionFeature.register(container);
        ListScheduledActionsFeature.register(container);
        CancelScheduledActionFeature.register(container);
        ExecuteScheduledActionFeature.register(container);
    }
});
