import { createFeature } from "@webiny/feature/api";
import { EmptyTrashBinRoute, EmptyTrashBinRouteDefinition } from "./EmptyTrashBinRoute.js";
import { uuid } from "@webiny/stdlib";
import { BulkActionsInternalToken } from "./BulkActionsInternalToken.js";
import { HttpRouteDefinition } from "@webiny/event-handler-core";
export { BulkActionsInternalToken };

export const EmptyTrashBinRouteFeature = createFeature({
    name: "BulkActions/EmptyTrashBinRoute",
    register: container => {
        const token = uuid();
        container.registerInstance(BulkActionsInternalToken, { value: token });
        container.register(EmptyTrashBinRoute);
        container.registerInstance(HttpRouteDefinition, EmptyTrashBinRouteDefinition);
    }
});
