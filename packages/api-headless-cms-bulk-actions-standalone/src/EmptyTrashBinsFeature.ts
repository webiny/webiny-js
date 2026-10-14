import { createFeature } from "@webiny/feature/api";
import { EmptyTrashBinsEventType } from "./EmptyTrashBinsEventType.js";
import { TriggerEmptyTrashBinsHandler } from "./TriggerEmptyTrashBinsHandler.js";

/**
 * Lets the standalone server empty the trash bins by dispatching an `EmptyTrashBinsEvent`. Register
 * at the root container.
 */
export const EmptyTrashBinsFeature = createFeature({
    name: "BulkActions/EmptyTrashBins",
    register: container => {
        container.register(EmptyTrashBinsEventType);
        container.register(TriggerEmptyTrashBinsHandler);
    }
});
