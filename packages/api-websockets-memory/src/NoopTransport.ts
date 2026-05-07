import type {
    IWebsocketsTransport,
    IWebsocketsTransportDisconnectConnection,
    IWebsocketsTransportSendConnection,
    IWebsocketsTransportSendData
} from "@webiny/api-websockets";
import type { GenericRecord } from "@webiny/api/types.js";

/**
 * Stub transport — logs send/disconnect calls but doesn't actually deliver
 * bytes anywhere. Used in container deployments until a real WebSocket
 * server (e.g., `@fastify/websocket` integration) is wired up. The
 * connection registry still tracks connections so the rest of the
 * subscription machinery (filter-by-tenant, filter-by-identity) works
 * end-to-end during development.
 *
 * Replace this with a `FastifyWebsocketsTransport` (next slice) to deliver
 * real messages.
 */
export class NoopTransport implements IWebsocketsTransport {
    public async send<T extends GenericRecord = GenericRecord>(
        connections: IWebsocketsTransportSendConnection[],
        data: IWebsocketsTransportSendData<T>
    ): Promise<void> {
        if (connections.length === 0) {
            return;
        }
        console.log(
            "[NoopTransport] would send to %d connection(s); action=%s, messageId=%s",
            connections.length,
            data.action ?? "<none>",
            data.messageId ?? "<none>"
        );
    }

    public async disconnect(
        connections: IWebsocketsTransportDisconnectConnection[]
    ): Promise<void> {
        if (connections.length === 0) {
            return;
        }
        console.log("[NoopTransport] would disconnect %d connection(s)", connections.length);
    }
}
