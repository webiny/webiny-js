/**
 * Webiny API handler for the self-hosted Node HTTP server transport — storage-agnostic BASE.
 *
 * The ROOT container wires the Node HTTP transport (NodeHttpFeature = event type + router + HttpFeature)
 * plus the auth/tenant loader decorators (extract token / x-tenant from the IncomingMessage → shared
 * RequestIdentityLoader / RequestTenantLoader). The per-request feature stack is the transport-agnostic
 * `registerApiRequestStack` from `@webiny/api-event-handler-core` — the SAME stack the AWS handler uses.
 * It is called with NEITHER the realtime nor the scheduler hook: those are AWS-specific (API Gateway
 * WebSockets / EventBridge Scheduler) and this transport has no equivalent — the hooks being optional
 * is the point. The storage variant (and its identity provider) is injected via `registerRootStorage`.
 *
 * The identity provider (e.g. `@webiny/self-hosted-auth`'s JWT IdP) must be registered by the variant
 * in `registerRootStorage`, so the RequestIdentityLoader driven by the identity decorator can resolve it.
 */
import type { Container } from "@webiny/di";
import { createNodeHandler, NodeHttpFeature } from "@webiny/event-handler-server";
import { registerExtensions } from "@webiny/handler";
import { registerApiRequestStack } from "@webiny/api-event-handler-core";
import { NodeHttpIdentityLoaderDecorator } from "~/handlers/NodeHttpIdentityLoaderDecorator.js";
import { NodeHttpTenantLoaderDecorator } from "~/handlers/NodeHttpTenantLoaderDecorator.js";

export interface CreateWebinyApiHandlerConfig {
    /**
     * Project-defined extensions, applied at register() time.
     */
    extensions: () => Parameters<typeof registerExtensions>[1];
    /**
     * Register ALL root-container storage for this deployment (the DB feature + CMS storage ops +
     * registries) AND the identity provider. Unlike the AWS base, the server base bakes in no DB or
     * IdP assumption — the variant supplies the complete storage + auth wiring.
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
            // NodeHttpFeature registers the event type + HttpFeature (router) + the routing terminal.
            NodeHttpFeature.register(container);

            // ── Auth + tenant (extract → shared load) ──────────────────
            // registerDecorator applies LATER registrations as the OUTER wrapper (whose execute()
            // runs first). Identity must be established before tenant, so register tenant first
            // (inner) and identity last (outer) → identity runs, then tenant, then the router.
            container.registerDecorator(NodeHttpTenantLoaderDecorator);
            container.registerDecorator(NodeHttpIdentityLoaderDecorator);

            // ── Storage + identity provider (variant-supplied) ─────────
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
