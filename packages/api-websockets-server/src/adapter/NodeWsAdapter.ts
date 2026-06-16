import type { Server as HttpServer } from "node:http";
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

    public start(server: HttpServer): void {
        this.wss = new WebSocketServer({ server });
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
