import {
    IGenericData,
    IWebsocketsAction,
    IWebsocketsManagerMessageEvent,
    IWebsocketsSubscription
} from "~/domain/types";

export * from "./domain/types";

export interface IWebsocketsContextSendCallable {
    <T extends IGenericData = IGenericData>(action: string, data?: T, timeout?: number): void;
}

export interface IWebsocketsContextCreateActionCallable<
    T extends IGenericData = IGenericData,
    R extends IGenericData = IGenericData
> {
    (name: string): IWebsocketsAction<T, R>;
}

export interface ISocketsContextOnMessageCallable {
    <T extends IncomingGenericData = IncomingGenericData>(
        action: string,
        cb: (data: T) => void
    ): IWebsocketsSubscription<IWebsocketsManagerMessageEvent<T>>;
}

export interface IWebsocketsContext {
    send: IWebsocketsContextSendCallable;
    createAction: IWebsocketsContextCreateActionCallable;
    onMessage: ISocketsContextOnMessageCallable;
}

export interface IncomingGenericData extends IGenericData {
    action: string;
}
