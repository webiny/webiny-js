import { createServer } from "node:http";
import type { Server as HttpServer, IncomingMessage } from "node:http";
import type { Duplex } from "node:stream";
import { mdbid } from "@webiny/utils";
import type { WebsocketsServerAdapter } from "~/adapter/abstractions.js";
import type { WebsocketsUpgradeHandler } from "~/upgradeHandler/abstractions.js";
import type { WebsocketsConnectionManager } from "~/connectionManager/abstractions.js";
import type { ConnectionRegistry } from "@webiny/api-websockets/exports/api.js";
import { NodeWsAdapterImpl } from "~/adapter/NodeWsAdapter.js";
import { DefaultUpgradeHandlerImpl } from "~/upgradeHandler/DefaultUpgradeHandler.js";
import { HeartbeatManager } from "~/heartbeat/HeartbeatManager.js";
import { WEBSOCKETS_PATH } from "./constants.js";
import type {
    CreateWebsocketsServerParams,
    AttachWebsocketsServerParams,
    IWebsocketsServer,
    WebsocketsConnectionAuthenticator
} from "./types.js";

const DEFAULT_HEARTBEAT_INTERVAL = 60_000;
// Three admin ping intervals (5 minutes each): one late ping is not enough to evict a live tab.
const DEFAULT_STALE_AFTER = 15 * 60_000;

const toHeaders = (raw: IncomingMessage["headers"]): Record<string, string> => {
    const headers: Record<string, string> = {};
    for (const [key, value] of Object.entries(raw)) {
        if (typeof value === "string") {
            headers[key] = value;
        }
    }
    return headers;
};

// What the upgrade step learned about a connection, handed to the connection handler.
interface IHandshake {
    identity: ConnectionRegistry.Identity;
    tenant: string;
}

// Answers an upgrade with an HTTP error. `end` rather than `destroy`, so the response is flushed first.
const refuse = (socket: Duplex, statusCode: number, reason: string): void => {
    socket.once("finish", () => socket.destroy());
    socket.end(
        `HTTP/1.1 ${statusCode} ${reason}\r\nConnection: close\r\nContent-Length: 0\r\n\r\n`
    );
};

interface WebsocketsServerParams {
    httpServer: HttpServer;
    ownsHttpServer: boolean;
    adapter: WebsocketsServerAdapter.Interface<unknown>;
    upgradeHandler: WebsocketsUpgradeHandler.Interface;
    connectionManager?: WebsocketsConnectionManager.Interface<unknown>;
    authenticate: WebsocketsConnectionAuthenticator;
    heartbeatInterval: number;
    staleAfter: number;
    debug: boolean;
    port: number;
    host: string;
}

class WebsocketsServer implements IWebsocketsServer {
    private readonly httpServer: HttpServer;
    private readonly ownsHttpServer: boolean;
    private readonly adapter: WebsocketsServerAdapter.Interface<unknown>;
    private readonly upgradeHandler: WebsocketsUpgradeHandler.Interface;
    private readonly connectionManager: WebsocketsConnectionManager.Interface<unknown> | undefined;
    private readonly authenticate: WebsocketsConnectionAuthenticator;
    private readonly heartbeat: HeartbeatManager | undefined;
    private readonly debug: boolean;
    private readonly requestedPort: number;
    private readonly requestedHost: string;
    // Set when an upgrade is accepted, read once the socket is open.
    private readonly handshakes = new WeakMap<IncomingMessage, IHandshake>();

    private shuttingDown: boolean = false;
    private endpoint: string = "";
    private resolvedPort: number = 0;

    public constructor(params: WebsocketsServerParams) {
        this.httpServer = params.httpServer;
        this.ownsHttpServer = params.ownsHttpServer;
        this.adapter = params.adapter;
        this.upgradeHandler = params.upgradeHandler;
        this.connectionManager = params.connectionManager;
        this.authenticate = params.authenticate;
        this.debug = params.debug;
        this.requestedPort = params.port;
        this.requestedHost = params.host;

        if (params.connectionManager) {
            this.heartbeat = new HeartbeatManager(
                params.connectionManager,
                params.adapter,
                params.heartbeatInterval,
                params.staleAfter
            );
        }
    }

    public async start(): Promise<void> {
        this.adapter.start(this.httpServer);
        this.wireUpgradeHandler();
        this.wireConnectionHandler();

        if (this.ownsHttpServer) {
            await this.listen();
        } else {
            this.resolvePortFromExistingServer();
        }

        this.heartbeat?.start();

        if (this.debug) {
            console.log(`[WebsocketsServer] started on ${this.endpoint}`);
        }
    }

