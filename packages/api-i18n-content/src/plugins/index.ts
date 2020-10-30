import { HandlerContextPlugin } from "@webiny/handler/types";
import { HandlerI18NContext } from "@webiny/api-i18n/types";

export default {
    type: "context",
    apply(context) {
        context.getContentLocale = () => context.i18n.getCurrentLocale("content");
    }
} as HandlerContextPlugin<HandlerI18NContext>;
