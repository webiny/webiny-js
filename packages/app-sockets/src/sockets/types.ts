import { IGenericData } from "~/sockets/abstractions/IWebsocketConnection";

export type IWebsocketManagerMessageEvent<T = IGenericData> = MessageEvent<T>;
export type IWebsocketManagerCloseEvent = CloseEvent;
export type IWebsocketManagerOpenEvent = Event;
export type IWebsocketManagerErrorEvent = Event;

export enum WebsocketCloseCode {
    RECONNECT = 1,
    NORMAL = 1000,
    GOING_AWAY = 1001,
    PROTOCOL_ERROR = 1002,
    CANNOT_ACCEPT = 1003,
    RESERVED = 1004,
    NO_STATUS = 1005,
    ABNORMAL = 1006,
    INVALID_DATA = 1007,
    POLICY_VIOLATION = 1008,
    TOO_BIG = 1009,
    MISSING_EXTENSION = 1010,
    SERVER_ERROR = 1011,
    SERVICE_RESTART = 1012,
    TRY_AGAIN_LATER = 1013,
    BAD_GATEWAY = 1014,
    TLS_HANDSHAKE = 1015
}

export enum WebsocketReadyState {
    CONNECTING = 0,
    OPEN = 1,
    CLOSING = 2,
    CLOSED = 3
}

export type IWebsocketManagerEvent = "open" | "close" | "error" | "message";
