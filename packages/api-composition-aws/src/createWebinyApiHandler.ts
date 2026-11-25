/**
 * DI-native Webiny API handler for the AWS Lambda transport — storage-agnostic BASE.
 *
 * The ROOT container wires the AWS transport (API Gateway HTTP + auth/tenant loaders, background-task
 * and WebSocket Lambda invocations, storage). Everything that is not
 * transport-specific — identity providers, storage, and the transport-AGNOSTIC per-request
 * feature stack — lives in `composition/`, shared with the response-streaming handler
 * (`createWebinyStreamApiHandler`) so the two roots cannot drift. The storage variant, database
 * included, is injected via `registerRootStorage` by a thin variant package
 * (`@webiny/api-composition-aws-ddb`, `-aws-ddb-os`). Keeping the wiring in real packages (not an app
 * template) is what makes it unit/integration testable.
 */
import { createLambdaHandler, ApiGatewayFeature } from "@webiny/api-kernel-aws";
import { registerHttpTransport } from "@webiny/api-composition-core";
import {
    registerInboundInputTypes,
    registerWebinyApiChild,
    registerWebinyApiRoot
} from "~/composition/index.js";
import type { WebinyApiCompositionConfig } from "~/composition/index.js";

export type CreateWebinyApiHandlerConfig = WebinyApiCompositionConfig;

export function createWebinyApiHandler(config: CreateWebinyApiHandlerConfig) {
    return createLambdaHandler({
        root: async container => {
            // ── Transport ──────────────────────────────────────────────
            // ApiGatewayFeature registers the HTTP transport (event type + router + HttpFeature).
            // registerHttpTransport also registers the tenant, identity and preview-as loading.
            registerHttpTransport(container, ApiGatewayFeature);

            // Every non-HTTP invocation shape (background tasks, EventBridge, scheduled actions,
            // WebSockets) with its handler. Kept in one function so the set is testable and an
            // inbound transport can't be half-wired.
            registerInboundInputTypes(container);

            await registerWebinyApiRoot(container, config);
        },

        child: async container => {
            await registerWebinyApiChild(container, config);
        }
    });
}
