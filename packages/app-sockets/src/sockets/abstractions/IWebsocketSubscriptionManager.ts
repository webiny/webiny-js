import { GenericRecord } from "@webiny/app/types";
import {
    IWebsocketManagerCloseEvent,
    IWebsocketManagerErrorEvent,
    IWebsocketManagerMessageEvent,
    IWebsocketManagerOpenEvent
} from "~/sockets/types";
import { IGenericData } from "./IWebsocketConnection";

export interface IWebsocketSubscriptionCallback<T> {
    (data: T): Promise<void>;
}

export interface IWebsocketSubscription<T> {
    cb: IWebsocketSubscriptionCallback<T>;
    id: string;
    /**
     * Remove the subscription on the message.
     */
    off: () => void;
}

export interface IWebsocketsSubscriptionManagerSubscriptions<
    T extends IGenericData = IGenericData
> {
    open: GenericRecord<string, IWebsocketSubscription<IWebsocketManagerOpenEvent>>;
    close: GenericRecord<string, IWebsocketSubscription<IWebsocketManagerCloseEvent>>;
    error: GenericRecord<string, IWebsocketSubscription<IWebsocketManagerErrorEvent>>;
    message: GenericRecord<string, IWebsocketSubscription<T>>;
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

    onMessage<T extends IGenericData = IGenericData>(
        cb: IWebsocketSubscriptionCallback<IWebsocketManagerMessageEvent<T>>
    ): IWebsocketSubscription<IWebsocketManagerMessageEvent<T>>;

    triggerOnOpen(event: IWebsocketManagerOpenEvent): Promise<void>;
    triggerOnClose(event: IWebsocketManagerCloseEvent): Promise<void>;
    triggerOnError(event: IWebsocketManagerErrorEvent): Promise<void>;
    triggerOnMessage(event: IWebsocketManagerMessageEvent<string>): Promise<void>;
}
