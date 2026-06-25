import type { Server as HttpServer } from "node:http";
import type { IncomingMessage } from "node:http";
import type { Duplex } from "node:stream";
import { WebSocketServer } from "ws";
import { WebSocket } from "ws";
import { WebsocketsServerAdapter } from "~/abstractions.js";

class NodeWsAdapterImpl implements WebsocketsServerAdapter.Interface<WebSocket> {
    private wss: WebSocketServer | undefined;

    private getWss(): WebSocketServer {
        if (!this.wss) {
            throw new Error("WebSocketServer has not been started. Call start() first.");
        }
        return this.wss;
    }

    /* The server param is kept for interface compliance but not used —
       the HTTP upgrade event is handled externally via handleUpgrade(). */
    public start(_server: HttpServer): void {
        this.wss = new WebSocketServer({ noServer: true });
    }

    public handleUpgrade(request: IncomingMessage, socket: Duplex, head: Buffer): void {
        this.getWss().handleUpgrade(request, socket, head, ws => {
            this.getWss().emit("connection", ws, request);
        });
    }

    public stop(): Promise<void> {
        const wss = this.getWss();
        /* Terminate all open client connections so wss.close() resolves immediately. */
        for (const client of wss.clients) {
            client.terminate();
        }
        return new Promise((resolve, reject) => {
            wss.close(err => {
                if (err) {
                    reject(err);
                    return;
                }
                resolve();
            });
        });
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
