import { createFeature } from "@webiny/feature/api";
import { HcmsBulkActionsFeature } from "@webiny/api-headless-cms-bulk-actions";
import { DeleteModelTaskFeature } from "./features/DeleteModelTask/feature.js";
import { DisableModelFeature } from "./features/DisableModel/feature.js";
import { DeleteModelOperationsImplementation } from "./graphql/deleteModel/DeleteModelOperationsImpl.js";
import { DeleteModelGraphQLSchemaFactoryImpl } from "./graphql/deleteModel/index.js";

export const HcmsTasksFeature = createFeature({
    name: "HcmsTasks",
    register(container) {
        // Bulk actions (entries) + the empty-trash-bin task.
        HcmsBulkActionsFeature.register(container, { batchSize: 100 });

        DeleteModelTaskFeature.register(container);

        // DisableModelFeature resolves DeleteModelOperations eagerly (it binds
        // `isModelBeingDeleted` into a decorator), so the operations must be registered first.
        // That ordering is local and explicit here; it used to be spread across two initializers.
        container.register(DeleteModelOperationsImplementation);
        DisableModelFeature.register(container);

        container.register(DeleteModelGraphQLSchemaFactoryImpl);
    }
});
