/**
 * Webiny API handler for the standalone Node HTTP server transport — storage-agnostic BASE.
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
import { GraphQLSchemaCacheFeature } from "@webiny/api-graphql";
import { EncryptionKeyCacheFeature } from "@webiny/api-core/features/encryption/index.js";
import { JwksStoreFeature } from "@webiny/api-core/idp/index.js";
import type { Container } from "@webiny/di";
import { createServerHandler, NodeHttpFeature } from "@webiny/event-handler-standalone";
import { registerExtensions } from "@webiny/handler";
import { registerApiRequestStack } from "@webiny/api-event-handler-core";
import {
    ServerConnectionManager,
    NodeWsAdapter,
    WebsocketsStandaloneFeature,
    WebsocketsConnectionManager,
    attachWebsocketsServer
} from "@webiny/api-websockets-standalone";
import { BackgroundTasksStandaloneFeature } from "@webiny/background-tasks-standalone";
import { FileManagerStandaloneFeature } from "@webiny/api-file-manager-standalone";
import { registerSchedulerServer, startSchedulerServer } from "~/scheduler/schedulerServer.js";
import { startBulkActionsServer } from "~/bulkActions/bulkActionsServer.js";
import { NodeHttpIdentityLoaderDecorator } from "~/handlers/NodeHttpIdentityLoaderDecorator.js";
import { NodeHttpTenantLoaderDecorator } from "~/handlers/NodeHttpTenantLoaderDecorator.js";
import { NodeHttpAssumePermissionsDecorator } from "~/handlers/NodeHttpAssumePermissionsDecorator.js";
import { createWebsocketsAuthenticator } from "~/websockets/createWebsocketsAuthenticator.js";
import { EmptyTrashBinsFeature } from "@webiny/api-headless-cms-bulk-actions-standalone";

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
     * Register the per-request storage features (e.g. the CMS storage operations) in the request
     * container, before `HeadlessCmsFeature` builds its storage. Optional.
     */
    registerRequestStorage?: (container: Container) => void | Promise<void>;
}

export function createWebinyApiHandler(config: CreateWebinyApiHandlerConfig) {
    return createServerHandler({
        root: async rootContainer => {
            // ── Transport (Node HTTP) ──────────────────────────────────
            // NodeHttpFeature registers the event type + HttpFeature (router) + the routing terminal.
            NodeHttpFeature.register(rootContainer);

            // ── Tenant + auth (extract → shared load) ──────────────────
            // registerDecorator applies LATER registrations as the OUTER wrapper (whose execute()
            // runs first). TENANT must be established before IDENTITY: API-key authentication resolves
            // the key by tenant partition (ApiKeysRepository reads TenantContext.getTenant()), so
            // identity depends on the tenant; the reverse is not true (RequestTenantLoader has no
            // identity dependency). Register identity first (inner) and tenant last (outer) → tenant
            // runs, then identity, then the router.
            rootContainer.registerDecorator(NodeHttpIdentityLoaderDecorator);
            rootContainer.registerDecorator(NodeHttpTenantLoaderDecorator);

            // Preview-as. Mirrors the AWS handler.
            rootContainer.registerDecorator(NodeHttpAssumePermissionsDecorator);

            // ── Storage + identity provider (variant-supplied) ─────────
            await config.registerRootStorage(rootContainer);

            // ── WebSockets transport (root) ────────────────────────────
            // Live-socket registry + adapter live in the root as singletons: the connection manager
            // is shared between the upgrade acceptor (attachWebsocketsServer, below) and the
            // per-request ServerWebsocketsTransport that sends to those live sockets. The persistent
            // connection registry (ConnectionRegistry) is the storage variant's job (e.g. sql).
            rootContainer.register(ServerConnectionManager).inSingletonScope();
            rootContainer.register(NodeWsAdapter).inSingletonScope();

            // ── GraphQL schema cache (root) ────────────────────────────
            // Root, so a built schema outlives the request that built it.
            GraphQLSchemaCacheFeature.register(rootContainer);

            // ── Encryption key cache (root) ────────────────────────────
            // Root, so the scrypt-derived key is computed once per process instead of per request.
            EncryptionKeyCacheFeature.register(rootContainer);
            // Root, so identity providers' signing keys are fetched once per process, not per request.
            JwksStoreFeature.register(rootContainer);

            // ── Background tasks (root) ────────────────────────────────
            // Mirrors the AWS handler registering its background-task transport at root. Where AWS
            // has Step Functions invoke the Lambda once per iteration, a root task loop dispatches a
            // BackgroundTaskEvent per iteration through the EventDispatcher (registered by
            // createServerHandler), and each one runs in a fresh request container.
            BackgroundTasksStandaloneFeature.register(rootContainer);

            // ── Scheduler (root) ───────────────────────────────────────
            // The Bree scheduler is a single long-lived instance for ALL tenants, started once at boot
            // (onServer, below) — the counterpart of the WebSockets connection manager, NOT a per-request
            // transport. Registered here as SchedulerService (per-request create/update/delete during
            // mutations manipulate this one live timer set) plus the run/recover event handlers. When a
            // timer fires (outside any request) it dispatches a ScheduledActionEvent, handled in a fresh
            // request container by the same handler AWS uses.
            registerSchedulerServer(rootContainer);

            // ── Bulk actions (root) ───────────────────────────────────
            // Registers the EmptyTrashBinsEvent handler that the periodic trigger
            // (startBulkActionsServer, onServer below) dispatches.
            EmptyTrashBinsFeature.register(rootContainer);
        },

        child: async container => {
            // The transport-agnostic per-request stack. The realtime hook installs the server
            // WebSockets transport (overriding the domain's NullWebsocketsTransport); it resolves the
            // shared connection manager + adapter from the root. Scheduler is NOT a per-request
            // transport here — it's a root singleton wired in `root` + `onServer` (see above).
            await registerApiRequestStack(container, {
                extensions: config.extensions,
                registerRequestStorage: config.registerRequestStorage,
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
                        WebsocketsStandaloneFeature.register(requestContainer);
                    },
                    // File-manager storage transport: local disk. Where AWS uses S3 (+ a separate asset-
                    // delivery Lambda), the single-process server stores files on disk and serves them
                    // in-process — FileManagerStandaloneFeature registers local asset delivery (overriding
                    // the domain's null impls), the upload/multipart HTTP routes, and disk file ops.
                    fileManager: requestContainer => {
                        FileManagerStandaloneFeature.register(requestContainer);
                    }
                }
            });
        },

        onServer: async (server, rootContainer) => {
            // Attach the WebSockets upgrade handler to the running HTTP server, backed by the shared
            // (root) connection manager so request-time sends reach the live sockets.
            //
            // Authenticate each WebSocket connection from its `?token` JWT so it's registered under
            // the real identity (targeted server→client sends match by identity id). It's a callback
            // the handler supplies rather than something the WS server resolves itself — see
            // createWebsocketsAuthenticator for why (AuthenticationContext is per-request, unreachable
            // from the root container the WS server is attached to).
            const websockets = attachWebsocketsServer({
                server,
                connectionManager: rootContainer.resolve(WebsocketsConnectionManager),
                authenticate: createWebsocketsAuthenticator(rootContainer, config.extensions)
            });
            await websockets.start();

            // Start the in-process scheduler timers, then re-arm persisted schedules in the
            // background (see startSchedulerServer).
            await startSchedulerServer(rootContainer);

            // Start the periodic empty-trash-bin trigger.
            startBulkActionsServer(rootContainer);
        }
    });
}
