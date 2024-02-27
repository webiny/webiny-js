import { GenericRecord } from "@webiny/app/types";
import {
    IWebsocketManagerCloseEvent,
    IWebsocketManagerErrorEvent,
    IWebsocketManagerMessageEvent,
    IWebsocketManagerOpenEvent
} from "~/sockets/types";

export interface IWebsocketSubscriptionCallback<T> {
    (event: T): Promise<void>;
}

export interface IWebsocketSubscription<T> {
    cb: IWebsocketSubscriptionCallback<T>;
    id: string;
    off: () => void;
}

export interface IWebsocketsSubscriptionManagerSubscriptions {
    open: GenericRecord<string, IWebsocketSubscription<IWebsocketManagerOpenEvent>>;
    close: GenericRecord<string, IWebsocketSubscription<IWebsocketManagerCloseEvent>>;
    error: GenericRecord<string, IWebsocketSubscription<IWebsocketManagerErrorEvent>>;
    message: GenericRecord<string, IWebsocketSubscription<IWebsocketManagerMessageEvent>>;
}

export interface IWebsocketSubscriptionManager {
    onOpen(
        cb: IWebsocketSubscriptionCallback<IWebsocketManagerOpenEvent>
    ): IWebsocketSubscription<IWebsocketManagerOpenEvent>;
    onClose(
        cb: IWebsocketSubscriptionCallback<IWebsocketManagerCloseEvent>
    ): IWebsocketSubscription<IWebsocketManagerCloseEvent>;
    onError(
        cb: IWebsocketSubscriptionCallback<IWebsocketManagerErrorEvent>
    ): IWebsocketSubscription<IWebsocketManagerErrorEvent>;
    onMessage(
        cb: IWebsocketSubscriptionCallback<IWebsocketManagerMessageEvent>
    ): IWebsocketSubscription<IWebsocketManagerMessageEvent>;

    triggerOnOpen(event: IWebsocketManagerOpenEvent): Promise<void>;
    triggerOnClose(event: IWebsocketManagerCloseEvent): Promise<void>;
    triggerOnError(event: IWebsocketManagerErrorEvent): Promise<void>;
    triggerOnMessage(event: IWebsocketManagerMessageEvent): Promise<void>;
}
