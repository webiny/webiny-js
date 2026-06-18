import { createContextPlugin } from "@webiny/api";
import {
    createDataSynchronization,
    createEnableIndexingTask,
    createIndexesTaskDefinition,
    ElasticsearchReindexingTask
} from "~/tasks/index.js";
import type { PluginCollection } from "@webiny/plugins/types.js";
import type { Context, IElasticsearchTaskConfig } from "~/types.js";
import { DbRegistry } from "~/abstractions/DbRegistry.js";

export type CreateElasticsearchBackgroundTasksParams = Partial<IElasticsearchTaskConfig>;

export const createElasticsearchBackgroundTasks = (
    params?: CreateElasticsearchBackgroundTasksParams
): PluginCollection => {
    return [
        createContextPlugin<Context>(context => {
            // Register DbRegistry abstraction with the actual context.db.registry implementation
            // @ts-expect-error We are going to remove this DB client.
            context.container.registerInstance(DbRegistry, context.db.registry);

            context.container.register(ElasticsearchReindexingTask);
        }),
        createEnableIndexingTask(params),
        createIndexesTaskDefinition(params),
        createDataSynchronization(params)
    ];
};

export * from "./abstractions/OpensearchTenantIndexFactory.js";
