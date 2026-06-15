import { createContextPlugin } from "@webiny/api";
import {
    EntriesBulkAction,
    EntriesBulkActionConfig
} from "~/features/EntriesBulkAction/abstractions.js";
import { BulkActionContext } from "~/features/BulkActionContext/index.js";
import { createBulkActionTasks } from "~/features/EntriesBulkAction/createBulkActionTasks.js";
import { createDefaultGraphQL } from "~/graphql/createDefaultGraphQL.js";
import { createBulkActionGraphQL } from "~/graphql/createBulkActionGraphQL.js";
import { DeleteEntriesBulkActionFeature } from "~/features/DeleteEntriesBulkAction/feature.js";
import { MoveToFolderBulkActionFeature } from "~/features/MoveToFolderBulkAction/feature.js";
import { MoveToTrashBulkActionFeature } from "~/features/MoveToTrashBulkAction/feature.js";
import { PublishEntriesBulkActionFeature } from "~/features/PublishEntriesBulkAction/feature.js";
import { UnpublishEntriesBulkActionFeature } from "~/features/UnpublishEntriesBulkAction/feature.js";
import { RestoreEntriesBulkActionFeature } from "~/features/RestoreEntriesBulkAction/feature.js";
import type { HcmsBulkActionsContext } from "~/types.js";

export type * from "./abstractions/index.js";
export { createEmptyTrashBinsTask } from "./tasks/index.js";
export { BulkActionsEventBridgeLambdaHandler } from "./BulkActionsEventBridgeLambdaHandler.js";

interface BulkActionsConfig {
    batchSize?: number;
}

export const createHcmsBulkActions = (config?: BulkActionsConfig) => {
    const batchSize = config?.batchSize ?? 100;

    return [
        createDefaultGraphQL(),
        createContextPlugin(context => {
            context.container.registerInstance(EntriesBulkActionConfig, { batchSize });
            DeleteEntriesBulkActionFeature.register(context.container);
            MoveToFolderBulkActionFeature.register(context.container);
            MoveToTrashBulkActionFeature.register(context.container);
            PublishEntriesBulkActionFeature.register(context.container);
            UnpublishEntriesBulkActionFeature.register(context.container);
            RestoreEntriesBulkActionFeature.register(context.container);
        }),
        createContextPlugin<HcmsBulkActionsContext>(async context => {
            context.container.registerInstance(BulkActionContext, context);

            const bulkActions = context.container.resolveAll(EntriesBulkAction);
            const bulkActionsConfig = context.container.resolve(EntriesBulkActionConfig);

            for (const bulkAction of bulkActions) {
                const feature = createBulkActionTasks(bulkAction, bulkActionsConfig);
                feature.register(context.container);
                await createBulkActionGraphQL(context, bulkAction);
            }
        })
    ];
};
