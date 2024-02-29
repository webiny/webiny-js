import { Context as BaseContext } from "@webiny/handler/types";
import { DbContext } from "@webiny/handler-db/types";
import { IWebsocketsContext } from "./context/abstractions/IWebsocketsContext";
import { SecurityContext } from "@webiny/api-security/types";
import { I18NContext } from "@webiny/api-i18n/types";

export interface Context extends BaseContext, DbContext, SecurityContext, I18NContext {
    websockets: IWebsocketsContext;
}
