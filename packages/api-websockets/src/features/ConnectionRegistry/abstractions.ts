import { createAbstraction } from "@webiny/feature/api";
import type { IWebsocketsIdentity } from "~/types.js";

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

    updateLastSeen(connectionId: string): Promise<void>;
    listStale(olderThan: Date): Promise<IWebsocketsConnectionRegistryData[]>;
}

export const ConnectionRegistry =
    createAbstraction<IWebsocketsConnectionRegistry>("ConnectionRegistry");

export namespace ConnectionRegistry {
    export type Interface = IWebsocketsConnectionRegistry;
    export type Data = IWebsocketsConnectionRegistryData;
    export type RegisterParams = IWebsocketsConnectionRegistryRegisterParams;
    export type UnregisterParams = IWebsocketsConnectionRegistryUnregisterParams;
}
