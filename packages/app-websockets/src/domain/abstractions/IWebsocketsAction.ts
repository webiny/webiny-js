import { IGenericData } from "./types";

export interface IWebsocketActionOnResponse<R extends IGenericData = IGenericData> {
    (response: R | null): R | null;
}

export interface IWebsocketsActionsTriggerParams<
    T extends IGenericData = IGenericData,
    R extends IGenericData = IGenericData
> {
    data?: T;
    /**
     * Does this action expect some response from the server?
     * If defined, the response will be passed to this function.
     */
    onResponse?: IWebsocketActionOnResponse<R>;
    /**
     * How long to wait for the response?
     * In milliseconds.
     */
    timeout?: number;
}

export interface IWebsocketsAction<
    T extends IGenericData = IGenericData,
    R extends IGenericData = IGenericData
> {
    /**
     * Trigger the action - send data to the server via Websockets.
     * If onResponse is defined the method will wait for the response.
     * If onResponse is not defined, the method will return null immediately.
     */
    trigger(params?: IWebsocketsActionsTriggerParams<T, R>): Promise<R | null>;
}
