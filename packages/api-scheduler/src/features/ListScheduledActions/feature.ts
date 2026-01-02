import { createFeature } from "@webiny/feature/api";
import { ListScheduledActionsUseCase } from "./ListScheduledActionsUseCase.js";

/**
 * ListScheduledActions Feature
 *
 * Provides the ability to list scheduled actions with optional filtering by namespace or actionType.
 * Critical for CMS CRUD views showing all scheduled actions for a content model.
 */
export const ListScheduledActionsFeature = createFeature({
    name: "ListScheduledActions",
    register(container) {
        container.register(ListScheduledActionsUseCase);
    }
});
