import { createAbstraction } from "@webiny/feature/api";
import type { IWebsocketsIdentity } from "~/types.js";

export interface IWebsocketsConnectionRegistryData {
    connectionId: string;
    identity: IWebsocketsIdentity;
    tenant: string;
    connectedOn: string;
    endpoint: string;
    /*
     * The process holding the live socket, on a server that runs several processes. Absent where
     * one service holds every socket (API Gateway on AWS) and on rows written before it existed.
     */
    owner?: string;
}

export interface IWebsocketsConnectionRegistryRegisterParams {
    connectionId: string;
    tenant: string;
    identity: IWebsocketsIdentity;
    endpoint: string;
    connectedOn: string;
    owner?: string;
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
    export type Identity = IWebsocketsIdentity;
    export type Data = IWebsocketsConnectionRegistryData;
    export type RegisterParams = IWebsocketsConnectionRegistryRegisterParams;
    export type UnregisterParams = IWebsocketsConnectionRegistryUnregisterParams;
}
