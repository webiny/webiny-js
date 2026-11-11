import type { WebsocketsConnectionManager } from "~/connectionManager/abstractions.js";
import { WebsocketsLiveSockets } from "./abstractions.js";

export class InMemoryLiveSocketsImpl implements WebsocketsLiveSockets.Interface {
    private readonly sockets = new Map<string, unknown>();
    private readonly metadata = new Map<string, WebsocketsConnectionManager.ConnectionMetadata>();

    public add(params: WebsocketsLiveSockets.AddParams): void {
        this.sockets.set(params.connectionId, params.socket);
        this.metadata.set(params.connectionId, params.metadata);
    }

    public remove(connectionId: string): boolean {
        this.metadata.delete(connectionId);
        return this.sockets.delete(connectionId);
    }

    public getSocket(connectionId: string): unknown | undefined {
        return this.sockets.get(connectionId);
    }

    public getMetadata(
        connectionId: string
    ): WebsocketsConnectionManager.ConnectionMetadata | undefined {
        return this.metadata.get(connectionId);
    }

    public getActiveConnectionIds(): string[] {
        return Array.from(this.sockets.keys());
    }
}

export const InMemoryLiveSockets = WebsocketsLiveSockets.createImplementation({
    implementation: InMemoryLiveSocketsImpl,
    dependencies: []
});
