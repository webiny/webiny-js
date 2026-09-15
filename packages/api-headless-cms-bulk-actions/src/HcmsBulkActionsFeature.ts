import { createFeature } from "@webiny/feature/api";
import { EntriesBulkActionConfig } from "~/features/EntriesBulkAction/abstractions.js";
import {
    BulkActionListTaskDefinition,
    BulkActionProcessTaskDefinition
} from "~/features/EntriesBulkAction/createBulkActionTasks.js";
import { DeleteEntriesBulkActionFeature } from "~/features/DeleteEntriesBulkAction/feature.js";
import { MoveToFolderBulkActionFeature } from "~/features/MoveToFolderBulkAction/feature.js";
import { MoveToTrashBulkActionFeature } from "~/features/MoveToTrashBulkAction/feature.js";
import { PublishEntriesBulkActionFeature } from "~/features/PublishEntriesBulkAction/feature.js";
import { UnpublishEntriesBulkActionFeature } from "~/features/UnpublishEntriesBulkAction/feature.js";
import { RestoreEntriesBulkActionFeature } from "~/features/RestoreEntriesBulkAction/feature.js";
import { EmptyTrashBinTaskDefinition } from "~/tasks/EmptyTrashBinTaskDefinition.js";
import { BulkActionsGraphQLSchema } from "~/graphql/BulkActionsGraphQLSchema.js";

export interface HcmsBulkActionsFeatureConfig {
    batchSize?: number;
}

export const HcmsBulkActionsFeature = createFeature<HcmsBulkActionsFeatureConfig | undefined>({
    name: "HcmsBulkActions",
    register(container, config) {
        container.registerInstance(EntriesBulkActionConfig, {
            batchSize: config?.batchSize ?? 100
        });

        DeleteEntriesBulkActionFeature.register(container);
        MoveToFolderBulkActionFeature.register(container);
        MoveToTrashBulkActionFeature.register(container);
        PublishEntriesBulkActionFeature.register(container);
        UnpublishEntriesBulkActionFeature.register(container);
        RestoreEntriesBulkActionFeature.register(container);

        container.register(EmptyTrashBinTaskDefinition);
        container.register(BulkActionListTaskDefinition);
        container.register(BulkActionProcessTaskDefinition);
        container.register(BulkActionsGraphQLSchema);
    }
});
