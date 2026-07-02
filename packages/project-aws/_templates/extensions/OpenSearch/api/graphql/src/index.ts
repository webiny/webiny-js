/**
 * DI-native API GraphQL handler — OpenSearch (DDB+ES) variant.
 *
 * Identical to the default DDB handler, except CMS storage uses the DynamoDB+OpenSearch storage
 * operations (HeadlessCmsDdbEsFeature) and the OpenSearch client is registered in the root container.
 * The OpenSearch extension's ReplaceApiLambdaFnHandlers copies this file over the api workspace when
 * OpenSearch is enabled.
 */
import { getDocumentClient } from "@webiny/aws-sdk/client-dynamodb/index.js";
import { createSchedulerClient } from "@webiny/aws-sdk/client-scheduler/index.js";
import {
    createLambdaHandler,
    ApiGatewayFeature,
    BackgroundTaskEventType,
    WebSocketEventType
} from "@webiny/event-handler-aws";
import { BackgroundTaskLambdaHandler } from "@webiny/background-tasks/api";
import { registerLegacyPluginsViaGqlContextualSchema } from "@webiny/handler-graphql";
import { registerExtensions } from "@webiny/handler";
import { GraphQLEngineFeature } from "@webiny/handler-graphql";
import { DbFeature } from "@webiny/handler-db";
import { DbRegistryFeature } from "@webiny/db/exports/api/db.js";
import { ApiCoreFeature } from "@webiny/api-core";
import { ApiCoreDdbFeature } from "@webiny/api-core-ddb";
import { createOpenSearchClient, type OpenSearchClientOptions } from "@webiny/api-opensearch";
import { OpenSearchClientFeature } from "@webiny/api-opensearch/features/OpenSearchClient/feature.js";
import { OpenSearchClientFactoryFeature } from "@webiny/api-opensearch/features/OpenSearchClientFactory/feature.js";
import { OpenSearchQueryBuilderOperatorFeature } from "@webiny/api-opensearch/features/OpenSearchQueryBuilderOperator/feature.js";
import { OpenSearchFieldFeature } from "@webiny/api-opensearch/features/OpenSearchField/feature.js";
import { OpenSearchIndexFeature } from "@webiny/api-opensearch/features/OpenSearchIndex/feature.js";
import { HeadlessCmsFeature } from "@webiny/api-headless-cms";
import { HeadlessCmsDdbEsFeature } from "@webiny/api-headless-cms-ddb-es";
import { MailerFeature } from "@webiny/api-mailer";
import { RecordLockingAppFeature } from "@webiny/api-record-locking";
import { AuditLogsFeature } from "@webiny/api-audit-logs";
import { AuditLogsDdbFeature } from "@webiny/api-audit-logs-ddb";
import { WebhooksFeature } from "@webiny/webhooks/api";
import { AcoFeature } from "@webiny/api-aco";
import { AcoDdbFeature } from "@webiny/api-aco-ddb";
import { AcoHcmsFeature } from "@webiny/api-headless-cms-aco";
import { BackgroundTasksFeature } from "@webiny/background-tasks/api";
import { HcmsTasksFeature } from "@webiny/api-headless-cms-tasks";
import { WebsocketsFeature, WebSocketLambdaHandler } from "@webiny/api-websockets";
import { WebsocketsDdbFeature } from "@webiny/api-websockets-ddb";
import { WebsocketsAwsFeature } from "@webiny/api-websockets-aws";
import { WorkflowsFeature } from "@webiny/api-workflows";
import { CmsWorkflowsFeature } from "@webiny/api-headless-cms-workflows";
import { WebsiteBuilderWorkflowsFeature } from "@webiny/api-website-builder-workflows";
import { SchedulerFeature } from "@webiny/api-scheduler";
import { registerSchedulerAwsExtension } from "@webiny/api-scheduler-aws";
import { CmsSchedulerFeature } from "@webiny/api-headless-cms-scheduler";
import { WebsiteBuilderSchedulerFeature } from "@webiny/api-website-builder-scheduler";
import { FileManagerAppFeature } from "@webiny/api-file-manager";
import { FileManagerAcoFeature } from "@webiny/api-file-manager-aco";
import { FileManagerS3Feature } from "@webiny/api-file-manager-s3";
import { WebsiteBuilderFeature, setupWebsiteBuilderModels } from "@webiny/api-website-builder";
// CognitoIdpFeature must be in the root container so the request auth step
// (ApiGatewayIdentityLoaderDecorator → RequestIdentityLoader) sees CognitoIdentityProvider
// when it is first instantiated. Extensions register in the child/request container — too late.
import { CognitoIdpFeature } from "@webiny/cognito/api/features/CognitoIdp/feature.js";

import { extensions } from "./extensions";

const documentClient = getDocumentClient();

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

