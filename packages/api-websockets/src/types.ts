import type { DbContext } from "@webiny/handler-db/types.js";
import type { IWebsocketsContextObject } from "./context/abstractions/IWebsocketsContext.js";
import type { ApiCoreContext } from "@webiny/api-core/types/core.js";
import type { SecurityPermission } from "@webiny/api-core/types/security.js";
import type { GenericRecord } from "@webiny/api/types.js";

export type { IWebsocketsContextObject };

export interface Context extends DbContext, ApiCoreContext {
    websockets: IWebsocketsContextObject;
}

export interface WebsocketsPermission extends SecurityPermission {
    name: "websockets";
    rwd?: string;
}

export type WebsocketsRoute = "connect" | "disconnect" | "default";

export type WebsocketsEventType = "message" | "connect" | "disconnect";

export interface IWebsocketsEventData {
    token?: string;
    tenant?: string;
    messageId?: string;
    action?: string;
    data?: GenericRecord;
}

export interface IWebsocketsEventContext {
    connectionId: string;
    connectedAt: number;
    host: string;
    eventType: WebsocketsEventType;
    route: WebsocketsRoute | string;
    endpoint: string;
}

export interface IWebsocketsEvent<T extends IWebsocketsEventData = IWebsocketsEventData> {
    headers?: Record<string, string>;
    context: IWebsocketsEventContext;
    body?: T;
}
