import { createFeature } from "@webiny/feature/api";
import { RequestContextInitializer } from "@webiny/event-handler-core";
import { HcmsBulkActionsFeature } from "@webiny/api-headless-cms-bulk-actions";
import { DeleteModelTaskFeature } from "./features/DeleteModelTask/feature.js";
import { createDeleteModelCrud } from "./graphql/deleteModel/crud.js";
import { createDeleteModelGraphQl } from "./graphql/deleteModel/index.js";

export const HcmsTasksFeature = createFeature({
    name: "HcmsTasks",
    register(container) {
        // Bulk actions (entries) + the empty-trash-bin task.
        HcmsBulkActionsFeature.register(container, { batchSize: 100 });

        // Delete-model task + its per-request operations/schema. The crud initializer registers
        // DeleteModelOperations (+ DisableModelFeature) and MUST run before the GraphQL initializer,
        // whose resolvers resolve DeleteModelOperations — RequestContextInitializers run in
        // registration order.
        DeleteModelTaskFeature.register(container);
        container.registerInstance(RequestContextInitializer, createDeleteModelCrud());
        container.registerInstance(RequestContextInitializer, createDeleteModelGraphQl());
    }
});
