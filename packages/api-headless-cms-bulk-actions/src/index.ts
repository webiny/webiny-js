import { createHandlers } from "~/handlers/index.js";
import { createBeforeHandlerPlugin } from "@webiny/handler/plugins/BeforeHandlerPlugin.js";
import { EntryBulkAction } from "~/features/EntryBulkAction/abstractions.js";
import { BulkActionContext } from "~/features/BulkActionContext/index.js";
import { createBulkActionTasks } from "~/features/EntryBulkAction/createBulkActionTasks.js";
import { createDefaultGraphQL } from "~/graphql/createDefaultGraphQL.js";
import { createBulkActionGraphQL } from "~/graphql/createBulkActionGraphQL.js";
import { createContextPlugin } from "@webiny/api";
import { DeleteEntriesBulkActionFeature } from "~/features/DeleteEntriesBulkAction/feature.js";
import { MoveToFolderBulkActionFeature } from "~/features/MoveToFolderBulkAction/feature.js";
import { MoveToTrashBulkActionFeature } from "~/features/MoveToTrashBulkAction/feature.js";
import { PublishEntriesBulkActionFeature } from "~/features/PublishEntriesBulkAction/feature.js";
import { UnpublishEntriesBulkActionFeature } from "~/features/UnpublishEntriesBulkAction/feature.js";

export type * from "./abstractions/index.js";
export * from "./handlers/index.js";
export * from "./useCases/index.js";
export * from "./tasks/index.js";

export const createHcmsBulkActions = () => [
    createHandlers(),
    createDefaultGraphQL(),
    createContextPlugin(context => {
        DeleteEntriesBulkActionFeature.register(context.container);
        MoveToFolderBulkActionFeature.register(context.container);
        MoveToTrashBulkActionFeature.register(context.container);
        PublishEntriesBulkActionFeature.register(context.container);
        UnpublishEntriesBulkActionFeature.register(context.container);
    }),
    // Set up bulk actions after the context is bootstrapped, but before actual handler processing
    createBeforeHandlerPlugin(context => {
        context.container.registerInstance(BulkActionContext, context);

        const bulkActions = context.container.resolveAll(EntryBulkAction);

        // 2. For each EntryBulkAction, create and register tasks + GraphQL schema
        for (const bulkAction of bulkActions) {
            // Register tasks implementation
            const feature = createBulkActionTasks(bulkAction);
            feature.register(context.container);
            // Register GraphQL schema
            createBulkActionGraphQL(bulkAction);
        }
    })
];