    public async stop(): Promise<void> {
        this.shuttingDown = true;
        this.heartbeat?.stop();

        /*
         * Close the sockets and take this process's connections out of the registry at the same
         * time, so both fit in the shutdown. Without the registry step, the rows stay until another
         * process's heartbeat finds them stale, and sends to those users go nowhere until then.
         */
        const activeIds = this.connectionManager?.getActiveConnectionIds() ?? [];
        const removals = activeIds.map(connectionId => this.removeConnection(connectionId));
        const closing = this.adapter.stop();
        await Promise.all([closing, ...removals]);

        if (this.ownsHttpServer) {
            await this.closeHttpServer();
        }

        if (this.debug) {
            console.log("[WebsocketsServer] stopped");
        }
    }

    public port(): number {
        return this.resolvedPort;
    }

    private wireUpgradeHandler(): void {
        this.httpServer.on(
            "upgrade",
            async (request: IncomingMessage, socket: Duplex, head: Buffer) => {
                if (this.shuttingDown) {
                    socket.destroy();
                    return;
                }

                /*
                 * Node drops its own error listener before emitting `upgrade`, so an error on the
                 * raw socket before `ws` takes it over would be unhandled and end the process.
                 */
                socket.on("error", error => {
                    console.error("WebSocket upgrade socket error:", error.message);
                });

                /*
                 * Checked here and not in the upgrade handler, which is meant to be replaceable. The
                 * server shares its HTTP server with the API, so no other path may ever upgrade.
                 */
                const url = new URL(request.url ?? "/", "http://localhost");
                if (url.pathname !== WEBSOCKETS_PATH) {
                    refuse(socket, 404, "Not Found");
                    return;
                }

                try {
                    const decision = await this.upgradeHandler.shouldUpgrade(request);
                    if (!decision.allowed) {
                        refuse(socket, decision.statusCode, decision.reason);
                        return;
                    }

                    /*
                     * Authenticated before the socket opens, not after: an anonymous connection
                     * would still write a registry row, and nothing would stop a client opening
                     * as many of them as it likes.
                     */
                    const handshake = await this.authenticateUpgrade(url);
                    if (!handshake) {
                        refuse(socket, 401, "Unauthorized");
                        return;
                    }

                    this.handshakes.set(request, handshake);
                    this.adapter.handleUpgrade(request, socket, head);
                } catch (error) {
                    console.error("WebSocket upgrade failed:", error);
                    refuse(socket, 500, "Internal Server Error");
                }
            }
        );
    }

    private wireConnectionHandler(): void {
        this.adapter.onConnection((socket, request) => {
            if (this.shuttingDown) {
                return;
            }

            const handshake = this.handshakes.get(request);
            if (!handshake) {
                return;
            }
            this.handshakes.delete(request);

            const connectionId = mdbid();
            const connectedAt = Date.now();
            const host = request.headers.host || "localhost";
            const headers = toHeaders(request.headers);

            // The registry write is async, so we kick it off without awaiting it and wire the socket
            // handlers below synchronously — that way we don't miss a close or message that arrives
            // during the gap. If a message does arrive before registration finishes, the
            // `getMetadata` guard below just drops it, which is fine since the client doesn't send
            // anything meaningful right at connect time.
            const registration = this.registerConnection({
                connectionId,
                socket,
                handshake,
                connectedAt,
                host,
                headers
            });

            this.adapter.onMessage(socket, data => {
                if (this.shuttingDown) {
                    return;
                }

                const metadata = this.connectionManager?.getMetadata(connectionId);
                if (!metadata) {
                    return;
                }

                try {
                    JSON.parse(data.toString());
                } catch {
                    return;
                }

                this.connectionManager?.updateLastSeen(connectionId).catch(error => {
                    console.error(
                        `Failed to update last seen for WebSocket connection "${connectionId}":`,
                        error
                    );
                });
            });

            this.adapter.onClose(socket, () => {
                if (this.shuttingDown) {
                    return;
                }
                /*
                 * Wait for registration: a socket that closes while it is still being registered
                 * would otherwise be removed first and then registered, leaving a dead entry.
                 */
                void registration.then(() => this.removeConnection(connectionId));
            });

            this.adapter.onError(socket, error => {
                console.error(`WebSocket error for connection "${connectionId}":`, error.message);
            });
        });
    }

