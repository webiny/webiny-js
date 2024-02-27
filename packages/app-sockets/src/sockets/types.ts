import { GenericRecord } from "@webiny/app/types";
import { IWebsocketConnection } from "~/sockets/abstractions/IWebsocketConnection";

export type IWebsocketManagerMessageEvent = MessageEvent;
export type IWebsocketManagerCloseEvent = CloseEvent;
export type IWebsocketManagerOpenEvent = Event;
export type IWebsocketManagerErrorEvent = Event;

export enum WebsocketReadyState {
    CONNECTING = 0,
    OPEN = 1,
    CLOSING = 2,
    CLOSED = 3
}

export interface IWebsocketManagerOnOpenCallable {
    (event: IWebsocketManagerOpenEvent): Promise<void>;
}

export interface IWebsocketManagerOnCloseCallable {
    (event: IWebsocketManagerCloseEvent): Promise<void>;
}

export interface IWebsocketManagerOnErrorCallable {
    (event: IWebsocketManagerErrorEvent): Promise<void>;
}

export interface IWebsocketManagerOnMessageCallable {
    (event: IWebsocketManagerMessageEvent): Promise<void>;
}

export type IWebsocketManagerEvent = "open" | "close" | "error" | "message";

export interface IWebsocketManagerCallablesRemove {
    id: string;
    (): void;
}

export interface IWebsocketManagerConfig {
    connection: IWebsocketConnection;
    debug?: boolean;
}

export interface IWebsocketManager {
    connect(url: string, protocol?: string[]): void;
    reconnect(url?: string, protocol?: string[]): void;
    close(code?: number, reason?: string): void;
    send<T extends GenericRecord = GenericRecord>(data: T): void;

    onOpen(cb: IWebsocketManagerOnOpenCallable): IWebsocketManagerCallablesRemove;
    onClose(cb: IWebsocketManagerOnCloseCallable): IWebsocketManagerCallablesRemove;
    onError(cb: IWebsocketManagerOnErrorCallable): IWebsocketManagerCallablesRemove;
    onMessage(cb: IWebsocketManagerOnMessageCallable): IWebsocketManagerCallablesRemove;
}
