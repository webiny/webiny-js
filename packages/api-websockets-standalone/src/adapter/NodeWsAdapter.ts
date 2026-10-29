import type { Server as HttpServer } from "node:http";
import type { IncomingMessage } from "node:http";
import type { Duplex } from "node:stream";
import { WebSocketServer } from "ws";
import { WebSocket } from "ws";
import { WebsocketsServerAdapter } from "./abstractions.js";

/*
 * Clients only send small JSON envelopes (a ping carrying a token). The `ws` default is 100 MiB,
 * which any client, authenticated or not, could make the server buffer per message.
 */
const MAX_PAYLOAD_BYTES = 64 * 1024;

/*
 * Sent to every client when the server stops. 1012 means "service restart": the client reconnects,
 * and behind a load balancer it reaches a process that is still up.
 */
const SERVICE_RESTART = 1012;

// How long a client gets to answer the close before its socket is cut.
const CLOSE_WAIT_MS = 1000;

/*
 * How often every open socket gets a WebSocket ping frame. Proxies and load balancers close a
 * connection that carries nothing for a while (60 seconds by default on nginx and AWS ALB), and the
 * admin's own ping comes only every 5 minutes. Browsers answer ping frames by themselves; no client
 * code is involved, and nothing is written to the registry.
 */
const PING_INTERVAL_MS = 30_000;

/*
 * Closes the socket with `SERVICE_RESTART` and resolves once it is closed. A client that has not
 * answered within `CLOSE_WAIT_MS` (a frozen tab, a dead network) is cut.
 */
const closeForRestart = (client: WebSocket): Promise<void> => {
    return new Promise(resolve => {
        if (client.readyState === WebSocket.CLOSED) {
            resolve();
            return;
        }
        const timer = setTimeout(() => {
            client.terminate();
        }, CLOSE_WAIT_MS);
        client.once("close", () => {
            clearTimeout(timer);
            resolve();
        });
        client.close(SERVICE_RESTART, "Server restarting");
    });
};

class NodeWsAdapterImpl implements WebsocketsServerAdapter.Interface<WebSocket> {
    private wss: WebSocketServer | undefined;
    private pingTimer: ReturnType<typeof setInterval> | undefined;
    // Sockets that answered the last ping, or connected since it was sent.
    private readonly answered = new WeakSet<WebSocket>();

    public constructor(private readonly pingInterval: number = PING_INTERVAL_MS) {}

    private getWss(): WebSocketServer {
        if (!this.wss) {
            throw new Error("WebSocketServer has not been started. Call start() first.");
        }
        return this.wss;
    }

    /* The server param is kept for interface compliance but not used —
       the HTTP upgrade event is handled externally via handleUpgrade(). */
    public start(_server: HttpServer): void {
        const wss = new WebSocketServer({ noServer: true, maxPayload: MAX_PAYLOAD_BYTES });
        wss.on("connection", socket => {
            this.answered.add(socket);
            socket.on("pong", () => {
                this.answered.add(socket);
            });
        });
        this.wss = wss;
        this.pingTimer = setInterval(() => {
            this.pingAll(wss);
        }, this.pingInterval);
    }

    public handleUpgrade(request: IncomingMessage, socket: Duplex, head: Buffer): void {
        this.getWss().handleUpgrade(request, socket, head, ws => {
            this.getWss().emit("connection", ws, request);
        });
    }

    // Safe to call again: a stopped adapter has nothing left to close.
    public async stop(): Promise<void> {
        const wss = this.wss;
        if (!wss) {
            return;
        }
        this.wss = undefined;
        clearInterval(this.pingTimer);

        const clients = [...wss.clients];
        const closing = clients.map(closeForRestart);
        await Promise.all(closing);

        await new Promise<void>((resolve, reject) => {
            wss.close(err => {
                if (err) {
                    reject(err);
                    return;
                }
                resolve();
            });
        });
    }

    /*
     * Pings every open socket. One that has not answered the previous ping within a whole interval is
     * gone without having closed (a laptop asleep, a dropped network), so it is cut; its close
     * handler then removes the connection.
     */
    private pingAll(wss: WebSocketServer): void {
        for (const socket of wss.clients) {
            if (!this.answered.has(socket)) {
                socket.terminate();
                continue;
            }
            this.answered.delete(socket);
            if (socket.readyState === WebSocket.OPEN) {
                socket.ping();
            }
        }
    }

    public onConnection(
        cb: (socket: WebSocket, request: import("node:http").IncomingMessage) => void
    ): void {
        this.getWss().on("connection", cb);
    }

    public onMessage(socket: WebSocket, cb: (data: Buffer) => void): void {
        socket.on("message", cb);
    }

    public onClose(socket: WebSocket, cb: (code: number, reason: Buffer) => void): void {
        socket.on("close", cb);
    }

    public onError(socket: WebSocket, cb: (error: Error) => void): void {
        socket.on("error", cb);
    }

    public send(socket: WebSocket, data: string): Promise<void> {
        return new Promise((resolve, reject) => {
            socket.send(data, err => {
                if (err) {
                    reject(err);
                    return;
                }
                resolve();
            });
        });
    }

    public close(socket: WebSocket, code?: number, reason?: string): void {
        socket.close(code, reason);
    }
}

export { NodeWsAdapterImpl };

export const NodeWsAdapter = WebsocketsServerAdapter.createImplementation({
    implementation: NodeWsAdapterImpl,
    dependencies: []
});
