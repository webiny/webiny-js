import { createServer } from "node:http";
import type { Server as HttpServer, IncomingMessage } from "node:http";
import type { Duplex } from "node:stream";
import { mdbid } from "@webiny/utils";
import { NodeWsAdapterImpl } from "~/adapter/NodeWsAdapter.js";
import { DefaultUpgradeHandlerImpl } from "~/upgradeHandler/DefaultUpgradeHandler.js";
import { ServerConnectionManagerImpl } from "~/connectionManager/ServerConnectionManager.js";
import { ServerWebsocketsEventValidator } from "~/validator/ServerWebsocketsEventValidator.js";
import type {
    CreateWebsocketsServerParams,
    AttachWebsocketsServerParams,
    IWebsocketsServer
} from "./types.js";

const toHeaders = (raw: IncomingMessage["headers"]): Record<string, string> => {
    const headers: Record<string, string> = {};
    for (const [key, value] of Object.entries(raw)) {
        if (typeof value === "string") {
            headers[key] = value;
        }
    }
    return headers;
};

class WebsocketsServer implements IWebsocketsServer {
    private readonly httpServer: HttpServer;
    private readonly ownsHttpServer: boolean;
    private readonly adapter: NodeWsAdapterImpl;
    private readonly validator: ServerWebsocketsEventValidator;
    private readonly upgradeHandler: DefaultUpgradeHandlerImpl;
    private readonly heartbeatInterval: number;
    private readonly debug: boolean;
    private readonly requestedPort: number;
    private readonly requestedHost: string;

    private connectionManager: ServerConnectionManagerImpl | undefined;
    private heartbeatTimer: ReturnType<typeof setInterval> | undefined;
    private shuttingDown: boolean = false;
    private endpoint: string = "";
    private resolvedPort: number = 0;

    public constructor(params: {
        httpServer: HttpServer;
        ownsHttpServer: boolean;
        heartbeatInterval: number;
        debug: boolean;
        port: number;
        host: string;
    }) {
        this.httpServer = params.httpServer;
        this.ownsHttpServer = params.ownsHttpServer;
        this.heartbeatInterval = params.heartbeatInterval;
        this.debug = params.debug;
        this.requestedPort = params.port;
        this.requestedHost = params.host;

        this.adapter = new NodeWsAdapterImpl();
        this.validator = new ServerWebsocketsEventValidator();
        this.upgradeHandler = new DefaultUpgradeHandlerImpl();
    }

    public setConnectionManager(manager: ServerConnectionManagerImpl): void {
        this.connectionManager = manager;
    }

    public async start(): Promise<void> {
        this.adapter.start(this.httpServer);
        this.wireEvents();

        if (this.ownsHttpServer) {
            await this.listen();
        } else {
            this.resolvePortFromExistingServer();
        }

        this.startHeartbeat();

        if (this.debug) {
            console.log(`[WebsocketsServer] started on ${this.endpoint}`);
        }
    }

    public async stop(): Promise<void> {
        this.shuttingDown = true;
        this.stopHeartbeat();

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

    private wireEvents(): void {
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

        this.adapter.onConnection((socket, request) => {
            if (this.shuttingDown) {
                return;
            }

            const connectionId = mdbid();
            const connectedAt = Date.now();
            const host = request.headers.host || "localhost";
            const headers = toHeaders(request.headers);

            this.connectionManager?.add({
                connectionId,
                socket,
                endpoint: this.endpoint,
                identity: { id: "", displayName: "", type: "" },
                tenant: "",
                connectedAt,
                host,
                headers
            });

            this.adapter.onMessage(socket, _data => {
                if (this.shuttingDown) {
                    return;
                }

                const metadata = this.connectionManager?.getMetadata(connectionId);
                if (!metadata) {
                    return;
                }

                let body: unknown;
                try {
                    body = JSON.parse(_data.toString());
                } catch {
                    /* Malformed JSON, silently ignore. */
                    return;
                }

                /* Suppress unused variable warning — body will be used by the runner in Task 9. */
                void body;

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

    private startHeartbeat(): void {
        this.heartbeatTimer = setInterval(() => {
            if (this.shuttingDown) {
                return;
            }
            this.connectionManager?.cleanup(5 * this.heartbeatInterval);
        }, this.heartbeatInterval);
    }

    private stopHeartbeat(): void {
        if (this.heartbeatTimer) {
            clearInterval(this.heartbeatTimer);
            this.heartbeatTimer = undefined;
        }
    }
}

export { WebsocketsServer };

export const createWebsocketsServer = (params: CreateWebsocketsServerParams): IWebsocketsServer => {
    const httpServer = createServer();
    const server = new WebsocketsServer({
        httpServer,
        ownsHttpServer: true,
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
        heartbeatInterval: params.heartbeatInterval ?? 60_000,
        debug: params.debug ?? false,
        port: 0,
        host: "127.0.0.1"
    });
    return server;
};
