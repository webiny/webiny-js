import { type Container, createFeature } from "@webiny/feature/api";
import {
    CreateIndexesTask,
    CreateIndexesTaskRunner,
    OnBeforeTrigger,
    DataSynchronizationTask,
    ElasticsearchEnableIndexingTask,
    EnableIndexingTaskRunner,
    ElasticsearchReindexingTask,
    ReindexingTaskRunner,
    ElasticsearchSynchronize,
    ElasticsearchFetcher,
    ElasticsearchToDynamoDbSynchronization,
    Manager
} from "~/tasks/index.js";
import { IndexSettingsManager } from "~/settings/IndexSettingsManager.js";
import { DisableIndexing } from "~/settings/DisableIndexing.js";
import { EnableIndexing } from "~/settings/EnableIndexing.js";
import { IndexManagerFactory } from "~/settings/IndexManagerFactory.js";

export const ElasticsearchTasksFeature = createFeature({
    name: "ElasticsearchTasks",
    register(container: Container) {
        container.register(Manager);
        container.register(IndexSettingsManager);
        container.register(DisableIndexing);
        container.register(EnableIndexing);
        container.register(IndexManagerFactory);
        container.register(ReindexingTaskRunner);
        container.register(ElasticsearchReindexingTask);
        container.register(EnableIndexingTaskRunner);
        container.register(ElasticsearchEnableIndexingTask);
        container.register(ElasticsearchSynchronize);
        container.register(ElasticsearchFetcher);
        container.register(ElasticsearchToDynamoDbSynchronization);
        container.register(DataSynchronizationTask);
        container.register(CreateIndexesTaskRunner);
        container.register(OnBeforeTrigger);
        container.register(CreateIndexesTask);
    }
});
