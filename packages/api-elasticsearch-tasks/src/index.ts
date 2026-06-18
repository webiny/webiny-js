import { createContextPlugin } from "@webiny/api";
import {
    CreateIndexesTask,
    DataSynchronizationTask,
    ElasticsearchEnableIndexingTask,
    ElasticsearchReindexingTask,
    ElasticsearchSynchronize
} from "~/tasks/index.js";
import type { PluginCollection } from "@webiny/plugins/types.js";
import type { Context } from "~/types.js";

export const createElasticsearchBackgroundTasks = (): PluginCollection => {
    return [
        createContextPlugin<Context>(context => {
            context.container.register(ElasticsearchReindexingTask);
            context.container.register(ElasticsearchEnableIndexingTask);
            context.container.register(ElasticsearchSynchronize);
            context.container.register(DataSynchronizationTask);
            context.container.register(CreateIndexesTask);
        })
    ];
};

export * from "./abstractions/OpensearchTenantIndexFactory.js";
