import { IGenericData } from "~/sockets/abstractions/IWebsocketConnection";
import {
    IWebsocketSubscription,
    IWebsocketSubscriptionCallback
} from "~/sockets/abstractions/IWebsocketSubscriptionManager";
import {
    IWebsocketManagerCloseEvent,
    IWebsocketManagerErrorEvent,
    IWebsocketManagerMessageEvent,
    IWebsocketManagerOpenEvent
} from "~/sockets/types";

export interface IWebsocketManagerSendData extends IGenericData {
    token: string;
    tenant: string;
    locale: string;
}

export interface IWebsocketManager {
    close(code?: number, reason?: string): void;
    send<T extends IWebsocketManagerSendData = IWebsocketManagerSendData>(data: T): void;

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
}
