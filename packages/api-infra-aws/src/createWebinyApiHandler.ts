/**
 * DI-native Webiny API handler for the AWS Lambda transport — storage-agnostic BASE.
 *
 * This is the composition root: it assembles the transport + every storage-agnostic API feature
 * onto the DI container in the correct (order-sensitive) sequence. The storage variant — which CMS
 * storage operations, whether OpenSearch is wired, etc. — is injected via `registerRootStorage` /
 * `registerRequestStorage` by a thin variant package (`@webiny/api-infra-aws-ddb`,
 * `@webiny/api-infra-aws-ddb-os`). Keeping the wiring here (a real, testable package) rather than in
 * an app template is what makes it unit/integration testable.
 */
import type { Container } from "@webiny/di";
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
import { HeadlessCmsFeature } from "@webiny/api-headless-cms";
import { MailerFeature } from "@webiny/api-mailer";
import { RecordLockingAppFeature } from "@webiny/api-record-locking";
import { AuditLogsFeature } from "@webiny/api-audit-logs";
import { WebhooksFeature } from "@webiny/webhooks/api";
import { AcoFeature } from "@webiny/api-aco";
import { AcoHcmsFeature } from "@webiny/api-headless-cms-aco";
import { BackgroundTasksFeature } from "@webiny/background-tasks/api";
import { HcmsTasksFeature } from "@webiny/api-headless-cms-tasks";
import { WebsocketsFeature, WebSocketLambdaHandler } from "@webiny/api-websockets";
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
import { ApiGatewayIdentityLoaderDecorator } from "~/handlers/ApiGatewayIdentityLoaderDecorator.js";
import { ApiGatewayTenantLoaderDecorator } from "~/handlers/ApiGatewayTenantLoaderDecorator.js";

export interface RegisterRootStorageContext {
    documentClient: ReturnType<typeof getDocumentClient>;
}

export interface CreateWebinyApiHandlerConfig {
    /**
     * Project-defined extensions, applied at register() time. This is the one project-specific
     * input; everything else is standard AWS/env wiring owned by this package.
     */
    extensions: () => Parameters<typeof registerExtensions>[1];
    /**
     * DynamoDB document client. Defaults to the standard AWS client (`getDocumentClient()`).
     * Injectable so integration tests can point the handler at a local (dynalite) DynamoDB.
     */
    documentClient?: ReturnType<typeof getDocumentClient>;
    /**
     * DynamoDB table name. Defaults to `process.env.DB_TABLE`. Injectable for tests.
     */
    dbTable?: string;
    /**
     * Register the storage-variant features in the ROOT container: the CMS storage operations, the
     * DDB storage registries, and (for the OpenSearch variant) the OpenSearch core. Supplied by the
     * variant package.
     */
    registerRootStorage: (
        container: Container,
        ctx: RegisterRootStorageContext
    ) => void | Promise<void>;
    /**
     * Register any request-phase storage features that must run BEFORE `HeadlessCmsFeature` builds
     * its storage — e.g. `DbRegistryFeature` for the DDB+ES variant. Optional (DDB-only needs none).
     */
    registerRequestStorage?: (container: Container) => void | Promise<void>;
}

export function createWebinyApiHandler(config: CreateWebinyApiHandlerConfig) {
    const documentClient = config.documentClient ?? getDocumentClient();
    const table = config.dbTable ?? process.env.DB_TABLE;

    return createLambdaHandler({
        root: async container => {
            // ── Transport ──────────────────────────────────────────────
            // ApiGatewayFeature registers the HTTP transport (event type + router + HttpFeature).
            ApiGatewayFeature.register(container);

            // ── Auth + tenant (extract → shared load) ──────────────────
            // These decorators depend on api-core (RequestIdentityLoader/RequestTenantLoader), so
            // they live in this composition layer, not event-handler-aws. registerDecorator applies
            // LATER registrations as the OUTER wrapper (whose execute() runs first). Identity must be
            // established before tenant, so register tenant first (inner) and identity last (outer)
            // → identity runs, then tenant, then the router.
            container.registerDecorator(ApiGatewayTenantLoaderDecorator);
            container.registerDecorator(ApiGatewayIdentityLoaderDecorator);

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

            // ── Identity providers ─────────────────────────────────────
            // Must be in root so the request auth step can authenticate
            // requests before the GraphQL engine runs.
            CognitoIdpFeature.register(container);

            // ── Storage (variant-specific: CMS storage ops, DDB registries, OpenSearch core) ──
            await config.registerRootStorage(container, { documentClient });
        },

        request: async container => {
            // ── Core API (per-request: EventPublisher + tenant/identity/request contexts must bind
            // to the request child container so per-request event handlers are resolvable) ─────────
            ApiCoreFeature.register(container, { wcpLicense: undefined });

            // ── Request-phase storage (variant-specific; must precede HeadlessCmsFeature) ──
            // e.g. DbRegistryFeature for DDB+ES: CMS storage beforeInit registers entities into it.
            await config.registerRequestStorage?.(container);

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
