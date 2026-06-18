import { createContextPlugin } from "@webiny/api";
import {
    CreateIndexesTask,
    DataSynchronizationTask,
    ElasticsearchEnableIndexingTask,
    ElasticsearchReindexingTask
} from "~/tasks/index.js";
import type { PluginCollection } from "@webiny/plugins/types.js";
import type { Context } from "~/types.js";
import { DbRegistry } from "~/abstractions/DbRegistry.js";

export const createElasticsearchBackgroundTasks = (): PluginCollection => {
    return [
        createContextPlugin<Context>(context => {
            // @ts-expect-error We are going to remove this DB client.
            context.container.registerInstance(DbRegistry, context.db.registry);

            context.container.register(ElasticsearchReindexingTask);
            context.container.register(ElasticsearchEnableIndexingTask);
            context.container.register(DataSynchronizationTask);
            context.container.register(CreateIndexesTask);
        })
    ];
};

export * from "./abstractions/OpensearchTenantIndexFactory.js";
