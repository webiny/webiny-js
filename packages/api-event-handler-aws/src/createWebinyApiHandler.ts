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
import {
    createLambdaHandler,
    ApiGatewayFeature,
    BackgroundTaskEventType,
    EventBridgeEventType,
    WebSocketEventType
} from "@webiny/event-handler-aws";
import { BackgroundTasksAwsFeature } from "@webiny/background-tasks-aws";
import { registerExtensions } from "@webiny/handler";
import { DynamoDBCoreFeature } from "@webiny/db-dynamodb";
import { registerApiRequestStack } from "@webiny/api-event-handler-core";
import { WebsocketsAwsFeature } from "@webiny/api-websockets-aws";
import { SchedulerAwsFeature } from "@webiny/api-scheduler-aws";
import { FileManagerS3Feature } from "@webiny/api-file-manager-s3";
// CognitoIdpFeature must be in the root container so the request auth step
// (ApiGatewayIdentityLoaderDecorator → RequestIdentityLoader) sees CognitoIdentityProvider
// when it is first instantiated. Extensions register in the child/request container — too late.
import { CognitoIdpFeature } from "@webiny/cognito/api/features/CognitoIdp/feature.js";
import { BulkActionsEventBridgeLambdaHandlerFeature } from "@webiny/api-headless-cms-bulk-actions-aws";
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

    return createLambdaHandler({
        root: async container => {
            // ── Transport ──────────────────────────────────────────────
            // ApiGatewayFeature registers the HTTP transport (event type + router + HttpFeature).
            ApiGatewayFeature.register(container);

            // ── Tenant + auth (extract → shared load) ──────────────────
            // These decorators depend on api-core (RequestTenantLoader/RequestIdentityLoader), so
            // they live in this composition layer, not event-handler-aws. registerDecorator applies
            // LATER registrations as the OUTER wrapper (whose execute() runs first). TENANT must be
            // established before IDENTITY: API-key authentication resolves the key by tenant partition
            // (ApiKeysRepository reads TenantContext.getTenant()), so identity establishment depends on
            // the tenant. The reverse is not true — RequestTenantLoader has no identity dependency. So
            // register identity first (inner) and tenant last (outer) → tenant runs, then identity,
            // then the router.
            container.registerDecorator(ApiGatewayIdentityLoaderDecorator);
            container.registerDecorator(ApiGatewayTenantLoaderDecorator);

            // Background task invocations (Step Functions → Lambda directly). BackgroundTasksAwsFeature
            // registers the Lambda handler + StepFunctionService (the AWS dispatch transport).
            container.register(BackgroundTaskEventType);
            BackgroundTasksAwsFeature.register(container);

            // EventBridge invocations (e.g. scheduled empty-trash-bin). Without the event type the
            // dispatcher can't match an EventBridge-shaped event; without the handler the container
            // can't resolve EventBridgeEventHandler.
            container.register(EventBridgeEventType);
            BulkActionsEventBridgeLambdaHandlerFeature.register(container);

            // WebSocket invocations (API Gateway WebSocket → this Lambda: $connect/$disconnect/$default).
            // Without the event type + handler, the DI dispatcher can't match a WS event ("No event type
            // matched") so $connect fails and no connection is ever registered → no server→client push.
            container.register(WebSocketEventType);

            // ── Database ───────────────────────────────────────────────
            DynamoDBCoreFeature.register(container, {
                documentClient
            });

            // ── Identity providers ─────────────────────────────────────
            // Must be in root so the request auth step can authenticate
            // requests before the GraphQL engine runs.
            CognitoIdpFeature.register(container);

            // ── Storage (variant-specific: CMS storage ops, DDB registries, OpenSearch core) ──
            await config.registerRootStorage(container, { documentClient });
        },

        request: async container => {
            // The per-request feature stack is transport-agnostic (shared with the server transport).
            // The AWS-specific interleave points are supplied as the `transports` adapters.
            await registerApiRequestStack(container, {
                extensions: config.extensions,
                registerRequestStorage: config.registerRequestStorage,
                transports: {
                    // Real AWS WebSocket transport (API Gateway Management API), registered right after
                    // WebsocketsFeature so it overrides the NullWebsocketsTransport.
                    realtime: c => {
                        WebsocketsAwsFeature.register(c);
                    },
                    // Scheduler transport: the scheduler-aws extension (EventBridge Scheduler).
                    scheduler: c => {
                        SchedulerAwsFeature.register(c);
                    },
                    // File-manager storage transport: S3 (asset delivery + S3 file operations + schema).
                    fileManager: c => {
                        FileManagerS3Feature.register(c, {});
                    }
                }
            });
        }
    });
}
