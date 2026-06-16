import { ConnectionRegistry } from "@webiny/api-websockets";
import type { IWebsocketsConnectionRegistry } from "@webiny/api-websockets";
import { WebsocketsConnectionManager } from "~/abstractions.js";

export class ServerConnectionManagerImpl implements WebsocketsConnectionManager.Interface<unknown> {
    private readonly sockets = new Map<string, unknown>();
    private readonly metadata = new Map<string, WebsocketsConnectionManager.ConnectionMetadata>();
    private readonly registry: IWebsocketsConnectionRegistry;

    public constructor(registry: IWebsocketsConnectionRegistry) {
        this.registry = registry;
    }

    public async add(params: WebsocketsConnectionManager.AddParams<unknown>): Promise<void> {
        this.sockets.set(params.connectionId, params.socket);
        this.metadata.set(params.connectionId, {
            connectionId: params.connectionId,
            endpoint: params.endpoint,
            connectedAt: params.connectedAt,
            host: params.host,
            headers: params.headers
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
