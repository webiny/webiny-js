import type { GenericRecord } from "@webiny/api/types.js";
import { createAbstraction } from "@webiny/feature/api";

export interface IWebsocketsBusSendMessage {
    action: "send";
    connectionIds: string[];
    data: GenericRecord;
}

export interface IWebsocketsBusDisconnectMessage {
    action: "disconnect";
    connectionIds: string[];
}

export type IWebsocketsBusMessage = IWebsocketsBusSendMessage | IWebsocketsBusDisconnectMessage;

export type IWebsocketsBusHandler = (message: IWebsocketsBusMessage) => Promise<void>;

/**
 * Carries a send or a disconnect to the process that holds the sockets. Each process listens on its
 * own channel, named after its `ProcessOwner` id, and other processes publish to it.
 *
 * Delivery is at most once and nothing is queued: a message for a process that is not listening is
 * dropped, as a push to a reconnecting client is on AWS.
 */
export interface IWebsocketsMessageBus {
    publish(owner: string, message: IWebsocketsBusMessage): Promise<void>;
    subscribe(owner: string, handler: IWebsocketsBusHandler): Promise<void>;
    close(): Promise<void>;
}

export const WebsocketsMessageBus =
    createAbstraction<IWebsocketsMessageBus>("Websockets/MessageBus");

export namespace WebsocketsMessageBus {
    export type Interface = IWebsocketsMessageBus;
    export type Message = IWebsocketsBusMessage;
    export type Handler = IWebsocketsBusHandler;
}
