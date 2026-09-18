import { ConnectionRegistry } from "@webiny/api-websockets/exports/api.js";
import { createAbstraction } from "@webiny/feature/api";

export interface IWebsocketsConnectionManagerAddParams<TSocket> {
    connectionId: string;
    socket: TSocket;
    endpoint: string;
    identity: ConnectionRegistry.Identity;
    tenant: string;
    connectedAt: number;
    host: string;
    headers: Record<string, string>;
}

export interface IWebsocketsConnectionManagerMetadata {
    connectionId: string;
    endpoint: string;
    connectedAt: number;
    host: string;
    headers: Record<string, string>;
}

export interface IWebsocketsConnectionManager<TSocket> {
    add(params: IWebsocketsConnectionManagerAddParams<TSocket>): Promise<void>;
    remove(connectionId: string): Promise<void>;
    getSocket(connectionId: string): TSocket | undefined;
    getMetadata(connectionId: string): IWebsocketsConnectionManagerMetadata | undefined;
    updateLastSeen(connectionId: string): Promise<void>;
    cleanup(maxAge: number): Promise<string[]>;
    getActiveConnectionIds(): string[];
}

export const WebsocketsConnectionManager = createAbstraction<IWebsocketsConnectionManager<unknown>>(
    "WebsocketsConnectionManager"
);

export namespace WebsocketsConnectionManager {
    export type Interface<TSocket> = IWebsocketsConnectionManager<TSocket>;
    export type AddParams<TSocket> = IWebsocketsConnectionManagerAddParams<TSocket>;
    export type ConnectionMetadata = IWebsocketsConnectionManagerMetadata;
}
