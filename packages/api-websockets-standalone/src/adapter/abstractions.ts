import type { Server as HttpServer } from "node:http";
import type { IncomingMessage } from "node:http";
import type { Duplex } from "node:stream";
import { createAbstraction } from "@webiny/feature/api";

export interface IWebsocketsServerAdapter<TSocket> {
    start(server: HttpServer): void;
    stop(): Promise<void>;
    onMessage(socket: TSocket, cb: (data: Buffer) => void): void;
    onClose(socket: TSocket, cb: (code: number, reason: Buffer) => void): void;
    onError(socket: TSocket, cb: (error: Error) => void): void;
    send(socket: TSocket, data: string): Promise<void>;
    close(socket: TSocket, code?: number, reason?: string): void;
    /**
     * Completes the upgrade and calls `onOpen` with the opened socket. The caller decides whether
     * to upgrade before calling this, so whatever it learned about the request stays in its scope.
     */
    handleUpgrade(
        request: IncomingMessage,
        socket: Duplex,
        head: Buffer,
        onOpen: (socket: TSocket) => void
    ): void;
}

export const WebsocketsServerAdapter =
    createAbstraction<IWebsocketsServerAdapter<unknown>>("WebsocketsServerAdapter");

export namespace WebsocketsServerAdapter {
    export type Interface<TSocket> = IWebsocketsServerAdapter<TSocket>;
}
