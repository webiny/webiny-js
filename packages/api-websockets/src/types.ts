import type { DbContext } from "@webiny/handler-db/types.js";
import type { IWebsocketsContextObject } from "./context/abstractions/IWebsocketsContext.js";
import type { ApiCoreContext } from "@webiny/api-core/types/core.js";
import type { SecurityPermission } from "@webiny/api-core/types/security.js";

export type { IWebsocketsContextObject };

export interface Context extends DbContext, ApiCoreContext {
    websockets: IWebsocketsContextObject;
}

export interface WebsocketsPermission extends SecurityPermission {
    name: "websockets";
    rwd?: string;
}
