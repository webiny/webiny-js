import { DbContext } from "@webiny/handler-db/types";
import { IWebsocketsContextObject } from "./context/abstractions/IWebsocketsContext";
import { SecurityContext, SecurityPermission } from "@webiny/api-security/types";
import { I18NContext } from "@webiny/api-i18n/types";

export type { IWebsocketsContextObject };

export interface Context extends DbContext, SecurityContext, I18NContext {
    websockets: IWebsocketsContextObject;
}

export interface WebsocketsPermission extends SecurityPermission {
    name: "websockets";
    rwd?: string;
}
