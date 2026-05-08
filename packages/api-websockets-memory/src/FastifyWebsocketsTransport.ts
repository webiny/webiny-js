import type { WebSocket } from "@fastify/websocket";
import type {
    IWebsocketsTransport,
    IWebsocketsTransportDisconnectConnection,
    IWebsocketsTransportSendConnection,
    IWebsocketsTransportSendData
} from "@webiny/api-websockets";
import type { GenericRecord } from "@webiny/api/types.js";

/**
 * Transport that delivers WebSocket frames via live `ws` sockets held by
 * Fastify (`@fastify/websocket`). Companion to `mountFastifyWebsockets`,
 * which owns the connection lifecycle and tells the transport which
 * connectionId maps to which socket.
 *
 * The contract is the same `IWebsocketsTransport` used by the AWS
 * (API Gateway PostToConnection) implementation — `send` takes a list of
 * `IWebsocketsTransportSendConnection` (which only carries
 * `{connectionId, domainName, stage}`) and a JSON-serializable payload.
 * `domainName` / `stage` are ignored here; the connectionId is the only
 * key that matters in the single-process model.
 */
export class FastifyWebsocketsTransport implements IWebsocketsTransport {
    private readonly sockets = new Map<string, WebSocket>();

    public addSocket(connectionId: string, socket: WebSocket): void {
        this.sockets.set(connectionId, socket);
    }

    public removeSocket(connectionId: string): void {
        this.sockets.delete(connectionId);
    }

    public getSocket(connectionId: string): WebSocket | undefined {
        return this.sockets.get(connectionId);
    }

    public async send<T extends GenericRecord = GenericRecord>(
        connections: IWebsocketsTransportSendConnection[],
        data: IWebsocketsTransportSendData<T>
    ): Promise<void> {
        if (connections.length === 0) {
            return;
        }
        const payload = JSON.stringify(data);
        for (const connection of connections) {
            const socket = this.sockets.get(connection.connectionId);
            if (!socket) {
                continue;
            }
            // ws's readyState constants: 0 CONNECTING, 1 OPEN, 2 CLOSING, 3 CLOSED.
            // Only send on OPEN; everything else is either too early (will
            // never reach the client) or too late (would throw).
            if (socket.readyState !== 1) {
                continue;
            }
            try {
                socket.send(payload);
            } catch (ex) {
                // The socket may have closed between the readyState check
                // and the send call. Drop the failed send rather than
                // letting one bad connection break a fan-out broadcast.
                console.error(
                    `[FastifyWebsocketsTransport] send failed for ${connection.connectionId}:`,
                    (ex as Error).message
                );
            }
        }
    }

    public async disconnect(
        connections: IWebsocketsTransportDisconnectConnection[]
    ): Promise<void> {
        if (connections.length === 0) {
            return;
        }
        for (const connection of connections) {
            const socket = this.sockets.get(connection.connectionId);
            if (!socket) {
                continue;
            }
            try {
                // 1000 = normal closure
                socket.close(1000, "Server-initiated disconnect");
            } catch (ex) {
                console.error(
                    `[FastifyWebsocketsTransport] disconnect failed for ${connection.connectionId}:`,
                    (ex as Error).message
                );
            }
            // Drop our reference even if close threw — the socket is in
            // a bad state and won't get cleaned up via the close handler.
            this.sockets.delete(connection.connectionId);
        }
    }
}
