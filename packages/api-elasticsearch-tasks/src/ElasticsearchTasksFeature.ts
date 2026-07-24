import { type Container, createFeature } from "@webiny/feature/api";
import { SearchIndexTasksFeature } from "@webiny/api-search-index-tasks";
import { SearchIndexTasksDdbOsFeature } from "@webiny/api-search-index-tasks-ddb-os";
import {
    DataSynchronizationTask,
    ElasticsearchSynchronize,
    ElasticsearchFetcher,
    ElasticsearchToDynamoDbSynchronization,
    Manager
} from "~/tasks/index.js";
import { IndexSettingsManager } from "~/settings/IndexSettingsManager.js";
import { DisableIndexing } from "~/settings/DisableIndexing.js";
import { EnableIndexing } from "~/settings/EnableIndexing.js";
import { IndexManagerFactory } from "~/settings/IndexManagerFactory.js";
import { OperationsFactoryFeature } from "@webiny/api-sync-to-opensearch/features/Operations/feature.js";
import { ExecuteSyncFeature } from "@webiny/api-sync-to-opensearch/features/ExecuteSync/feature.js";
import { ExecuteSyncWithRetryFeature } from "@webiny/api-sync-to-opensearch/features/ExecuteSyncWithRetry/feature.js";
import { SynchronizationBuilderFeature } from "@webiny/api-sync-to-opensearch/features/SynchronizationBuilder/feature.js";

export const ElasticsearchTasksFeature = createFeature({
    name: "ElasticsearchTasks",
    register(container: Container) {
        SearchIndexTasksFeature.register(container);
        SearchIndexTasksDdbOsFeature.register(container);

        OperationsFactoryFeature.register(container);
        ExecuteSyncFeature.register(container);
        ExecuteSyncWithRetryFeature.register(container);
        SynchronizationBuilderFeature.register(container);

        container.register(Manager);
        container.register(IndexSettingsManager);
        container.register(DisableIndexing);
        container.register(EnableIndexing);
        container.register(IndexManagerFactory);
        container.register(ElasticsearchSynchronize);
        container.register(ElasticsearchFetcher);
        container.register(ElasticsearchToDynamoDbSynchronization);
        container.register(DataSynchronizationTask);
    }
});
