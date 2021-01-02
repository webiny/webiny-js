import { ContextPlugin } from "@webiny/handler/types";
import { I18NContext } from "@webiny/api-i18n/types";

export default (): ContextPlugin<I18NContext> => {
    return {
        type: "context",
        async apply(context) {
            const locale = context.i18n.getCurrentLocale();

            context.cms = {
                ...(context.cms || ({} as any)),
                locale: locale ? locale.code : "en-US",
                getLocale() {
                    return locale || { code: "en-US" };
                }
            };
        }
    };
};
