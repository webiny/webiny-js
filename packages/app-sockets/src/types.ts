import { IGenericData } from "~/sockets/abstractions/IWebsocketConnection";
import { IWebsocketAction } from "~/sockets/abstractions/IWebsocketAction";
import { IWebsocketSubscription } from "~/sockets/abstractions/IWebsocketSubscriptionManager";
import { IWebsocketManagerMessageEvent } from "~/sockets/types";

export * from "./sockets/types";

export interface ISocketsContextSendCallable {
    <T extends IGenericData = IGenericData>(action: string, data?: T, timeout?: number): void;
}

export interface ISocketsContextCreateActionCallable<
    T extends IGenericData = IGenericData,
    R extends IGenericData = IGenericData
> {
    (name: string): IWebsocketAction<T, R>;
}

export interface ISocketsContextOnMessageCallable<
    T extends IncomingGenericData = IncomingGenericData
> {
    (action: string, cb: (data: T) => void): IWebsocketSubscription<
        IWebsocketManagerMessageEvent<T>
    >;
}

export interface ISocketsContext {
    send: ISocketsContextSendCallable;
    createAction: ISocketsContextCreateActionCallable;
    onMessage: ISocketsContextOnMessageCallable;
}

export interface IncomingGenericData extends IGenericData {
    action: string;
}
