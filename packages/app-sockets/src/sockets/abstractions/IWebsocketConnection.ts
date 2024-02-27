import { GenericRecord } from "@webiny/app/types";
import { IWebsocketSubscriptionManager } from "./IWebsocketSubscriptionManager";
import { WebsocketCloseCode } from "~/sockets/types";

export type IGenericData = GenericRecord;

export type IWebsocketConnectProtocol = string | string[] | undefined;

export interface IWebsocketConnectionFactory {
    (url: string, protocol?: IWebsocketConnectProtocol): WebSocket;
}

export interface IWebsocketConnection {
    readonly subscriptionManager: IWebsocketSubscriptionManager;

    connect(url: string, protocol?: IWebsocketConnectProtocol): void;
    reconnect(url?: string, protocol?: IWebsocketConnectProtocol): void;
    close(code?: WebsocketCloseCode, reason?: string): boolean;
    send<T extends IGenericData = IGenericData>(data: T): void;
}
