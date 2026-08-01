import { createFeature } from "@webiny/feature/api";
import { EmptyTrashBinRoute } from "./EmptyTrashBinRoute.js";
export { BulkActionsInternalToken } from "./BulkActionsInternalToken.js";

export const EmptyTrashBinRouteFeature = createFeature({
    name: "BulkActions/EmptyTrashBinRoute",
    register: container => {
        container.register(EmptyTrashBinRoute);
    }
});
