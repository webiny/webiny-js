import { Context as SocketsContext } from "~/types";
import { SecurityContext } from "@webiny/api-security/types";
import { I18NContext } from "@webiny/api-i18n/types";

export interface Context extends SocketsContext, SecurityContext, I18NContext {}
