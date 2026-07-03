/**
 * EXPERIMENTAL — Webiny API handler for the self-hosted Node HTTP server transport.
 *
 * This package exists to (a) prove `@webiny/api-event-handler-core`'s `registerApiRequestStack` is
 * genuinely transport-agnostic — note it is called below with NEITHER the realtime nor the scheduler
 * hook, since those are AWS-specific (API Gateway WebSockets / EventBridge Scheduler) and a plain
 * server has no equivalent; the hooks being optional is exactly the point — and (b) give a starting
 * point for a productized server transport.
 *
 * ⚠️ NOT YET DEPLOYABLE. The Node transport in `@webiny/event-handler-server` is incomplete:
 *   1. ROUTING TERMINAL — `NodeHttpTranslator` translates IncomingMessage → IHttpRequest and calls
 *      next(), but there is no Node equivalent of AWS's `ApiGatewayHttpRouterHandler` that dispatches
 *      the IHttpRequest through the HttpRouter and translates the IHttpResponse back. Until that
 *      exists, requests are translated but not routed to HttpRoutes.
 *   2. AUTH / TENANT LOADERS — the AWS transport has ApiGateway{Identity,Tenant}LoaderDecorator that
 *      extract the token / x-tenant from the event. Node equivalents (reading IncomingMessage headers)
 *      do not exist yet, so identity/tenant are not established here.
 * Both are transport primitives that belong in `@webiny/event-handler-server`, not composition here.
 * No app template wires this handler; it is not on any deploy path.
 */
import type { Container } from "@webiny/di";
import {
    createNodeHandler,
    NodeHttpEventType,
    NodeHttpTranslator
} from "@webiny/event-handler-server";
import { HttpFeature } from "@webiny/event-handler-core";
import { registerExtensions } from "@webiny/handler";
import { registerApiRequestStack } from "@webiny/api-event-handler-core";

export interface CreateWebinyApiHandlerConfig {
    /**
     * Project-defined extensions, applied at register() time.
     */
    extensions: () => Parameters<typeof registerExtensions>[1];
    /**
     * Register ALL root-container storage for this deployment (the DB feature + CMS storage ops +
     * registries). Unlike the AWS base, the server base bakes in no DynamoDB assumption — the
     * variant supplies the complete storage wiring (e.g. DDB or SQL).
     */
    registerRootStorage: (container: Container) => void | Promise<void>;
    /**
     * Request-phase storage features that must run before HeadlessCmsFeature builds (optional).
     */
    registerRequestStorage?: (container: Container) => void | Promise<void>;
}

export function createWebinyApiHandler(config: CreateWebinyApiHandlerConfig) {
    return createNodeHandler({
        root: async container => {
            // ── Transport (Node HTTP) ──────────────────────────────────
            container.register(NodeHttpEventType);
            container.register(NodeHttpTranslator);
            // HTTP routing infrastructure (HttpRouter + RequestContextInitializerDecorator).
            HttpFeature.register(container);

            // TODO(server-transport): auth/tenant loader decorators for the Node transport
            // (extract token / x-tenant from IncomingMessage headers) — see the file header.

            // ── Storage (variant-supplied; includes the DB feature) ────
            await config.registerRootStorage(container);
        },

        request: async container => {
            // The transport-agnostic per-request stack. No realtime/scheduler hooks: those are
            // AWS-specific and this transport has no equivalent — validating that they are optional.
            await registerApiRequestStack(container, {
                extensions: config.extensions,
                registerRequestStorage: config.registerRequestStorage
            });
        }
    });
}
