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

        container.register(DeleteModelOperationsImplementation);
        DisableModelFeature.register(container);

        container.register(DeleteModelGraphQLSchemaFactoryImpl);
    }
});
