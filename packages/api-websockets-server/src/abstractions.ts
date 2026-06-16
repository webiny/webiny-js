import type { Server as HttpServer } from "node:http";
import type { IncomingMessage } from "node:http";
import type { Duplex } from "node:stream";
import type { IWebsocketsIdentity } from "@webiny/api-websockets";
import { createAbstraction } from "@webiny/feature/api";

export interface IWebsocketsServerAdapter<TSocket> {
    start(server: HttpServer): void;
    stop(): Promise<void>;
    onConnection(cb: (socket: TSocket, request: IncomingMessage) => void): void;
    onMessage(socket: TSocket, cb: (data: Buffer) => void): void;
    onClose(socket: TSocket, cb: (code: number, reason: Buffer) => void): void;
    onError(socket: TSocket, cb: (error: Error) => void): void;
    send(socket: TSocket, data: string): Promise<void>;
    close(socket: TSocket, code?: number, reason?: string): void;
    handleUpgrade(request: IncomingMessage, socket: Duplex, head: Buffer): void;
}

export const WebsocketsServerAdapter =
    createAbstraction<IWebsocketsServerAdapter<unknown>>("WebsocketsServerAdapter");

export namespace WebsocketsServerAdapter {
    export type Interface<TSocket> = IWebsocketsServerAdapter<TSocket>;
}

type UpgradeDecision = { allowed: true } | { allowed: false; statusCode: number; reason: string };

export interface IWebsocketsUpgradeHandler {
    shouldUpgrade(request: IncomingMessage): Promise<UpgradeDecision>;
}

export const WebsocketsUpgradeHandler = createAbstraction<IWebsocketsUpgradeHandler>(
    "WebsocketsUpgradeHandler"
);

export namespace WebsocketsUpgradeHandler {
    export type Interface = IWebsocketsUpgradeHandler;
    export type Decision = UpgradeDecision;
}

export interface IWebsocketsConnectionManagerAddParams<TSocket> {
    connectionId: string;
    socket: TSocket;
    endpoint: string;
    identity: IWebsocketsIdentity;
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
