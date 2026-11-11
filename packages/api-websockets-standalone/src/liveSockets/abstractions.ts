import { createAbstraction } from "@webiny/feature/api";
import type { WebsocketsConnectionManager } from "~/connectionManager/abstractions.js";

export interface IWebsocketsLiveSocketsAddParams<TSocket> {
    connectionId: string;
    socket: TSocket;
    metadata: WebsocketsConnectionManager.ConnectionMetadata;
}

export interface IWebsocketsLiveSockets<TSocket> {
    add(params: IWebsocketsLiveSocketsAddParams<TSocket>): void;
    /** Forgets the socket. Returns whether this process held it. */
    remove(connectionId: string): boolean;
    getSocket(connectionId: string): TSocket | undefined;
    getMetadata(connectionId: string): WebsocketsConnectionManager.ConnectionMetadata | undefined;
    getActiveConnectionIds(): string[];
}

/**
 * The sockets this process holds, in memory only: a root singleton, shared by the upgrade acceptor
 * and every request that sends to a socket. The connections' rows (who is connected, which process
 * holds them) are in the connection registry, a storage, which requests write.
 */
export const WebsocketsLiveSockets =
    createAbstraction<IWebsocketsLiveSockets<unknown>>("WebsocketsLiveSockets");

export namespace WebsocketsLiveSockets {
    export type Interface<TSocket = unknown> = IWebsocketsLiveSockets<TSocket>;
    export type AddParams<TSocket = unknown> = IWebsocketsLiveSocketsAddParams<TSocket>;
}
