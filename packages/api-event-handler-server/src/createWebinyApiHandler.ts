/**
 * Webiny API handler for the self-hosted Node HTTP server transport — storage-agnostic BASE.
 *
 * The ROOT container wires the Node HTTP transport (NodeHttpFeature = event type + router + HttpFeature)
 * plus the auth/tenant loader decorators (extract token / x-tenant from the IncomingMessage → shared
 * RequestIdentityLoader / RequestTenantLoader). The per-request feature stack is the transport-agnostic
 * `registerApiRequestStack` from `@webiny/api-event-handler-core` — the SAME stack the AWS handler uses.
 * Both interleave hooks are supplied with SINGLE-PROCESS, in-process equivalents of the AWS transports:
 * the realtime hook installs the server WebSockets transport (vs AWS's API Gateway Management API), and
 * the scheduler hook installs the Bree/in-process scheduler (vs AWS's EventBridge Scheduler). Background
 * tasks are wired in the ROOT container (below), mirroring how the AWS handler registers its background-
 * task transport at root. The storage variant (and its identity provider) is injected via `registerRootStorage`.
 *
 * The identity provider (e.g. `@webiny/self-hosted-auth`'s JWT IdP) must be registered by the variant
 * in `registerRootStorage`, so the RequestIdentityLoader driven by the identity decorator can resolve it.
 */
import type { Container } from "@webiny/di";
import { createServerHandler, NodeHttpFeature } from "@webiny/event-handler-server";
import { registerExtensions } from "@webiny/handler";
import { registerApiRequestStack } from "@webiny/api-event-handler-core";
import {
    ServerConnectionManager,
    NodeWsAdapter,
    ServerWebsocketsTransport,
    WebsocketsConnectionManager,
    attachWebsocketsServer
} from "@webiny/api-websockets-server";
import { BackgroundTasksServerFeature } from "@webiny/background-tasks-server";
import { registerSchedulerServerExtension } from "@webiny/api-scheduler-server";
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
}

export function createWebinyApiHandler(config: CreateWebinyApiHandlerConfig) {
    return createServerHandler({
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

            // ── WebSockets transport (root) ────────────────────────────
            // Live-socket registry + adapter live in the root as singletons: the connection manager
            // is shared between the upgrade acceptor (attachWebsocketsServer, below) and the
            // per-request ServerWebsocketsTransport that sends to those live sockets. The persistent
            // connection registry (ConnectionRegistry) is the storage variant's job (e.g. sql).
            container.register(ServerConnectionManager).inSingletonScope();
            container.register(NodeWsAdapter).inSingletonScope();

            // ── Background tasks (root) ────────────────────────────────
            // Mirrors the AWS handler registering its background-task transport at root. There is no
            // Step Functions / Lambda re-invocation in a single process, so the transport is in-process:
            // WorkerService (the BackgroundTasks/TaskService dispatch abstraction) runs each triggered
            // task in a Node worker_thread that POSTs back to this server's `/background-task` HTTP route
            // (BackgroundTaskRoute), which runs the task loop (continue/timeout/abort) in-process. Root,
            // not per-request, is load-bearing: the shared InternalToken (registered here as a singleton)
            // gates the route against the worker's callback, so dispatcher and route MUST see the SAME
            // token — a per-request registration would mint a fresh token per request and always 403.
            // The route is an HttpRoute; the per-request HttpRouter collects it via the parent chain.
            BackgroundTasksServerFeature.register(container);
        },

        request: async container => {
            // The transport-agnostic per-request stack. The realtime hook installs the server
            // WebSockets transport (overriding the domain's NullWebsocketsTransport); it resolves the
            // shared connection manager + adapter from the root. The scheduler hook installs the
            // Bree/in-process scheduler transport (the single-process equivalent of EventBridge).
            await registerApiRequestStack(container, {
                extensions: config.extensions,
                // Why a hook (and not just registering the transport ourselves): `.register()` calls
                // are otherwise order-independent — you can register Features in any order, because
                // they only REGISTER, they don't RESOLVE during registration (resolution happens
                // later, in Initializers / SchemaFactories). The one thing that makes order matter is
                // a DEFAULT registration: `WebsocketsFeature` registers `NullWebsocketsTransport` so
                // the abstraction is always resolvable. Overriding it (last-registration-wins) means
                // our transport MUST be registered AFTER `WebsocketsFeature`. This hook is the seam
                // `registerApiRequestStack` provides for exactly that — it runs right after the Null
                // default, so the override is guaranteed without the caller knowing the internal order.
                registerRealtimeTransport: requestContainer => {
                    requestContainer.register(ServerWebsocketsTransport);
                },
                // Scheduler transport: the Bree/in-process extension. Where AWS bridges EventBridge
                // Scheduler, the single-process server drives delayed/scheduled action triggers with
                // in-process timers (Bree). The hook runs right after SchedulerFeature so this transport
                // overrides the domain default, same seam as the realtime hook above.
                registerSchedulerTransport: requestContainer => {
                    registerSchedulerServerExtension(requestContainer);
                }
            });
        },

        onServer: async (server, rootContainer) => {
            // Attach the WebSockets upgrade handler to the running HTTP server, backed by the shared
            // (root) connection manager so request-time sends reach the live sockets.
            const websockets = attachWebsocketsServer({
                server,
                connectionManager: rootContainer.resolve(WebsocketsConnectionManager)
            });
            await websockets.start();
        }
    });
}
