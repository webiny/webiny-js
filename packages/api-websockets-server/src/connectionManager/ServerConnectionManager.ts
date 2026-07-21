import { ConnectionRegistry } from "@webiny/api-websockets/exports/api.js";
import { WebsocketsConnectionManager } from "./abstractions.js";

export class ServerConnectionManagerImpl implements WebsocketsConnectionManager.Interface<unknown> {
    private readonly sockets = new Map<string, unknown>();
    private readonly metadata = new Map<string, WebsocketsConnectionManager.ConnectionMetadata>();

    public constructor(private readonly registry: ConnectionRegistry.Interface) {}

    public async add(params: WebsocketsConnectionManager.AddParams<unknown>): Promise<void> {
        this.sockets.set(params.connectionId, params.socket);
        this.metadata.set(params.connectionId, {
            connectionId: params.connectionId,
            endpoint: params.endpoint,
            connectedAt: params.connectedAt,
            host: params.host,
            headers: params.headers
        });

        // Save the connection to the shared registry. This is what lets the server later push a
        // message to a specific user — e.g. when a background task finishes and calls
        // SendToIdentity. That flow looks connections up in the registry by identity id to get their
        // connection ids, then comes back here to fetch each live socket by connection id and send.
        // The in-memory map above only answers "socket for this connection id?" — it can't be
        // searched by identity, so without this registry row a targeted send finds nobody. The
        // registry stores `connectedOn` as an ISO string (it compares connections against a recency
        // cutoff), so we convert the epoch-ms `connectedAt`.
        await this.registry.register({
            connectionId: params.connectionId,
            identity: params.identity,
            tenant: params.tenant,
            endpoint: params.endpoint,
            connectedOn: new Date(params.connectedAt).toISOString()
        });
    }

    public async remove(connectionId: string): Promise<void> {
        this.sockets.delete(connectionId);
        this.metadata.delete(connectionId);
        try {
            await this.registry.unregister({ connectionId });
        } catch (err) {
            if ((err as any).code === "CONNECTION_NOT_FOUND") {
                return;
            }
            throw err;
        }
    }

    public getSocket(connectionId: string): unknown | undefined {
        return this.sockets.get(connectionId);
    }

    public getMetadata(
        connectionId: string
    ): WebsocketsConnectionManager.ConnectionMetadata | undefined {
        return this.metadata.get(connectionId);
    }

    public async updateLastSeen(connectionId: string): Promise<void> {
        await this.registry.updateLastSeen(connectionId);
    }

    public async cleanup(maxAge: number): Promise<string[]> {
        const olderThan = new Date(Date.now() - maxAge);
        const stale = await this.registry.listStale(olderThan);
        const removed: string[] = [];
        for (const entry of stale) {
            await this.remove(entry.connectionId);
            removed.push(entry.connectionId);
        }
        return removed;
    }

    public getActiveConnectionIds(): string[] {
        return Array.from(this.sockets.keys());
    }
}

export const ServerConnectionManager = WebsocketsConnectionManager.createImplementation({
    implementation: ServerConnectionManagerImpl,
    dependencies: [ConnectionRegistry]
});
