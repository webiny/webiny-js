import { createContextPlugin } from "@webiny/api";
import {
    createDataSynchronization,
    createElasticsearchReindexingTask,
    createEnableIndexingTask,
    createIndexesTaskDefinition
} from "~/tasks/index.js";
import type { PluginCollection } from "@webiny/plugins/types.js";
import type { Context, IElasticsearchTaskConfig } from "~/types.js";
import { DbRegistry } from "~/abstractions/DbRegistry.js";
import { SynchronizationContext } from "~/abstractions/SynchronizationContext.js";

export type CreateElasticsearchBackgroundTasksParams = Partial<IElasticsearchTaskConfig>;

export const createElasticsearchBackgroundTasks = (
    params?: CreateElasticsearchBackgroundTasksParams
): PluginCollection => {
    return [
        createContextPlugin<Context>(context => {
            // Register DbRegistry abstraction with the actual context.db.registry implementation
            // @ts-expect-error We are going to remove this DB client.
            context.container.registerInstance(DbRegistry, context.db.registry);

            context.container.registerInstance(SynchronizationContext, {
                elasticsearch: context.elasticsearch
            });
        }),
        createElasticsearchReindexingTask(params),
        createEnableIndexingTask(params),
        createIndexesTaskDefinition(params),
        createDataSynchronization(params)
    ];
};

export * from "./abstractions/OpensearchTenantIndexFactory.js";
