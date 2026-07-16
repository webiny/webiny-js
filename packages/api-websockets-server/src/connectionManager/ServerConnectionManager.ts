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

        // Persist the connection to the shared registry. This is what makes the live socket
        // addressable: `SendToIdentity`/`ListConnections` query the registry by identity id, then
        // resolve the in-memory socket here by connection id. Without this row the socket exists but
        // no identity→connectionId mapping does, so targeted server→client sends reach nothing.
        // `connectedOn` is an ISO string (the registry filters connections lexicographically against
        // a recency cutoff), so the epoch ms `connectedAt` is converted here.
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
