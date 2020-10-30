import { HandlerContextPlugin } from "@webiny/handler/types";
import { HandlerI18NContext } from "@webiny/api-i18n/types";
import { HandlerI18NContentContext } from "../types";

export default () =>
    ({
        type: "context",
        apply(context) {
            context.i18nContent = { locale: context.i18n.getCurrentLocale("content") };
        }
    } as HandlerContextPlugin<HandlerI18NContext, HandlerI18NContentContext>);
