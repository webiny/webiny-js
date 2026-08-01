import { createFeature } from "@webiny/feature/api";
import { RequestContextInitializer } from "@webiny/event-handler-core";
import {
    EntriesBulkAction,
    EntriesBulkActionConfig
} from "~/features/EntriesBulkAction/abstractions.js";
import { createBulkActionTasks } from "~/features/EntriesBulkAction/createBulkActionTasks.js";
import { DeleteEntriesBulkActionFeature } from "~/features/DeleteEntriesBulkAction/feature.js";
import { MoveToFolderBulkActionFeature } from "~/features/MoveToFolderBulkAction/feature.js";
import { MoveToTrashBulkActionFeature } from "~/features/MoveToTrashBulkAction/feature.js";
import { PublishEntriesBulkActionFeature } from "~/features/PublishEntriesBulkAction/feature.js";
import { UnpublishEntriesBulkActionFeature } from "~/features/UnpublishEntriesBulkAction/feature.js";
import { RestoreEntriesBulkActionFeature } from "~/features/RestoreEntriesBulkAction/feature.js";
import { EmptyTrashBinTaskDefinition } from "~/tasks/EmptyTrashBinTaskDefinition.js";
import { registerDefaultBulkActionGraphQL } from "~/graphql/createDefaultGraphQL.js";
import { createBulkActionGraphQL } from "~/graphql/createBulkActionGraphQL.js";
import type { HcmsBulkActionsContext } from "~/types.js";

export interface HcmsBulkActionsFeatureConfig {
    batchSize?: number;
}

export const HcmsBulkActionsFeature = createFeature<HcmsBulkActionsFeatureConfig | undefined>({
    name: "HcmsBulkActions",
    register(container, config) {
        container.registerInstance(EntriesBulkActionConfig, {
            batchSize: config?.batchSize ?? 100
        });

        // Bulk-action implementations (one EntriesBulkAction each).
        DeleteEntriesBulkActionFeature.register(container);
        MoveToFolderBulkActionFeature.register(container);
        MoveToTrashBulkActionFeature.register(container);
        PublishEntriesBulkActionFeature.register(container);
        UnpublishEntriesBulkActionFeature.register(container);
        RestoreEntriesBulkActionFeature.register(container);

        container.register(EmptyTrashBinTaskDefinition);

        // TODO: temporarily disabled to debug FileModel resolution ordering
        // container.registerInstance(RequestContextInitializer, {
        //     async init(ctx: Record<string, any>) {
        //         const context = ctx as HcmsBulkActionsContext;
        //         const bulkActionsConfig = container.resolve(EntriesBulkActionConfig);
        //         const bulkActions = container.resolveAll(EntriesBulkAction);
        //         for (const bulkAction of bulkActions) {
        //             createBulkActionTasks(bulkAction, bulkActionsConfig).register(container);
        //             await createBulkActionGraphQL(context, bulkAction);
        //         }
        //         await registerDefaultBulkActionGraphQL(context);
        //     }
        // });
    }
});
