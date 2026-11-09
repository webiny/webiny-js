import type { CreateWebinyApiHandlerConfig as BaseConfig } from "@webiny/api-event-handler-aws";
import { ApiCoreDdbFeature } from "@webiny/api-core-ddb";
import { HeadlessCmsDdbEsFeature } from "@webiny/api-headless-cms-ddb-es";
import { AuditLogsDdbFeature } from "@webiny/api-audit-logs-ddb";
import { AcoDdbFeature } from "@webiny/api-aco-ddb";
import { WebsocketsDdbFeature } from "@webiny/api-websockets-aws";
import { DbRegistryFeature } from "@webiny/db/exports/api/db.js";
import { type OpenSearchClientOptions } from "@webiny/api-opensearch";
import {
    createAwsOpenSearchClient,
    AwsOpenSearchClientFactoryFeature
} from "@webiny/api-opensearch-aws";
import { OpenSearchClientFeature } from "@webiny/api-opensearch/features/OpenSearchClient/feature.js";
import { OpenSearchQueryBuilderOperatorFeature } from "@webiny/api-opensearch/features/OpenSearchQueryBuilderOperator/feature.js";
import { OpenSearchFieldFeature } from "@webiny/api-opensearch/features/OpenSearchField/feature.js";
import { OpenSearchIndexFeature } from "@webiny/api-opensearch/features/OpenSearchIndex/feature.js";

export type CreateAwsDdbOsApiHandlerConfig = Pick<BaseConfig, "extensions" | "documentClient"> & {
    /**
     * OpenSearch client. Defaults to one built from `OPENSEARCH_*` env vars. Injectable so
     * integration tests can point the handler at a local OpenSearch.
     */
    openSearchClient?: ReturnType<typeof createAwsOpenSearchClient>;
};

const openSearchClientFromEnv = () => {
    const osUsername = process.env.OPENSEARCH_USERNAME;
    const osPassword = process.env.OPENSEARCH_PASSWORD;

    const openSearchClientOptions: OpenSearchClientOptions = {
        endpoint: `https://${process.env.OPENSEARCH_ENDPOINT}`
    };
    // Basic auth for local / self-managed OpenSearch; when absent the client falls back to AWS SigV4.
    if (osUsername && osPassword) {
        openSearchClientOptions.auth = {
            username: osUsername,
            password: osPassword
        };
    }

    return createAwsOpenSearchClient(openSearchClientOptions);
};

/**
 * The storage half of the composition, shared by the buffered and the response-streaming entry points
 * so the two Lambda functions built from this bundle cannot drift.
 */
export function storageConfig(
    config: CreateAwsDdbOsApiHandlerConfig
): Pick<BaseConfig, "extensions" | "documentClient" | "registerRootStorage"> {
    return {
        extensions: config.extensions,
        documentClient: config.documentClient,
        registerRootStorage: (container, { documentClient }) => {
            // Built here rather than at factory time: one bundle exports both the buffered and the
            // streaming handler, so an eager client would be created twice per cold start.
            const openSearchClient = config.openSearchClient ?? openSearchClientFromEnv();

            // ── OpenSearch core (client + query-builder operators + fields + index registries) ──
            // The DDB+ES CMS storage factory resolves all of these.
            OpenSearchClientFeature.register(container, openSearchClient);
            AwsOpenSearchClientFactoryFeature.register(container);
            OpenSearchQueryBuilderOperatorFeature.register(container);
            OpenSearchFieldFeature.register(container);
            OpenSearchIndexFeature.register(container);

            // DbRegistry holds the DDB entities the DDB+ES CMS storage stages for OpenSearch sync. It is
            // container scoped; the CMS storage adds its entities to every request's registry.
            DbRegistryFeature.register(container);

            ApiCoreDdbFeature.register(container, { documentClient });
            // CMS uses the DynamoDB+OpenSearch storage operations; the rest stay DynamoDB-only.
            HeadlessCmsDdbEsFeature.register(container);
            AuditLogsDdbFeature.register(container, {});
            AcoDdbFeature.register(container);
            WebsocketsDdbFeature.register(container);
        }
    };
}
