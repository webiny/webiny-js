/**
 * DI-native Webiny API handler for the AWS Lambda transport — storage-agnostic BASE.
 *
 * The ROOT container wires the AWS transport (API Gateway HTTP + auth/tenant loaders, background-task
 * and WebSocket Lambda invocations, DynamoDB, Cognito, storage). Everything that is not
 * transport-specific — database, identity providers, storage, and the transport-AGNOSTIC per-request
 * feature stack — lives in `composition/`, shared with the response-streaming handler
 * (`createWebinyStreamApiHandler`) so the two roots cannot drift. The storage variant is injected via
 * `registerRootStorage` / `registerRequestStorage` by a thin variant package
 * (`@webiny/api-event-handler-aws-ddb`, `-aws-ddb-os`). Keeping the wiring in real packages (not an app
 * template) is what makes it unit/integration testable.
 */
import { getDocumentClient } from "@webiny/aws-sdk/client-dynamodb/index.js";
import {
    createLambdaHandler,
    ApiGatewayFeature,
    BackgroundTaskEventType,
    EventBridgeEventType,
    WebSocketEventType
} from "@webiny/event-handler-aws";
import { BackgroundTasksAwsFeature } from "@webiny/background-tasks-aws";
import { BulkActionsEventBridgeLambdaHandlerFeature } from "@webiny/api-headless-cms-bulk-actions-aws";
import { ApiGatewayIdentityLoaderDecorator } from "~/handlers/ApiGatewayIdentityLoaderDecorator.js";
import { ApiGatewayTenantLoaderDecorator } from "~/handlers/ApiGatewayTenantLoaderDecorator.js";
import { registerWebinyApiChild, registerWebinyApiRoot } from "~/composition/index.js";
import type { WebinyApiCompositionConfig } from "~/composition/index.js";

export type { RegisterRootStorageContext } from "~/composition/index.js";

export type CreateWebinyApiHandlerConfig = WebinyApiCompositionConfig;

export function createWebinyApiHandler(config: CreateWebinyApiHandlerConfig) {
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

            // Resolved here rather than at factory time: one bundle exports BOTH this handler and the
            // streaming one, so building the client eagerly would open a second DynamoDB client on
            // every cold start. `root` runs once, lazily.
            await registerWebinyApiRoot(
                container,
                config,
                config.documentClient ?? getDocumentClient()
            );
        },

        child: async container => {
            await registerWebinyApiChild(container, config);
        }
    });
}
