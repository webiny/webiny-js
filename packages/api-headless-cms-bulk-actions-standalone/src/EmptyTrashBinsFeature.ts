import { createFeature } from "@webiny/feature/api";
import { EmptyTrashBinsInputType } from "./EmptyTrashBinsInputType.js";
import { TriggerEmptyTrashBinsHandler } from "./TriggerEmptyTrashBinsHandler.js";

/**
 * Lets the standalone server empty the trash bins by dispatching an `EmptyTrashBinsEvent`. Register
 * at the root container.
 */
export const EmptyTrashBinsFeature = createFeature({
    name: "BulkActions/EmptyTrashBins",
    register: container => {
        container.register(EmptyTrashBinsInputType);
        container.register(TriggerEmptyTrashBinsHandler);
    }
});
