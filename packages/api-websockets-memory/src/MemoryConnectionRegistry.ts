import type {
    IWebsocketsConnectionRegistry,
    IWebsocketsConnectionRegistryData,
    IWebsocketsConnectionRegistryRegisterParams,
    IWebsocketsConnectionRegistryUnregisterParams
} from "@webiny/api-websockets";

/**
 * Single-process, in-memory implementation of the WebSockets connection
 * registry. Suitable for the single-container POC topology (one process,
 * one Map). When the container topology splits into api + ws + worker
 * processes, swap this for a Redis or NATS-backed registry that all
 * replicas share.
 *
 * Connection bookkeeping is the only state held — actual transport (sending
 * bytes back to a client) is the transport layer's responsibility.
 */
export class MemoryConnectionRegistry implements IWebsocketsConnectionRegistry {
    private readonly connections = new Map<string, IWebsocketsConnectionRegistryData>();

    public async register(
        params: IWebsocketsConnectionRegistryRegisterParams
    ): Promise<IWebsocketsConnectionRegistryData> {
        const data: IWebsocketsConnectionRegistryData = {
            connectionId: params.connectionId,
            identity: params.identity,
            tenant: params.tenant,
            domainName: params.domainName,
            stage: params.stage,
            connectedOn: params.connectedOn
        };
        this.connections.set(params.connectionId, data);
        return data;
    }

    public async unregister(params: IWebsocketsConnectionRegistryUnregisterParams): Promise<void> {
        this.connections.delete(params.connectionId);
    }

    public async listViaConnections(
        connections: string[]
    ): Promise<IWebsocketsConnectionRegistryData[]> {
        const results: IWebsocketsConnectionRegistryData[] = [];
        for (const id of connections) {
            const found = this.connections.get(id);
            if (found) {
                results.push(found);
            }
        }
        return results;
    }

    public async listViaIdentity(identity: string): Promise<IWebsocketsConnectionRegistryData[]> {
        return Array.from(this.connections.values()).filter(c => c.identity?.id === identity);
    }

    public async listViaTenant(tenant: string): Promise<IWebsocketsConnectionRegistryData[]> {
        return Array.from(this.connections.values()).filter(c => c.tenant === tenant);
    }

    public async listAll(): Promise<IWebsocketsConnectionRegistryData[]> {
        return Array.from(this.connections.values());
    }
}
