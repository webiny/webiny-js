import { IWebsocketsIdentity } from "~/context/abstractions/IWebsocketsContext";

export interface IWebsocketsConnectionRegistryData {
    connectionId: string;
    identity: IWebsocketsIdentity;
    tenant: string;
    locale: string;
    connectedOn: string;
    domainName: string;
    stage: string;
}

export interface IWebsocketsConnectionRegistryRegisterParams {
    connectionId: string;
    tenant: string;
    locale: string;
    identity: IWebsocketsIdentity;
    domainName: string;
    stage: string;
    /**
     * A DateTime.toISOString() format.
     */
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
    listViaTenant(tenant: string, locale?: string): Promise<IWebsocketsConnectionRegistryData[]>;
    listAll(): Promise<IWebsocketsConnectionRegistryData[]>;
}
