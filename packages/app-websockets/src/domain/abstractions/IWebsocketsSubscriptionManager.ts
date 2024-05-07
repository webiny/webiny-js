import { GenericRecord } from "@webiny/app/types";
import {
    IGenericData,
    IWebsocketsManagerCloseEvent,
    IWebsocketsManagerErrorEvent,
    IWebsocketsManagerMessageEvent,
    IWebsocketsManagerOpenEvent
} from "./types";

export type IWebsocketManagerEvent = "open" | "close" | "error" | "message";

export interface IWebsocketsSubscriptionCallback<T> {
    (data: T): Promise<void> | void;
}

export interface IWebsocketsSubscription<T> {
    cb: IWebsocketsSubscriptionCallback<T>;
    id: string;
    /**
     * Remove the subscription on the message.
     */
    off: () => void;
}

export interface IWebsocketsSubscriptionManagerSubscriptions<
    T extends IGenericData = IGenericData
> {
    open: GenericRecord<string, IWebsocketsSubscription<IWebsocketsManagerOpenEvent>>;
    close: GenericRecord<string, IWebsocketsSubscription<IWebsocketsManagerCloseEvent>>;
    error: GenericRecord<string, IWebsocketsSubscription<IWebsocketsManagerErrorEvent>>;
    message: GenericRecord<string, IWebsocketsSubscription<T>>;
}

export interface IWebsocketsSubscriptionManager {
    onOpen(
        cb: IWebsocketsSubscriptionCallback<IWebsocketsManagerOpenEvent>
    ): IWebsocketsSubscription<IWebsocketsManagerOpenEvent>;

    onClose(
        cb: IWebsocketsSubscriptionCallback<IWebsocketsManagerCloseEvent>
    ): IWebsocketsSubscription<IWebsocketsManagerCloseEvent>;

    onError(
        cb: IWebsocketsSubscriptionCallback<IWebsocketsManagerErrorEvent>
    ): IWebsocketsSubscription<IWebsocketsManagerErrorEvent>;

    onMessage<T extends IGenericData = IGenericData>(
        cb: IWebsocketsSubscriptionCallback<IWebsocketsManagerMessageEvent<T>>
    ): IWebsocketsSubscription<IWebsocketsManagerMessageEvent<T>>;

    triggerOnOpen(event: IWebsocketsManagerOpenEvent): Promise<void>;
    triggerOnClose(event: IWebsocketsManagerCloseEvent): Promise<void>;
    triggerOnError(event: IWebsocketsManagerErrorEvent): Promise<void>;
    triggerOnMessage(event: IWebsocketsManagerMessageEvent<string>): Promise<void>;
}
