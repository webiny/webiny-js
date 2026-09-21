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
import { createLambdaHandler, ApiGatewayFeature } from "@webiny/event-handler-aws";
import { ApiGatewayIdentityLoaderDecorator } from "~/handlers/ApiGatewayIdentityLoaderDecorator.js";
import { ApiGatewayTenantLoaderDecorator } from "~/handlers/ApiGatewayTenantLoaderDecorator.js";
import {
    registerInboundEventTypes,
    registerWebinyApiChild,
    registerWebinyApiRoot
} from "~/composition/index.js";
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

            // Every non-HTTP invocation shape (background tasks, EventBridge, scheduled actions,
            // WebSockets) with its handler. Kept in one function so the set is testable and an
            // inbound transport can't be half-wired.
            registerInboundEventTypes(container);

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
