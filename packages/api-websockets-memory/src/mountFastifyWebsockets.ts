import { randomUUID } from "node:crypto";
import type { FastifyInstance } from "fastify";
import fastifyWebsocket from "@fastify/websocket";
import type { WebSocket } from "@fastify/websocket";
import {
    WebsocketsEventRequestContextEventType,
    WebsocketsEventRoute
} from "@webiny/api-websockets/handler/types.js";
import type { IWebsocketsIncomingEvent } from "@webiny/api-websockets/handler/types.js";
import { createWebsocketsRoutePlugins } from "@webiny/api-websockets/runner/routes/index.js";
import { WebsocketsResponse } from "@webiny/api-websockets/response/index.js";
import { WebsocketsRunner, WebsocketsEventValidator } from "@webiny/api-websockets";
import type { IWebsocketsConnectionRegistry, Context } from "@webiny/api-websockets";
import type { FastifyWebsocketsTransport } from "./FastifyWebsocketsTransport.js";

/**
 * Mounts a real WebSocket endpoint at `/ws` on the long-lived Fastify
 * instance, plus an internal HTTP route that dispatches synthesized WS
 * events through the standard Webiny preHandler chain.
 *
 * Why the indirection: the WebSocket message handler runs outside any
 * Webiny request scope — there's no `Request` in DI, no tenancy, no
 * identity. Instead of replicating the auth + tenancy setup by hand
 * (and getting cross-request isolation wrong), we synthesize an
 * `IWebsocketsIncomingEvent`, stuff the per-connection token + tenant
 * into HTTP headers, and POST it via Fastify's `inject()` to a private
 * `/webiny-ws-internal` route. That POST runs through the full
 * `onRequest` -> `preHandler` -> route handler pipeline, so identity
 * and tenant are populated in the per-request ALS scope exactly the way
 * a normal HTTP request gets them. The route handler then constructs a
 * `WebsocketsRunner` and dispatches.
 *
 * `WebsocketsRunner` calls `context.websockets.sendToConnections([...], data)`
 * to respond, which goes through the configured `IWebsocketsTransport`
 * — the `FastifyWebsocketsTransport` companion to this helper looks up
 * the live `ws` socket by `connectionId` and writes the response back
 * to the actual client.
 */
export interface MountFastifyWebsocketsParams {
    app: FastifyInstance;
    transport: FastifyWebsocketsTransport;
    registry: IWebsocketsConnectionRegistry;
    /**
     * Path to mount the WebSocket endpoint at. Defaults to `/ws`.
     */
    path?: string;
    /**
     * The subprotocol the Webiny Admin UI client requests
     * (see `app-websockets/src/WebsocketsContextProvider.tsx`).
     * Defaults to `webiny-ws-v1`.
     */
    subprotocol?: string;
}

const INTERNAL_DISPATCH_PATH = "/webiny-ws-internal";

export const mountFastifyWebsockets = async (
    params: MountFastifyWebsocketsParams
): Promise<void> => {
    const { app, transport, registry } = params;
    const path = params.path ?? "/ws";

    // The default $connect / $disconnect / $default route plugins live on
    // the long-lived PluginsContainer so WebsocketsRunner can find them
    // on every dispatch. (createWebsockets() doesn't register them
    // because the AWS handler does it per-invocation.)
    const webiny = (app as unknown as { webiny: Context }).webiny;
    webiny.plugins.register(...createWebsocketsRoutePlugins());

    // Private dispatch route. The WS message handler hits this via
    // app.inject() once per WS event so the full Webiny preHandler
    // chain runs in a fresh per-request scope before the runner
    // executes. Externally reachable, but every request requires a
    // valid Authorization bearer (validated by the standard preHandler
    // chain) — so the attack surface is no larger than connecting to
    // /ws and sending the same event yourself.
    app.post<{ Body: IWebsocketsIncomingEvent }>(INTERNAL_DISPATCH_PATH, async (request, reply) => {
        const ctx = (request.server as unknown as { webiny: Context }).webiny;
        const runner = new WebsocketsRunner(
            ctx,
            registry,
            new WebsocketsEventValidator(),
            new WebsocketsResponse()
        );
        const result = await runner.run(request.body);
        return reply.send(result);
    });

    await app.register(fastifyWebsocket);
    await app.register(async fastify => {
        fastify.get(path, { websocket: true }, async (socket, request) => {
            const query = (request.query ?? {}) as { token?: string; tenant?: string };
            const token = query.token;
            const tenant = query.tenant ?? "root";
            if (!token) {
                // 1008 = policy violation
                socket.close(1008, "Missing token");
                return;
            }

            const connectionId = randomUUID();
            transport.addSocket(connectionId, socket as unknown as WebSocket);

            const dispatch = async (
                eventType: WebsocketsEventRequestContextEventType,
                routeKey: WebsocketsEventRoute,
                body?: unknown
            ) => {
                const event: IWebsocketsIncomingEvent = {
                    requestContext: {
                        connectionId,
                        connectedAt: Date.now(),
                        domainName: "container",
                        stage: "ws",
                        eventType,
                        routeKey
                    },
                    headers: {
                        ["x-tenant"]: tenant
                    },
                    queryStringParameters: { token, tenant },
                    body:
                        body !== undefined
                            ? typeof body === "string"
                                ? body
                                : JSON.stringify(body)
                            : undefined
                };

                await app.inject({
                    method: "POST",
                    url: INTERNAL_DISPATCH_PATH,
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "x-tenant": tenant,
                        "content-type": "application/json"
                    },
                    payload: event
                });
            };

            // Run $connect immediately so the connection is registered
            // (or rejected) before any subsequent message arrives.
            try {
                await dispatch(
                    WebsocketsEventRequestContextEventType.connect,
                    WebsocketsEventRoute.connect
                );
            } catch (ex) {
                console.error(
                    `[mountFastifyWebsockets] $connect dispatch failed for ${connectionId}:`,
                    (ex as Error).message
                );
                transport.removeSocket(connectionId);
                socket.close(1011, "Connect dispatch failed");
                return;
            }

            socket.on("message", async raw => {
                let parsed: unknown;
                try {
                    parsed = JSON.parse(raw.toString());
                } catch {
                    // Webiny's WS protocol is JSON-only; drop non-JSON
                    // frames silently rather than failing the connection.
                    return;
                }
                try {
                    await dispatch(
                        WebsocketsEventRequestContextEventType.message,
                        WebsocketsEventRoute.default,
                        parsed
                    );
                } catch (ex) {
                    console.error(
                        `[mountFastifyWebsockets] $default dispatch failed for ${connectionId}:`,
                        (ex as Error).message
                    );
                }
            });

            socket.on("close", async () => {
                try {
                    await dispatch(
                        WebsocketsEventRequestContextEventType.disconnect,
                        WebsocketsEventRoute.disconnect
                    );
                } catch (ex) {
                    console.error(
                        `[mountFastifyWebsockets] $disconnect dispatch failed for ${connectionId}:`,
                        (ex as Error).message
                    );
                } finally {
                    transport.removeSocket(connectionId);
                }
            });

            socket.on("error", err => {
                // Browser drops the socket on unload; logging would just
                // be noise. Real errors fire here too, but they're
                // surfaced via the close handler's exit code.
                if ((err as NodeJS.ErrnoException).code === "ECONNRESET") {
                    return;
                }
                console.error(
                    `[mountFastifyWebsockets] socket error for ${connectionId}:`,
                    err.message
                );
            });
        });
    });
};
