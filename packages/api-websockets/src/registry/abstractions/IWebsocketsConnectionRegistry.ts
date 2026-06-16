import type { IWebsocketsIdentity } from "~/context/abstractions/IWebsocketsContext.js";

export interface IWebsocketsConnectionRegistryData {
    connectionId: string;
    identity: IWebsocketsIdentity;
    tenant: string;
    connectedOn: string;
    endpoint: string;
}

export interface IWebsocketsConnectionRegistryRegisterParams {
    connectionId: string;
    tenant: string;
    identity: IWebsocketsIdentity;
    endpoint: string;
    connectedOn: string;
}

export interface IWebsocketsConnectionRegistryUnregisterParams {
    connectionId: string;
}

export interface IWebsocketsConnectionRegistry {
    register(
        event: IWebsocketsConnectionRegistryRegisterParams
    ): Promise<IWebsocketsConnectionRegistryData>;
    unregister(event: IWebsocketsConnectionRegistryUnregisterParams): Promise<void>;

    listViaConnections(connections: string[]): Promise<IWebsocketsConnectionRegistryData[]>;
    listViaIdentity(identity: string): Promise<IWebsocketsConnectionRegistryData[]>;
    listViaTenant(tenant: string): Promise<IWebsocketsConnectionRegistryData[]>;
    listAll(): Promise<IWebsocketsConnectionRegistryData[]>;
}
