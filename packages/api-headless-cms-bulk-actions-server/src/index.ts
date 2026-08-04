import { createFeature } from "@webiny/feature/api";
import { EmptyTrashBinRoute } from "./EmptyTrashBinRoute.js";
import { uuid } from "@webiny/stdlib";
import { BulkActionsInternalToken } from "./BulkActionsInternalToken.js";
export { BulkActionsInternalToken };

export const EmptyTrashBinRouteFeature = createFeature({
    name: "BulkActions/EmptyTrashBinRoute",
    register: container => {
        const token = uuid();
        container.registerInstance(BulkActionsInternalToken, { value: token });
        container.register(EmptyTrashBinRoute);
    }
});
