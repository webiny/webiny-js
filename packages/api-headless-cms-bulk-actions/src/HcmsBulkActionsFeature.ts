import { type Container, createFeature } from "@webiny/feature/api";
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

export const HcmsBulkActionsFeature = createFeature<HcmsBulkActionsFeatureConfig>({
    name: "HcmsBulkActions",
    register(container: Container, config?: HcmsBulkActionsFeatureConfig) {
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

        // Per-action task definitions (list + process). resolveAll works now that the actions are
        // registered above; the task definitions need no per-request/model data.
        const bulkActionsConfig = container.resolve(EntriesBulkActionConfig);
        for (const bulkAction of container.resolveAll(EntriesBulkAction)) {
            createBulkActionTasks(bulkAction, bulkActionsConfig).register(container);
        }

        // The bulk-action GraphQL is model-derived (per-tenant models are known only at request
        // time), so it's built in a RequestContextInitializer that registers CmsGraphQLSchemaFactory
        // instances — merged by the CMS schema build that runs after initializers.
        container.registerInstance(RequestContextInitializer, {
            async init(ctx: Record<string, any>) {
                const context = ctx as HcmsBulkActionsContext;
                await registerDefaultBulkActionGraphQL(context);
                for (const bulkAction of container.resolveAll(EntriesBulkAction)) {
                    await createBulkActionGraphQL(context, bulkAction);
                }
            }
        });
    }
});
