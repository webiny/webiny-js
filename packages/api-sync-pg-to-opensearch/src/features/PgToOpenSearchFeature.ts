import { createFeature } from "@webiny/feature/api";
import type { Client } from "@webiny/api-opensearch/client.js";
import { OperationsFactoryFeature } from "@webiny/api-sync-to-opensearch/features/Operations/feature.js";
import { ExecuteSyncFeature } from "@webiny/api-sync-to-opensearch/features/ExecuteSync/feature.js";
import { ExecuteSyncWithRetryFeature } from "@webiny/api-sync-to-opensearch/features/ExecuteSyncWithRetry/feature.js";
import { SynchronizationBuilderFeature } from "@webiny/api-sync-to-opensearch/features/SynchronizationBuilder/feature.js";
import { PgOperationsBuilderFeature } from "./PgOperationsBuilder/feature.js";
import { OpenSearchClientFeature } from "@webiny/api-opensearch/features/OpenSearchClient/feature.js";
import { CompressionFeature } from "@webiny/utils/features/compression/feature.js";

export interface PgToOpenSearchFeatureConfig {
    client: Client;
}

export const PgToOpenSearchFeature = createFeature<PgToOpenSearchFeatureConfig>({
    name: "sync.pg-to-opensearch",
    register(container, config) {
        OpenSearchClientFeature.register(container, config.client);
        CompressionFeature.register(container);

        OperationsFactoryFeature.register(container);
        ExecuteSyncFeature.register(container);
        ExecuteSyncWithRetryFeature.register(container);
        SynchronizationBuilderFeature.register(container);

        PgOperationsBuilderFeature.register(container);
    }
});
