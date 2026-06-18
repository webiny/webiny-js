import { createContextPlugin } from "@webiny/api";
import {
    CreateIndexesTask,
    DataSynchronizationTask,
    ElasticsearchEnableIndexingTask,
    ElasticsearchReindexingTask,
    ElasticsearchSynchronize,
    ElasticsearchFetcher,
    ElasticsearchToDynamoDbSynchronization,
    Manager
} from "~/tasks/index.js";
import { IndexSettingsManager } from "~/settings/IndexSettingsManager.js";
import { DisableIndexing } from "~/settings/DisableIndexing.js";
import { EnableIndexing } from "~/settings/EnableIndexing.js";
import type { PluginCollection } from "@webiny/plugins/types.js";
import type { Context } from "~/types.js";

export const createElasticsearchBackgroundTasks = (): PluginCollection => {
    return [
        createContextPlugin<Context>(context => {
            context.container.register(Manager);
            context.container.register(IndexSettingsManager);
            context.container.register(DisableIndexing);
            context.container.register(EnableIndexing);
            context.container.register(ElasticsearchReindexingTask);
            context.container.register(ElasticsearchEnableIndexingTask);
            context.container.register(ElasticsearchSynchronize);
            context.container.register(ElasticsearchFetcher);
            context.container.register(ElasticsearchToDynamoDbSynchronization);
            context.container.register(DataSynchronizationTask);
            context.container.register(CreateIndexesTask);
        })
    ];
};

export * from "./abstractions/OpensearchTenantIndexFactory.js";
