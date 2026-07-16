/**
 * Webiny API handler for the self-hosted Node HTTP server transport — storage-agnostic BASE.
 *
 * The ROOT container wires the Node HTTP transport (NodeHttpFeature = event type + router + HttpFeature)
 * plus the auth/tenant loader decorators (extract token / x-tenant from the IncomingMessage → shared
 * RequestIdentityLoader / RequestTenantLoader). The per-request feature stack is the transport-agnostic
 * `registerApiRequestStack` from `@webiny/api-event-handler-core` — the SAME stack the AWS handler uses.
 * The realtime transport hook installs the server WebSockets transport (vs AWS's API Gateway Management
 * API) with a SINGLE-PROCESS, in-process implementation. Background tasks and the Bree scheduler are
 * ROOT-container singletons (below) — mirroring how the AWS handler registers background tasks at root,
 * and the WebSockets connection manager — rather than per-request transports; the scheduler fires timers
 * in-process (vs AWS's EventBridge). The storage variant (and identity provider) is injected via
 * `registerRootStorage`.
 *
 * The identity provider (e.g. `@webiny/self-hosted-auth`'s JWT IdP) must be registered by the variant
 * in `registerRootStorage`, so the RequestIdentityLoader driven by the identity decorator can resolve it.
 */
import type { Container } from "@webiny/di";
import { createServerHandler, NodeHttpFeature } from "@webiny/event-handler-server";
import { registerExtensions } from "@webiny/handler";
import { registerApiRequestStack } from "@webiny/api-event-handler-core";
import { RequestContainer } from "@webiny/event-handler-core";
import {
    ServerConnectionManager,
    NodeWsAdapter,
    WebsocketsServerFeature,
    WebsocketsConnectionManager,
    attachWebsocketsServer
} from "@webiny/api-websockets-server";
import { BackgroundTasksServerFeature } from "@webiny/background-tasks-server";
import { FileManagerServerFeature } from "@webiny/api-file-manager-server";
import { registerSchedulerServer, startSchedulerServer } from "~/scheduler/schedulerServer.js";
import { NodeHttpIdentityLoaderDecorator } from "~/handlers/NodeHttpIdentityLoaderDecorator.js";
import { NodeHttpTenantLoaderDecorator } from "~/handlers/NodeHttpTenantLoaderDecorator.js";
import { AuthenticationContext } from "@webiny/api-core/features/security/authentication/AuthenticationContext/index.js";

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

            // ── Scheduler (root) ───────────────────────────────────────
            // The Bree scheduler is a single long-lived instance for ALL tenants, started once at boot
            // (onServer, below) — the counterpart of the WebSockets connection manager, NOT a per-request
            // transport. Registered here as SchedulerService (per-request create/update/delete during
            // mutations manipulate this one live timer set) plus the run/recover HTTP routes + internal
            // token. When a timer fires (outside any request) it POSTs `/scheduled-action-run`, which
            // rebuilds the tenant's request context and executes the action.
            registerSchedulerServer(container);
        },

        request: async container => {
            // The transport-agnostic per-request stack. The realtime hook installs the server
            // WebSockets transport (overriding the domain's NullWebsocketsTransport); it resolves the
            // shared connection manager + adapter from the root. Scheduler is NOT a per-request
            // transport here — it's a root singleton wired in `root` + `onServer` (see above).
            await registerApiRequestStack(container, {
                extensions: config.extensions,
                // Why hooks (and not just registering the transports ourselves): `.register()` calls
                // are otherwise order-independent — you can register Features in any order, because
                // they only REGISTER, they don't RESOLVE during registration (resolution happens
                // later, in Initializers / SchemaFactories). The one thing that makes order matter is
                // a DEFAULT registration: e.g. `WebsocketsFeature` registers `NullWebsocketsTransport`
                // so the abstraction is always resolvable. Overriding it (last-registration-wins) means
                // our transport MUST be registered AFTER that Feature. These hooks are the seams
                // `registerApiRequestStack` provides for exactly that — each runs right after its Null
                // default, so the override is guaranteed without the caller knowing the internal order.
                transports: {
                    // Server WebSockets transport; resolves the shared connection manager + adapter
                    // from the root (registered as singletons above).
                    realtime: requestContainer => {
                        WebsocketsServerFeature.register(requestContainer);
                    },
                    // File-manager storage transport: local disk. Where AWS uses S3 (+ a separate asset-
                    // delivery Lambda), the single-process server stores files on disk and serves them
                    // in-process — FileManagerServerFeature registers local asset delivery (overriding
                    // the domain's null impls), the upload/multipart HTTP routes, and disk file ops.
                    fileManager: requestContainer => {
                        FileManagerServerFeature.register(requestContainer);
                    }
                }
            });
        },

        onServer: async (server, rootContainer) => {
            // Attach the WebSockets upgrade handler to the running HTTP server, backed by the shared
            // (root) connection manager so request-time sends reach the live sockets.
            //
            // Authenticate each WebSocket upgrade from its `?token` JWT so the connection is
            // registered under the real identity — required for targeted server→client sends
            // (SendToIdentity matches connections by identity id). AuthenticationContext lives in the
            // PER-REQUEST stack (registered by ApiCoreFeature, not registerRootStorage), so it isn't
            // resolvable from the root container. We build a throwaway request-scoped child container
            // (the same way createHandler builds one per HTTP request) and resolve it there. Only the
            // CORE stack is needed — no transports — since this is purely the token→identity step
            // (the SAME one the HTTP stack runs via RequestIdentityLoader), and it's tenant-independent
            // (the HTTP stack establishes identity BEFORE tenant), so it needs no request/tenant state.
            // Connections are infrequent (one per admin session), so the per-connection child is cheap.
            const authenticate = async (token: string) => {
                const child = rootContainer.createChildContainer();
                child.registerInstance(RequestContainer, child);
                await registerApiRequestStack(child, { extensions: config.extensions });
                const identity = await child.resolve(AuthenticationContext).authenticate(token);
                if (!identity?.id) {
                    return null;
                }
                return {
                    id: identity.id,
                    displayName: identity.displayName,
                    type: identity.type
                };
            };

            const websockets = attachWebsocketsServer({
                server,
                connectionManager: rootContainer.resolve(WebsocketsConnectionManager),
                authenticate
            });
            await websockets.start();

            // Start the in-process scheduler timers, then re-arm persisted schedules (deferred until
            // the server is listening — see startSchedulerServer).
            await startSchedulerServer(rootContainer);
        }
    });
}
