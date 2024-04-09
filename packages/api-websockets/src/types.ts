import { DbContext } from "@webiny/handler-db/types";
import { IWebsocketsContext } from "./context/abstractions/IWebsocketsContext";
import { SecurityContext, SecurityPermission } from "@webiny/api-security/types";
import { I18NContext } from "@webiny/api-i18n/types";

export interface Context extends DbContext, SecurityContext, I18NContext {
    websockets: IWebsocketsContext;
}

export interface WebsocketsPermission extends SecurityPermission {
    name: "websockets";
    rwd?: string;
}
