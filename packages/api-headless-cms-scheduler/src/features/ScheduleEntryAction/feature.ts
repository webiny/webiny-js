import { createFeature } from "@webiny/feature/api";
import { ScheduleEntryActionUseCase } from "./ScheduleEntryActionUseCase.js";
import { PublishEntryActionHandler } from "./actionHandlers/PublishEntryActionHandler.js";
import { UnpublishEntryActionHandler } from "./actionHandlers/UnpublishEntryActionHandler.js";

/**
 * ScheduleEntryAction Feature
 *
 * Provides the ability to schedule CMS entry actions (publish/unpublish).
 * Handles both immediate execution and future scheduling.
 */
export const ScheduleEntryActionFeature = createFeature({
    name: "ScheduleEntryAction",
    register(container) {
        container.register(ScheduleEntryActionUseCase);
        container.register(PublishEntryActionHandler);
        container.register(UnpublishEntryActionHandler);
    }
});
