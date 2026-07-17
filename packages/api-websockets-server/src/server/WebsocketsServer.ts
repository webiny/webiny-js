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
import type {
    CreateWebsocketsServerParams,
    AttachWebsocketsServerParams,
    IWebsocketsServer,
    WebsocketsConnectionAuthenticator
} from "./types.js";

const ANONYMOUS_IDENTITY: ConnectionRegistry.Identity = { id: "", displayName: "", type: "" };

const toHeaders = (raw: IncomingMessage["headers"]): Record<string, string> => {
    const headers: Record<string, string> = {};
    for (const [key, value] of Object.entries(raw)) {
        if (typeof value === "string") {
            headers[key] = value;
        }
    }
    return headers;
};

interface WebsocketsServerParams {
    httpServer: HttpServer;
    ownsHttpServer: boolean;
    adapter: WebsocketsServerAdapter.Interface<unknown>;
    upgradeHandler: WebsocketsUpgradeHandler.Interface;
    connectionManager?: WebsocketsConnectionManager.Interface<unknown>;
    authenticate?: WebsocketsConnectionAuthenticator;
    heartbeatInterval: number;
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
    private readonly authenticate: WebsocketsConnectionAuthenticator | undefined;
    private readonly heartbeat: HeartbeatManager | undefined;
    private readonly debug: boolean;
    private readonly requestedPort: number;
    private readonly requestedHost: string;

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
                params.heartbeatInterval
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

        await this.adapter.stop();

        if (this.connectionManager) {
            const activeIds = this.connectionManager.getActiveConnectionIds();
            for (const connectionId of activeIds) {
                await this.connectionManager.remove(connectionId);
            }
        }

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

                const decision = await this.upgradeHandler.shouldUpgrade(request);
                if (!decision.allowed) {
                    socket.write(`HTTP/1.1 ${decision.statusCode} ${decision.reason}\r\n\r\n`);
                    socket.destroy();
                    return;
                }

                this.adapter.handleUpgrade(request, socket, head);
            }
        );
    }

    private wireConnectionHandler(): void {
        this.adapter.onConnection((socket, request) => {
            if (this.shuttingDown) {
                return;
            }

            const connectionId = mdbid();
            const connectedAt = Date.now();
            const host = request.headers.host || "localhost";
            const headers = toHeaders(request.headers);

            // Register the connection under its real identity, decoded from the `?token` JWT. Both
            // the authentication and the registry write are async, so we kick this off without
            // awaiting it and wire the socket handlers below synchronously — that way we don't miss a
            // close or message that arrives during the gap. If a message does arrive before
            // registration finishes, the `getMetadata` guard below just drops it, which is fine since
            // the client doesn't send anything meaningful right at connect time.
            void this.registerConnection({
                connectionId,
                socket,
                request,
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

                this.connectionManager?.updateLastSeen(connectionId);
            });

            this.adapter.onClose(socket, () => {
                if (this.shuttingDown) {
                    return;
                }
                this.connectionManager?.remove(connectionId);
            });

            this.adapter.onError(socket, error => {
                console.error(`WebSocket error for connection "${connectionId}":`, error.message);
            });
        });
    }

    /**
     * Authenticates the upgrade using the `?token`/`?tenant` query the app-websockets client sends,
     * then registers the live socket in the shared connection manager under the resolved identity and
     * tenant. Getting both right matters for targeted server→client sends: `SendToIdentity` finds
     * connections by identity id in the registry, so a connection that's anonymous (or never made it
     * into the registry) can't be reached. Everything here is guarded — if something goes wrong we
     * don't crash the server or the upgrade, the connection just ends up unaddressable.
     */
    private async registerConnection(params: {
        connectionId: string;
        socket: unknown;
        request: IncomingMessage;
        connectedAt: number;
        host: string;
        headers: Record<string, string>;
    }): Promise<void> {
        const { connectionId, socket, request, connectedAt, host, headers } = params;

        let identity: ConnectionRegistry.Identity = ANONYMOUS_IDENTITY;
        let tenant = "";

        try {
            const url = new URL(request.url ?? "", `http://${host}`);
            tenant = url.searchParams.get("tenant") ?? "";
            const token = url.searchParams.get("token") ?? "";

            if (this.authenticate && token) {
                const authenticated = await this.authenticate(token);
                if (authenticated?.id) {
                    identity = authenticated;
                }
            }

            await this.connectionManager?.add({
                connectionId,
                socket,
                endpoint: this.endpoint,
                identity,
                tenant,
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
        heartbeatInterval: params.heartbeatInterval ?? 60_000,
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
        heartbeatInterval: params.heartbeatInterval ?? 60_000,
        debug: params.debug ?? false,
        port: 0,
        host: "127.0.0.1"
    });
    return server;
};
