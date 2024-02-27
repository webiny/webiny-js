import { GenericRecord } from "@webiny/app/types";
import { IWebsocketSubscriptionManager } from "./IWebsocketSubscriptionManager";

export type IGenericData = GenericRecord;

export interface IWebsocketConnectionFactory {
    (url: string, protocol?: string[]): WebSocket;
}

export interface IWebsocketConnection {
    readonly subscriptionManager: IWebsocketSubscriptionManager;

    connect(url: string, protocol?: string[]): void;
    reconnect(url?: string, protocol?: string[]): void;
    close(code?: number, reason?: string): boolean;
    send<T extends IGenericData = IGenericData>(data: T): void;
}
