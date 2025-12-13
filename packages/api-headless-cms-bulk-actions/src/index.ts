import { createHandlers } from "~/handlers/index.js";
import { createDefaultGraphQL } from "~/plugins/index.js";
import { createBeforeHandlerPlugin } from "@webiny/handler/plugins/BeforeHandlerPlugin.js";
import { EntryBulkAction } from "~/features/EntryBulkAction/abstractions.js";
import { BulkActionContext } from "~/features/BulkActionContext/index.js";
import { createBulkActionTasks } from "~/features/EntryBulkAction/createBulkActionTasks.js";

export type * from "./abstractions/index.js";
export * from "./handlers/index.js";
export * from "./useCases/index.js";
export * from "./plugins/index.js";
export * from "./tasks/index.js";

export const createHcmsBulkActions = () => [
    createHandlers(),
    createDefaultGraphQL(),
    // Set up bulk actions after the context is bootstrapped, but before actual handler processing
    createBeforeHandlerPlugin(context => {
        context.container.registerInstance(BulkActionContext, context);

        // 1. Resolve all BulkAction implementations
        const bulkActions = context.container.resolveAll(EntryBulkAction);

        // 2. For each EntryBulkAction, create and register tasks
        for (const bulkAction of bulkActions) {
            const tasks = createBulkActionTasks(bulkAction);

            // 3. Register each task
            for (const task of tasks) {
                context.container.register(task);
            }
        }
    })
];
