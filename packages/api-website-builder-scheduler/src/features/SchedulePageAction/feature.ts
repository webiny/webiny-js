import { createFeature } from "@webiny/feature/api";
import { SchedulePageActionUseCase } from "./SchedulePageActionUseCase.js";
import { PublishPageActionHandler } from "./actionHandlers/PublishPageActionHandler.js";
import { UnpublishPageActionHandler } from "./actionHandlers/UnpublishPageActionHandler.js";

/**
 * SchedulePageAction Feature
 *
 * Provides the ability to schedule WB page actions (publish/unpublish).
 * Handles both immediate execution and future scheduling.
 */
export const SchedulePageActionFeature = createFeature({
    name: "SchedulePageAction",
    register(container) {
        container.register(SchedulePageActionUseCase);
        container.register(PublishPageActionHandler);
        container.register(UnpublishPageActionHandler);
    }
});
