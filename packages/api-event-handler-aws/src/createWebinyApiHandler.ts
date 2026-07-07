/**
 * DI-native Webiny API handler for the AWS Lambda transport — storage-agnostic BASE.
 *
 * The ROOT container wires the AWS transport (API Gateway HTTP + auth/tenant loaders, background-task
 * and WebSocket Lambda invocations, DynamoDB, Cognito, storage). The per-request feature stack is the
 * transport-AGNOSTIC `registerApiRequestStack` from `@webiny/api-event-handler-core`, with the two
 * AWS-specific interleave points supplied as hooks (real-time WebSockets transport + scheduler
 * transport). The storage variant is injected via `registerRootStorage` / `registerRequestStorage`
 * by a thin variant package (`@webiny/api-event-handler-aws-ddb`, `-aws-ddb-os`). Keeping the wiring
 * in real packages (not an app template) is what makes it unit/integration testable.
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
import { BackgroundTasksAwsFeature } from "@webiny/background-tasks-aws";
import { registerLegacyPluginsViaGqlContextualSchema } from "@webiny/handler-graphql";
import { registerExtensions } from "@webiny/handler";
import { DbFeature } from "@webiny/handler-db";
import { registerApiRequestStack } from "@webiny/api-event-handler-core";
import { WebsocketsAwsFeature } from "@webiny/api-websockets-aws";
import { registerSchedulerAwsExtension } from "@webiny/api-scheduler-aws";
import { WebSocketLambdaHandler } from "@webiny/api-websockets";
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

            // Background task invocations (Step Functions → Lambda directly). BackgroundTasksAwsFeature
            // registers the Lambda handler + StepFunctionService (the AWS dispatch transport).
            container.register(BackgroundTaskEventType);
            BackgroundTasksAwsFeature.register(container);

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
            // The per-request feature stack is transport-agnostic (shared with the future server
            // transport). The two AWS-specific interleave points are supplied as hooks.
            await registerApiRequestStack(container, {
                extensions: config.extensions,
                registerRequestStorage: config.registerRequestStorage,
                // Real AWS WebSocket transport (API Gateway Management API), registered right after
                // WebsocketsFeature so it overrides the NullWebsocketsTransport.
                registerRealtimeTransport: c => {
                    WebsocketsAwsFeature.register(c);
                },
                // Scheduler transport: bridge the scheduler-aws extension (EventBridge Scheduler).
                registerSchedulerTransport: c => {
                    registerLegacyPluginsViaGqlContextualSchema(c, [
                        ...registerSchedulerAwsExtension({
                            getClient: schedulerConfig => createSchedulerClient(schedulerConfig)
                        })
                    ]);
                }
            });
        }
    });
}
