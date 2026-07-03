/**
 * DI-native Webiny API GraphQL handler for the AWS Lambda transport.
 *
 * This is the composition root — it assembles every API feature onto the DI container in the
 * correct order. It lives in a real package (not an app template) so the wiring is unit/integration
 * testable: a test can boot this handler against fresh storage and exercise install/GraphQL without
 * a full deploy. The app template becomes a thin shim that calls `createWebinyApiHandler`.
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
import { ApiCoreFeature } from "@webiny/api-core";
import { ApiCoreDdbFeature } from "@webiny/api-core-ddb";
import { HeadlessCmsFeature } from "@webiny/api-headless-cms";
import { HeadlessCmsDdbFeature } from "@webiny/api-headless-cms-ddb";
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

export interface CreateWebinyApiHandlerConfig {
    /**
     * Project-defined extensions, applied at register() time. This is the one project-specific
     * input; everything else is standard AWS/env wiring owned by this package.
     */
    extensions: () => Parameters<typeof registerExtensions>[1];
    /**
     * DynamoDB document client. Defaults to the standard AWS client (`getDocumentClient()`).
     * Injectable so integration tests can point the handler at a local DynamoDB.
     */
    documentClient?: ReturnType<typeof getDocumentClient>;
    /**
     * DynamoDB table name. Defaults to `process.env.DB_TABLE`. Injectable for tests.
     */
    dbTable?: string;
}

export function createWebinyApiHandler(config: CreateWebinyApiHandlerConfig) {
    const documentClient = config.documentClient ?? getDocumentClient();
    const table = config.dbTable ?? process.env.DB_TABLE;

    return createLambdaHandler({
        root: async container => {
            // ── Transport ──────────────────────────────────────────────
            // ApiGatewayFeature registers the HTTP transport + auth/tenant establishment.
            ApiGatewayFeature.register(container);

            // Background task invocations (Step Functions → Lambda directly)
            container.register(BackgroundTaskEventType);
            container.register(BackgroundTaskLambdaHandler);

            // WebSocket invocations (API Gateway WebSocket → this Lambda: $connect/$disconnect/$default).
            // Without the event type + handler, the DI dispatcher can't match a WS event ("No event type
            // matched") so $connect fails and no connection is ever registered → no server→client push.
            container.register(WebSocketEventType);
            container.register(WebSocketLambdaHandler);

            // ── Database ───────────────────────────────────────────────
            DbFeature.register(container, {
                documentClient,
                table
            });

            // ── Core API storage (root: DDB storage-ops factory; ApiCoreFeature itself is
            // registered per-request below) ─────────────────────────────
            ApiCoreDdbFeature.register(container, { documentClient });

            // ── Identity providers ─────────────────────────────────────
            // Must be in root so the request auth step can authenticate
            // requests before the GraphQL engine runs.
            CognitoIdpFeature.register(container);

            // ── DDB storage registries ─────────────────────────────────
            HeadlessCmsDdbFeature.register(container);
            AuditLogsDdbFeature.register(container, {});
            AcoDdbFeature.register(container);
            WebsocketsDdbFeature.register(container);
        },

        request: async container => {
            // ── Core API (per-request: EventPublisher + tenant/identity/request contexts must bind
            // to the request child container so per-request event handlers are resolvable) ─────────
            ApiCoreFeature.register(container, { wcpLicense: undefined });

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
                ...registerSchedulerAwsExtension({
                    getClient: schedulerConfig => createSchedulerClient(schedulerConfig)
                })
            ]);
            CmsSchedulerFeature.register(container);

            // ── Extensions ─────────────────────────────────────────────
            // Apply at register() time (not via a post-auth initializer) so extension features —
            // including code-defined CMS models (ModelFactory), e.g. Languages — are registered before
            // any initializer (e.g. ACO) lists + caches the per-request model set.
            await registerExtensions(container, config.extensions());

            // ── GraphQL engine (always last) ───────────────────────────
            GraphQLEngineFeature.register(container);
        }
    });
}