const openSearchClient = createOpenSearchClient(openSearchClientOptions);

export const handler = createLambdaHandler({
    root: async container => {
        // ── Transport ──────────────────────────────────────────────
        // ApiGatewayFeature registers the HTTP transport + auth/tenant establishment.
        ApiGatewayFeature.register(container);

        // Background task invocations (Step Functions → Lambda directly)
        container.register(BackgroundTaskEventType);
        container.register(BackgroundTaskLambdaHandler);

        // WebSocket invocations (API Gateway WebSocket → this Lambda: $connect/$disconnect/$default).
        container.register(WebSocketEventType);
        container.register(WebSocketLambdaHandler);

        // ── Database ───────────────────────────────────────────────
        DbFeature.register(container, {
            documentClient,
            table: process.env.DB_TABLE
        });

        // ── OpenSearch core (client + query-builder operators + fields + index registries) ──
        // Mirrors registerOpenSearchCore(); the DDB+ES CMS storage factory resolves all of these.
        OpenSearchClientFeature.register(container, openSearchClient);
        OpenSearchClientFactoryFeature.register(container);
        OpenSearchQueryBuilderOperatorFeature.register(container);
        OpenSearchFieldFeature.register(container);
        OpenSearchIndexFeature.register(container);

        // ── Core API storage (root: DDB storage-ops factory; ApiCoreFeature itself is
        // registered per-request below) ─────────────────────────────
        ApiCoreDdbFeature.register(container, { documentClient });

        // ── Identity providers ─────────────────────────────────────
        // Must be in root so the request auth step can authenticate
        // requests before the GraphQL engine runs.
        CognitoIdpFeature.register(container);

        // ── Storage registries ─────────────────────────────────────
        // CMS uses the DynamoDB+OpenSearch storage operations; the rest stay DynamoDB-only.
        HeadlessCmsDdbEsFeature.register(container);
        AuditLogsDdbFeature.register(container, {});
        AcoDdbFeature.register(container);
        WebsocketsDdbFeature.register(container);
    },

    request: async container => {
        // ── Core API (per-request: EventPublisher + tenant/identity/request contexts must bind
        // to the request child container so per-request event handlers are resolvable) ─────────
        ApiCoreFeature.register(container, { wcpLicense: undefined });

        // DbRegistry holds the DDB entities the DDB+ES CMS storage stages for OpenSearch sync
        // (its beforeInit registers into it). The DI DbFeature doesn't register it (only the legacy
        // handler-db plugin did), and the DDB-only path never needs it — so the OS variant must.
        DbRegistryFeature.register(container);

        // ── CMS ────────────────────────────────────────────────────
        HeadlessCmsFeature.register(container, { type: "manage" });
        AcoFeature.register(container);
        AcoHcmsFeature.register(container);
        HcmsTasksFeature.register(container);

        // ── File Manager ───────────────────────────────────────────
        FileManagerAppFeature.register(container);
        FileManagerAcoFeature.register(container);
        FileManagerS3Feature.register(container, {});

        // ── Website Builder ────────────────────────────────────────
        WebsiteBuilderFeature.register(container);
        await setupWebsiteBuilderModels(container);
        WebsiteBuilderWorkflowsFeature.register(container);
        WebsiteBuilderSchedulerFeature.register(container);

        // ── Websockets ─────────────────────────────────────────────
        WebsocketsFeature.register(container);
        // Real AWS transport (API Gateway Management API). MUST register after WebsocketsFeature so
        // it overrides the NullWebsocketsTransport (nearest-container-last-wins); otherwise every
        // server→client send() is a silent no-op.
        WebsocketsAwsFeature.register(container);

        // ── Supporting services ────────────────────────────────────
        MailerFeature.register(container);
        RecordLockingAppFeature.register(container, {});
        AuditLogsFeature.register(container, {});
        WebhooksFeature.register(container);
        BackgroundTasksFeature.register(container);

        // ── Workflows ──────────────────────────────────────────────
        WorkflowsFeature.register(container);
        CmsWorkflowsFeature.register(container);

        // ── Scheduler ──────────────────────────────────────────────
        SchedulerFeature.register(container);
        registerLegacyPluginsViaGqlContextualSchema(container, [
            ...registerSchedulerAwsExtension({ getClient: config => createSchedulerClient(config) })
        ]);
        CmsSchedulerFeature.register(container);

        // ── Extensions ─────────────────────────────────────────────
        // Apply at register() time (not via a post-auth initializer) so extension features —
        // including code-defined CMS models (ModelFactory), e.g. Languages — are registered before
        // any initializer (e.g. ACO) lists + caches the per-request model set.
        await registerExtensions(container, extensions());

        // ── GraphQL engine (always last) ───────────────────────────
        GraphQLEngineFeature.register(container);
    }
});
