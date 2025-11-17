import { createFeature } from "@webiny/feature/api";
import { ProcessRecordsUseCase } from "./ProcessRecordsUseCase.js";
import { PublishRecordAction } from "./actions/PublishRecordAction.js";
import { UnpublishRecordAction } from "./actions/UnpublishRecordAction.js";

/**
 * ProcessRecordsFeature Feature
 *
 * Provides functionality for processing scheduled CMS action events.
 * Delegates to specific action handlers (publish, unpublish).
 */
export const ProcessRecordsFeature = createFeature({
    name: "ProcessRecordsFeature",
    register(container) {
        // Register use case
        container.register(ProcessRecordsUseCase);

        // Register action handlers
        container.register(PublishRecordAction);
        container.register(UnpublishRecordAction);
    }
});