    /**
     * Reads the `?token`/`?tenant` query the app-websockets client sends and resolves the token to an
     * identity. Returns `null` when there is no token or it doesn't resolve to one, and the upgrade
     * is refused.
     */
    private async authenticateUpgrade(url: URL): Promise<IHandshake | null> {
        const token = url.searchParams.get("token") ?? "";
        if (!token) {
            return null;
        }

        const identity = await this.authenticate(token);
        if (!identity?.id) {
            return null;
        }

        return { identity, tenant: url.searchParams.get("tenant") ?? "" };
    }

    /**
     * Registers the live socket in the shared connection manager under the identity and tenant the
     * upgrade resolved. Getting both right matters for targeted server→client sends:
     * `SendToIdentity` finds connections by identity id in the registry, so a connection that never
     * made it into the registry can't be reached. A failure is logged rather than thrown, so it
     * doesn't crash the server; the connection just ends up unaddressable.
     */
    private async registerConnection(params: {
        connectionId: string;
        socket: unknown;
        handshake: IHandshake;
        connectedAt: number;
        host: string;
        headers: Record<string, string>;
    }): Promise<void> {
        const { connectionId, socket, handshake, connectedAt, host, headers } = params;

        try {
            await this.connectionManager?.add({
                connectionId,
                socket,
                endpoint: this.endpoint,
                identity: handshake.identity,
                tenant: handshake.tenant,
                connectedAt,
                host,
                headers
            });
        } catch (error) {
            console.error(
                `Failed to register WebSocket connection "${connectionId}":`,
                error instanceof Error ? error.message : String(error)
            );
        }
    }

    private async removeConnection(connectionId: string): Promise<void> {
        try {
            await this.connectionManager?.remove(connectionId);
        } catch (error) {
            console.error(`Failed to remove WebSocket connection "${connectionId}":`, error);
        }
    }

    private resolvePortFromExistingServer(): void {
        const address = this.httpServer.address();
        if (address && typeof address !== "string") {
            this.resolvedPort = address.port;
            this.endpoint = `ws://127.0.0.1:${this.resolvedPort}`;
        }
    }

    private listen(): Promise<void> {
        return new Promise((resolve, reject) => {
            this.httpServer.listen(this.requestedPort, this.requestedHost, () => {
                const address = this.httpServer.address();
                if (!address || typeof address === "string") {
                    reject(new Error("Unexpected server address format."));
                    return;
                }
                this.resolvedPort = address.port;
                this.endpoint = `ws://${this.requestedHost}:${this.resolvedPort}`;
                resolve();
            });
        });
    }

    private closeHttpServer(): Promise<void> {
        return new Promise((resolve, reject) => {
            this.httpServer.close(err => {
                if (err) {
                    reject(err);
                    return;
                }
                resolve();
            });
        });
    }
}

export { WebsocketsServer };

export const createWebsocketsServer = (params: CreateWebsocketsServerParams): IWebsocketsServer => {
    const httpServer = createServer();
    const server = new WebsocketsServer({
        httpServer,
        ownsHttpServer: true,
        adapter: new NodeWsAdapterImpl(),
        upgradeHandler: new DefaultUpgradeHandlerImpl(),
        connectionManager: params.connectionManager,
        authenticate: params.authenticate,
        heartbeatInterval: params.heartbeatInterval ?? DEFAULT_HEARTBEAT_INTERVAL,
        staleAfter: params.staleAfter ?? DEFAULT_STALE_AFTER,
        debug: params.debug ?? false,
        port: params.port ?? 0,
        host: params.host ?? "127.0.0.1"
    });
    return server;
};

export const attachWebsocketsServer = (params: AttachWebsocketsServerParams): IWebsocketsServer => {
    const server = new WebsocketsServer({
        httpServer: params.server,
        ownsHttpServer: false,
        adapter: new NodeWsAdapterImpl(),
        upgradeHandler: new DefaultUpgradeHandlerImpl(),
        connectionManager: params.connectionManager,
        authenticate: params.authenticate,
        heartbeatInterval: params.heartbeatInterval ?? DEFAULT_HEARTBEAT_INTERVAL,
        staleAfter: params.staleAfter ?? DEFAULT_STALE_AFTER,
        debug: params.debug ?? false,
        port: 0,
        host: "127.0.0.1"
    });
    return server;
};
